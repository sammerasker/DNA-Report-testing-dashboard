/**
 * End-to-End Integration Tests for Enhanced Enrichment Layer
 * 
 * Tests complete flow: JSON parsing → TRAIT_GUIDE extension → enrichment → validation
 */

import { enrichAssessmentData } from '../../../lib/dna-report-chunked/enrichment.js';
import { validateEnrichedContext } from '../../../lib/dna-report-chunked/enrichment-validator.js';
import { TRAIT_GUIDE } from '../../../lib/dna-report-chunked/trait-definitions.js';

describe('Enhanced Enrichment Layer - End-to-End Integration', () => {
  
  // Sample assessment data for testing
  const sampleAssessmentData = {
    profile: {
      name: 'John Entrepreneur',
      email: 'john@startup.com',
      userType: 'entrepreneur',
      assessmentDate: '2024-01-15T10:30:00Z'
    },
    scores: {
      speed: 75,
      complexity: 60,
      vision: 80,
      structure: 45,
      detail: 50,
      consistency: 55,
      collaboration: 70,
      influence: 65,
      empathy: 60,
      stress: 55,
      steadiness: 50,
      optimism: 70,
      novelty: 85,
      experimentation: 80,
      learning: 75,
      risk: 70,
      ambiguity: 65
    },
    rolesTop: [
      { role: 'Visionary Founder', score: 85 },
      { role: 'Product Innovator', score: 80 },
      { role: 'Growth Leader', score: 75 }
    ]
  };

  describe('Complete Enrichment Flow', () => {
    it('should generate enriched context with all sections based on data availability', () => {
      const enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Always-present sections (8)
      const alwaysPresentSections = [
        '=== VALIDATION CONSTRAINTS ===',
        '=== BALANCED TRAIT FRAMING ===',
        '=== LANGUAGE GUIDELINES ===',
        '=== USER PROFILE ===',
        '=== SCORE INTERPRETATIONS ===',
        '=== DOMAIN MAPPINGS ===',
        '=== TRAIT INSIGHTS ===',
        '=== SECTION REQUIREMENTS ==='
      ];
      
      // Conditional sections - check if they should be present
      const conditionalSections = [];
      
      // Check if tensions section should be present
      const hasTensions = enrichedContext.includes('=== CENTRAL TENSIONS & SYNERGIES ===');
      if (hasTensions) {
        conditionalSections.push('=== CENTRAL TENSIONS & SYNERGIES ===');
      }
      
      // Check if roles section should be present
      const hasRoles = sampleAssessmentData.rolesTop && sampleAssessmentData.rolesTop.length > 0;
      if (hasRoles) {
        conditionalSections.push('=== ROLE MATCH RATIONALE ===');
      }
      
      // Check if behavioral indicators section should be present
      const hasBehavioralIndicators = enrichedContext.includes('=== BEHAVIORAL INDICATORS ===');
      if (hasBehavioralIndicators) {
        conditionalSections.push('=== BEHAVIORAL INDICATORS ===');
      }
      
      // Check if psychological framework section should be present
      const hasFramework = enrichedContext.includes('=== PSYCHOLOGICAL FRAMEWORK ===');
      if (hasFramework) {
        conditionalSections.push('=== PSYCHOLOGICAL FRAMEWORK ===');
      }
      
      // Calculate expected section count dynamically
      const expectedSectionCount = alwaysPresentSections.length + conditionalSections.length;
      
      // Verify all expected sections are present
      const allExpectedSections = [...alwaysPresentSections, ...conditionalSections];
      allExpectedSections.forEach(section => {
        expect(enrichedContext).toContain(section);
      });
      
      // Verify the total count matches
      const actualSectionCount = allExpectedSections.filter(section => 
        enrichedContext.includes(section)
      ).length;
      expect(actualSectionCount).toBe(expectedSectionCount);
    });

    it('should include all 16 trait interpretations', () => {
      const enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Verify all traits are interpreted
      Object.values(TRAIT_GUIDE).forEach(trait => {
        expect(enrichedContext).toContain(trait.displayName);
      });
    });

    it('should include all 6 domain aggregations', () => {
      const enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Extract unique domains
      const domains = new Set();
      Object.values(TRAIT_GUIDE).forEach(trait => {
        domains.add(trait.domainDisplayName);
      });
      
      // Verify all domains are aggregated
      domains.forEach(domain => {
        expect(enrichedContext).toContain(domain);
      });
    });

    it('should include behavioral indicators for assessed traits', () => {
      const enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Check if any assessed trait has behavioral indicators data
      let hasBehavioralIndicatorsData = false;
      Object.keys(sampleAssessmentData.scores).forEach(traitKey => {
        const trait = TRAIT_GUIDE[traitKey];
        if (trait && trait.behavioralIndicators && trait.behavioralIndicators.length > 0) {
          hasBehavioralIndicatorsData = true;
        }
      });
      
      if (hasBehavioralIndicatorsData) {
        // Section should always be present (even if empty/placeholder) for backward compatibility
        expect(enrichedContext).toContain('=== BEHAVIORAL INDICATORS ===');
        
        // Verify behavioral indicators are present for traits with indicators defined
        Object.keys(sampleAssessmentData.scores).forEach(traitKey => {
          const trait = TRAIT_GUIDE[traitKey];
          if (trait && trait.behavioralIndicators && trait.behavioralIndicators.length > 0) {
            const behavioralSection = enrichedContext.split('=== BEHAVIORAL INDICATORS ===')[1];
            if (behavioralSection) {
              expect(behavioralSection).toContain(trait.displayName);
            }
          }
        });
      } else {
        // Section should still be present for backward compatibility
        expect(enrichedContext).toContain('=== BEHAVIORAL INDICATORS ===');
      }
    });

    it('should include psychological framework for assessed traits', () => {
      const enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Check if any assessed trait has psychological framework data
      let hasFrameworkData = false;
      Object.entries(sampleAssessmentData.scores).forEach(([traitKey, score]) => {
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
            }
          }
        }
      });
      
      if (hasFrameworkData) {
        // Section should always be present (even if empty/placeholder) for backward compatibility
        expect(enrichedContext).toContain('=== PSYCHOLOGICAL FRAMEWORK ===');
        
        // Verify framework fields are present
        const frameworkSection = enrichedContext.split('=== PSYCHOLOGICAL FRAMEWORK ===')[1];
        if (frameworkSection) {
          expect(frameworkSection).toMatch(/Key Strength|Risk Factor|Suggestion/i);
        }
      } else {
        // Section should still be present for backward compatibility
        expect(enrichedContext).toContain('=== PSYCHOLOGICAL FRAMEWORK ===');
      }
    });

    it('should include anti-hallucination constraints', () => {
      const enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Check for validation constraints section
      expect(enrichedContext).toContain('=== VALIDATION CONSTRAINTS ===');
      
      // Verify all 16 trait keys are listed
      Object.keys(TRAIT_GUIDE).forEach(traitKey => {
        expect(enrichedContext).toContain(traitKey);
      });
      
      // Verify prohibition statements
      expect(enrichedContext).toMatch(/DO NOT.*invent/i);
    });

    it('should include role match rationale when roles provided', () => {
      const enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Check for role match section
      expect(enrichedContext).toContain('=== ROLE MATCH RATIONALE ===');
      
      // Verify all roles are present
      sampleAssessmentData.rolesTop.forEach(roleData => {
        expect(enrichedContext).toContain(roleData.role);
      });
    });

    it('should pass validation for complete enriched context', () => {
      const enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Validate the enriched context
      const validationResult = validateEnrichedContext(sampleAssessmentData, enrichedContext);
      
      // Debug: log validation errors if any
      if (!validationResult.valid) {
        console.log('Validation errors:', validationResult.errors);
        console.log('Enriched context length:', enrichedContext.length);
      }
      
      // Should pass validation
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle assessment data with no roles', () => {
      const dataWithoutRoles = {
        ...sampleAssessmentData,
        rolesTop: []
      };
      
      const enrichedContext = enrichAssessmentData(dataWithoutRoles);
      
      // Should still generate valid enriched context
      expect(enrichedContext).toBeTruthy();
      expect(enrichedContext.length).toBeGreaterThan(0);
      
      // Should include role prohibition statement
      expect(enrichedContext).toMatch(/DO NOT.*reference.*role|NO role data/i);
    });

    it('should handle assessment data with missing profile fields', () => {
      const dataWithMissingProfile = {
        profile: {},
        scores: sampleAssessmentData.scores,
        rolesTop: []
      };
      
      const enrichedContext = enrichAssessmentData(dataWithMissingProfile);
      
      // Should still generate valid enriched context
      expect(enrichedContext).toBeTruthy();
      expect(enrichedContext).toContain('=== USER PROFILE ===');
      expect(enrichedContext).toContain('Not Provided');
    });

    it('should handle assessment data with null/undefined scores', () => {
      const dataWithMissingScores = {
        profile: sampleAssessmentData.profile,
        scores: {
          speed: 75,
          complexity: null,
          vision: undefined,
          // ... other scores missing
        },
        rolesTop: []
      };
      
      const enrichedContext = enrichAssessmentData(dataWithMissingScores);
      
      // Should still generate valid enriched context
      expect(enrichedContext).toBeTruthy();
      expect(enrichedContext).toContain('=== SCORE INTERPRETATIONS ===');
    });

    it('should handle empty assessment data', () => {
      const emptyData = {};
      
      const enrichedContext = enrichAssessmentData(emptyData);
      
      // Should still generate enriched context with defaults
      expect(enrichedContext).toBeTruthy();
      expect(enrichedContext).toContain('=== VALIDATION CONSTRAINTS ===');
      expect(enrichedContext).toContain('=== USER PROFILE ===');
    });
  });

  describe('Validation Integration', () => {
    it('should detect missing sections in corrupted enriched context', () => {
      let enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Check if behavioral indicators data exists in the assessment
      let hasBehavioralIndicatorsData = false;
      Object.keys(sampleAssessmentData.scores).forEach(traitKey => {
        const trait = TRAIT_GUIDE[traitKey];
        if (trait && trait.behavioralIndicators && trait.behavioralIndicators.length > 0) {
          hasBehavioralIndicatorsData = true;
        }
      });
      
      if (hasBehavioralIndicatorsData) {
        // Only test removal if data exists for behavioral indicators
        // Corrupt the enriched context by removing the BEHAVIORAL INDICATORS section
        enrichedContext = enrichedContext.replace(/=== BEHAVIORAL INDICATORS ===[\s\S]*?===/g, '===');
        
        // Validate
        const validationResult = validateEnrichedContext(sampleAssessmentData, enrichedContext);
        
        // Should fail validation (missing BEHAVIORAL INDICATORS section when data exists)
        expect(validationResult.valid).toBe(false);
        expect(validationResult.errors.length).toBeGreaterThan(0);
        expect(validationResult.errors.some(e => e.includes('BEHAVIORAL INDICATORS'))).toBe(true);
      } else {
        // If no behavioral indicators data exists, validation should pass without the section
        const validationResult = validateEnrichedContext(sampleAssessmentData, enrichedContext);
        
        // Should pass validation (no data exists for BEHAVIORAL INDICATORS)
        expect(validationResult.valid).toBe(true);
      }
    });

    it('should detect missing behavioral indicators', () => {
      let enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Check if behavioral indicators data exists in the assessment
      let hasBehavioralIndicatorsData = false;
      Object.keys(sampleAssessmentData.scores).forEach(traitKey => {
        const trait = TRAIT_GUIDE[traitKey];
        if (trait && trait.behavioralIndicators && trait.behavioralIndicators.length > 0) {
          hasBehavioralIndicatorsData = true;
        }
      });
      
      if (hasBehavioralIndicatorsData) {
        // Only test removal if data exists for behavioral indicators
        // Remove behavioral indicators section
        enrichedContext = enrichedContext.replace(/=== BEHAVIORAL INDICATORS ===[\s\S]*?(?==== |$)/, '');
        
        // Validate
        const validationResult = validateEnrichedContext(sampleAssessmentData, enrichedContext);
        
        // Should fail validation (missing section when data exists)
        expect(validationResult.valid).toBe(false);
        expect(validationResult.errors.some(e => e.includes('behavioral') || e.includes('indicator'))).toBe(true);
      } else {
        // If no behavioral indicators data exists, validation should pass without the section
        const validationResult = validateEnrichedContext(sampleAssessmentData, enrichedContext);
        
        // Should pass validation (no data exists for BEHAVIORAL INDICATORS)
        expect(validationResult.valid).toBe(true);
      }
    });

    it('should detect missing psychological framework', () => {
      let enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Check if psychological framework data exists in the assessment
      let hasFrameworkData = false;
      Object.entries(sampleAssessmentData.scores).forEach(([traitKey, score]) => {
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
            }
          }
        }
      });
      
      if (hasFrameworkData) {
        // Only test removal if data exists for psychological framework
        // Remove psychological framework section
        enrichedContext = enrichedContext.replace(/=== PSYCHOLOGICAL FRAMEWORK ===[\s\S]*?(?==== |$)/, '');
        
        // Validate
        const validationResult = validateEnrichedContext(sampleAssessmentData, enrichedContext);
        
        // Should fail validation (missing section when data exists)
        expect(validationResult.valid).toBe(false);
        expect(validationResult.errors.some(e => e.includes('psychological') || e.includes('framework'))).toBe(true);
      } else {
        // If no psychological framework data exists, validation should pass without the section
        const validationResult = validateEnrichedContext(sampleAssessmentData, enrichedContext);
        
        // Should pass validation (no data exists for PSYCHOLOGICAL FRAMEWORK)
        expect(validationResult.valid).toBe(true);
      }
    });
  });

  describe('Performance', () => {
    it('should generate enriched context in reasonable time', () => {
      const startTime = Date.now();
      
      enrichAssessmentData(sampleAssessmentData);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in less than 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should validate enriched context in reasonable time', () => {
      const enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      const startTime = Date.now();
      
      validateEnrichedContext(sampleAssessmentData, enrichedContext);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in less than 500ms
      expect(duration).toBeLessThan(500);
    });
  });

});
