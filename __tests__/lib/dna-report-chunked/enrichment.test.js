/**
 * Unit Tests for Data Enrichment Layer
 * Example-based tests for specific scenarios
 * 
 * These tests verify behavior with known inputs and expected outputs.
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { enrichAssessmentData } from '../../../lib/dna-report-chunked/enrichment.js';
import { TRAIT_GUIDE, DOMAIN_DEFINITIONS } from '../../../lib/dna-report-chunked/trait-definitions.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Data Enrichment Layer - Unit Tests', () => {
  
  /**
   * Test with complete sampledata.json
   */
  describe('Complete Assessment Data', () => {
    let sampleData;
    let assessmentData;
    let enriched;

    beforeAll(() => {
      // Load actual sampledata.json
      const samplePath = path.join(__dirname, '../../../sampledata.json');
      sampleData = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
      
      // Transform to expected format
      assessmentData = {
        profile: {
          name: sampleData.fullName || sampleData.firstName,
          email: 'marion@example.com',
          userType: sampleData.userTypes?.[0] || 'Unknown',
          assessmentDate: sampleData.completedAt
        },
        scores: sampleData.normalizedScores || {},
        rolesTop: sampleData.rolesTop || []
      };

      enriched = enrichAssessmentData(assessmentData);
    });

    test('should include user profile information', () => {
      expect(enriched).toContain('=== USER PROFILE ===');
      expect(enriched).toContain('Name: Marion Anderson');
      expect(enriched).toContain('User Type: entrepreneur-with-idea');
    });

    test('should include all score interpretations', () => {
      expect(enriched).toContain('=== SCORE INTERPRETATIONS ===');
      expect(enriched).toContain('Tempo & Bias for Action: 85 (High (Very High))');
      expect(enriched).toContain('Pattern Recognition: 72 (High)');
      expect(enriched).toContain('Creative Divergence: 90 (High (Very High))');
    });

    test('should include domain mappings', () => {
      expect(enriched).toContain('=== DOMAIN MAPPINGS ===');
      expect(enriched).toContain('Cognitive & Vision:');
      expect(enriched).toContain('Execution & Operations:');
      expect(enriched).toContain('Social & Emotional Intelligence:');
    });

    test('should include trait insights for all traits', () => {
      expect(enriched).toContain('=== TRAIT INSIGHTS ===');
      
      // Check for assessed traits
      expect(enriched).toContain('Tempo & Bias for Action (85):');
      expect(enriched).toContain('Fast-Cycle Decision-Making');
      
      // Check for not assessed traits
      expect(enriched).toContain('Conflict Navigation (N/A):');
      expect(enriched).toContain('Not Assessed');
    });

    test('should include central tensions and synergies', () => {
      expect(enriched).toContain('=== CENTRAL TENSIONS & SYNERGIES ===');
      expect(enriched).toContain('Vision-Execution Gap');
      expect(enriched).toContain('tension');
    });

    test('should include role match rationales', () => {
      expect(enriched).toContain('=== ROLE MATCH RATIONALE ===');
      expect(enriched).toContain('Product-Led Founder');
      expect(enriched).toContain('Visionary CEO');
      expect(enriched).toContain('Match Score: 94');
    });

    test('should be a reasonably long output', () => {
      expect(enriched.length).toBeGreaterThan(3000);
      expect(enriched.length).toBeLessThan(25000); // Increased to accommodate all new sections (behavioral indicators, psychological framework, etc.)
    });
  });

  /**
   * Test with missing profile fields
   */
  describe('Missing Profile Fields', () => {
    test('should handle missing name', () => {
      const assessment = {
        profile: {
          email: 'test@example.com',
          userType: 'startup',
          assessmentDate: '2026-01-01'
        },
        scores: { speed: 75 },
        rolesTop: []
      };

      const enriched = enrichAssessmentData(assessment);
      expect(enriched).toContain('Name: Not Provided');
    });

    test('should handle missing email', () => {
      const assessment = {
        profile: {
          name: 'Test User',
          userType: 'startup',
          assessmentDate: '2026-01-01'
        },
        scores: { speed: 75 },
        rolesTop: []
      };

      const enriched = enrichAssessmentData(assessment);
      expect(enriched).toContain('Email: Not Provided');
    });

    test('should handle completely missing profile', () => {
      const assessment = {
        scores: { speed: 75 },
        rolesTop: []
      };

      const enriched = enrichAssessmentData(assessment);
      expect(enriched).toContain('Name: Not Provided');
      expect(enriched).toContain('Email: Not Provided');
      expect(enriched).toContain('User Type: Not Provided');
    });
  });

  /**
   * Test with empty rolesTop array
   */
  describe('Empty Roles Array', () => {
    test('should not include role section when rolesTop is empty', () => {
      const assessment = {
        profile: {
          name: 'Test User',
          email: 'test@example.com',
          userType: 'startup',
          assessmentDate: '2026-01-01'
        },
        scores: { speed: 75, abstraction: 60 },
        rolesTop: []
      };

      const enriched = enrichAssessmentData(assessment);
      expect(enriched).not.toContain('=== ROLE MATCH RATIONALE ===');
    });

    test('should not include role section when rolesTop is undefined', () => {
      const assessment = {
        profile: {
          name: 'Test User',
          email: 'test@example.com',
          userType: 'startup',
          assessmentDate: '2026-01-01'
        },
        scores: { speed: 75 }
      };

      const enriched = enrichAssessmentData(assessment);
      expect(enriched).not.toContain('=== ROLE MATCH RATIONALE ===');
    });
  });

  /**
   * Test score band boundaries (5-tier system)
   */
  describe('Score Band Boundaries', () => {
    const testScoreBand = (score, expectedBand) => {
      const assessment = {
        profile: { name: 'Test', email: 'test@test.com', userType: 'test', assessmentDate: '2026-01-01' },
        scores: { speed: score },
        rolesTop: []
      };
      const enriched = enrichAssessmentData(assessment);
      expect(enriched).toContain(`Tempo & Bias for Action: ${score} (${expectedBand})`);
    };

    test('score 0 should be Low (Very Low)', () => testScoreBand(0, 'Low (Very Low)'));
    test('score 24 should be Low (Very Low)', () => testScoreBand(24, 'Low (Very Low)'));
    test('score 25 should be Low', () => testScoreBand(25, 'Low'));
    test('score 39 should be Low', () => testScoreBand(39, 'Low'));
    test('score 40 should be Mid', () => testScoreBand(40, 'Mid'));
    test('score 69 should be Mid', () => testScoreBand(69, 'Mid'));
    test('score 70 should be High', () => testScoreBand(70, 'High'));
    test('score 84 should be High', () => testScoreBand(84, 'High'));
    test('score 85 should be High (Very High)', () => testScoreBand(85, 'High (Very High)'));
    test('score 100 should be High (Very High)', () => testScoreBand(100, 'High (Very High)'));
  });

  /**
   * Test trait interpretation logic
   */
  describe('Trait Interpretations', () => {
    test('high score (>= 50) should use high interpretation', () => {
      const assessment = {
        profile: { name: 'Test', email: 'test@test.com', userType: 'test', assessmentDate: '2026-01-01' },
        scores: { speed: 85 },
        rolesTop: []
      };
      const enriched = enrichAssessmentData(assessment);
      expect(enriched).toContain('Fast-Cycle Decision-Making');
      expect(enriched).not.toContain('Deliberate Pacing');
    });

    test('low score (< 50) should use low interpretation', () => {
      const assessment = {
        profile: { name: 'Test', email: 'test@test.com', userType: 'test', assessmentDate: '2026-01-01' },
        scores: { speed: 30 },
        rolesTop: []
      };
      const enriched = enrichAssessmentData(assessment);
      expect(enriched).toContain('Deliberate Pacing');
      expect(enriched).not.toContain('Fast-Cycle Decision-Making');
    });
  });

  /**
   * Test domain aggregation
   */
  describe('Domain Aggregation', () => {
    test('should calculate average domain scores correctly', () => {
      const assessment = {
        profile: { name: 'Test', email: 'test@test.com', userType: 'test', assessmentDate: '2026-01-01' },
        scores: {
          speed: 90,        // Cognitive & Vision
          abstraction: 80,  // Cognitive & Vision
          creativity: 70    // Cognitive & Vision
          // Average: 80
        },
        rolesTop: []
      };
      const enriched = enrichAssessmentData(assessment);
      expect(enriched).toContain('Cognitive & Vision: 80');
    });

    test('should handle domains with missing traits', () => {
      const assessment = {
        profile: { name: 'Test', email: 'test@test.com', userType: 'test', assessmentDate: '2026-01-01' },
        scores: {
          speed: 90,        // Only one trait from Cognitive & Vision
          structure: 60     // One trait from Execution & Operations
        },
        rolesTop: []
      };
      const enriched = enrichAssessmentData(assessment);
      // Should still calculate domains even with partial data
      expect(enriched).toContain('Cognitive & Vision:');
      expect(enriched).toContain('Execution & Operations:');
    });
  });

  /**
   * Test tension identification
   */
  describe('Tension Identification', () => {
    test('should identify vision-execution gap', () => {
      const assessment = {
        profile: { name: 'Test', email: 'test@test.com', userType: 'test', assessmentDate: '2026-01-01' },
        scores: {
          abstraction: 90,  // High vision
          creativity: 85,   // High vision
          structure: 40,    // Low execution
          planning: 35      // Low execution
        },
        rolesTop: []
      };
      const enriched = enrichAssessmentData(assessment);
      expect(enriched).toContain('Vision-Execution Gap');
      expect(enriched).toContain('tension');
    });

    test('should identify synergies', () => {
      const assessment = {
        profile: { name: 'Test', email: 'test@test.com', userType: 'test', assessmentDate: '2026-01-01' },
        scores: {
          mission: 85,
          competition: 80
        },
        rolesTop: []
      };
      const enriched = enrichAssessmentData(assessment);
      expect(enriched).toContain('Mission-Driven Competitor');
      expect(enriched).toContain('synergy');
    });
  });

  /**
   * Test role rationale generation
   */
  describe('Role Rationale Generation', () => {
    test('should generate rationales for multiple roles', () => {
      const assessment = {
        profile: { name: 'Test', email: 'test@test.com', userType: 'test', assessmentDate: '2026-01-01' },
        scores: {
          speed: 85,
          creativity: 90,
          mission: 88
        },
        rolesTop: [
          { role: 'Product-Led Founder', score: 94 },
          { role: 'Visionary CEO', score: 88 },
          { role: 'Innovation Leader', score: 82 }
        ]
      };
      const enriched = enrichAssessmentData(assessment);
      expect(enriched).toContain('1. Product-Led Founder (Match Score: 94)');
      expect(enriched).toContain('2. Visionary CEO (Match Score: 88)');
      expect(enriched).toContain('3. Innovation Leader (Match Score: 82)');
    });

    test('should include trait names in rationales', () => {
      const assessment = {
        profile: { name: 'Test', email: 'test@test.com', userType: 'test', assessmentDate: '2026-01-01' },
        scores: {
          creativity: 90,
          mission: 88,
          speed: 85
        },
        rolesTop: [
          { role: 'Product-Led Founder', score: 94 }
        ]
      };
      const enriched = enrichAssessmentData(assessment);
      expect(enriched).toContain('Creative Divergence');
      expect(enriched).toContain('Mission Anchoring');
      expect(enriched).toContain('Tempo & Bias for Action');
    });
  });

  /**
   * Test error handling and edge cases
   */
  describe('Error Handling', () => {
    test('should not throw with null input', () => {
      expect(() => enrichAssessmentData(null)).not.toThrow();
    });

    test('should not throw with undefined input', () => {
      expect(() => enrichAssessmentData(undefined)).not.toThrow();
    });

    test('should not throw with empty object', () => {
      expect(() => enrichAssessmentData({})).not.toThrow();
    });

    test('should handle invalid score values gracefully', () => {
      const assessment = {
        profile: { name: 'Test', email: 'test@test.com', userType: 'test', assessmentDate: '2026-01-01' },
        scores: {
          speed: null,
          abstraction: undefined,
          creativity: 'invalid'
        },
        rolesTop: []
      };
      expect(() => enrichAssessmentData(assessment)).not.toThrow();
    });
  });

  /**
   * Test language guidelines section (Requirements 7.1-7.6)
   */
  describe('Language Guidelines Section', () => {
    let enriched;

    beforeAll(() => {
      const assessment = {
        profile: { name: 'Test', email: 'test@test.com', userType: 'test', assessmentDate: '2026-01-01' },
        scores: { speed: 75 },
        rolesTop: []
      };
      enriched = enrichAssessmentData(assessment);
    });

    test('should include language guidelines section', () => {
      expect(enriched).toContain('=== LANGUAGE GUIDELINES ===');
      expect(enriched).toContain('LANGUAGE QUALITY GUIDELINES:');
    });

    test('should include forbidden vague terms (Requirement 7.1)', () => {
      expect(enriched).toContain('1. FORBIDDEN VAGUE TERMS:');
      expect(enriched).toContain('"quickly" / "slowly"');
      expect(enriched).toContain('"adequate" / "sufficient"');
      expect(enriched).toContain('"reasonable" / "appropriate"');
      expect(enriched).toContain('"user-friendly" / "easy to use"');
      expect(enriched).toContain('"efficient" / "effective"');
      expect(enriched).toContain('"strategic" / "tactical"');
    });

    test('should include requirement for concrete, measurable descriptions (Requirement 7.2)', () => {
      expect(enriched).toContain('2. USE CONCRETE, MEASURABLE DESCRIPTIONS:');
      expect(enriched).toContain('Include specific timeframes');
      expect(enriched).toContain('Include specific quantities');
      expect(enriched).toContain('Include specific frequencies');
      expect(enriched).toContain('observable, countable behaviors');
    });

    test('should include prohibition on ostentatious language (Requirement 7.3)', () => {
      expect(enriched).toContain('3. AVOID OSTENTATIOUS OR UNNECESSARILY COMPLEX LANGUAGE:');
      expect(enriched).toContain('DO NOT use unnecessarily complex vocabulary');
      expect(enriched).toContain('DO NOT use jargon or technical terms when simpler words');
      expect(enriched).toContain('DO use clear, direct language');
    });

    test('should include requirement for accessible language (Requirement 7.4)', () => {
      expect(enriched).toContain('4. USE ACCESSIBLE, HUMAN-CENTERED LANGUAGE:');
      expect(enriched).toContain('Write as if speaking to a colleague');
      expect(enriched).toContain('Use active voice');
      expect(enriched).toContain('conversational tone');
      expect(enriched).toContain('Prioritize clarity');
    });

    test('should include examples of concrete vs vague language (Requirement 7.5)', () => {
      expect(enriched).toContain('5. EXAMPLES OF CONCRETE VS VAGUE LANGUAGE:');
      expect(enriched).toContain('VAGUE: "You work quickly and efficiently."');
      expect(enriched).toContain('CONCRETE: "You make decisions within 24-48 hours');
      expect(enriched).toContain('VAGUE: "You communicate effectively');
      expect(enriched).toContain('CONCRETE: "You hold daily 15-minute stand-ups');
    });

    test('should include requirement for observable, specific descriptions (Requirement 7.6)', () => {
      expect(enriched).toContain('6. ALL BEHAVIORAL DESCRIPTIONS MUST BE OBSERVABLE AND SPECIFIC:');
      expect(enriched).toContain('Describe behaviors that could be seen, heard, or counted');
      expect(enriched).toContain('Use action verbs that describe what someone does');
      expect(enriched).toContain('Could someone observe and verify this behavior?');
    });

    test('should include examples of observable vs non-observable descriptions', () => {
      expect(enriched).toContain('"You\'re thoughtful"');
      expect(enriched).toContain('"You pause 5-10 seconds before responding');
      expect(enriched).toContain('"You\'re confident"');
      expect(enriched).toContain('"You present ideas to groups of 20+ without notes"');
    });
  });
});
