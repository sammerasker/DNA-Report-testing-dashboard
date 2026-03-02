/**
 * Enrichment Validator Module
 * 
 * Validates enriched context completeness before LLM consumption.
 * Ensures all required sections, traits, domains, and validation constraints are present.
 * 
 * @module enrichment-validator
 */

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

  const frameworkResult = validatePsychologicalFramework(enrichedContext);
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
 * for all traits that have scores. This ensures concrete behavioral descriptions
 * are available for the LLM.
 * 
 * @param {Object} scores - Trait scores object
 * @param {string} enrichedContext - Enriched context text
 * @returns {Object} Validation result with structure:
 *   - valid {boolean} - True if behavioral indicators are present
 *   - missingIndicators {string[]} - Array of trait keys missing behavioral indicators
 */
export function validateBehavioralIndicators(scores, enrichedContext) {
  const missingIndicators = [];

  // Check for behavioral indicators section header
  const hasBehavioralSection = enrichedContext.includes('BEHAVIORAL INDICATORS') ||
                                enrichedContext.includes('Behavioral Indicators') ||
                                enrichedContext.includes('behavioral indicators');

  if (!hasBehavioralSection) {
    // If no behavioral indicators section exists, all traits are missing indicators
    for (const traitKey in scores) {
      if (Object.prototype.hasOwnProperty.call(scores, traitKey)) {
        missingIndicators.push(traitKey);
      }
    }
  } else {
    // Check for specific behavioral indicator patterns for each trait
    for (const traitKey in scores) {
      if (Object.prototype.hasOwnProperty.call(scores, traitKey)) {
        // Look for patterns like "low:", "mid:", "high:" near the trait key
        const traitPattern = new RegExp(`${traitKey}[\\s\\S]{0,500}(low:|mid:|high:)`, 'i');
        if (!traitPattern.test(enrichedContext)) {
          missingIndicators.push(traitKey);
        }
      }
    }
  }

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
 * in the enriched context.
 * 
 * @param {string} enrichedContext - Enriched context text
 * @returns {Object} Validation result with structure:
 *   - valid {boolean} - True if psychological framework is complete
 *   - missingFramework {string[]} - Array of missing framework elements
 */
export function validatePsychologicalFramework(enrichedContext) {
  const missingFramework = [];

  // Check for psychological framework section or elements
  const frameworkElements = [
    { key: 'compassionate', patterns: ['compassionate', 'Compassionate'] },
    { key: 'key_strengths', patterns: ['key strengths', 'Key Strengths', 'keyStrengths'] },
    { key: 'risk_factors', patterns: ['risk factors', 'Risk Factors', 'riskFactors'] },
    { key: 'suggestions', patterns: ['suggestions', 'Suggestions', 'actionable'] },
    { key: 'how_to_use_strengths', patterns: ['how to use', 'How to Use', 'howToUseStrengths'] },
    { key: 'accommodations', patterns: ['accommodations', 'Accommodations'] }
  ];

  for (const element of frameworkElements) {
    const hasElement = element.patterns.some(pattern => enrichedContext.includes(pattern));
    if (!hasElement) {
      missingFramework.push(element.key);
    }
  }

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

  // Check for valid traits list
  if (!enrichedContext.includes('valid trait') && 
      !enrichedContext.includes('Valid Trait')) {
    missingConstraints.push('valid_traits_list');
  }

  // Check for valid domains list
  if (!enrichedContext.includes('valid domain') && 
      !enrichedContext.includes('Valid Domain')) {
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
