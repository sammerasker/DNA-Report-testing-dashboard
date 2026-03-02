/**
 * Property-Based Tests for Enrichment Validator
 * 
 * These tests validate that the validation layer correctly detects missing elements
 * using fast-check library for property-based testing.
 */

import fc from 'fast-check';
import {
  validateEnrichedContext,
  validateTraitCompleteness,
  validateDomainCompleteness,
  validateBehavioralIndicators,
  validatePsychologicalFramework
} from '../../../lib/dna-report-chunked/enrichment-validator.js';
import { enrichAssessmentData } from '../../../lib/dna-report-chunked/enrichment.js';
import { TRAIT_GUIDE } from '../../../lib/dna-report-chunked/trait-definitions.js';

// Helper: Generate valid assessment data
const assessmentDataArbitrary = fc.record({
  profile: fc.record({
    name: fc.string(),
    email: fc.emailAddress()
  }),
  scores: fc.record(
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

describe('Enrichment Validator - Property-Based Tests', () => {
  
  // Property 16: Validation Detects Missing Trait Interpretations
  describe('Property 16: Validation Detects Missing Trait Interpretations', () => {
    it('should fail validation when trait interpretations are missing', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...Object.keys(TRAIT_GUIDE)), { minLength: 1, maxLength: 5 }),
          (traitsToRemove) => {
            // Generate valid enriched context
            const assessmentData = {
              profile: { name: 'Test', email: 'test@example.com' },
              scores: Object.keys(TRAIT_GUIDE).reduce((acc, key) => {
                acc[key] = 50;
                return acc;
              }, {}),
              rolesTop: []
            };
            
            let enrichedContext = enrichAssessmentData(assessmentData);
            
            // Remove trait interpretations for selected traits
            traitsToRemove.forEach(traitKey => {
              const trait = TRAIT_GUIDE[traitKey];
              if (trait) {
                // Remove the trait from TRAIT INSIGHTS section
                const regex = new RegExp(`${trait.displayName}.*?\\n\\n`, 'gs');
                enrichedContext = enrichedContext.replace(regex, '');
              }
            });
            
            // Validate
            const result = validateTraitCompleteness(enrichedContext);
            
            // Should detect missing traits
            expect(result.valid).toBe(false);
            expect(result.missingTraits.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Property 17: Validation Detects Missing Domain Aggregations
  describe('Property 17: Validation Detects Missing Domain Aggregations', () => {
    it('should fail validation when domain aggregations are missing', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              'cognitive_vision',
              'execution_operations',
              'interpersonal_leadership',
              'emotional_resilience',
              'innovation_learning',
              'risk_uncertainty'
            ),
            { minLength: 1, maxLength: 3 }
          ),
          (domainsToRemove) => {
            // Generate valid enriched context
            const assessmentData = {
              profile: { name: 'Test', email: 'test@example.com' },
              scores: Object.keys(TRAIT_GUIDE).reduce((acc, key) => {
                acc[key] = 50;
                return acc;
              }, {}),
              rolesTop: []
            };
            
            let enrichedContext = enrichAssessmentData(assessmentData);
            
            // Remove domain aggregations for selected domains
            domainsToRemove.forEach(domainKey => {
              // Find domain display name
              const domainTrait = Object.values(TRAIT_GUIDE).find(t => t.domain === domainKey);
              if (domainTrait) {
                const domainName = domainTrait.domainDisplayName;
                // Remove the domain from DOMAIN MAPPINGS section
                const regex = new RegExp(`${domainName}:.*?\\n\\n`, 'gs');
                enrichedContext = enrichedContext.replace(regex, '');
              }
            });
            
            // Validate
            const result = validateDomainCompleteness(enrichedContext);
            
            // Should detect missing domains
            expect(result.valid).toBe(false);
            expect(result.missingDomains.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Property 19: Validation Detects Missing Behavioral Indicators
  describe('Property 19: Validation Detects Missing Behavioral Indicators', () => {
    it('should fail validation when behavioral indicators are missing', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...Object.keys(TRAIT_GUIDE)), { minLength: 1, maxLength: 5 }),
          (traitsToRemove) => {
            // Generate valid enriched context
            const assessmentData = {
              profile: { name: 'Test', email: 'test@example.com' },
              scores: Object.keys(TRAIT_GUIDE).reduce((acc, key) => {
                acc[key] = 50;
                return acc;
              }, {}),
              rolesTop: []
            };
            
            let enrichedContext = enrichAssessmentData(assessmentData);
            
            // Remove behavioral indicators for selected traits
            traitsToRemove.forEach(traitKey => {
              const trait = TRAIT_GUIDE[traitKey];
              if (trait && trait.behavioralIndicators) {
                // Remove the trait from BEHAVIORAL INDICATORS section
                const regex = new RegExp(`${trait.displayName}.*?Behavioral Indicators:.*?\\n\\n`, 'gs');
                enrichedContext = enrichedContext.replace(regex, '');
              }
            });
            
            // Validate
            const result = validateBehavioralIndicators(assessmentData.scores, enrichedContext);
            
            // Should detect missing indicators for traits with behavioral indicators defined
            const traitsWithIndicators = traitsToRemove.filter(key => {
              const trait = TRAIT_GUIDE[key];
              return trait && trait.behavioralIndicators && trait.behavioralIndicators.length > 0;
            });
            
            if (traitsWithIndicators.length > 0) {
              expect(result.valid).toBe(false);
              expect(result.missingIndicators.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Property 20: Validation Detects Incomplete Psychological Framework
  describe('Property 20: Validation Detects Incomplete Psychological Framework', () => {
    it('should fail validation when psychological framework is incomplete', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...Object.keys(TRAIT_GUIDE)), { minLength: 1, maxLength: 5 }),
          (traitsToRemove) => {
            // Generate valid enriched context
            const assessmentData = {
              profile: { name: 'Test', email: 'test@example.com' },
              scores: Object.keys(TRAIT_GUIDE).reduce((acc, key) => {
                acc[key] = 50;
                return acc;
              }, {}),
              rolesTop: []
            };
            
            let enrichedContext = enrichAssessmentData(assessmentData);
            
            // Remove psychological framework for selected traits
            traitsToRemove.forEach(traitKey => {
              const trait = TRAIT_GUIDE[traitKey];
              if (trait) {
                // Remove the trait from PSYCHOLOGICAL FRAMEWORK section
                const regex = new RegExp(`${trait.displayName}.*?(?=\\n\\n|$)`, 'gs');
                const frameworkSection = enrichedContext.split('=== PSYCHOLOGICAL FRAMEWORK ===')[1];
                if (frameworkSection) {
                  const modifiedSection = frameworkSection.replace(regex, '');
                  enrichedContext = enrichedContext.replace(
                    '=== PSYCHOLOGICAL FRAMEWORK ===' + frameworkSection,
                    '=== PSYCHOLOGICAL FRAMEWORK ===' + modifiedSection
                  );
                }
              }
            });
            
            // Validate
            const result = validatePsychologicalFramework(enrichedContext);
            
            // Should detect missing framework for traits with framework defined
            const traitsWithFramework = traitsToRemove.filter(key => {
              const trait = TRAIT_GUIDE[key];
              const pole = trait.low;
              return pole && (pole.compassionateName || pole.keyStrengths || pole.riskFactors);
            });
            
            if (traitsWithFramework.length > 0) {
              expect(result.valid).toBe(false);
              expect(result.missingFramework.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Property 21: Validation Errors Are Descriptive
  describe('Property 21: Validation Errors Are Descriptive', () => {
    it('should contain specific missing elements in error messages', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Corrupt the enriched context by removing a section
          const corruptedContext = enrichedContext.replace('=== TRAIT INSIGHTS ===', '');
          
          // Validate
          const result = validateEnrichedContext(assessmentData, corruptedContext);
          
          // If validation fails, errors should be descriptive
          if (!result.valid) {
            expect(result.errors.length).toBeGreaterThan(0);
            result.errors.forEach(error => {
              expect(error).toBeTruthy();
              expect(typeof error).toBe('string');
              expect(error.length).toBeGreaterThan(10); // Should be descriptive, not just "error"
            });
          }
        }),
        { numRuns: 100 }
      );
    });
  });

});
