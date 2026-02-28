/**
 * @fileoverview Quality Metrics Engine for DNA Report Chunked Pipeline
 * 
 * Validates report completeness and accuracy against 6 defined criteria:
 * 1. Score References: Count mentions of 10 trait names
 * 2. User Type Mentions: Count references to user type
 * 3. Section Completeness: Detect 10 expected sections
 * 4. Word Count: Count space-separated tokens
 * 5. Domain References: Count 4 domains
 * 6. Central Tension References: Count vision-execution gap mentions
 */

/**
 * @typedef {Object} MetricResult
 * @property {number} count - Actual count
 * @property {number} target - Target count
 * @property {boolean} pass - Whether metric passes
 * @property {string[]} [details] - Additional details (e.g., list of found items)
 * @property {string[]} [missingSections] - Missing sections (for section completeness)
 */

/**
 * @typedef {Object} QualityMetricsResult
 * @property {MetricResult} scoreReferences - Score reference metric
 * @property {MetricResult} userTypeMentions - User type mention metric
 * @property {MetricResult} sectionCompleteness - Section completeness metric
 * @property {MetricResult} wordCount - Word count metric
 * @property {MetricResult} domainReferences - Domain reference metric
 * @property {MetricResult} centralTensionReferences - Central tension reference metric
 * @property {number} overallScore - Overall quality score (0-100)
 * @property {string} timestamp - ISO timestamp of calculation
 */

/**
 * QualityMetrics class for validating report quality
 */
class QualityMetrics {
  constructor() {
    // Define trait names to search for
    this.traitNames = [
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
    ];

    // Define domain names to search for
    this.domainNames = [
      'Cognitive & Vision',
      'Execution & Discipline',
      'Social & Influence',
      'Resilience & Drive'
    ];

    // Define expected section headers
    this.expectedSections = [
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
    ];
  }

  /**
   * Calculate all quality metrics for a report
   * @param {string} report - Complete assembled report
   * @param {Object} assessmentData - Original assessment data for validation
   * @returns {QualityMetricsResult} Metrics object with scores and details
   */
  calculateMetrics(report, assessmentData) {
    if (!report || typeof report !== 'string') {
      throw new Error('Report must be a non-empty string');
    }

    const scoreReferences = this._countScoreReferences(report);
    const userTypeMentions = this._countUserTypeMentions(report, assessmentData);
    const sectionCompleteness = this._checkSectionCompleteness(report);
    const wordCount = this._countWords(report);
    const domainReferences = this._countDomainReferences(report);
    const centralTensionReferences = this._countCentralTensionReferences(report);

    const overallScore = this._calculateOverallScore({
      scoreReferences,
      userTypeMentions,
      sectionCompleteness,
      wordCount,
      domainReferences,
      centralTensionReferences
    });

    return {
      scoreReferences,
      userTypeMentions,
      sectionCompleteness,
      wordCount,
      domainReferences,
      centralTensionReferences,
      overallScore,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Count score references (trait names mentioned)
   * @param {string} report - Report text
   * @returns {MetricResult} Score reference metric
   * @private
   */
  _countScoreReferences(report) {
    const foundTraits = [];
    const reportLower = report.toLowerCase();

    for (const trait of this.traitNames) {
      const traitLower = trait.toLowerCase();
      if (reportLower.includes(traitLower)) {
        foundTraits.push(trait);
      }
    }

    return {
      count: foundTraits.length,
      target: 10,
      pass: foundTraits.length >= 10,
      details: foundTraits
    };
  }

  /**
   * Count user type mentions
   * @param {string} report - Report text
   * @param {Object} assessmentData - Assessment data containing user type
   * @returns {MetricResult} User type mention metric
   * @private
   */
  _countUserTypeMentions(report, assessmentData) {
    const userType = assessmentData?.profile?.userType || '';
    
    if (!userType) {
      return {
        count: 0,
        minimum: 6,
        pass: false
      };
    }

    // Count occurrences of user type (case-insensitive)
    const regex = new RegExp(userType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = report.match(regex);
    const count = matches ? matches.length : 0;

    return {
      count,
      minimum: 6,
      pass: count >= 6
    };
  }

  /**
   * Check section completeness
   * @param {string} report - Report text
   * @returns {MetricResult} Section completeness metric
   * @private
   */
  _checkSectionCompleteness(report) {
    const foundSections = [];
    const missingSections = [];
    const reportLower = report.toLowerCase();

    for (const section of this.expectedSections) {
      const sectionLower = section.toLowerCase();
      if (reportLower.includes(sectionLower)) {
        foundSections.push(section);
      } else {
        missingSections.push(section);
      }
    }

    return {
      count: foundSections.length,
      target: 10,
      pass: foundSections.length >= 10,
      missingSections
    };
  }

  /**
   * Count words in report
   * @param {string} report - Report text
   * @returns {MetricResult} Word count metric
   * @private
   */
  _countWords(report) {
    // Count space-separated tokens
    const words = report.trim().split(/\s+/);
    const count = words.filter(word => word.length > 0).length;

    return {
      count,
      range: [2500, 4000],
      pass: count >= 2500 && count <= 4000
    };
  }

  /**
   * Count domain references
   * @param {string} report - Report text
   * @returns {MetricResult} Domain reference metric
   * @private
   */
  _countDomainReferences(report) {
    const foundDomains = [];
    const reportLower = report.toLowerCase();

    for (const domain of this.domainNames) {
      const domainLower = domain.toLowerCase();
      if (reportLower.includes(domainLower)) {
        foundDomains.push(domain);
      }
    }

    return {
      count: foundDomains.length,
      target: 4,
      pass: foundDomains.length >= 4,
      details: foundDomains
    };
  }

  /**
   * Count central tension references
   * @param {string} report - Report text
   * @returns {MetricResult} Central tension reference metric
   * @private
   */
  _countCentralTensionReferences(report) {
    const reportLower = report.toLowerCase();
    
    // Search for various phrasings of central tension / vision-execution gap
    const tensionPhrases = [
      'central tension',
      'vision-execution gap',
      'vision execution gap',
      'gap between vision and execution',
      'tension between vision and execution'
    ];

    let count = 0;
    for (const phrase of tensionPhrases) {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = reportLower.match(regex);
      if (matches) {
        count += matches.length;
      }
    }

    return {
      count,
      minimum: 2,
      pass: count >= 2
    };
  }

  /**
   * Calculate overall quality score (0-100)
   * @param {Object} metrics - All individual metrics
   * @returns {number} Overall score
   * @private
   */
  _calculateOverallScore(metrics) {
    // Weight each metric
    const weights = {
      scoreReferences: 20,      // 20 points
      userTypeMentions: 15,     // 15 points
      sectionCompleteness: 25,  // 25 points
      wordCount: 15,            // 15 points
      domainReferences: 15,     // 15 points
      centralTensionReferences: 10  // 10 points
    };

    let totalScore = 0;

    // Score references: proportional to target
    totalScore += (metrics.scoreReferences.count / metrics.scoreReferences.target) * weights.scoreReferences;

    // User type mentions: proportional to minimum (capped at 100%)
    const userTypeRatio = Math.min(metrics.userTypeMentions.count / metrics.userTypeMentions.minimum, 1.0);
    totalScore += userTypeRatio * weights.userTypeMentions;

    // Section completeness: proportional to target
    totalScore += (metrics.sectionCompleteness.count / metrics.sectionCompleteness.target) * weights.sectionCompleteness;

    // Word count: full points if in range, proportional if outside
    if (metrics.wordCount.pass) {
      totalScore += weights.wordCount;
    } else {
      const [min, max] = metrics.wordCount.range;
      const count = metrics.wordCount.count;
      if (count < min) {
        totalScore += (count / min) * weights.wordCount;
      } else {
        // Over max: deduct proportionally
        const excess = count - max;
        const penalty = Math.min(excess / max, 1.0);
        totalScore += (1 - penalty) * weights.wordCount;
      }
    }

    // Domain references: proportional to target
    totalScore += (metrics.domainReferences.count / metrics.domainReferences.target) * weights.domainReferences;

    // Central tension references: proportional to minimum (capped at 100%)
    const tensionRatio = Math.min(metrics.centralTensionReferences.count / metrics.centralTensionReferences.minimum, 1.0);
    totalScore += tensionRatio * weights.centralTensionReferences;

    // Round to nearest integer
    return Math.round(totalScore);
  }
}

export default QualityMetrics;
