/**
 * Enrichment Validator Module
 * 
 * Validates enriched context completeness before LLM consumption.
 * Ensures all required sections, traits, domains, and validation constraints are present.
 * 
 * @module enrichment-validator
 */

import { TRAIT_GUIDE } from './trait-definitions.js';

/**
 * Validates enriched context completeness
 * 
 * This is the main validation function that orchestrates all validation checks.
 * It calls various sub-validation functions and aggregates their results.
 * 
 * @param {Object} assessmentData - Raw assessment data containing scores, profile, and roles
 * @param {Object} assessmentData.scores - Trait scores object (16 traits)
 * @param {Object} assessmentData.profile - User profile information
 * @param {Array} assessmentData.rolesTop - Top role matches (may be empty)
 * @param {string} enrichedContext - Generated enriched context text
 * @returns {Object} Validation result with structure:
 *   - valid {boolean} - True if all validations pass
 *   - errors {string[]} - Array of error messages for critical issues
 *   - warnings {string[]} - Array of warning messages for non-critical issues
 */
export function validateEnrichedContext(assessmentData, enrichedContext) {
  const errors = [];
  const warnings = [];

  // Validate input parameters
  if (!assessmentData) {
    errors.push('Assessment data is required');
    return { valid: false, errors, warnings };
  }

  if (!enrichedContext || typeof enrichedContext !== 'string') {
    errors.push('Enriched context must be a non-empty string');
    return { valid: false, errors, warnings };
  }

  // Extract assessment data components
  const { scores } = assessmentData;

  if (!scores || typeof scores !== 'object') {
    errors.push('Assessment data must contain scores object');
    return { valid: false, errors, warnings };
  }

  // Call validation sub-functions
  const traitResult = validateTraitCompleteness(enrichedContext);
  if (!traitResult.valid) {
    errors.push(`Missing trait interpretations: ${traitResult.missingTraits.join(', ')}`);
  }

  const domainResult = validateDomainCompleteness(enrichedContext);
  if (!domainResult.valid) {
    errors.push(`Missing domain aggregations: ${domainResult.missingDomains.join(', ')}`);
  }

  const behavioralResult = validateBehavioralIndicators(scores, enrichedContext);
  if (!behavioralResult.valid) {
    errors.push(`Missing behavioral indicators: ${behavioralResult.missingIndicators.join(', ')}`);
  }

  const frameworkResult = validatePsychologicalFramework(scores, enrichedContext);
  if (!frameworkResult.valid) {
    errors.push(`Missing psychological framework elements: ${frameworkResult.missingFramework.join(', ')}`);
  }

  const constraintsResult = validateAntiHallucinationConstraints(enrichedContext);
  if (!constraintsResult.valid) {
    errors.push(`Missing anti-hallucination constraints: ${constraintsResult.missingConstraints.join(', ')}`);
  }

  // Aggregate validation results
  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings
  };
}

/**
 * Validates all 16 traits have interpretations in enriched context
 * 
 * Checks that each of the 16 traits appears in the enriched context with
 * score interpretations. This ensures the LLM has access to all trait data.
 * 
 * @param {string} enrichedContext - Enriched context text
 * @returns {Object} Validation result with structure:
 *   - valid {boolean} - True if all traits have interpretations
 *   - missingTraits {string[]} - Array of trait keys missing interpretations
 */
export function validateTraitCompleteness(enrichedContext) {
  const allTraits = [
    'speed', 'abstraction', 'creativity',
    'structure', 'planning', 'risk',
    'empathy', 'conflict', 'expressiveness', 'trust',
    'mission', 'competition',
    'stress', 'ambiguity',
    'visibility', 'influence'
  ];

  const missingTraits = [];

  for (const traitKey of allTraits) {
    // Check if trait key appears in enriched context
    // We look for the trait key in various contexts (score interpretations, behavioral indicators, etc.)
    if (!enrichedContext.includes(traitKey)) {
      missingTraits.push(traitKey);
    }
  }

  return {
    valid: missingTraits.length === 0,
    missingTraits
  };
}

/**
 * Validates all 6 domains have aggregations in enriched context
 * 
 * Checks that each of the 6 domains appears in the enriched context with
 * aggregated interpretations. This ensures comprehensive domain coverage.
 * 
 * @param {string} enrichedContext - Enriched context text
 * @returns {Object} Validation result with structure:
 *   - valid {boolean} - True if all domains have aggregations
 *   - missingDomains {string[]} - Array of domain keys missing aggregations
 */
export function validateDomainCompleteness(enrichedContext) {
  const allDomains = [
    'cognitive_vision',
    'execution_operations',
    'social_emotional',
    'motivation_drive',
    'resilience_adaptability',
    'leadership_presence'
  ];

  const missingDomains = [];

  for (const domainKey of allDomains) {
    // Check if domain key appears in enriched context
    // Domains should appear in domain aggregation sections
    if (!enrichedContext.includes(domainKey)) {
      missingDomains.push(domainKey);
    }
  }

  return {
    valid: missingDomains.length === 0,
    missingDomains
  };
}

/**
 * Validates behavioral indicators are present for assessed traits
 * 
 * Checks that behavioral indicators are included in the enriched context
 * ONLY if trait data with behavioral indicators exists. This is a conditional
 * validation - the section is only required when data exists to populate it.
 * 
 * @param {Object} scores - Trait scores object
 * @param {string} enrichedContext - Enriched context text
 * @returns {Object} Validation result with structure:
 *   - valid {boolean} - True if behavioral indicators are present when data exists, or absent when no data exists
 *   - missingIndicators {string[]} - Array of trait keys missing behavioral indicators
 */
export function validateBehavioralIndicators(scores, enrichedContext) {
  const missingIndicators = [];

  if (enrichedContext === null || enrichedContext === undefined) {
    return {
      valid: false,
      missingIndicators: ['ENRICHED CONTEXT is required']
    };
  }

  const contextStr = String(enrichedContext);

  // Check if any assessed trait has behavioral indicators data in TRAIT_GUIDE
  let hasBehavioralIndicatorsData = false;
  if (scores && typeof scores === 'object') {
    for (const traitKey of Object.keys(scores)) {
      const score = scores[traitKey];
      if (score !== undefined && score !== null) {
        const trait = TRAIT_GUIDE[traitKey];
        if (trait && trait.behavioralIndicators && trait.behavioralIndicators.length > 0) {
          hasBehavioralIndicatorsData = true;
          break;
        }
      }
    }
  }

  // Check for behavioral indicators section header (must be in section header format)
  const hasBehavioralSection = contextStr.includes('=== BEHAVIORAL INDICATORS ===') ||
                                contextStr.includes('=== Behavioral Indicators ===') ||
                                contextStr.includes('BEHAVIORAL INDICATORS:') ||
                                contextStr.includes('Behavioral Indicators:');

  // CONDITIONAL VALIDATION: Only require the section if data exists for it
  if (hasBehavioralIndicatorsData && !hasBehavioralSection) {
    // Data exists but section is missing - validation fails
    missingIndicators.push('BEHAVIORAL INDICATORS section');
  }
  // If no data exists, section is optional - validation passes regardless of presence

  return {
    valid: missingIndicators.length === 0,
    missingIndicators
  };
}

/**
 * Validates psychological framework data is complete in enriched context
 * 
 * Checks that psychological framework elements (compassionate names, key strengths,
 * risk factors, suggestions, how to use strengths, accommodations) are present
 * ONLY if trait data with psychological framework exists. This is a conditional
 * validation - the section is only required when data exists to populate it.
 * 
 * @param {Object} scores - Trait scores object
 * @param {string} enrichedContext - Enriched context text
 * @returns {Object} Validation result with structure:
 *   - valid {boolean} - True if psychological framework is present when data exists, or absent when no data exists
 *   - missingFramework {string[]} - Array of missing framework elements
 */
export function validatePsychologicalFramework(scores, enrichedContext) {
  const missingFramework = [];

  if (enrichedContext === null || enrichedContext === undefined) {
    return {
      valid: false,
      missingFramework: ['ENRICHED CONTEXT is required']
    };
  }

  const contextStr = String(enrichedContext);

  // Check if any assessed trait has psychological framework data in TRAIT_GUIDE
  let hasFrameworkData = false;
  if (scores && typeof scores === 'object') {
    for (const traitKey of Object.keys(scores)) {
      const score = scores[traitKey];
      if (score !== undefined && score !== null) {
        const trait = TRAIT_GUIDE[traitKey];
        if (trait) {
          const pole = score < 50 ? trait.low : trait.high;
          const hasPoleFrameworkData = pole.compassionateName || 
                                       (pole.keyStrengths && pole.keyStrengths.length > 0) ||
                                       (pole.riskFactors && pole.riskFactors.length > 0) ||
                                       (pole.suggestions && pole.suggestions.length > 0) ||
                                       (pole.howToUseStrengths && pole.howToUseStrengths.length > 0) ||
                                       (pole.accommodations && pole.accommodations.length > 0);
          if (hasPoleFrameworkData) {
            hasFrameworkData = true;
            break;
          }
        }
      }
    }
  }

  // Check for psychological framework section header (must be in section header format)
  const hasFrameworkSection = contextStr.includes('=== PSYCHOLOGICAL FRAMEWORK ===') ||
                               contextStr.includes('=== Psychological Framework ===') ||
                               contextStr.includes('PSYCHOLOGICAL FRAMEWORK:') ||
                               contextStr.includes('Psychological Framework:');

  // CONDITIONAL VALIDATION: Only require the section if data exists for it
  if (hasFrameworkData && !hasFrameworkSection) {
    // Data exists but section is missing - validation fails
    missingFramework.push('PSYCHOLOGICAL FRAMEWORK section');
  }
  // If no data exists, section is optional - validation passes regardless of presence

  return {
    valid: missingFramework.length === 0,
    missingFramework
  };
}

/**
 * Validates anti-hallucination constraints are present in enriched context
 * 
 * Checks that validation lists (valid traits, valid domains, valid roles) and
 * prohibition statements are present in the enriched context. This ensures
 * the LLM has explicit constraints to prevent hallucinations.
 * 
 * @param {string} enrichedContext - Enriched context text
 * @returns {Object} Validation result with structure:
 *   - valid {boolean} - True if anti-hallucination constraints are present
 *   - missingConstraints {string[]} - Array of missing constraint elements
 */
export function validateAntiHallucinationConstraints(enrichedContext) {
  const missingConstraints = [];

  // Check for validation constraints section
  if (!enrichedContext.includes('VALIDATION CONSTRAINTS') && 
      !enrichedContext.includes('Validation Constraints')) {
    missingConstraints.push('validation_constraints_section');
  }

  // Check for valid traits list (case-insensitive)
  if (!enrichedContext.toLowerCase().includes('valid trait')) {
    missingConstraints.push('valid_traits_list');
  }

  // Check for valid domains list (case-insensitive)
  if (!enrichedContext.toLowerCase().includes('valid domain')) {
    missingConstraints.push('valid_domains_list');
  }

  // Check for prohibition statements
  const prohibitionPatterns = [
    'do not invent',
    'Do not invent',
    'DO NOT invent',
    'must not reference',
    'forbidden',
    'prohibited'
  ];

  const hasProhibition = prohibitionPatterns.some(pattern => enrichedContext.includes(pattern));
  if (!hasProhibition) {
    missingConstraints.push('prohibition_statements');
  }

  return {
    valid: missingConstraints.length === 0,
    missingConstraints
  };
}
