/**
 * Integration test for validation section in enriched context
 * Verifies the validation section is properly integrated into the enriched output
 */

import { enrichAssessmentData } from '../../../lib/dna-report-chunked/enrichment.js';

describe('Validation Section Integration', () => {
  test('should include validation section as first section in enriched context', () => {
    const assessmentData = {
      profile: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        userType: 'founder',
        assessmentDate: '2024-01-15'
      },
      scores: {
        speed: 75,
        abstraction: 82,
        creativity: 68,
        structure: 45,
        planning: 55,
        risk: 78
      },
      rolesTop: [
        { role: 'CEO', score: 88 },
        { role: 'Product Manager', score: 82 }
      ]
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Verify validation section appears first
    const validationIndex = enrichedContext.indexOf('=== VALIDATION CONSTRAINTS ===');
    const profileIndex = enrichedContext.indexOf('=== USER PROFILE ===');
    
    expect(validationIndex).toBeGreaterThan(-1);
    expect(profileIndex).toBeGreaterThan(-1);
    expect(validationIndex).toBeLessThan(profileIndex);
  });

  test('should include all required validation components', () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: [{ role: 'Engineer', score: 85 }]
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Extract validation section
    const validationStart = enrichedContext.indexOf('=== VALIDATION CONSTRAINTS ===');
    const validationEnd = enrichedContext.indexOf('=== USER PROFILE ===');
    const validationSection = enrichedContext.substring(validationStart, validationEnd);

    // Verify all components are present
    expect(validationSection).toContain('VALID TRAITS (16 total)');
    expect(validationSection).toContain('VALID DOMAINS (6 total)');
    expect(validationSection).toContain('VALID ROLES:');
    expect(validationSection).toContain('CRITICAL CONSTRAINTS:');
    
    // Verify specific constraints
    expect(validationSection).toContain('DO NOT invent or reference traits');
    expect(validationSection).toContain('DO NOT invent or reference domains');
    expect(validationSection).toContain('DO NOT invent or reference metrics');
    expect(validationSection).toContain('DO NOT invent or reference roles');
  });

  test('should maintain all existing sections after validation section', () => {
    const assessmentData = {
      profile: {
        name: 'John Smith',
        email: 'john@example.com'
      },
      scores: {
        speed: 75,
        abstraction: 60,
        empathy: 80
      },
      rolesTop: []
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Verify all expected sections are present
    expect(enrichedContext).toContain('=== VALIDATION CONSTRAINTS ===');
    expect(enrichedContext).toContain('=== USER PROFILE ===');
    expect(enrichedContext).toContain('=== SCORE INTERPRETATIONS ===');
    expect(enrichedContext).toContain('=== DOMAIN MAPPINGS ===');
    expect(enrichedContext).toContain('=== TRAIT INSIGHTS ===');
    
    // Verify section order
    const sections = [
      '=== VALIDATION CONSTRAINTS ===',
      '=== USER PROFILE ===',
      '=== SCORE INTERPRETATIONS ===',
      '=== DOMAIN MAPPINGS ===',
      '=== TRAIT INSIGHTS ==='
    ];

    let lastIndex = -1;
    sections.forEach(section => {
      const currentIndex = enrichedContext.indexOf(section);
      expect(currentIndex).toBeGreaterThan(lastIndex);
      lastIndex = currentIndex;
    });
  });

  test('should handle empty assessment data with validation section', () => {
    const assessmentData = {};

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Should still include validation section even with empty data
    expect(enrichedContext).toContain('=== VALIDATION CONSTRAINTS ===');
    expect(enrichedContext).toContain('VALID TRAITS (16 total)');
    expect(enrichedContext).toContain('VALID DOMAINS (6 total)');
    expect(enrichedContext).toContain('VALID ROLES:');
    expect(enrichedContext).toContain('NONE (no role data provided)');
  });

  test('should list all 16 traits with display names', () => {
    const assessmentData = {
      profile: { name: 'Test' },
      scores: {},
      rolesTop: []
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Verify trait display names are included
    const expectedTraitDisplayNames = [
      'Tempo & Bias for Action',
      'Pattern Recognition',
      'Creative Divergence',
      'Systems & Cadence',
      'Forward Mapping',
      'Risk Posture',
      'Empathy & Attunement',
      'Conflict Navigation',
      'Story & Communication',
      'Delegation & Trust',
      'Mission Anchoring',
      'Competitive Drive',
      'Pressure Regulation',
      'Ambiguity Comfort',
      'Visibility & Presence',
      'Influence & Persuasion'
    ];

    expectedTraitDisplayNames.forEach(displayName => {
      expect(enrichedContext).toContain(displayName);
    });
  });

  test('should list all 6 domains with display names', () => {
    const assessmentData = {
      profile: { name: 'Test' },
      scores: {},
      rolesTop: []
    };

    const enrichedContext = enrichAssessmentData(assessmentData);

    // Verify domain display names are included
    const expectedDomainDisplayNames = [
      'Cognitive & Vision',
      'Execution & Operations',
      'Social & Emotional Intelligence',
      'Motivation & Drive',
      'Resilience & Adaptability',
      'Leadership Presence'
    ];

    expectedDomainDisplayNames.forEach(displayName => {
      expect(enrichedContext).toContain(displayName);
    });
  });
});
