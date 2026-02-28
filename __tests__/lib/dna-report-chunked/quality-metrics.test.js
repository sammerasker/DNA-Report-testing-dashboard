/**
 * @fileoverview Unit tests for Quality Metrics Engine
 * 
 * Tests specific examples and edge cases for quality metrics calculation.
 */

import QualityMetrics from '../../../lib/dna-report-chunked/quality-metrics.js';

describe('QualityMetrics - Unit Tests', () => {
  let qualityMetrics;

  beforeEach(() => {
    qualityMetrics = new QualityMetrics();
  });

  describe('Score Reference Counting', () => {
    test('counts all 10 trait names when present', () => {
      const report = `
        This report covers Strategic Thinking, Innovation, Vision, Execution,
        Discipline, Attention to Detail, Leadership, Influence,
        Emotional Intelligence, Resilience, and Risk Tolerance.
      `;
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.scoreReferences.count).toBe(11); // 11 traits (Risk Tolerance is one trait)
      expect(metrics.scoreReferences.target).toBe(10);
      expect(metrics.scoreReferences.pass).toBe(true);
      expect(metrics.scoreReferences.details).toHaveLength(11);
    });

    test('counts partial trait mentions', () => {
      const report = 'Strategic Thinking and Innovation are key traits.';
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.scoreReferences.count).toBe(2);
      expect(metrics.scoreReferences.pass).toBe(false);
    });

    test('is case-insensitive', () => {
      const report = 'STRATEGIC THINKING and innovation are important.';
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.scoreReferences.count).toBe(2);
    });
  });

  describe('User Type Mention Counting', () => {
    test('counts user type mentions correctly', () => {
      const userType = 'Visionary Entrepreneur';
      const report = `
        As a Visionary Entrepreneur, you excel at innovation.
        The Visionary Entrepreneur profile shows strong vision.
        Visionary Entrepreneur types often lead change.
        Your Visionary Entrepreneur strengths include creativity.
        Visionary Entrepreneur individuals are forward-thinking.
        The Visionary Entrepreneur mindset drives growth.
      `;
      
      const assessmentData = { profile: { userType } };
      const metrics = qualityMetrics.calculateMetrics(report, assessmentData);
      
      expect(metrics.userTypeMentions.count).toBe(6);
      expect(metrics.userTypeMentions.minimum).toBe(6);
      expect(metrics.userTypeMentions.pass).toBe(true);
    });

    test('fails when user type mentioned less than 6 times', () => {
      const userType = 'Strategic Leader';
      const report = 'Strategic Leader is mentioned twice. Strategic Leader here.';
      
      const assessmentData = { profile: { userType } };
      const metrics = qualityMetrics.calculateMetrics(report, assessmentData);
      
      expect(metrics.userTypeMentions.count).toBe(2);
      expect(metrics.userTypeMentions.pass).toBe(false);
    });

    test('handles missing user type gracefully', () => {
      const report = 'Some report content.';
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.userTypeMentions.count).toBe(0);
      expect(metrics.userTypeMentions.pass).toBe(false);
    });
  });

  describe('Section Completeness Checking', () => {
    test('detects all 10 sections when present', () => {
      const report = `
        Executive Overview of the assessment.
        Cognitive abilities are strong.
        Leadership skills are evident.
        Execution capabilities are solid.
        Emotional Intelligence is high.
        Risk tolerance is moderate.
        Motivation levels are strong.
        Optimal Roles include CEO positions.
        Development Plan for growth.
        Recommendations for improvement.
      `;
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.sectionCompleteness.count).toBe(10);
      expect(metrics.sectionCompleteness.target).toBe(10);
      expect(metrics.sectionCompleteness.pass).toBe(true);
      expect(metrics.sectionCompleteness.missingSections).toHaveLength(0);
    });

    test('identifies missing sections', () => {
      const report = 'Executive Overview and Leadership are covered.';
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.sectionCompleteness.count).toBe(2);
      expect(metrics.sectionCompleteness.pass).toBe(false);
      expect(metrics.sectionCompleteness.missingSections.length).toBeGreaterThan(0);
    });
  });

  describe('Word Count Measurement', () => {
    test('counts words in target range', () => {
      // Create a report with approximately 3000 words
      const words = Array(3000).fill('word').join(' ');
      const report = words;
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.wordCount.count).toBe(3000);
      expect(metrics.wordCount.range).toEqual([2500, 4000]);
      expect(metrics.wordCount.pass).toBe(true);
    });

    test('fails when word count is below minimum', () => {
      const report = 'Short report with only ten words in total here now.';
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.wordCount.count).toBeLessThan(2500);
      expect(metrics.wordCount.pass).toBe(false);
    });

    test('fails when word count is above maximum', () => {
      // Create a report with 5000 words
      const words = Array(5000).fill('word').join(' ');
      const report = words;
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.wordCount.count).toBe(5000);
      expect(metrics.wordCount.pass).toBe(false);
    });

    test('handles multiple spaces correctly', () => {
      const report = 'word1    word2     word3';
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.wordCount.count).toBe(3);
    });
  });

  describe('Domain Reference Counting', () => {
    test('counts all 4 domains when present', () => {
      const report = `
        Cognitive & Vision domain is strong.
        Execution & Discipline is solid.
        Social & Influence capabilities are evident.
        Resilience & Drive is high.
      `;
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.domainReferences.count).toBe(4);
      expect(metrics.domainReferences.target).toBe(4);
      expect(metrics.domainReferences.pass).toBe(true);
      expect(metrics.domainReferences.details).toHaveLength(4);
    });

    test('counts partial domain mentions', () => {
      const report = 'Cognitive & Vision and Execution & Discipline are key.';
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.domainReferences.count).toBe(2);
      expect(metrics.domainReferences.pass).toBe(false);
    });
  });

  describe('Central Tension Reference Counting', () => {
    test('counts central tension mentions', () => {
      const report = `
        The central tension in your profile is significant.
        This vision-execution gap requires attention.
        Addressing the central tension will improve performance.
      `;
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.centralTensionReferences.count).toBe(3);
      expect(metrics.centralTensionReferences.minimum).toBe(2);
      expect(metrics.centralTensionReferences.pass).toBe(true);
    });

    test('recognizes various tension phrasings', () => {
      const report = `
        The gap between vision and execution is notable.
        There is tension between vision and execution.
      `;
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.centralTensionReferences.count).toBeGreaterThanOrEqual(2);
      expect(metrics.centralTensionReferences.pass).toBe(true);
    });

    test('fails when mentioned less than 2 times', () => {
      const report = 'The central tension is mentioned once.';
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.centralTensionReferences.count).toBe(1);
      expect(metrics.centralTensionReferences.pass).toBe(false);
    });
  });

  describe('Overall Score Calculation', () => {
    test('calculates score between 0 and 100', () => {
      const report = 'Some basic report content.';
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics.overallScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(metrics.overallScore)).toBe(true);
    });

    test('gives high score for complete report', () => {
      const report = `
        Executive Overview: Strategic Thinking, Innovation, Vision, Execution,
        Discipline, Attention to Detail, Leadership, Influence,
        Emotional Intelligence, Resilience, Risk Tolerance.
        
        Cognitive & Vision domain analysis.
        Execution & Discipline assessment.
        Social & Influence evaluation.
        Resilience & Drive review.
        
        The central tension between vision and execution is significant.
        This vision-execution gap requires attention.
        
        Visionary Entrepreneur profile shows strength.
        As a Visionary Entrepreneur, you excel.
        The Visionary Entrepreneur mindset is evident.
        Visionary Entrepreneur types lead change.
        Your Visionary Entrepreneur strengths shine.
        Visionary Entrepreneur individuals are forward-thinking.
        
        Leadership capabilities are strong.
        Emotional Intelligence is high.
        Risk tolerance is balanced.
        Motivation drives success.
        Optimal Roles include executive positions.
        Development Plan for growth.
        Recommendations for improvement.
      ` + ' word '.repeat(2500);
      
      const assessmentData = { profile: { userType: 'Visionary Entrepreneur' } };
      const metrics = qualityMetrics.calculateMetrics(report, assessmentData);
      
      expect(metrics.overallScore).toBeGreaterThan(80);
    });

    test('gives low score for minimal report', () => {
      const report = 'Minimal content.';
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics.overallScore).toBeLessThan(30);
    });
  });

  describe('Complete Metrics Calculation', () => {
    test('returns all required metrics', () => {
      const report = 'Test report content.';
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(metrics).toHaveProperty('scoreReferences');
      expect(metrics).toHaveProperty('userTypeMentions');
      expect(metrics).toHaveProperty('sectionCompleteness');
      expect(metrics).toHaveProperty('wordCount');
      expect(metrics).toHaveProperty('domainReferences');
      expect(metrics).toHaveProperty('centralTensionReferences');
      expect(metrics).toHaveProperty('overallScore');
      expect(metrics).toHaveProperty('timestamp');
    });

    test('includes timestamp in ISO format', () => {
      const report = 'Test report content.';
      
      const metrics = qualityMetrics.calculateMetrics(report, {});
      
      expect(typeof metrics.timestamp).toBe('string');
      expect(metrics.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('Error Handling', () => {
    test('throws error for empty report', () => {
      expect(() => {
        qualityMetrics.calculateMetrics('', {});
      }).toThrow('Report must be a non-empty string');
    });

    test('throws error for null report', () => {
      expect(() => {
        qualityMetrics.calculateMetrics(null, {});
      }).toThrow('Report must be a non-empty string');
    });

    test('throws error for non-string report', () => {
      expect(() => {
        qualityMetrics.calculateMetrics(123, {});
      }).toThrow('Report must be a non-empty string');
    });
  });
});
