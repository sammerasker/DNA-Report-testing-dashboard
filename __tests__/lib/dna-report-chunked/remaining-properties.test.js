/**
 * Remaining Property-Based Tests for Enhanced Enrichment Layer
 * 
 * Properties 4, 13, 14, 21-33
 */

import fc from 'fast-check';
import { enrichAssessmentData } from '../../../lib/dna-report-chunked/enrichment.js';
import { validateEnrichedContext } from '../../../lib/dna-report-chunked/enrichment-validator.js';
import { TRAIT_GUIDE } from '../../../lib/dna-report-chunked/trait-definitions.js';
import {
  parsePsychologicalFramework,
  parseBehavioralIndicators,
  validateFrameworkStructure,
  validateBehavioralStructure
} from '../../../lib/dna-report-chunked/framework-parser.js';

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

describe('Remaining Property-Based Tests', () => {
  
  // Property 4: Psychological Framework Validation
  describe('Property 4: Psychological Framework Validation', () => {
    it('should fail validation when psychological framework fields are missing but data exists', () => {
      /**
       * **Validates: Requirements 2.5, 3.5**
       */
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          // Check if any assessed trait has psychological framework data
          let hasFrameworkData = false;
          Object.entries(assessmentData.scores).forEach(([traitKey, score]) => {
            if (score !== undefined && score !== null) {
              const trait = TRAIT_GUIDE[traitKey];
              if (trait) {
                const pole = score < 50 ? trait.low : trait.high;
                if (pole.compassionateName || 
                    (pole.keyStrengths && pole.keyStrengths.length > 0) ||
                    (pole.riskFactors && pole.riskFactors.length > 0) ||
                    (pole.suggestions && pole.suggestions.length > 0) ||
                    (pole.howToUseStrengths && pole.howToUseStrengths.length > 0) ||
                    (pole.accommodations && pole.accommodations.length > 0)) {
                  hasFrameworkData = true;
                }
              }
            }
          });
          
          let enrichedContext = enrichAssessmentData(assessmentData);
          
          // Remove psychological framework section
          enrichedContext = enrichedContext.replace(/=== PSYCHOLOGICAL FRAMEWORK ===[\s\S]*?(?==== |$)/, '');
          
          // Validate
          const result = validateEnrichedContext(assessmentData, enrichedContext);
          
          // Should only fail validation if framework data exists
          if (hasFrameworkData) {
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('psychological') || e.includes('framework'))).toBe(true);
          } else {
            // Section should still be present for backward compatibility
            expect(result.valid).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 13: Section Definitions Present
  describe('Property 13: Section Definitions Present', () => {
    it('should contain all required section definitions', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Check for section requirements section
          expect(enrichedContext).toContain('=== SECTION REQUIREMENTS ===');
          
          // Check for required sections list
          const requiredSections = [
            'Executive Summary',
            'Cognitive & Vision',
            'Execution & Operations',
            'Interpersonal & Leadership',
            'Emotional & Resilience',
            'Innovation & Learning',
            'Risk & Uncertainty',
            'Development Opportunities',
            'Conclusion'
          ];
          
          requiredSections.forEach(section => {
            expect(enrichedContext).toContain(section);
          });
          
          // Check for minimum content requirements
          expect(enrichedContext).toMatch(/MINIMUM.*CONTENT|minimum.*content/i);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 14: Additional Context for Small Domains
  describe('Property 14: Additional Context for Small Domains', () => {
    it('should include additional behavioral context for domains with fewer than 3 traits', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Count traits per domain
          const domainTraitCounts = {};
          Object.values(TRAIT_GUIDE).forEach(trait => {
            const domain = trait.domainDisplayName;
            if (!domainTraitCounts[domain]) {
              domainTraitCounts[domain] = 0;
            }
            domainTraitCounts[domain]++;
          });
          
          // Find small domains
          const smallDomains = Object.entries(domainTraitCounts)
            .filter(([domain, count]) => count < 3)
            .map(([domain]) => domain);
          
          // If there are small domains, check for additional context guidance
          if (smallDomains.length > 0) {
            expect(enrichedContext).toMatch(/ADDITIONAL CONTEXT.*SMALL DOMAIN|small domain.*additional/i);
            
            smallDomains.forEach(domain => {
              // Should mention the domain in additional context section
              const sectionRequirements = enrichedContext.split('=== SECTION REQUIREMENTS ===')[1];
              if (sectionRequirements) {
                expect(sectionRequirements).toContain(domain);
              }
            });
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 22: Validation Results Are Logged
  describe('Property 22: Validation Results Are Logged', () => {
    it('should return validation results for all enrichment operations', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Validate
          const result = validateEnrichedContext(assessmentData, enrichedContext);
          
          // Should return validation result object
          expect(result).toBeDefined();
          expect(result).toHaveProperty('valid');
          expect(result).toHaveProperty('errors');
          expect(result).toHaveProperty('warnings');
          expect(typeof result.valid).toBe('boolean');
          expect(Array.isArray(result.errors)).toBe(true);
          expect(Array.isArray(result.warnings)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 23: Psychological Framework JSON Parsing
  describe('Property 23: Psychological Framework JSON Parsing', () => {
    it('should parse valid psychological framework JSON correctly', () => {
      // This test requires actual JSON files, so we'll test the validation function
      const validFramework = {
        version: 'psy-v1',
        language: 'en',
        traits: {
          speed: {
            low: {
              name: 'Deliberate Pacing',
              key_strengths: ['Strength 1', 'Strength 2', 'Strength 3'],
              risk_factors: ['Risk 1', 'Risk 2'],
              suggestions: ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'],
              how_to_use_strengths: ['How 1', 'How 2'],
              accommodations: ['Accommodation 1', 'Accommodation 2']
            },
            high: {
              name: 'Fast-Cycle Decision-Making',
              key_strengths: ['Strength 1', 'Strength 2', 'Strength 3'],
              risk_factors: ['Risk 1', 'Risk 2'],
              suggestions: ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'],
              how_to_use_strengths: ['How 1', 'How 2'],
              accommodations: ['Accommodation 1', 'Accommodation 2']
            }
          }
        }
      };
      
      const result = validateFrameworkStructure(validFramework);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // Property 24: Behavioral Indicators JSON Parsing
  describe('Property 24: Behavioral Indicators JSON Parsing', () => {
    it('should parse valid behavioral indicators JSON correctly', () => {
      const validBehavioral = {
        version: 'psy-v1',
        language: 'en',
        traits: {
          speed: {
            scale: {
              low: 'Deliberate Pacing',
              high: 'Fast-Cycle Decision-Making'
            },
            measures: 'Decision latency',
            entrepreneurial_relevance: 'Critical for timing',
            behaviors: [
              {
                id: 'decision_latency',
                name: 'Decision Latency',
                description: 'Time to decide',
                low: 'Takes 3-5 days',
                mid: 'Takes 24-48 hours',
                high: 'Decides within hours'
              }
            ]
          }
        }
      };
      
      const result = validateBehavioralStructure(validBehavioral);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // Property 25: JSON Structure Validation
  describe('Property 25: JSON Structure Validation', () => {
    it('should fail validation with descriptive error for invalid JSON structure', () => {
      const invalidFramework = {
        version: 'psy-v1',
        // Missing language field
        traits: {
          speed: {
            low: {
              // Missing required fields
              name: 'Deliberate Pacing'
            }
          }
        }
      };
      
      const result = validateFrameworkStructure(invalidFramework);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => typeof e === 'string' && e.length > 0)).toBe(true);
    });
  });

  // Property 29: Risk Factors in Extreme Score Bands
  describe('Property 29: Risk Factors in Extreme Score Bands', () => {
    it('should include risk factors for extreme scores', () => {
      const extremeScores = fc.record({
        profile: fc.record({
          name: fc.string(),
          email: fc.emailAddress()
        }),
        scores: fc.record(
          Object.keys(TRAIT_GUIDE).reduce((acc, key) => {
            // Generate extreme scores (0-24 or 85-100)
            acc[key] = fc.oneof(
              fc.integer({ min: 0, max: 24 }),
              fc.integer({ min: 85, max: 100 })
            );
            return acc;
          }, {})
        ),
        rolesTop: fc.constant([])
      });

      fc.assert(
        fc.property(extremeScores, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Check if any assessed trait has riskFactors data
          let hasRiskFactorsData = false;
          Object.entries(assessmentData.scores).forEach(([traitKey, score]) => {
            if (score !== undefined && score !== null) {
              const trait = TRAIT_GUIDE[traitKey];
              if (trait) {
                const pole = score < 50 ? trait.low : trait.high;
                if (pole.riskFactors && pole.riskFactors.length > 0) {
                  hasRiskFactorsData = true;
                }
              }
            }
          });
          
          // Only assert section presence if risk factors data exists
          if (hasRiskFactorsData) {
            expect(enrichedContext).toContain('=== PSYCHOLOGICAL FRAMEWORK ===');
            
            // For extreme scores, risk factors should be present
            Object.entries(assessmentData.scores).forEach(([traitKey, score]) => {
              const trait = TRAIT_GUIDE[traitKey];
              if (trait) {
                const pole = score < 50 ? trait.low : trait.high;
                if (pole.riskFactors && pole.riskFactors.length > 0) {
                  // Check that at least one risk factor appears in the context
                  const frameworkSection = enrichedContext.split('=== PSYCHOLOGICAL FRAMEWORK ===')[1];
                  if (frameworkSection) {
                    expect(frameworkSection).toMatch(/Risk Factor/i);
                  }
                }
              }
            });
          } else {
            // Section should still be present for backward compatibility
            expect(enrichedContext).toContain('=== PSYCHOLOGICAL FRAMEWORK ===');
          }
        }),
        { numRuns: 50 }
      );
    });
  });

  // Property 30: Suggestions for Development Areas
  describe('Property 30: Suggestions for Development Areas', () => {
    it('should include suggestions for development area scores', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Check if any assessed trait has suggestions data
          let hasSuggestionsData = false;
          Object.entries(assessmentData.scores).forEach(([traitKey, score]) => {
            if (score !== undefined && score !== null) {
              const trait = TRAIT_GUIDE[traitKey];
              if (trait) {
                const pole = score < 50 ? trait.low : trait.high;
                if (pole.suggestions && pole.suggestions.length > 0) {
                  hasSuggestionsData = true;
                }
              }
            }
          });
          
          // Only assert section presence if suggestions data exists
          if (hasSuggestionsData) {
            expect(enrichedContext).toContain('=== PSYCHOLOGICAL FRAMEWORK ===');
            
            // For all scores, suggestions should be present
            Object.entries(assessmentData.scores).forEach(([traitKey, score]) => {
              const trait = TRAIT_GUIDE[traitKey];
              if (trait) {
                const pole = score < 50 ? trait.low : trait.high;
                if (pole.suggestions && pole.suggestions.length > 0) {
                  // Check that suggestions section appears
                  const frameworkSection = enrichedContext.split('=== PSYCHOLOGICAL FRAMEWORK ===')[1];
                  if (frameworkSection) {
                    expect(frameworkSection).toMatch(/Suggestion/i);
                  }
                }
              }
            });
          } else {
            // Section should still be present for backward compatibility
            expect(enrichedContext).toContain('=== PSYCHOLOGICAL FRAMEWORK ===');
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 31: Backward Compatible Output Format
  describe('Property 31: Backward Compatible Output Format', () => {
    it('should produce all sections from current enrichment', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Check for all original sections
          const originalSections = [
            '=== USER PROFILE ===',
            '=== SCORE INTERPRETATIONS ===',
            '=== DOMAIN MAPPINGS ===',
            '=== TRAIT INSIGHTS ==='
          ];
          
          originalSections.forEach(section => {
            expect(enrichedContext).toContain(section);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 32: Backward Compatible Function Signatures
  describe('Property 32: Backward Compatible Function Signatures', () => {
    it('should accept same parameters and return string', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          // Should accept assessment data object
          const result = enrichAssessmentData(assessmentData);
          
          // Should return string
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 33: Backward Compatible Field Presence
  describe('Property 33: Backward Compatible Field Presence', () => {
    it('should contain all fields from current enrichment', () => {
      fc.assert(
        fc.property(assessmentDataArbitrary, (assessmentData) => {
          const enrichedContext = enrichAssessmentData(assessmentData);
          
          // Check for original fields
          expect(enrichedContext).toContain('Name:');
          expect(enrichedContext).toContain('Email:');
          
          // Check for trait interpretations
          Object.keys(TRAIT_GUIDE).forEach(traitKey => {
            const trait = TRAIT_GUIDE[traitKey];
            if (trait && assessmentData.scores[traitKey] !== undefined) {
              expect(enrichedContext).toContain(trait.displayName);
            }
          });
          
          // Check for domain aggregations
          const domains = new Set();
          Object.values(TRAIT_GUIDE).forEach(trait => {
            domains.add(trait.domainDisplayName);
          });
          
          domains.forEach(domain => {
            expect(enrichedContext).toContain(domain);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

});
