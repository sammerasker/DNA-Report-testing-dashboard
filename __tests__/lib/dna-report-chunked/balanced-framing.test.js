/**
 * Unit tests for generateBalancedFramingGuidance function
 * Tests balanced trait framing guidance generation
 * 
 * Validates Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { enrichAssessmentData } from '../../../lib/dna-report-chunked/enrichment.js';

describe('generateBalancedFramingGuidance', () => {
  // Helper to get enriched context
  const getEnrichedContext = () => {
    const assessmentData = {
      profile: { name: 'Test User' },
      scores: { speed: 75 },
      rolesTop: []
    };
    return enrichAssessmentData(assessmentData);
  };

  test('should include guidance on mid-range scores as ideal (Requirement 5.1)', () => {
    const enrichedContext = getEnrichedContext();

    // Check for mid-range guidance
    expect(enrichedContext).toContain('MID-RANGE SCORES ARE IDEAL');
    expect(enrichedContext).toContain('40-69 range represent balanced, adaptive trait expressions');
    expect(enrichedContext).toContain('flexibility to adjust behavior based on context');
    expect(enrichedContext).toContain('ability to access both poles of a trait as needed');
  });

  test('should include guidance on extreme scores as potentially inflexible (Requirement 5.2)', () => {
    const enrichedContext = getEnrichedContext();

    // Check for extreme scores guidance
    expect(enrichedContext).toContain('EXTREME SCORES MAY INDICATE INFLEXIBLE PATTERNS');
    expect(enrichedContext).toContain('0-24 range (very low) or 85-100 range (very high) may indicate inflexible patterns');
    expect(enrichedContext).toContain('difficulty accessing the opposite pole when context requires it');
  });

  test('should include guidance that both poles have valid strengths (Requirement 5.3)', () => {
    const enrichedContext = getEnrichedContext();

    // Check for both poles guidance
    expect(enrichedContext).toContain('BOTH TRAIT POLES HAVE VALID STRENGTHS');
    expect(enrichedContext).toContain('BOTH poles offer legitimate strengths');
    expect(enrichedContext).toContain('Low scores are not "bad" and high scores are not "good"');
    expect(enrichedContext).toContain('Each pole is valuable in different contexts');
  });

  test('should include prohibition on value judgments (Requirement 5.4)', () => {
    const enrichedContext = getEnrichedContext();

    // Check for value judgment prohibition
    expect(enrichedContext).toContain('NO VALUE JUDGMENTS ABOUT SCORE LEVELS');
    expect(enrichedContext).toContain('DO NOT use language that implies one score level is "better" than another');
    expect(enrichedContext).toContain('DO NOT frame low scores as deficits or high scores as superiority');
    expect(enrichedContext).toContain('DO NOT use terms like "lacking," "deficient," "excessive," or "too much/too little"');
  });

  test('should include guidance that context determines optimal expression (Requirement 5.5)', () => {
    const enrichedContext = getEnrichedContext();

    // Check for context-dependent guidance
    expect(enrichedContext).toContain('CONTEXT DETERMINES OPTIMAL TRAIT EXPRESSION');
    expect(enrichedContext).toContain('no universally "ideal" score for any trait');
    expect(enrichedContext).toContain('optimal trait expression depends on role, industry, team composition, and goals');
    expect(enrichedContext).toContain('What works in one context may not work in another');
  });

  test('should include strengths-based framing guidance (Requirement 5.6)', () => {
    const enrichedContext = getEnrichedContext();

    // Check for strengths-based framing
    expect(enrichedContext).toContain('STRENGTHS-BASED FRAMING FOR ALL INTERPRETATIONS');
    expect(enrichedContext).toContain('Lead with the strengths and advantages of the expressed trait pole');
    expect(enrichedContext).toContain('compassionate, empowering language');
    expect(enrichedContext).toContain('traits are preferences, not abilities');
  });

  test('should include all 6 balanced framing principles', () => {
    const enrichedContext = getEnrichedContext();

    // Check for all principle headers
    expect(enrichedContext).toContain('1. MID-RANGE SCORES ARE IDEAL');
    expect(enrichedContext).toContain('2. EXTREME SCORES MAY INDICATE INFLEXIBLE PATTERNS');
    expect(enrichedContext).toContain('3. BOTH TRAIT POLES HAVE VALID STRENGTHS');
    expect(enrichedContext).toContain('4. NO VALUE JUDGMENTS ABOUT SCORE LEVELS');
    expect(enrichedContext).toContain('5. CONTEXT DETERMINES OPTIMAL TRAIT EXPRESSION');
    expect(enrichedContext).toContain('6. STRENGTHS-BASED FRAMING FOR ALL INTERPRETATIONS');
  });

  test('should include balanced framing principles section header', () => {
    const enrichedContext = getEnrichedContext();

    // Check for section header
    expect(enrichedContext).toContain('BALANCED TRAIT FRAMING PRINCIPLES');
  });

  test('should handle null assessment data gracefully', () => {
    const enrichedContext = enrichAssessmentData(null);

    // Should still include balanced framing guidance
    expect(enrichedContext).toContain('BALANCED TRAIT FRAMING PRINCIPLES');
    expect(enrichedContext).toContain('MID-RANGE SCORES ARE IDEAL');
  });

  test('should handle empty assessment data gracefully', () => {
    const enrichedContext = enrichAssessmentData({});

    // Should still include balanced framing guidance
    expect(enrichedContext).toContain('BALANCED TRAIT FRAMING PRINCIPLES');
    expect(enrichedContext).toContain('BOTH TRAIT POLES HAVE VALID STRENGTHS');
  });
});
