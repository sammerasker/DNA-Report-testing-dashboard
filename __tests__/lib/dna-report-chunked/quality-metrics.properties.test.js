/**
 * @fileoverview Property-based tests for Quality Metrics Engine
 * 
 * Tests universal properties that should hold across all valid inputs
 * using fast-check for property-based testing.
 */

import fc from 'fast-check';
import QualityMetrics from '../../../lib/dna-report-chunked/quality-metrics.js';

const testConfig = { numRuns: 20 };

describe('QualityMetrics - Property-Based Tests', () => {
  let qualityMetrics;

  beforeEach(() => {
    qualityMetrics = new QualityMetrics();
  });

  /**
   * Property 16: Quality Metrics Counting Accuracy
   * Validates: Requirements 6.1, 6.2, 6.5, 6.6
   * 
   * For any generated report text, the quality metrics counting functions
   * should return counts that match the actual number of occurrences.
   */
  describe('Property 16: Quality Metrics Counting Accuracy', () => {
    test('score references count matches actual trait occurrences', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              'Strategic Thinking',
              'Innovation',
              'Vision',
              'Execution',
              'Discipline',
              'Attention to Detail',
              'Leadership',
              'Influence',
              'Emotional Intelligence',
              'Resilience',
              'Risk Tolerance'
            ),
            { minLength: 0, maxLength: 15 }
          ),
          (traits) => {
            // Create report with known trait mentions
            const report = traits.join(' and ') + ' are important traits.';
            
            // Calculate metrics
            const metrics = qualityMetrics.calculateMetrics(report, {});
            
            // Count unique traits
            const uniqueTraits = new Set(traits);
            const expectedCount = uniqueTraits.size;
            
            // Verify count matches
            return metrics.scoreReferences.count === expectedCount;
          }
        ),
        testConfig
      );
    });

    test('user type mentions count matches actual occurrences', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 30 }),
          fc.integer({ min: 0, max: 10 }),
          (userType, repeatCount) => {
            // Create report with known user type mentions
            const mentions = Array(repeatCount).fill(userType);
            const report = mentions.join(' is a ') + ' profile.';
            
            // Calculate metrics
            const assessmentData = {
              profile: { userType }
            };
            const metrics = qualityMetrics.calculateMetrics(report, assessmentData);
            
            // Verify count matches
            return metrics.userTypeMentions.count === repeatCount;
          }
        ),
        testConfig
      );
    });

    test('domain references count matches actual domain occurrences', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              'Cognitive & Vision',
              'Execution & Discipline',
              'Social & Influence',
              'Resilience & Drive'
            ),
            { minLength: 0, maxLength: 8 }
          ),
          (domains) => {
            // Create report with known domain mentions
            const report = domains.join(' and ') + ' are key domains.';
            
            // Calculate metrics
            const metrics = qualityMetrics.calculateMetrics(report, {});
            
            // Count unique domains
            const uniqueDomains = new Set(domains);
            const expectedCount = uniqueDomains.size;
            
            // Verify count matches
            return metrics.domainReferences.count === expectedCount;
          }
        ),
        testConfig
      );
    });

    test('central tension references count matches actual occurrences', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5 }),
          (repeatCount) => {
            // Create report with known central tension mentions
            const phrases = [
              'central tension',
              'vision-execution gap',
              'gap between vision and execution'
            ];
            
            let report = 'This is a report. ';
            for (let i = 0; i < repeatCount; i++) {
              report += phrases[i % phrases.length] + ' is important. ';
            }
            
            // Calculate metrics
            const metrics = qualityMetrics.calculateMetrics(report, {});
            
            // Verify count matches (should be at least repeatCount)
            return metrics.centralTensionReferences.count >= repeatCount;
          }
        ),
        testConfig
      );
    });
  });

  /**
   * Property 17: Section Completeness Detection
   * Validates: Requirements 6.3
   * 
   * For any generated report, the section completeness metric should
   * accurately identify which of the 10 expected sections are present.
   */
  describe('Property 17: Section Completeness Detection', () => {
    test('section completeness accurately identifies present sections', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              'Executive Overview',
              'Cognitive',
              'Leadership',
              'Execution',
              'Emotional Intelligence',
              'Risk',
              'Motivation',
              'Optimal Roles',
              'Development Plan',
              'Recommendations'
            ),
            { minLength: 0, maxLength: 15 }
          ),
          (sections) => {
            // Create report with known sections
            const report = 'Report content: ' + sections.join(', ') + '.';
            
            // Calculate metrics
            const metrics = qualityMetrics.calculateMetrics(report, {});
            
            // Count unique sections
            const uniqueSections = new Set(sections);
            const expectedCount = uniqueSections.size;
            
            // Verify count matches
            return metrics.sectionCompleteness.count === expectedCount;
          }
        ),
        testConfig
      );
    });

    test('missing sections are correctly identified', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              'Executive Overview',
              'Cognitive',
              'Leadership',
              'Execution',
              'Emotional Intelligence',
              'Risk',
              'Motivation',
              'Optimal Roles',
              'Development Plan',
              'Recommendations'
            ),
            { minLength: 0, maxLength: 10 }
          ),
          (includedSections) => {
            // Create report with some sections
            const report = 'Report content: ' + includedSections.join(', ') + '.';
            
            // Calculate metrics
            const metrics = qualityMetrics.calculateMetrics(report, {});
            
            // All expected sections
            const allSections = new Set([
              'Executive Overview',
              'Cognitive',
              'Leadership',
              'Execution',
              'Emotional Intelligence',
              'Risk',
              'Motivation',
              'Optimal Roles',
              'Development Plan',
              'Recommendations'
            ]);
            
            // Sections that should be missing
            const includedSet = new Set(includedSections);
            const expectedMissing = [...allSections].filter(s => !includedSet.has(s));
            
            // Verify missing sections are correctly identified
            const actualMissing = metrics.sectionCompleteness.missingSections;
            return actualMissing.length === expectedMissing.length;
          }
        ),
        testConfig
      );
    });
  });

  /**
   * Property 18: Word Count Accuracy
   * Validates: Requirements 6.4
   * 
   * For any text string, the word count metric should return a count
   * that matches the actual number of words (space-separated tokens).
   */
  describe('Property 18: Word Count Accuracy', () => {
    test('word count matches actual space-separated tokens', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 100 }),
          (words) => {
            // Create report with known word count
            const report = words.join(' ');
            
            // Calculate metrics
            const metrics = qualityMetrics.calculateMetrics(report, {});
            
            // Count actual words
            const actualWords = report.trim().split(/\s+/).filter(w => w.length > 0);
            const expectedCount = actualWords.length;
            
            // Verify count matches
            return metrics.wordCount.count === expectedCount;
          }
        ),
        testConfig
      );
    });

    test('word count handles multiple spaces correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 5 }),
          (words, spaceCount) => {
            // Create report with variable spacing
            const separator = ' '.repeat(spaceCount);
            const report = words.join(separator);
            
            // Calculate metrics
            const metrics = qualityMetrics.calculateMetrics(report, {});
            
            // Count actual words (should ignore extra spaces)
            const actualWords = report.trim().split(/\s+/).filter(w => w.length > 0);
            const expectedCount = actualWords.length;
            
            // Verify count matches
            return metrics.wordCount.count === expectedCount;
          }
        ),
        testConfig
      );
    });
  });

  /**
   * Property 19: Complete Metrics Calculation
   * Validates: Requirements 6.7
   * 
   * For any generated report, the quality metrics calculation should
   * return an object containing all 6 required metrics.
   */
  describe('Property 19: Complete Metrics Calculation', () => {
    test('calculateMetrics returns all 6 required metrics', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 1000 }),
          (reportContent) => {
            // Create a valid report
            const report = 'Report: ' + reportContent;
            
            // Calculate metrics
            const metrics = qualityMetrics.calculateMetrics(report, {});
            
            // Verify all required metrics are present
            const hasScoreReferences = metrics.scoreReferences !== undefined &&
                                      typeof metrics.scoreReferences.count === 'number';
            const hasUserTypeMentions = metrics.userTypeMentions !== undefined &&
                                       typeof metrics.userTypeMentions.count === 'number';
            const hasSectionCompleteness = metrics.sectionCompleteness !== undefined &&
                                          typeof metrics.sectionCompleteness.count === 'number';
            const hasWordCount = metrics.wordCount !== undefined &&
                                typeof metrics.wordCount.count === 'number';
            const hasDomainReferences = metrics.domainReferences !== undefined &&
                                       typeof metrics.domainReferences.count === 'number';
            const hasCentralTensionReferences = metrics.centralTensionReferences !== undefined &&
                                               typeof metrics.centralTensionReferences.count === 'number';
            
            return hasScoreReferences && hasUserTypeMentions && hasSectionCompleteness &&
                   hasWordCount && hasDomainReferences && hasCentralTensionReferences;
          }
        ),
        testConfig
      );
    });

    test('calculateMetrics includes overall score and timestamp', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 1000 }),
          (reportContent) => {
            // Create a valid report
            const report = 'Report: ' + reportContent;
            
            // Calculate metrics
            const metrics = qualityMetrics.calculateMetrics(report, {});
            
            // Verify overall score and timestamp are present
            const hasOverallScore = typeof metrics.overallScore === 'number' &&
                                   metrics.overallScore >= 0 &&
                                   metrics.overallScore <= 100;
            const hasTimestamp = typeof metrics.timestamp === 'string' &&
                                metrics.timestamp.length > 0;
            
            return hasOverallScore && hasTimestamp;
          }
        ),
        testConfig
      );
    });
  });

});
