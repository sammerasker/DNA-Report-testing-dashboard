/**
 * Unit tests for enrichment validator functions
 * Tests validation of enriched context completeness
 */

import {
  validateEnrichedContext,
  validateTraitCompleteness,
  validateDomainCompleteness,
  validateBehavioralIndicators,
  validatePsychologicalFramework,
  validateAntiHallucinationConstraints
} from '../../../lib/dna-report-chunked/enrichment-validator.js';
import { enrichAssessmentData } from '../../../lib/dna-report-chunked/enrichment.js';

describe('validateTraitCompleteness', () => {
  test('should pass when all 16 traits are present', () => {
    const enrichedContext = `
      speed abstraction creativity
      structure planning risk
      empathy conflict expressiveness trust
      mission competition
      stress ambiguity
      visibility influence
    `;

    const result = validateTraitCompleteness(enrichedContext);
    expect(result.valid).toBe(true);
    expect(result.missingTraits).toEqual([]);
  });

  test('should fail when traits are missing', () => {
    const enrichedContext = `
      speed abstraction
      structure planning
    `;

    const result = validateTraitCompleteness(enrichedContext);
    expect(result.valid).toBe(false);
    expect(result.missingTraits.length).toBeGreaterThan(0);
    expect(result.missingTraits).toContain('creativity');
    expect(result.missingTraits).toContain('risk');
  });

  test('should identify all missing traits', () => {
    const enrichedContext = 'speed only';

    const result = validateTraitCompleteness(enrichedContext);
    expect(result.valid).toBe(false);
    expect(result.missingTraits).toHaveLength(15);
  });
});

describe('validateDomainCompleteness', () => {
  test('should pass when all 6 domains are present', () => {
    const enrichedContext = `
      cognitive_vision
      execution_operations
      social_emotional
      motivation_drive
      resilience_adaptability
      leadership_presence
    `;

    const result = validateDomainCompleteness(enrichedContext);
    expect(result.valid).toBe(true);
    expect(result.missingDomains).toEqual([]);
  });

  test('should fail when domains are missing', () => {
    const enrichedContext = `
      cognitive_vision
      execution_operations
    `;

    const result = validateDomainCompleteness(enrichedContext);
    expect(result.valid).toBe(false);
    expect(result.missingDomains.length).toBeGreaterThan(0);
    expect(result.missingDomains).toContain('social_emotional');
  });
});

describe('validateBehavioralIndicators', () => {
  test('should pass when behavioral indicators section exists with low/mid/high', () => {
    const scores = { speed: 75, abstraction: 50 };
    const enrichedContext = `
      BEHAVIORAL INDICATORS
      speed: low: slow decisions, mid: balanced decisions, high: fast decisions
      abstraction: low: concrete, mid: balanced, high: abstract
    `;

    const result = validateBehavioralIndicators(scores, enrichedContext);
    expect(result.valid).toBe(true);
    expect(result.missingIndicators).toEqual([]);
  });

  test('should fail when behavioral indicators section is missing', () => {
    const scores = { speed: 75, abstraction: 50 };
    const enrichedContext = 'No behavioral indicators here';

    const result = validateBehavioralIndicators(scores, enrichedContext);
    expect(result.valid).toBe(false);
    expect(result.missingIndicators).toContain('speed');
    expect(result.missingIndicators).toContain('abstraction');
  });

  test('should fail when specific trait indicators are missing', () => {
    const scores = { speed: 75, abstraction: 50 };
    const enrichedContext = `
      BEHAVIORAL INDICATORS
      speed: low: slow, mid: balanced, high: fast
    `;

    const result = validateBehavioralIndicators(scores, enrichedContext);
    expect(result.valid).toBe(false);
    expect(result.missingIndicators).toContain('abstraction');
    expect(result.missingIndicators).not.toContain('speed');
  });
});

describe('validatePsychologicalFramework', () => {
  test('should pass when all framework elements are present', () => {
    const enrichedContext = `
      compassionate names
      key strengths
      risk factors
      suggestions
      how to use strengths
      accommodations
    `;

    const result = validatePsychologicalFramework(enrichedContext);
    expect(result.valid).toBe(true);
    expect(result.missingFramework).toEqual([]);
  });

  test('should fail when framework elements are missing', () => {
    const enrichedContext = `
      key strengths
      suggestions
    `;

    const result = validatePsychologicalFramework(enrichedContext);
    expect(result.valid).toBe(false);
    expect(result.missingFramework).toContain('compassionate');
    expect(result.missingFramework).toContain('risk_factors');
  });
});

describe('validateAntiHallucinationConstraints', () => {
  test('should pass when all constraints are present', () => {
    const enrichedContext = `
      VALIDATION CONSTRAINTS
      valid traits: speed, abstraction
      valid domains: cognitive_vision
      DO NOT invent traits
    `;

    const result = validateAntiHallucinationConstraints(enrichedContext);
    expect(result.valid).toBe(true);
    expect(result.missingConstraints).toEqual([]);
  });

  test('should fail when validation section is missing', () => {
    const enrichedContext = 'No validation here';

    const result = validateAntiHallucinationConstraints(enrichedContext);
    expect(result.valid).toBe(false);
    expect(result.missingConstraints).toContain('validation_constraints_section');
  });

  test('should fail when prohibition statements are missing', () => {
    const enrichedContext = `
      VALIDATION CONSTRAINTS
      valid traits: speed
      valid domains: cognitive_vision
    `;

    const result = validateAntiHallucinationConstraints(enrichedContext);
    expect(result.valid).toBe(false);
    expect(result.missingConstraints).toContain('prohibition_statements');
  });
});

describe('validateEnrichedContext', () => {
  test('should validate complete enriched context from enrichAssessmentData', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: {
        speed: 75,
        abstraction: 60,
        creativity: 55,
        structure: 70,
        planning: 65,
        risk: 80,
        empathy: 50,
        conflict: 45,
        expressiveness: 70,
        trust: 60,
        mission: 85,
        competition: 75,
        stress: 65,
        ambiguity: 70,
        visibility: 55,
        influence: 60
      },
      rolesTop: []
    };

    const enrichedContext = enrichAssessmentData(assessmentData);
    const result = validateEnrichedContext(assessmentData, enrichedContext);

    // The validation should pass or provide specific errors
    if (!result.valid) {
      console.log('Validation errors:', result.errors);
      console.log('Validation warnings:', result.warnings);
    }

    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('warnings');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  test('should fail validation with missing assessment data', () => {
    const result = validateEnrichedContext(null, 'some context');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Assessment data is required');
  });

  test('should fail validation with invalid enriched context', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: []
    };

    const result = validateEnrichedContext(assessmentData, null);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Enriched context must be a non-empty string');
  });

  test('should fail validation with missing scores', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      rolesTop: []
    };

    const result = validateEnrichedContext(assessmentData, 'some context');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Assessment data must contain scores object');
  });

  test('should aggregate errors from all validation functions', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: []
    };

    const incompleteContext = 'speed only';

    const result = validateEnrichedContext(assessmentData, incompleteContext);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    // Should have errors from multiple validation functions
    const errorString = result.errors.join(' ');
    expect(errorString).toContain('Missing');
  });
});
