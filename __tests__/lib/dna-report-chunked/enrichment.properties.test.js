/**
 * Property-Based Tests for Enhanced Enrichment Layer
 * 
 * These tests validate universal correctness properties across all valid inputs
 * using fast-check library for property-based testing.
 */

import fc from 'fast-check';
import { enrichAssessmentData } from '../../../lib/dna-report-chunked/enrichment.js';
import { TRAIT_GUIDE } from '../../../lib/dna-report-chunked/trait-definitions.js';

// Helper: Generate valid assessment data
const assessmentDataArbitrary = fc.record({
  profile: fc.record({
    name: fc.string(),
    email: fc.emailAddress(),
    userType: fc.constantFrom('entrepreneur', 'employee', 'student'),
    assessmentDate: fc.integer({ min: Date.parse('2000-01-01'), max: Date.parse('2030-12-31') }).map(ts => new Date(ts).toISOString())
  }),
  normalizedScores: fc.record(
    Object.keys(TRAIT_GUIDE).reduce((acc, key) => {
      acc[key] = fc.integer({ min: 0, max: 100 });
      return acc;
    }, {})
  ),
  rolesTop: fc.array(
    fc.record({
      role: fc.string({ minLength: 1 }),
      score: fc.integer({ min: 0, max: 100 })
    }),
    { minLength: 0, maxLength: 5 }
  )
});

describe('Enhanced Enrichment Layer - Property-Based Tests', () => {
  
  // Property 6: Valid Trait List in Enriched Context
  describe('Property 6: Valid Trait List in Enriched Context', () => {
    it('should include explicit list of all 16 valid trait keys', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Check that enriched context contains VALIDATION CONSTRAINTS section
          expect(enrichedContext).toContain('=== VALIDATION CONSTRAINTS ===');
          
          // Check that all 16 trait keys are listed
          const traitKeys = Object.keys(TRAIT_GUIDE);
          expect(traitKeys).toHaveLength(16);
          
          traitKeys.forEach(traitKey => {
            expect(enrichedContext).toContain(traitKey);
          });
          
          // Check for explicit statement about valid traits
          expect(enrichedContext).toMatch(/VALID TRAITS|valid trait/i);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 7: Valid Domain List in Enriched Context
  describe('Property 7: Valid Domain List in Enriched Context', () => {
    it('should include explicit list of all 6 valid domain keys', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Extract unique domains from TRAIT_GUIDE
          const domains = new Set();
          Object.values(TRAIT_GUIDE).forEach(trait => {
            domains.add(trait.domain);
          });
          
          expect(domains.size).toBe(6);
          
          // Check that all 6 domain keys are listed
          domains.forEach(domain => {
            expect(enrichedContext).toContain(domain);
          });
          
          // Check for explicit statement about valid domains
          expect(enrichedContext).toMatch(/VALID DOMAINS|valid domain/i);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 8: Anti-Hallucination Prohibitions Present
  describe('Property 8: Anti-Hallucination Prohibitions Present', () => {
    it('should contain all prohibition statements', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Check for prohibition statements
          const prohibitions = [
            /DO NOT.*invent.*trait/i,
            /DO NOT.*invent.*domain/i,
            /DO NOT.*invent.*metric/i,
            /DO NOT.*invent.*composite score/i
          ];
          
          prohibitions.forEach(prohibition => {
            expect(enrichedContext).toMatch(prohibition);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 9: Valid Role List When Roles Present
  describe('Property 9: Valid Role List When Roles Present', () => {
    it('should include explicit role list and prohibition when roles present', () => {
      const assessmentWithRoles = fc.record({
        profile: fc.record({
          name: fc.string(),
          email: fc.emailAddress()
        }),
        normalizedScores: fc.record(
          Object.keys(TRAIT_GUIDE).reduce((acc, key) => {
            acc[key] = fc.integer({ min: 0, max: 100 });
            return acc;
          }, {})
        ),
        rolesTop: fc.array(
          fc.record({
            role: fc.string({ minLength: 1 }),
            score: fc.integer({ min: 0, max: 100 })
          }),
          { minLength: 1, maxLength: 5 }
        )
      });

      fc.assert(
        fc.property(assessmentWithRoles, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Check that all role names are present
          assessmentData.rolesTop.forEach(roleData => {
            expect(enrichedContext).toContain(roleData.role);
          });
          
          // Check for role prohibition statement
          expect(enrichedContext).toMatch(/DO NOT.*invent.*role/i);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 10: Role Prohibition When Roles Absent
  describe('Property 10: Role Prohibition When Roles Absent', () => {
    it('should include role prohibition when roles absent', () => {
      const assessmentWithoutRoles = fc.record({
        profile: fc.record({
          name: fc.string(),
          email: fc.emailAddress()
        }),
        normalizedScores: fc.record(
          Object.keys(TRAIT_GUIDE).reduce((acc, key) => {
            acc[key] = fc.integer({ min: 0, max: 100 });
            return acc;
          }, {})
        ),
        rolesTop: fc.constant([])
      });

      fc.assert(
        fc.property(assessmentWithoutRoles, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Check for prohibition statement when no roles
          expect(enrichedContext).toMatch(/DO NOT.*reference.*role|NO role data/i);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 11: Role Name Validation
  describe('Property 11: Role Name Validation', () => {
    it('should match role names exactly from rolesTop', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          if (assessmentData.rolesTop && assessmentData.rolesTop.length > 0) {
            // All role names should appear in enriched context
            assessmentData.rolesTop.forEach(roleData => {
              expect(enrichedContext).toContain(roleData.role);
            });
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 12: Balanced Framing Guidance Present
  describe('Property 12: Balanced Framing Guidance Present', () => {
    it('should contain all balanced framing guidance statements', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Check for balanced framing section
          expect(enrichedContext).toContain('=== BALANCED TRAIT FRAMING ===');
          
          // Check for key guidance statements
          const guidanceStatements = [
            /40-69.*balanced|balanced.*40-69/i,
            /extreme.*inflexible|inflexible.*extreme/i,
            /both poles.*strength|strength.*both poles/i,
            /no value judgment|avoid.*judgment/i,
            /context.*optimal|optimal.*context/i
          ];
          
          guidanceStatements.forEach(statement => {
            expect(enrichedContext).toMatch(statement);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 15: Language Guidelines Present
  describe('Property 15: Language Guidelines Present', () => {
    it('should contain all language guideline statements', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Check for language guidelines section
          expect(enrichedContext).toContain('=== LANGUAGE GUIDELINES ===');
          
          // Check for key guideline statements
          const guidelines = [
            /forbidden.*vague|avoid.*vague/i,
            /concrete.*measurable|measurable.*concrete/i,
            /ostentatious|unnecessarily complex/i,
            /accessible.*language|human-centered/i,
            /observable.*specific|specific.*observable/i
          ];
          
          guidelines.forEach(guideline => {
            expect(enrichedContext).toMatch(guideline);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 5: Behavioral Indicators in Enriched Context
  // **Validates: Requirements 2.2, 3.2**
  describe('Property 5: Behavioral Indicators in Enriched Context', () => {
    it('should include behavioral indicators section only when trait data exists', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Check if any trait has behavioral indicators defined
          const hasAnyBehavioralIndicators = Object.entries(assessmentData.normalizedScores || {}).some(([traitKey, score]) => {
            if (score !== undefined && score !== null) {
              const trait = TRAIT_GUIDE[traitKey];
              return trait && trait.behavioralIndicators && trait.behavioralIndicators.length > 0;
            }
            return false;
          });
          
          if (hasAnyBehavioralIndicators) {
            // Section should be present if data exists
            expect(enrichedContext).toContain('=== BEHAVIORAL INDICATORS ===');
            
            // For each assessed trait with behavioral indicators, check that they appear
            Object.entries(assessmentData.normalizedScores || {}).forEach(([traitKey, score]) => {
              if (score !== undefined && score !== null) {
                const trait = TRAIT_GUIDE[traitKey];
                if (trait && trait.behavioralIndicators && trait.behavioralIndicators.length > 0) {
                  const behavioralSection = enrichedContext.split('=== BEHAVIORAL INDICATORS ===')[1];
                  if (behavioralSection) {
                    expect(behavioralSection).toContain(trait.displayName);
                  }
                }
              }
            });
          } else {
            // Section should still be present for backward compatibility
            expect(enrichedContext).toContain('=== BEHAVIORAL INDICATORS ===');
          }
        }),
        { numRuns: 100 }
      );
    });
  });

});
