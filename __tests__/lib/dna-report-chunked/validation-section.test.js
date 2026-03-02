/**
 * Unit tests for generateValidationSection function
 * Tests anti-hallucination validation section generation
 */

import { enrichAssessmentData } from '../../../lib/dna-report-chunked/enrichment.js';

describe('generateValidationSection', () => {
  test('should include all 16 valid trait keys in enriched context', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: []
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Check for validation section header
    expect(enrichedContext).toContain('VALID TRAITS (16 total)');

    // Check for all 16 trait keys
    const expectedTraits = [
      'speed', 'abstraction', 'creativity',
      'structure', 'planning', 'risk',
      'empathy', 'conflict', 'expressiveness', 'trust',
      'mission', 'competition',
      'stress', 'ambiguity',
      'visibility', 'influence'
    ];

    expectedTraits.forEach(traitKey => {
      expect(enrichedContext).toContain(traitKey);
    });
  });

  test('should include all 6 valid domain keys in enriched context', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: []
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Check for validation section header
    expect(enrichedContext).toContain('VALID DOMAINS (6 total)');

    // Check for all 6 domain keys
    const expectedDomains = [
      'cognitive_vision',
      'execution_operations',
      'social_emotional',
      'motivation_drive',
      'resilience_adaptability',
      'leadership_presence'
    ];

    expectedDomains.forEach(domainKey => {
      expect(enrichedContext).toContain(domainKey);
    });
  });

  test('should include valid role list when rolesTop is provided', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: [
        { role: 'Product Manager', score: 85 },
        { role: 'Technical Lead', score: 78 }
      ]
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Check for validation section header
    expect(enrichedContext).toContain('VALID ROLES:');

    // Check for role names
    expect(enrichedContext).toContain('Product Manager');
    expect(enrichedContext).toContain('Technical Lead');

    // Check for role prohibition statement
    expect(enrichedContext).toContain('DO NOT invent or reference roles not in the VALID ROLES list above');
  });

  test('should include NONE when rolesTop is empty', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: []
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Check for validation section header
    expect(enrichedContext).toContain('VALID ROLES:');

    // Check for NONE statement
    expect(enrichedContext).toContain('NONE (no role data provided)');

    // Check for no-role prohibition statement
    expect(enrichedContext).toContain('DO NOT reference any roles - no role data was provided in this assessment');
  });

  test('should include prohibition statements for traits', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: []
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Check for prohibition statements
    expect(enrichedContext).toContain('CRITICAL CONSTRAINTS:');
    expect(enrichedContext).toContain('DO NOT invent or reference traits not in the VALID TRAITS list above');
  });

  test('should include prohibition statements for domains', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: []
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Check for prohibition statements
    expect(enrichedContext).toContain('DO NOT invent or reference domains not in the VALID DOMAINS list above');
  });

  test('should include prohibition statements for metrics', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: []
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Check for prohibition statements
    expect(enrichedContext).toContain('DO NOT invent or reference metrics, scores, or measurements not present in the assessment data');
    expect(enrichedContext).toContain('DO NOT invent or reference composite scores not explicitly defined in the trait definitions');
  });

  test('should include grounding statement', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: []
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Check for grounding statement
    expect(enrichedContext).toContain('ALL trait and domain references must be grounded in the assessment data provided');
  });

  test('should handle null rolesTop gracefully', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: null
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Should still include validation section
    expect(enrichedContext).toContain('VALID TRAITS (16 total)');
    expect(enrichedContext).toContain('VALID DOMAINS (6 total)');
    expect(enrichedContext).toContain('VALID ROLES:');
    expect(enrichedContext).toContain('NONE (no role data provided)');
  });

  test('should handle undefined rolesTop gracefully', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 }
      // rolesTop is undefined
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Should still include validation section
    expect(enrichedContext).toContain('VALID TRAITS (16 total)');
    expect(enrichedContext).toContain('VALID DOMAINS (6 total)');
    expect(enrichedContext).toContain('VALID ROLES:');
    expect(enrichedContext).toContain('NONE (no role data provided)');
  });
});
