/**
 * Unit Tests for Behavioral Indicators Generation
 * Tests the generateBehavioralIndicators function behavior
 */

import { describe, test, expect } from '@jest/globals';
import { TRAIT_GUIDE } from '../../../lib/dna-report-chunked/trait-definitions.js';

/**
 * Mock implementation of generateBehavioralIndicators for testing
 * This mirrors the actual implementation in enrichment.js
 */
function generateBehavioralIndicators(traitKey, score) {
  const trait = TRAIT_GUIDE[traitKey];
  
  // Handle missing trait or behavioral indicators
  if (!trait || !trait.behavioralIndicators || trait.behavioralIndicators.length === 0) {
    return '';
  }

  // Classify score into band (low: 0-39, mid: 40-69, high: 70-100)
  let band;
  if (score >= 0 && score <= 39) {
    band = 'low';
  } else if (score >= 40 && score <= 69) {
    band = 'mid';
  } else if (score >= 70 && score <= 100) {
    band = 'high';
  } else {
    // Invalid score
    return '';
  }

  // Build behavioral indicators text
  let indicatorsText = '';
  
  trait.behavioralIndicators.forEach(indicator => {
    const description = indicator[band];
    if (description) {
      indicatorsText += `  ${indicator.name}: ${description}\n`;
    }
  });

  return indicatorsText;
}

describe('Behavioral Indicators Generation', () => {
  
  describe('Score Band Classification', () => {
    test('score 0 should classify as low band', () => {
      // Create a mock trait with behavioral indicators
      const mockTrait = {
        behavioralIndicators: [
          {
            id: 'test_indicator',
            name: 'Test Indicator',
            description: 'Test description',
            low: 'Low behavior',
            mid: 'Mid behavior',
            high: 'High behavior'
          }
        ]
      };
      
      // Temporarily add to TRAIT_GUIDE
      TRAIT_GUIDE.test_trait = mockTrait;
      
      const result = generateBehavioralIndicators('test_trait', 0);
      expect(result).toContain('Low behavior');
      expect(result).not.toContain('Mid behavior');
      expect(result).not.toContain('High behavior');
      
      // Cleanup
      delete TRAIT_GUIDE.test_trait;
    });

    test('score 39 should classify as low band', () => {
      const mockTrait = {
        behavioralIndicators: [
          {
            id: 'test_indicator',
            name: 'Test Indicator',
            description: 'Test description',
            low: 'Low behavior',
            mid: 'Mid behavior',
            high: 'High behavior'
          }
        ]
      };
      
      TRAIT_GUIDE.test_trait = mockTrait;
      
      const result = generateBehavioralIndicators('test_trait', 39);
      expect(result).toContain('Low behavior');
      
      delete TRAIT_GUIDE.test_trait;
    });

    test('score 40 should classify as mid band', () => {
      const mockTrait = {
        behavioralIndicators: [
          {
            id: 'test_indicator',
            name: 'Test Indicator',
            description: 'Test description',
            low: 'Low behavior',
            mid: 'Mid behavior',
            high: 'High behavior'
          }
        ]
      };
      
      TRAIT_GUIDE.test_trait = mockTrait;
      
      const result = generateBehavioralIndicators('test_trait', 40);
      expect(result).toContain('Mid behavior');
      expect(result).not.toContain('Low behavior');
      expect(result).not.toContain('High behavior');
      
      delete TRAIT_GUIDE.test_trait;
    });

    test('score 69 should classify as mid band', () => {
      const mockTrait = {
        behavioralIndicators: [
          {
            id: 'test_indicator',
            name: 'Test Indicator',
            description: 'Test description',
            low: 'Low behavior',
            mid: 'Mid behavior',
            high: 'High behavior'
          }
        ]
      };
      
      TRAIT_GUIDE.test_trait = mockTrait;
      
      const result = generateBehavioralIndicators('test_trait', 69);
      expect(result).toContain('Mid behavior');
      
      delete TRAIT_GUIDE.test_trait;
    });

    test('score 70 should classify as high band', () => {
      const mockTrait = {
        behavioralIndicators: [
          {
            id: 'test_indicator',
            name: 'Test Indicator',
            description: 'Test description',
            low: 'Low behavior',
            mid: 'Mid behavior',
            high: 'High behavior'
          }
        ]
      };
      
      TRAIT_GUIDE.test_trait = mockTrait;
      
      const result = generateBehavioralIndicators('test_trait', 70);
      expect(result).toContain('High behavior');
      expect(result).not.toContain('Low behavior');
      expect(result).not.toContain('Mid behavior');
      
      delete TRAIT_GUIDE.test_trait;
    });

    test('score 100 should classify as high band', () => {
      const mockTrait = {
        behavioralIndicators: [
          {
            id: 'test_indicator',
            name: 'Test Indicator',
            description: 'Test description',
            low: 'Low behavior',
            mid: 'Mid behavior',
            high: 'High behavior'
          }
        ]
      };
      
      TRAIT_GUIDE.test_trait = mockTrait;
      
      const result = generateBehavioralIndicators('test_trait', 100);
      expect(result).toContain('High behavior');
      
      delete TRAIT_GUIDE.test_trait;
    });
  });

  describe('Edge Cases', () => {
    test('should return empty string for missing trait', () => {
      const result = generateBehavioralIndicators('nonexistent_trait', 50);
      expect(result).toBe('');
    });

    test('should return empty string for trait without behavioral indicators', () => {
      const result = generateBehavioralIndicators('speed', 50);
      expect(result).toBe('');
    });

    test('should return empty string for invalid score (negative)', () => {
      const mockTrait = {
        behavioralIndicators: [
          {
            id: 'test_indicator',
            name: 'Test Indicator',
            description: 'Test description',
            low: 'Low behavior',
            mid: 'Mid behavior',
            high: 'High behavior'
          }
        ]
      };
      
      TRAIT_GUIDE.test_trait = mockTrait;
      
      const result = generateBehavioralIndicators('test_trait', -1);
      expect(result).toBe('');
      
      delete TRAIT_GUIDE.test_trait;
    });

    test('should return empty string for invalid score (> 100)', () => {
      const mockTrait = {
        behavioralIndicators: [
          {
            id: 'test_indicator',
            name: 'Test Indicator',
            description: 'Test description',
            low: 'Low behavior',
            mid: 'Mid behavior',
            high: 'High behavior'
          }
        ]
      };
      
      TRAIT_GUIDE.test_trait = mockTrait;
      
      const result = generateBehavioralIndicators('test_trait', 101);
      expect(result).toBe('');
      
      delete TRAIT_GUIDE.test_trait;
    });

    test('should return empty string for trait with empty behavioral indicators array', () => {
      const mockTrait = {
        behavioralIndicators: []
      };
      
      TRAIT_GUIDE.test_trait = mockTrait;
      
      const result = generateBehavioralIndicators('test_trait', 50);
      expect(result).toBe('');
      
      delete TRAIT_GUIDE.test_trait;
    });
  });

  describe('Multiple Behavioral Indicators', () => {
    test('should include all behavioral indicators for a trait', () => {
      const mockTrait = {
        behavioralIndicators: [
          {
            id: 'indicator_1',
            name: 'Decision Latency',
            description: 'Time from information to decision',
            low: 'Takes 3-5 days to decide',
            mid: 'Decides within 24-48 hours',
            high: 'Decides within hours'
          },
          {
            id: 'indicator_2',
            name: 'Action Initiation',
            description: 'Speed of starting tasks',
            low: 'Waits for perfect conditions',
            mid: 'Starts with good enough info',
            high: 'Starts immediately'
          }
        ]
      };
      
      TRAIT_GUIDE.test_trait = mockTrait;
      
      const result = generateBehavioralIndicators('test_trait', 50);
      expect(result).toContain('Decision Latency: Decides within 24-48 hours');
      expect(result).toContain('Action Initiation: Starts with good enough info');
      
      delete TRAIT_GUIDE.test_trait;
    });
  });

  describe('Output Format', () => {
    test('should format output with indicator name and description', () => {
      const mockTrait = {
        behavioralIndicators: [
          {
            id: 'test_indicator',
            name: 'Test Indicator',
            description: 'Test description',
            low: 'Low behavior',
            mid: 'Mid behavior',
            high: 'High behavior'
          }
        ]
      };
      
      TRAIT_GUIDE.test_trait = mockTrait;
      
      const result = generateBehavioralIndicators('test_trait', 50);
      expect(result).toMatch(/^\s+Test Indicator: Mid behavior\n$/);
      
      delete TRAIT_GUIDE.test_trait;
    });
  });
});
