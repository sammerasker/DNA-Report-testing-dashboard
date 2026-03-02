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
    it('should generate enriched context with all 12 sections', () => {
      const enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Verify all 12 sections are present
      const expectedSections = [
        '=== VALIDATION CONSTRAINTS ===',
        '=== BALANCED TRAIT FRAMING ===',
        '=== LANGUAGE GUIDELINES ===',
        '=== USER PROFILE ===',
        '=== SCORE INTERPRETATIONS ===',
        '=== BEHAVIORAL INDICATORS ===',
        '=== PSYCHOLOGICAL FRAMEWORK ===',
        '=== DOMAIN MAPPINGS ===',
        '=== TRAIT INSIGHTS ===',
        '=== CENTRAL TENSIONS & SYNERGIES ===',
        '=== ROLE MATCH RATIONALE ===',
        '=== SECTION REQUIREMENTS ==='
      ];
      
      expectedSections.forEach(section => {
        expect(enrichedContext).toContain(section);
      });
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
      
      // Check for behavioral indicators section
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
    });

    it('should include psychological framework for assessed traits', () => {
      const enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Check for psychological framework section
      expect(enrichedContext).toContain('=== PSYCHOLOGICAL FRAMEWORK ===');
      
      // Verify framework fields are present
      const frameworkSection = enrichedContext.split('=== PSYCHOLOGICAL FRAMEWORK ===')[1];
      if (frameworkSection) {
        expect(frameworkSection).toMatch(/Key Strength|Risk Factor|Suggestion/i);
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
      
      // Corrupt the enriched context by removing the BEHAVIORAL INDICATORS section
      enrichedContext = enrichedContext.replace(/=== BEHAVIORAL INDICATORS ===[\s\S]*?===/g, '===');
      
      // Validate
      const validationResult = validateEnrichedContext(sampleAssessmentData, enrichedContext);
      
      // Should fail validation (missing BEHAVIORAL INDICATORS section)
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
      expect(validationResult.errors.some(e => e.includes('BEHAVIORAL INDICATORS'))).toBe(true);
    });

    it('should detect missing behavioral indicators', () => {
      let enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Remove behavioral indicators section
      enrichedContext = enrichedContext.replace(/=== BEHAVIORAL INDICATORS ===[\s\S]*?(?==== |$)/, '');
      
      // Validate
      const validationResult = validateEnrichedContext(sampleAssessmentData, enrichedContext);
      
      // Should fail validation
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.some(e => e.includes('behavioral') || e.includes('indicator'))).toBe(true);
    });

    it('should detect missing psychological framework', () => {
      let enrichedContext = enrichAssessmentData(sampleAssessmentData);
      
      // Remove psychological framework section
      enrichedContext = enrichedContext.replace(/=== PSYCHOLOGICAL FRAMEWORK ===[\s\S]*?(?==== |$)/, '');
      
      // Validate
      const validationResult = validateEnrichedContext(sampleAssessmentData, enrichedContext);
      
      // Should fail validation
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.some(e => e.includes('psychological') || e.includes('framework'))).toBe(true);
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
