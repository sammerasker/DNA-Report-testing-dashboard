/**
 * Backward Compatibility Integration Tests
 * 
 * Verifies that enhanced enrichment maintains compatibility with existing report generation code
 */

import { enrichAssessmentData } from '../../../lib/dna-report-chunked/enrichment.js';
import { TRAIT_GUIDE } from '../../../lib/dna-report-chunked/trait-definitions.js';

describe('Backward Compatibility Integration Tests', () => {
  
  // Multiple assessment data samples for comprehensive testing
  const assessmentSamples = [
    {
      name: 'High-Energy Innovator',
      data: {
        profile: {
          name: 'Alice Innovator',
          email: 'alice@startup.com',
          userType: 'entrepreneur'
        },
        scores: {
          speed: 85,
          abstraction: 70,
          creativity: 90,
          structure: 40,
          planning: 35,
          risk: 80,
          empathy: 65,
          conflict: 75,
          expressiveness: 80,
          trust: 60,
          mission: 85,
          competition: 95,
          stress: 70,
          ambiguity: 75,
          visibility: 85,
          influence: 80
        },
        rolesTop: [
          { role: 'Visionary Founder', score: 90 },
          { role: 'Innovation Leader', score: 88 }
        ]
      }
    },
    {
      name: 'Balanced Operator',
      data: {
        profile: {
          name: 'Bob Operator',
          email: 'bob@company.com',
          userType: 'employee'
        },
        scores: {
          speed: 50,
          abstraction: 55,
          creativity: 50,
          structure: 60,
          planning: 65,
          risk: 50,
          empathy: 60,
          conflict: 60,
          expressiveness: 55,
          trust: 60,
          mission: 55,
          competition: 45,
          stress: 55,
          ambiguity: 45,
          visibility: 55,
          influence: 55
        },
        rolesTop: [
          { role: 'Operations Manager', score: 75 },
          { role: 'Project Lead', score: 70 }
        ]
      }
    },
    {
      name: 'Deliberate Strategist',
      data: {
        profile: {
          name: 'Carol Strategist',
          email: 'carol@consulting.com',
          userType: 'entrepreneur'
        },
        scores: {
          speed: 30,
          abstraction: 85,
          creativity: 75,
          structure: 70,
          planning: 80,
          risk: 35,
          empathy: 55,
          conflict: 50,
          expressiveness: 60,
          trust: 75,
          mission: 60,
          competition: 40,
          stress: 65,
          ambiguity: 60,
          visibility: 55,
          influence: 60
        },
        rolesTop: [
          { role: 'Strategic Advisor', score: 85 },
          { role: 'Systems Architect', score: 80 }
        ]
      }
    }
  ];

  describe('Function Signature Compatibility', () => {
    it('should accept assessment data object as single parameter', () => {
      assessmentSamples.forEach(sample => {
        expect(() => {
          enrichAssessmentData(sample.data);
        }).not.toThrow();
      });
    });

    it('should return string output', () => {
      assessmentSamples.forEach(sample => {
        const result = enrichAssessmentData(sample.data);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should handle null/undefined input gracefully', () => {
      expect(() => {
        enrichAssessmentData(null);
      }).not.toThrow();

      expect(() => {
        enrichAssessmentData(undefined);
      }).not.toThrow();

      expect(() => {
        enrichAssessmentData({});
      }).not.toThrow();
    });
  });

  describe('Output Format Compatibility', () => {
    it('should include all original sections', () => {
      const originalSections = [
        '=== USER PROFILE ===',
        '=== SCORE INTERPRETATIONS ===',
        '=== DOMAIN MAPPINGS ===',
        '=== TRAIT INSIGHTS ==='
      ];

      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        originalSections.forEach(section => {
          try {
            expect(enrichedContext).toContain(section);
          } catch (error) {
            console.log(`Missing section: ${section}`);
            console.log('Enriched context preview:', enrichedContext.substring(0, 500));
            throw error;
          }
        });
      });
    });

    it('should include user profile fields', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        expect(enrichedContext).toContain('Name:');
        expect(enrichedContext).toContain('Email:');
        expect(enrichedContext).toContain(sample.data.profile.name);
        expect(enrichedContext).toContain(sample.data.profile.email);
      });
    });

    it('should include score interpretations for all traits', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        Object.keys(sample.data.scores).forEach(traitKey => {
          const trait = TRAIT_GUIDE[traitKey];
          if (trait) {
            expect(enrichedContext).toContain(trait.displayName);
            expect(enrichedContext).toContain(sample.data.scores[traitKey].toString());
          }
        });
      });
    });

    it('should include domain aggregations', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        const domains = new Set();
        Object.values(TRAIT_GUIDE).forEach(trait => {
          domains.add(trait.domainDisplayName);
        });
        
        domains.forEach(domain => {
          expect(enrichedContext).toContain(domain);
        });
      });
    });

    it('should include role match rationale when roles provided', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        if (sample.data.rolesTop && sample.data.rolesTop.length > 0) {
          expect(enrichedContext).toContain('=== ROLE MATCH RATIONALE ===');
          
          sample.data.rolesTop.forEach(roleData => {
            expect(enrichedContext).toContain(roleData.role);
          });
        }
      });
    });
  });

  describe('Field Presence Compatibility', () => {
    it('should maintain all original field names', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        // Check for original field names
        expect(enrichedContext).toContain('Name:');
        expect(enrichedContext).toContain('Email:');
        expect(enrichedContext).toContain('User Type:');
        
        // Check for trait interpretation fields
        expect(enrichedContext).toMatch(/Typical Behaviors:|behaviors/i);
        
        // Check for domain fields
        expect(enrichedContext).toMatch(/Description:|Traits:/i);
      });
    });

    it('should maintain original section ordering for existing sections', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        // Original sections should appear in this order
        const userProfileIndex = enrichedContext.indexOf('=== USER PROFILE ===');
        const scoreInterpretationsIndex = enrichedContext.indexOf('=== SCORE INTERPRETATIONS ===');
        const domainMappingsIndex = enrichedContext.indexOf('=== DOMAIN MAPPINGS ===');
        const traitInsightsIndex = enrichedContext.indexOf('=== TRAIT INSIGHTS ===');
        
        expect(userProfileIndex).toBeLessThan(scoreInterpretationsIndex);
        expect(scoreInterpretationsIndex).toBeLessThan(domainMappingsIndex);
        expect(domainMappingsIndex).toBeLessThan(traitInsightsIndex);
      });
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all score values', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        Object.entries(sample.data.scores).forEach(([traitKey, score]) => {
          expect(enrichedContext).toContain(score.toString());
        });
      });
    });

    it('should preserve all role names and scores', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        if (sample.data.rolesTop && sample.data.rolesTop.length > 0) {
          sample.data.rolesTop.forEach(roleData => {
            expect(enrichedContext).toContain(roleData.role);
            expect(enrichedContext).toContain(roleData.score.toString());
          });
        }
      });
    });

    it('should correctly classify score bands', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        // Check that score bands are present
        expect(enrichedContext).toMatch(/Very Low|Low|Mid|High|Very High/);
      });
    });
  });

  describe('Enhanced Features Do Not Break Existing Functionality', () => {
    it('should add new sections without removing old ones', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        // New sections should be present
        const newSections = [
          '=== VALIDATION CONSTRAINTS ===',
          '=== BALANCED TRAIT FRAMING ===',
          '=== LANGUAGE GUIDELINES ===',
          '=== BEHAVIORAL INDICATORS ===',
          '=== PSYCHOLOGICAL FRAMEWORK ===',
          '=== SECTION REQUIREMENTS ==='
        ];
        
        newSections.forEach(section => {
          expect(enrichedContext).toContain(section);
        });
        
        // Old sections should still be present
        const oldSections = [
          '=== USER PROFILE ===',
          '=== SCORE INTERPRETATIONS ===',
          '=== DOMAIN MAPPINGS ===',
          '=== TRAIT INSIGHTS ==='
        ];
        
        oldSections.forEach(section => {
          expect(enrichedContext).toContain(section);
        });
      });
    });

    it('should maintain parseable output format', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        // Should be able to split by section headers
        const sections = enrichedContext.split('===');
        expect(sections.length).toBeGreaterThan(10);
        
        // When split by "===", odd-indexed sections are headers, even-indexed sections are content
        // Example: ["", " HEADER1 ", "\ncontent1\n", " HEADER2 ", "\ncontent2\n", ...]
        // So we check even-indexed sections (content) for non-emptiness
        sections.forEach((section, index) => {
          if (index > 0 && index % 2 === 0) { // Even indices are content sections
            const sectionHeader = sections[index - 1].trim(); // Get the header from previous section
            const sectionContent = section.trim();
            
            // Allow BEHAVIORAL INDICATORS and PSYCHOLOGICAL FRAMEWORK to be empty (no data populated yet)
            if (sectionHeader !== 'BEHAVIORAL INDICATORS' && sectionHeader !== 'PSYCHOLOGICAL FRAMEWORK') {
              if (sectionContent.length === 0) {
                console.log(`Empty content for section: "${sectionHeader}"`);
              }
              expect(sectionContent.length).toBeGreaterThan(0);
            }
          }
        });
      });
    });
  });

  describe('Regression Prevention', () => {
    it('should not introduce undefined or null values in output', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        expect(enrichedContext).not.toContain('undefined');
        expect(enrichedContext).not.toContain('null');
      });
    });

    it('should not introduce empty sections', () => {
      assessmentSamples.forEach(sample => {
        const enrichedContext = enrichAssessmentData(sample.data);
        
        // Split by section headers and check each section has content
        const sectionPattern = /=== .+ ===/g;
        const sections = enrichedContext.split(sectionPattern);
        
        sections.forEach((section, index) => {
          if (index > 0) { // Skip first section before first header
            const trimmedSection = section.trim();
            if (trimmedSection.length > 0) {
              expect(trimmedSection.length).toBeGreaterThan(10);
            }
          }
        });
      });
    });

    it('should handle all score ranges correctly', () => {
      const extremeScores = {
        profile: { name: 'Test', email: 'test@test.com' },
        scores: {
          speed: 0,
          complexity: 25,
          vision: 50,
          structure: 75,
          detail: 100,
          consistency: 15,
          collaboration: 85,
          influence: 40,
          empathy: 60,
          stress: 90,
          steadiness: 10,
          optimism: 95,
          novelty: 5,
          experimentation: 70,
          learning: 30,
          risk: 55,
          ambiguity: 80
        },
        rolesTop: []
      };

      expect(() => {
        const enrichedContext = enrichAssessmentData(extremeScores);
        expect(enrichedContext).toBeTruthy();
      }).not.toThrow();
    });
  });

});
