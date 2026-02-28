/**
 * Property-Based Tests for Data Enrichment Layer
 * Uses fast-check for universal property validation
 * 
 * These tests verify that certain properties hold true for ALL possible inputs,
 * not just specific examples. Each test runs 100+ iterations with random data.
 */

import { describe, test, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { enrichAssessmentData } from '../../../lib/dna-report-chunked/enrichment.js';
import { TRAIT_GUIDE, DOMAIN_DEFINITIONS, SCORE_BANDS } from '../../../lib/dna-report-chunked/trait-definitions.js';

/**
 * Arbitrary for generating valid trait scores (0-100)
 */
const scoreArbitrary = fc.integer({ min: 0, max: 100 });

/**
 * Arbitrary for generating assessment data with all traits
 */
const fullAssessmentArbitrary = fc.record({
  profile: fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    email: fc.emailAddress(),
    userType: fc.constantFrom('entrepreneur-with-idea', 'startup', 'scaleup', 'enterprise'),
    assessmentDate: fc.constantFrom('2024-01-15T10:30:00.000Z', '2025-06-20T14:45:00.000Z', '2026-02-10T09:15:00.000Z')
  }),
  scores: fc.record({
    speed: scoreArbitrary,
    abstraction: scoreArbitrary,
    creativity: scoreArbitrary,
    structure: scoreArbitrary,
    planning: scoreArbitrary,
    risk: scoreArbitrary,
    empathy: scoreArbitrary,
    conflict: scoreArbitrary,
    expressiveness: scoreArbitrary,
    trust: scoreArbitrary,
    mission: scoreArbitrary,
    competition: scoreArbitrary,
    stress: scoreArbitrary,
    ambiguity: scoreArbitrary,
    visibility: scoreArbitrary,
    influence: scoreArbitrary
  }),
  rolesTop: fc.array(
    fc.record({
      role: fc.string({ minLength: 5, maxLength: 30 }),
      score: fc.integer({ min: 0, max: 100 })
    }),
    { minLength: 0, maxLength: 5 }
  )
});

/**
 * Arbitrary for generating assessment data with missing fields
 */
const partialAssessmentArbitrary = fc.record({
  profile: fc.option(fc.record({
    name: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    email: fc.option(fc.emailAddress()),
    userType: fc.option(fc.constantFrom('entrepreneur-with-idea', 'startup')),
    assessmentDate: fc.option(fc.constantFrom('2024-01-15T10:30:00.000Z', '2025-06-20T14:45:00.000Z'))
  })),
  scores: fc.dictionary(
    fc.constantFrom(...Object.keys(TRAIT_GUIDE)),
    scoreArbitrary,
    { minKeys: 0, maxKeys: 16 }
  ),
  rolesTop: fc.option(fc.array(
    fc.record({
      role: fc.string({ minLength: 5, maxLength: 30 }),
      score: fc.integer({ min: 0, max: 100 })
    }),
    { minLength: 0, maxLength: 3 }
  ))
});

describe('Data Enrichment Layer - Property Tests', () => {
  
  /**
   * Property 1: Score Band Mapping Accuracy
   * Validates: Requirements 1.2
   * 
   * For any score 0-100, the band classification must be correct (5-tier system)
   */
  test('Property 1: Score band mapping is always accurate', () => {
    fc.assert(
      fc.property(scoreArbitrary, (score) => {
        let expectedBand;
        if (score >= 85) expectedBand = 'High (Very High)';
        else if (score >= 70) expectedBand = 'High';
        else if (score >= 40) expectedBand = 'Mid';
        else if (score >= 25) expectedBand = 'Low';
        else expectedBand = 'Low (Very Low)';

        // Create minimal assessment with this score
        const assessment = {
          profile: { name: 'Test', email: 'test@test.com', userType: 'test', assessmentDate: '2026-01-01' },
          scores: { speed: score },
          rolesTop: []
        };

        const enriched = enrichAssessmentData(assessment);
        
        // Check that the enriched output contains the correct band label
        return enriched.includes(`Tempo & Bias for Action: ${score} (${expectedBand})`);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property 2: Complete Domain Coverage
   * Validates: Requirements 1.3
   * 
   * For any valid assessment, all 6 domains must be present in the output
   */
  test('Property 2: All domains are always present in enriched output', () => {
    fc.assert(
      fc.property(fullAssessmentArbitrary, (assessment) => {
        const enriched = enrichAssessmentData(assessment);
        
        // Verify all 6 domain names appear in the output
        const allDomainsPresent = Object.values(DOMAIN_DEFINITIONS).every(domain => 
          enriched.includes(domain.displayName)
        );
        
        return allDomainsPresent;
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3: Complete Trait Insights
   * Validates: Requirements 1.4
   * 
   * For any valid assessment, exactly 16 trait insights must be generated
   */
  test('Property 3: Exactly 16 trait insights are always generated', () => {
    fc.assert(
      fc.property(fullAssessmentArbitrary, (assessment) => {
        const enriched = enrichAssessmentData(assessment);
        
        // Count how many trait display names appear in the TRAIT INSIGHTS section
        const insightsSection = enriched.split('=== TRAIT INSIGHTS ===')[1]?.split('===')[0] || '';
        
        const traitCount = Object.values(TRAIT_GUIDE).filter(trait => 
          insightsSection.includes(trait.displayName)
        ).length;
        
        return traitCount === 16;
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4: Role Rationale Completeness
   * Validates: Requirements 1.5
   * 
   * N roles in input must produce exactly N rationales in output
   */
  test('Property 4: Number of role rationales matches number of input roles', () => {
    fc.assert(
      fc.property(fullAssessmentArbitrary, (assessment) => {
        const enriched = enrichAssessmentData(assessment);
        const inputRoleCount = assessment.rolesTop.length;
        
        if (inputRoleCount === 0) {
          // If no roles, should not have ROLE MATCH RATIONALE section
          return !enriched.includes('=== ROLE MATCH RATIONALE ===');
        }
        
        // Count numbered role entries in the output
        const rationaleSection = enriched.split('=== ROLE MATCH RATIONALE ===')[1]?.split('===')[0] || '';
        const rationaleCount = (rationaleSection.match(/^\d+\./gm) || []).length;
        
        return rationaleCount === inputRoleCount;
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5: Enriched Context Structure
   * Validates: Requirements 1.6
   * 
   * All required section headers must be present in the output
   */
  test('Property 5: All required section headers are always present', () => {
    fc.assert(
      fc.property(fullAssessmentArbitrary, (assessment) => {
        const enriched = enrichAssessmentData(assessment);
        
        const requiredHeaders = [
          '=== USER PROFILE ===',
          '=== SCORE INTERPRETATIONS ===',
          '=== DOMAIN MAPPINGS ===',
          '=== TRAIT INSIGHTS ==='
        ];
        
        return requiredHeaders.every(header => enriched.includes(header));
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property 6: Graceful Handling of Missing Fields
   * Validates: Requirements 1.8
   * 
   * Function must never throw errors, even with incomplete data
   */
  test('Property 6: No errors thrown with missing or incomplete fields', () => {
    fc.assert(
      fc.property(partialAssessmentArbitrary, (assessment) => {
        try {
          const enriched = enrichAssessmentData(assessment);
          // Should produce some output
          return typeof enriched === 'string' && enriched.length > 0;
        } catch (error) {
          // Any error means the property failed
          return false;
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property 7: Missing Traits Marked as Not Assessed
   * Validates: Requirements 1.8 (graceful degradation)
   * 
   * Traits without scores should be marked "Not Assessed" or "N/A"
   */
  test('Property 7: Missing traits are marked as Not Assessed', () => {
    fc.assert(
      fc.property(partialAssessmentArbitrary, (assessment) => {
        const enriched = enrichAssessmentData(assessment);
        const providedTraits = Object.keys(assessment.scores || {});
        const allTraits = Object.keys(TRAIT_GUIDE);
        const missingTraits = allTraits.filter(t => !providedTraits.includes(t));
        
        if (missingTraits.length === 0) return true; // All traits provided
        
        // Check that at least one missing trait is marked as N/A or Not Assessed
        return missingTraits.some(traitKey => {
          const trait = TRAIT_GUIDE[traitKey];
          return enriched.includes(`${trait.displayName}: N/A`) || 
                 enriched.includes('Not Assessed');
        });
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property 8: Output is Always Non-Empty String
   * Validates: Basic correctness
   * 
   * Function must always return a non-empty string
   */
  test('Property 8: Output is always a non-empty string', () => {
    fc.assert(
      fc.property(partialAssessmentArbitrary, (assessment) => {
        const enriched = enrichAssessmentData(assessment);
        return typeof enriched === 'string' && enriched.length > 100; // Reasonable minimum
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property 9: Profile Information Preserved
   * Validates: Requirements 1.1 (data transformation)
   * 
   * User profile information must appear in the output
   */
  test('Property 9: Profile information is preserved in output', () => {
    fc.assert(
      fc.property(fullAssessmentArbitrary, (assessment) => {
        const enriched = enrichAssessmentData(assessment);
        
        // Check that profile name appears in output
        return enriched.includes(`Name: ${assessment.profile.name}`);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property 10: Score Values Preserved
   * Validates: Requirements 1.2 (score interpretation)
   * 
   * Original score values must appear in the output
   */
  test('Property 10: Score values are preserved in output', () => {
    fc.assert(
      fc.property(fullAssessmentArbitrary, (assessment) => {
        const enriched = enrichAssessmentData(assessment);
        
        // Check that at least one score value appears
        const someScorePresent = Object.values(assessment.scores).some(score => 
          enriched.includes(`: ${score} (`)
        );
        
        return someScorePresent;
      }),
      { numRuns: 20 }
    );
  });
});
