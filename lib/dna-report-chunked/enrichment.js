/**
 * Data Enrichment Layer
 * Transforms raw assessment JSON into enriched context for LLM consumption
 * 
 * This module implements the 6-step enrichment transformation:
 * 1. Score Band Classification
 * 2. Trait Interpretation Lookup
 * 3. Domain Aggregation
 * 4. Trait Tension Identification
 * 5. Role Match Rationale Generation
 * 6. Assemble Enriched Text
 */

import { TRAIT_GUIDE, DOMAIN_DEFINITIONS, SCORE_BANDS, TENSION_RULES } from './trait-definitions.js';

/**
 * Classifies a score into the appropriate band (5-tier system)
 * @param {number} score - Trait score (0-100)
 * @returns {Object} Band object with min, max, label, color, framing
 */
function classifyScoreBand(score) {
  if (score >= SCORE_BANDS.VERY_HIGH.min) return SCORE_BANDS.VERY_HIGH;
  if (score >= SCORE_BANDS.HIGH.min) return SCORE_BANDS.HIGH;
  if (score >= SCORE_BANDS.MID.min) return SCORE_BANDS.MID;
  if (score >= SCORE_BANDS.LOW.min) return SCORE_BANDS.LOW;
  return SCORE_BANDS.VERY_LOW;
}

/**
 * Gets trait interpretation based on score
 * @param {string} traitKey - Trait identifier
 * @param {number} score - Trait score (0-100)
 * @returns {Object} Interpretation object with label, interpretation, behaviors
 */
function getTraitInterpretation(traitKey, score) {
  const trait = TRAIT_GUIDE[traitKey];
  if (!trait) {
    return {
      label: 'Not Assessed',
      interpretation: 'This trait was not assessed.',
      behaviors: []
    };
  }

  // Determine if score is high or low (threshold at 50)
  return score >= 50 ? trait.high : trait.low;
}

/**
 * Aggregates traits by domain
 * @param {Object} scores - Object mapping trait keys to scores
 * @returns {Object} Domain aggregation with average scores
 */
function aggregateDomains(scores) {
  const domainAggregation = {};

  Object.values(DOMAIN_DEFINITIONS).forEach(domain => {
    const domainScores = domain.traits
      .map(traitKey => scores[traitKey])
      .filter(score => score !== undefined && score !== null);

    if (domainScores.length > 0) {
      const avgScore = domainScores.reduce((sum, s) => sum + s, 0) / domainScores.length;
      domainAggregation[domain.key] = {
        displayName: domain.displayName,
        description: domain.description,
        traits: domain.traits,
        averageScore: Math.round(avgScore),
        band: classifyScoreBand(avgScore)
      };
    }
  });

  return domainAggregation;
}

/**
 * Identifies trait tensions and synergies
 * @param {Object} scores - Object mapping trait keys to scores
 * @returns {Array<Object>} Array of identified tensions/synergies
 */
function identifyTensions(scores) {
  const identifiedTensions = [];

  TENSION_RULES.forEach(rule => {
    let matches = true;
    let minGap = Infinity;

    // Check high traits
    if (rule.pattern.high) {
      const highScores = rule.pattern.high.map(key => scores[key]).filter(s => s !== undefined);
      if (highScores.length === 0 || highScores.some(s => s < rule.threshold)) {
        matches = false;
      }
    }

    // Check low traits
    if (matches && rule.pattern.low) {
      const lowScores = rule.pattern.low.map(key => scores[key]).filter(s => s !== undefined);
      if (lowScores.length === 0 || lowScores.some(s => s >= (100 - rule.threshold))) {
        matches = false;
      }

      // Calculate gap for tension rules
      if (matches && rule.type === 'tension') {
        const highAvg = rule.pattern.high
          ? rule.pattern.high.reduce((sum, key) => sum + (scores[key] || 0), 0) / rule.pattern.high.length
          : 0;
        const lowAvg = rule.pattern.low
          ? rule.pattern.low.reduce((sum, key) => sum + (scores[key] || 0), 0) / rule.pattern.low.length
          : 0;
        minGap = highAvg - lowAvg;
      }
    }

    if (matches) {
      identifiedTensions.push({
        id: rule.id,
        name: rule.name,
        narrative: rule.narrative,
        type: rule.type,
        gap: rule.type === 'tension' ? minGap : null
      });
    }
  });

  return identifiedTensions;
}

/**
 * Generates role match rationales
 * @param {Array<Object>} rolesTop - Array of top role matches
 * @param {Object} scores - Object mapping trait keys to scores
 * @returns {Array<Object>} Array of role rationales
 */
function generateRoleRationales(rolesTop, scores) {
  if (!rolesTop || rolesTop.length === 0) {
    return [];
  }

  return rolesTop.map(role => {
    // Find traits that align with this role (scores > 60)
    const alignedTraits = Object.entries(scores)
      .filter(([key, score]) => score > 60 && TRAIT_GUIDE[key])
      .map(([key, score]) => ({
        key,
        displayName: TRAIT_GUIDE[key].displayName,
        score
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 aligned traits

    const traitList = alignedTraits.map(t => `${t.displayName} (${t.score})`).join(', ');

    return {
      role: role.role || role.name || 'Unknown Role',
      score: role.score || 0,
      rationale: `Strong fit based on: ${traitList || 'overall profile'}. This role leverages your natural strengths.`
    };
  });
}

/**
 * Generates behavioral indicators section for a trait
 * Classifies score into band and returns corresponding behavioral indicator descriptions
 * 
 * @param {string} traitKey - Trait identifier
 * @param {number} score - Trait score (0-100)
 * @returns {string} Behavioral indicators text for the score band
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

/**
 * Generates anti-hallucination validation section
 * Provides explicit lists of valid traits, domains, and roles to prevent LLM hallucinations
 * 
 * @param {Object} scores - Object mapping trait keys to scores
 * @param {Array<Object>} rolesTop - Array of top role matches
 * @returns {string} Validation section text with explicit lists and prohibition statements
 */
function generateValidationSection(scores, rolesTop) {
  let validationText = '';

  // 1. Valid Trait List (16 traits)
  const validTraits = Object.keys(TRAIT_GUIDE);
  validationText += 'VALID TRAITS (16 total):\n';
  validTraits.forEach(traitKey => {
    const trait = TRAIT_GUIDE[traitKey];
    validationText += `  - ${traitKey}: ${trait.displayName}\n`;
  });
  validationText += '\n';

  // 2. Valid Domain List (6 domains)
  const validDomains = Object.keys(DOMAIN_DEFINITIONS);
  validationText += 'VALID DOMAINS (6 total):\n';
  validDomains.forEach(domainKey => {
    const domain = DOMAIN_DEFINITIONS[domainKey];
    validationText += `  - ${domainKey}: ${domain.displayName}\n`;
  });
  validationText += '\n';

  // 3. Valid Role List (from rolesTop or NONE)
  validationText += 'VALID ROLES:\n';
  if (rolesTop && rolesTop.length > 0) {
    rolesTop.forEach(role => {
      const roleName = role.role || role.name || 'Unknown Role';
      validationText += `  - ${roleName}\n`;
    });
  } else {
    validationText += '  - NONE (no role data provided)\n';
  }
  validationText += '\n';

  // 4. Prohibition Statements
  validationText += 'CRITICAL CONSTRAINTS:\n';
  validationText += '  - DO NOT invent or reference traits not in the VALID TRAITS list above\n';
  validationText += '  - DO NOT invent or reference domains not in the VALID DOMAINS list above\n';
  validationText += '  - DO NOT invent or reference metrics, scores, or measurements not present in the assessment data\n';
  validationText += '  - DO NOT invent or reference composite scores not explicitly defined in the trait definitions\n';
  
  if (rolesTop && rolesTop.length > 0) {
    validationText += '  - DO NOT invent or reference roles not in the VALID ROLES list above\n';
  } else {
    validationText += '  - DO NOT reference any roles - no role data was provided in this assessment\n';
  }
  
  validationText += '  - ONLY use trait keys, domain keys, and role names that appear in the lists above\n';
  validationText += '  - ALL trait and domain references must be grounded in the assessment data provided\n';

  return validationText;
}
/**
 * Generates balanced trait framing guidance
 * Provides explicit guidance to prevent value judgments and frame all trait expressions positively
 *
 * @returns {string} Balanced framing guidance text
 */
function generateBalancedFramingGuidance() {
  let guidanceText = '';

  guidanceText += 'BALANCED TRAIT FRAMING PRINCIPLES:\n\n';

  // 1. Mid-range scores as ideal (Requirement 5.1)
  guidanceText += '1. MID-RANGE SCORES ARE IDEAL:\n';
  guidanceText += '   - Scores in the 40-69 range represent balanced, adaptive trait expressions\n';
  guidanceText += '   - These scores indicate flexibility to adjust behavior based on context\n';
  guidanceText += '   - Mid-range scores show the ability to access both poles of a trait as needed\n';
  guidanceText += '   - Frame mid-range scores as strengths, not as "average" or "moderate"\n\n';

  // 2. Extreme scores as potentially inflexible (Requirement 5.2)
  guidanceText += '2. EXTREME SCORES MAY INDICATE INFLEXIBLE PATTERNS:\n';
  guidanceText += '   - Scores in the 0-24 range (very low) or 85-100 range (very high) may indicate inflexible patterns\n';
  guidanceText += '   - Extreme scores can mean difficulty accessing the opposite pole when context requires it\n';
  guidanceText += '   - This is not inherently negative - it simply means a strong, consistent preference\n';
  guidanceText += '   - Frame extreme scores with awareness of both strengths and potential blind spots\n\n';

  // 3. Both poles have valid strengths (Requirement 5.3)
  guidanceText += '3. BOTH TRAIT POLES HAVE VALID STRENGTHS:\n';
  guidanceText += '   - Every trait has two poles, and BOTH poles offer legitimate strengths\n';
  guidanceText += '   - Low scores are not "bad" and high scores are not "good" - they are different expressions\n';
  guidanceText += '   - Each pole is valuable in different contexts and situations\n';
  guidanceText += '   - Always acknowledge the strengths of the expressed pole, regardless of score level\n\n';

  // 4. Prohibition on value judgments (Requirement 5.4)
  guidanceText += '4. NO VALUE JUDGMENTS ABOUT SCORE LEVELS:\n';
  guidanceText += '   - DO NOT use language that implies one score level is "better" than another\n';
  guidanceText += '   - DO NOT frame low scores as deficits or high scores as superiority\n';
  guidanceText += '   - DO NOT use terms like "lacking," "deficient," "excessive," or "too much/too little"\n';
  guidanceText += '   - DO use neutral, strengths-based language for all score levels\n';
  guidanceText += '   - Frame all trait expressions as valid preferences with contextual trade-offs\n\n';

  // 5. Context determines optimal expression (Requirement 5.5)
  guidanceText += '5. CONTEXT DETERMINES OPTIMAL TRAIT EXPRESSION:\n';
  guidanceText += '   - There is no universally "ideal" score for any trait\n';
  guidanceText += '   - The optimal trait expression depends on role, industry, team composition, and goals\n';
  guidanceText += '   - What works in one context may not work in another\n';
  guidanceText += '   - Focus on helping the individual understand their natural tendencies and when to flex\n';
  guidanceText += '   - Emphasize self-awareness and intentional adaptation over changing core traits\n\n';

  // 6. Overall framing guidance (Requirement 5.6)
  guidanceText += '6. STRENGTHS-BASED FRAMING FOR ALL INTERPRETATIONS:\n';
  guidanceText += '   - Lead with the strengths and advantages of the expressed trait pole\n';
  guidanceText += '   - Acknowledge potential challenges as "areas for awareness" not "weaknesses"\n';
  guidanceText += '   - Use compassionate, empowering language that respects the individual\'s natural wiring\n';
  guidanceText += '   - Frame development suggestions as opportunities to expand range, not fix problems\n';
  guidanceText += '   - Remember: traits are preferences, not abilities - they can be flexed with awareness\n';

  return guidanceText;
}

/**
 * Generates language quality guidelines
 * Provides explicit instructions for concrete, accessible language and prohibits vague terms
 *
 * @returns {string} Language guidelines text
 */
function generateLanguageGuidelines() {
  let guidelinesText = '';

  guidelinesText += 'LANGUAGE QUALITY GUIDELINES:\n\n';

  // 1. Forbidden vague terms (Requirement 7.1)
  guidelinesText += '1. FORBIDDEN VAGUE TERMS:\n';
  guidelinesText += '   DO NOT use these vague, unmeasurable terms:\n';
  guidelinesText += '   - "quickly" / "slowly" (use specific timeframes: "within 24 hours", "over 3-5 days")\n';
  guidelinesText += '   - "adequate" / "sufficient" (use specific criteria: "meets the 3 key requirements")\n';
  guidelinesText += '   - "reasonable" / "appropriate" (use specific standards: "aligns with industry benchmarks")\n';
  guidelinesText += '   - "user-friendly" / "easy to use" (use observable behaviors: "requires 2 clicks to complete")\n';
  guidelinesText += '   - "efficient" / "effective" (use measurable outcomes: "reduces processing time by 40%")\n';
  guidelinesText += '   - "robust" / "comprehensive" (use specific features: "handles 5 error scenarios")\n';
  guidelinesText += '   - "strategic" / "tactical" (use concrete actions: "focuses on 18-month planning cycles")\n';
  guidelinesText += '   - "proactive" / "reactive" (use observable patterns: "initiates contact before issues arise")\n';
  guidelinesText += '   - "flexible" / "adaptable" (use specific behaviors: "adjusts approach based on stakeholder feedback")\n';
  guidelinesText += '   - "innovative" / "creative" (use concrete examples: "generates 10+ solution alternatives")\n\n';

  // 2. Requirement for concrete, measurable descriptions (Requirement 7.2)
  guidelinesText += '2. USE CONCRETE, MEASURABLE DESCRIPTIONS:\n';
  guidelinesText += '   - Include specific timeframes: "within 48 hours", "3-week planning cycles"\n';
  guidelinesText += '   - Include specific quantities: "5 stakeholders", "10+ alternatives", "3 iterations"\n';
  guidelinesText += '   - Include specific frequencies: "daily check-ins", "weekly reviews", "monthly planning"\n';
  guidelinesText += '   - Include specific durations: "30-minute meetings", "2-hour deep work blocks"\n';
  guidelinesText += '   - Include specific thresholds: "decisions under $10K", "teams of 5-7 people"\n';
  guidelinesText += '   - Include specific percentages: "80% confidence level", "reduces errors by 30%"\n';
  guidelinesText += '   - Use observable, countable behaviors that could be measured or verified\n\n';

  // 3. Prohibition on ostentatious language (Requirement 7.3)
  guidelinesText += '3. AVOID OSTENTATIOUS OR UNNECESSARILY COMPLEX LANGUAGE:\n';
  guidelinesText += '   - DO NOT use unnecessarily complex vocabulary to sound impressive\n';
  guidelinesText += '   - DO NOT use jargon or technical terms when simpler words convey the same meaning\n';
  guidelinesText += '   - DO NOT use flowery, elaborate, or overly formal language\n';
  guidelinesText += '   - DO use clear, direct language that any educated reader can understand\n';
  guidelinesText += '   - DO use the simplest word that accurately conveys the meaning\n';
  guidelinesText += '   - Examples of ostentatious language to avoid:\n';
  guidelinesText += '     ✗ "leverages synergistic paradigms" → ✓ "combines complementary approaches"\n';
  guidelinesText += '     ✗ "operationalizes strategic initiatives" → ✓ "implements plans"\n';
  guidelinesText += '     ✗ "demonstrates proclivity for" → ✓ "tends to" or "prefers"\n';
  guidelinesText += '     ✗ "exhibits a predisposition toward" → ✓ "leans toward" or "favors"\n\n';

  // 4. Requirement for accessible, human-centered language (Requirement 7.4)
  guidelinesText += '4. USE ACCESSIBLE, HUMAN-CENTERED LANGUAGE:\n';
  guidelinesText += '   - Write as if speaking to a colleague, not writing an academic paper\n';
  guidelinesText += '   - Use active voice: "makes decisions quickly" not "decisions are made quickly"\n';
  guidelinesText += '   - Use conversational tone while maintaining professionalism\n';
  guidelinesText += '   - Prioritize clarity and understanding over sounding sophisticated\n';
  guidelinesText += '   - Use "you" and "your" to make the content personal and relevant\n';
  guidelinesText += '   - Break complex ideas into simple, digestible statements\n';
  guidelinesText += '   - Avoid passive constructions and nominalizations\n\n';

  // 5. Examples of concrete vs vague language (Requirement 7.5)
  guidelinesText += '5. EXAMPLES OF CONCRETE VS VAGUE LANGUAGE:\n';
  guidelinesText += '   VAGUE: "You work quickly and efficiently."\n';
  guidelinesText += '   CONCRETE: "You make decisions within 24-48 hours and complete projects 20% faster than average."\n\n';
  guidelinesText += '   VAGUE: "You communicate effectively with your team."\n';
  guidelinesText += '   CONCRETE: "You hold daily 15-minute stand-ups and respond to messages within 2 hours."\n\n';
  guidelinesText += '   VAGUE: "You\'re strategic in your approach."\n';
  guidelinesText += '   CONCRETE: "You create 18-month roadmaps and review progress quarterly."\n\n';
  guidelinesText += '   VAGUE: "You handle stress well."\n';
  guidelinesText += '   CONCRETE: "You maintain consistent output during tight deadlines and high-pressure launches."\n\n';
  guidelinesText += '   VAGUE: "You\'re detail-oriented."\n';
  guidelinesText += '   CONCRETE: "You catch 90% of errors before submission and create checklists for recurring tasks."\n\n';
  guidelinesText += '   VAGUE: "You build strong relationships."\n';
  guidelinesText += '   CONCRETE: "You schedule monthly 1-on-1s with each team member and remember personal details."\n\n';

  // 6. Requirement that behavioral descriptions be observable and specific (Requirement 7.6)
  guidelinesText += '6. ALL BEHAVIORAL DESCRIPTIONS MUST BE OBSERVABLE AND SPECIFIC:\n';
  guidelinesText += '   - Describe behaviors that could be seen, heard, or counted by an observer\n';
  guidelinesText += '   - Avoid internal states or assumptions about thoughts/feelings unless tied to observable patterns\n';
  guidelinesText += '   - Use action verbs that describe what someone does, not what they are\n';
  guidelinesText += '   - Include context that makes the behavior concrete: when, where, how often, with whom\n';
  guidelinesText += '   - Test: Could someone observe and verify this behavior? If not, make it more specific.\n';
  guidelinesText += '   Examples:\n';
  guidelinesText += '     ✗ "You\'re thoughtful" → ✓ "You pause 5-10 seconds before responding in meetings"\n';
  guidelinesText += '     ✗ "You\'re confident" → ✓ "You present ideas to groups of 20+ without notes"\n';
  guidelinesText += '     ✗ "You\'re analytical" → ✓ "You create spreadsheets with 10+ comparison criteria before deciding"\n';
  guidelinesText += '     ✗ "You value relationships" → ✓ "You schedule coffee chats with 3-5 colleagues monthly"\n';

  return guidelinesText;
}

/**
 * Generates section requirements for DNA report
 * Provides explicit section definitions, minimum content requirements, and depth guidelines
 * 
 * @param {Object} scores - Trait scores from assessment data
 * @returns {string} Section requirements text
 */
function generateSectionRequirements(scores) {
  let requirementsText = '';

  requirementsText += 'SECTION REQUIREMENTS FOR DNA REPORT:\n\n';

  // Requirement 6.1: Explicit section definitions for all required sections
  requirementsText += '1. REQUIRED SECTIONS:\n';
  requirementsText += '   The DNA report MUST include the following sections in this order:\n';
  requirementsText += '   a) Executive Summary\n';
  requirementsText += '   b) Cognitive & Vision\n';
  requirementsText += '   c) Execution & Operations\n';
  requirementsText += '   d) Interpersonal & Leadership\n';
  requirementsText += '   e) Emotional & Resilience\n';
  requirementsText += '   f) Innovation & Learning\n';
  requirementsText += '   g) Risk & Uncertainty\n';
  requirementsText += '   h) Role Recommendations (if role data is provided)\n';
  requirementsText += '   i) Development Opportunities\n';
  requirementsText += '   j) Conclusion\n\n';

  // Requirement 6.2: Minimum content requirements for each section
  requirementsText += '2. MINIMUM CONTENT REQUIREMENTS:\n';
  requirementsText += '   Each section MUST meet these minimum requirements:\n\n';

  requirementsText += '   a) Executive Summary:\n';
  requirementsText += '      - 2-3 paragraphs summarizing key patterns across all domains\n';
  requirementsText += '      - Highlight 3-5 most distinctive traits\n';
  requirementsText += '      - Identify 1-2 central tensions or synergies\n';
  requirementsText += '      - Provide overall entrepreneurial profile characterization\n\n';

  // Dynamically generate trait lists for each section
  // Note: Section names in requirements don't perfectly match domain names,
  // so we map them appropriately
  const cognitiveVisionTraits = DOMAIN_DEFINITIONS.cognitive_vision.traits
    .map(key => TRAIT_GUIDE[key]?.displayName || key).join(', ');
  const executionOperationsTraits = DOMAIN_DEFINITIONS.execution_operations.traits
    .map(key => TRAIT_GUIDE[key]?.displayName || key).join(', ');
  const interpersonalLeadershipTraits = [
    ...DOMAIN_DEFINITIONS.social_emotional.traits,
    ...DOMAIN_DEFINITIONS.leadership_presence.traits
  ].map(key => TRAIT_GUIDE[key]?.displayName || key).join(', ');
  const emotionalResilienceTraits = DOMAIN_DEFINITIONS.resilience_adaptability.traits
    .map(key => TRAIT_GUIDE[key]?.displayName || key).join(', ');
  const innovationLearningTraits = [
    TRAIT_GUIDE.creativity?.displayName || 'creativity',
    ...DOMAIN_DEFINITIONS.motivation_drive.traits.map(key => TRAIT_GUIDE[key]?.displayName || key)
  ].join(', ');
  const riskUncertaintyTraits = [
    TRAIT_GUIDE.risk?.displayName || 'risk',
    TRAIT_GUIDE.ambiguity?.displayName || 'ambiguity'
  ].join(', ');

  requirementsText += '   b) Cognitive & Vision:\n';
  requirementsText += '      - MINIMUM 3 paragraphs (this is a critical section)\n';
  requirementsText += `      - Cover all traits in this domain: ${cognitiveVisionTraits}\n`;
  requirementsText += '      - Describe how these traits interact to shape strategic thinking\n';
  requirementsText += '      - Include concrete behavioral examples for each trait\n';
  requirementsText += '      - Explain implications for business planning and decision-making\n\n';

  requirementsText += '   c) Execution & Operations:\n';
  requirementsText += '      - MINIMUM 2 paragraphs\n';
  requirementsText += `      - Cover all traits in this domain: ${executionOperationsTraits}\n`;
  requirementsText += '      - Describe operational style and process preferences\n';
  requirementsText += '      - Include concrete examples of execution patterns\n\n';

  requirementsText += '   d) Interpersonal & Leadership:\n';
  requirementsText += '      - MINIMUM 2 paragraphs\n';
  requirementsText += `      - Cover all traits in this domain: ${interpersonalLeadershipTraits}\n`;
  requirementsText += '      - Describe leadership style and team dynamics\n';
  requirementsText += '      - Include concrete examples of interpersonal patterns\n\n';

  requirementsText += '   e) Emotional & Resilience:\n';
  requirementsText += '      - MINIMUM 2 paragraphs\n';
  requirementsText += `      - Cover all traits in this domain: ${emotionalResilienceTraits}\n`;
  requirementsText += '      - Describe emotional patterns and resilience strategies\n';
  requirementsText += '      - Include concrete examples of stress responses\n\n';

  requirementsText += '   f) Innovation & Learning:\n';
  requirementsText += '      - MINIMUM 2 paragraphs\n';
  requirementsText += `      - Cover all traits in this domain: ${innovationLearningTraits}\n`;
  requirementsText += '      - Describe innovation style and learning preferences\n';
  requirementsText += '      - Include concrete examples of innovation patterns\n\n';

  requirementsText += '   g) Risk & Uncertainty:\n';
  requirementsText += '      - MINIMUM 2 paragraphs\n';
  requirementsText += `      - Cover all traits in this domain: ${riskUncertaintyTraits}\n`;
  requirementsText += '      - Describe risk assessment and decision-making under uncertainty\n';
  requirementsText += '      - Include concrete examples of risk-taking patterns\n\n';

  requirementsText += '   h) Role Recommendations:\n';
  requirementsText += '      - MINIMUM 1 paragraph per recommended role (if role data provided)\n';
  requirementsText += '      - Explain why each role is a good fit based on trait profile\n';
  requirementsText += '      - Include specific trait alignments for each role\n';
  requirementsText += '      - If no role data provided, OMIT this section entirely\n\n';

  requirementsText += '   i) Development Opportunities:\n';
  requirementsText += '      - MINIMUM 2 paragraphs\n';
  requirementsText += '      - Identify 3-5 specific development areas based on trait profile\n';
  requirementsText += '      - Provide actionable suggestions for each development area\n';
  requirementsText += '      - Frame development areas as growth opportunities, not deficits\n\n';

  requirementsText += '   j) Conclusion:\n';
  requirementsText += '      - MINIMUM 1 paragraph\n';
  requirementsText += '      - Synthesize key insights from all sections\n';
  requirementsText += '      - Reinforce unique strengths and opportunities\n';
  requirementsText += '      - End with forward-looking, empowering statement\n\n';

  // Requirement 6.3: Explicit instructions that Cognitive & Vision sections require multiple paragraphs
  requirementsText += '3. CRITICAL: COGNITIVE & VISION DEPTH REQUIREMENT:\n';
  requirementsText += '   The Cognitive & Vision section is the MOST IMPORTANT section of the report.\n';
  requirementsText += '   It MUST contain a MINIMUM of 3 substantial paragraphs.\n';
  requirementsText += '   Each paragraph should be 4-6 sentences long.\n';
  requirementsText += '   This section shapes the reader\'s understanding of strategic thinking and decision-making.\n';
  requirementsText += '   DO NOT reduce this section to 1-2 paragraphs or single sentences per trait.\n\n';

  // Requirement 6.4: Explicit instructions forbidding single-sentence sections
  requirementsText += '4. FORBIDDEN: SINGLE-SENTENCE SECTIONS:\n';
  requirementsText += '   NO section may consist of a single sentence.\n';
  requirementsText += '   Every section MUST contain multiple sentences organized into coherent paragraphs.\n';
  requirementsText += '   Single-sentence sections indicate insufficient depth and analysis.\n';
  requirementsText += '   If you find yourself writing a single sentence, expand it into a full paragraph.\n\n';

  // Requirement 6.5: Validate sufficient detail for each domain
  requirementsText += '5. DOMAIN COVERAGE VALIDATION:\n';
  requirementsText += '   For each domain section, ensure you have:\n';
  requirementsText += '   - Covered ALL traits in that domain (see DOMAIN MAPPINGS section above)\n';
  requirementsText += '   - Provided concrete behavioral examples for each trait\n';
  requirementsText += '   - Explained how traits interact within the domain\n';
  requirementsText += '   - Connected traits to entrepreneurial outcomes and implications\n';
  requirementsText += '   - Used specific, measurable language (see LANGUAGE GUIDELINES above)\n\n';

  // Requirement 6.6: Additional behavioral context for small domains
  requirementsText += '6. ADDITIONAL CONTEXT FOR SMALL DOMAINS:\n';
  requirementsText += '   Some domains have fewer than 3 traits. For these domains, provide EXTRA depth:\n\n';

  // Check which domains have fewer than 3 traits
  const domainTraitCounts = {};
  Object.values(TRAIT_GUIDE).forEach(trait => {
    const domain = trait.domainDisplayName;
    if (!domainTraitCounts[domain]) {
      domainTraitCounts[domain] = 0;
    }
    domainTraitCounts[domain]++;
  });

  const smallDomains = Object.entries(domainTraitCounts)
    .filter(([domain, count]) => count < 3)
    .map(([domain]) => domain);

  if (smallDomains.length > 0) {
    smallDomains.forEach(domain => {
      const traitCount = domainTraitCounts[domain];
      requirementsText += `   - ${domain} (${traitCount} trait${traitCount === 1 ? '' : 's'}):\n`;
      requirementsText += `     * Provide 2-3 behavioral examples per trait (instead of 1)\n`;
      requirementsText += `     * Explain how this domain interacts with other domains\n`;
      requirementsText += `     * Include additional context on entrepreneurial implications\n`;
      requirementsText += `     * Expand on risk factors and suggestions to reach minimum paragraph count\n\n`;
    });
  } else {
    requirementsText += '   - All domains have 3+ traits, so standard depth requirements apply.\n\n';
  }

  requirementsText += '7. SECTION FORMATTING:\n';
  requirementsText += '   - Use clear section headers (e.g., "## Cognitive & Vision")\n';
  requirementsText += '   - Organize content into well-structured paragraphs\n';
  requirementsText += '   - Use transitions between paragraphs to create narrative flow\n';
  requirementsText += '   - Avoid bullet points in narrative sections (use prose)\n';
  requirementsText += '   - Maintain consistent tone and style across all sections\n';

  return requirementsText;
}

/**
 * Main enrichment function
 * Transforms raw assessment data into enriched context string
 * 
 * @param {Object} assessmentData - Raw assessment data from sampledata.json
 * @returns {string} Enriched context formatted for LLM consumption
 */
export function enrichAssessmentData(assessmentData) {
  // Handle null/undefined input gracefully
  if (!assessmentData || typeof assessmentData !== 'object') {
    assessmentData = {};
  }
  
  // Extract data with defaults
  const profile = assessmentData.profile || {};
  const scores = assessmentData.normalizedScores || {};
  const rolesTop = assessmentData.rolesTop || [];

  // Step 1: Score Band Classification
  const scoreBands = {};
  Object.keys(TRAIT_GUIDE).forEach(traitKey => {
    const score = scores[traitKey];
    if (score !== undefined && score !== null) {
      scoreBands[traitKey] = {
        score,
        band: classifyScoreBand(score)
      };
    } else {
      scoreBands[traitKey] = {
        score: null,
        band: { label: 'Not Assessed' }
      };
    }
  });

  // Step 2: Trait Interpretation Lookup
  const traitInterpretations = {};
  Object.keys(TRAIT_GUIDE).forEach(traitKey => {
    const score = scores[traitKey];
    if (score !== undefined && score !== null) {
      traitInterpretations[traitKey] = getTraitInterpretation(traitKey, score);
    } else {
      traitInterpretations[traitKey] = {
        label: 'Not Assessed',
        interpretation: 'This trait was not assessed.',
        behaviors: []
      };
    }
  });

  // Step 3: Domain Aggregation
  const domainAggregation = aggregateDomains(scores);

  // Step 4: Trait Tension Identification
  const tensions = identifyTensions(scores);

  // Step 5: Role Match Rationale Generation
  const roleRationales = generateRoleRationales(rolesTop, scores);

  // Step 6: Assemble Enriched Text
  let enrichedText = '';

  // VALIDATION CONSTRAINTS (new section)
  enrichedText += '=== VALIDATION CONSTRAINTS ===\n';
  enrichedText += generateValidationSection(scores, rolesTop);
  enrichedText += '\n';

  // BALANCED TRAIT FRAMING (new section)
  enrichedText += '=== BALANCED TRAIT FRAMING ===\n';
  enrichedText += generateBalancedFramingGuidance();
  enrichedText += '\n';

  // LANGUAGE GUIDELINES (new section)
  enrichedText += '=== LANGUAGE GUIDELINES ===\n';
  enrichedText += generateLanguageGuidelines();
  enrichedText += '\n';

  // USER PROFILE
  enrichedText += '=== USER PROFILE ===\n';
  enrichedText += `Name: ${profile.name || 'Not Provided'}\n`;
  enrichedText += `Email: ${profile.email || 'Not Provided'}\n`;
  enrichedText += `User Type: ${profile.userType || 'Not Provided'}\n`;
  enrichedText += `Assessment Date: ${profile.assessmentDate || 'Not Provided'}\n\n`;

  // SCORE INTERPRETATIONS
  enrichedText += '=== SCORE INTERPRETATIONS ===\n';
  Object.entries(scoreBands).forEach(([traitKey, data]) => {
    const trait = TRAIT_GUIDE[traitKey];
    if (trait && data.score !== null) {
      enrichedText += `${trait.displayName}: ${data.score} (${data.band.label})\n`;
      if (data.band.framing) {
        enrichedText += `  ${data.band.framing}\n`;
      }
    }
  });
  enrichedText += '\n';

  // BEHAVIORAL INDICATORS (new section) - only output if data exists
  const behavioralIndicatorsContent = Object.entries(scores)
    .map(([traitKey, score]) => {
      if (score !== undefined && score !== null && TRAIT_GUIDE[traitKey]) {
        return generateBehavioralIndicators(traitKey, score);
      }
      return '';
    })
    .filter(text => text.length > 0)
    .join('\n');

  if (behavioralIndicatorsContent) {
    enrichedText += '=== BEHAVIORAL INDICATORS ===\n';
    enrichedText += behavioralIndicatorsContent;
    enrichedText += '\n\n';
  }

  // PSYCHOLOGICAL FRAMEWORK (new section) - only output if data exists
  const psychologicalFrameworkContent = [];
  
  Object.entries(scores).forEach(([traitKey, score]) => {
    if (score !== undefined && score !== null) {
      const trait = TRAIT_GUIDE[traitKey];
      // Validate that trait exists before processing
      if (!trait) {
        console.warn(`[enrichAssessmentData] Skipping invalid trait key: ${traitKey}`);
        return;
      }
      
      const pole = score < 50 ? trait.low : trait.high;
      
      // Only output if there's at least one psychological framework field
      const hasFrameworkData = pole.compassionateName || 
                               (pole.keyStrengths && pole.keyStrengths.length > 0) ||
                               (pole.riskFactors && pole.riskFactors.length > 0) ||
                               (pole.suggestions && pole.suggestions.length > 0) ||
                               (pole.howToUseStrengths && pole.howToUseStrengths.length > 0) ||
                               (pole.accommodations && pole.accommodations.length > 0);
      
      if (hasFrameworkData) {
        let frameworkText = `${trait.displayName} (${pole.label}):\n`;
        
        if (pole.compassionateName) {
          frameworkText += `  Compassionate Name: ${pole.compassionateName}\n`;
        }
        
        if (pole.keyStrengths && pole.keyStrengths.length > 0) {
          frameworkText += `  Key Strengths:\n`;
          pole.keyStrengths.forEach(strength => {
            frameworkText += `    - ${strength}\n`;
          });
        }
        
        if (pole.riskFactors && pole.riskFactors.length > 0) {
          frameworkText += `  Risk Factors:\n`;
          pole.riskFactors.forEach(risk => {
            frameworkText += `    - ${risk}\n`;
          });
        }
        
        if (pole.suggestions && pole.suggestions.length > 0) {
          frameworkText += `  Suggestions:\n`;
          pole.suggestions.forEach(suggestion => {
            frameworkText += `    - ${suggestion}\n`;
          });
        }
        
        if (pole.howToUseStrengths && pole.howToUseStrengths.length > 0) {
          frameworkText += `  How to Use Strengths:\n`;
          pole.howToUseStrengths.forEach(how => {
            frameworkText += `    - ${how}\n`;
          });
        }
        
        if (pole.accommodations && pole.accommodations.length > 0) {
          frameworkText += `  Accommodations:\n`;
          pole.accommodations.forEach(accommodation => {
            frameworkText += `    - ${accommodation}\n`;
          });
        }
        
        psychologicalFrameworkContent.push(frameworkText);
      }
    }
  });

  if (psychologicalFrameworkContent.length > 0) {
    enrichedText += '=== PSYCHOLOGICAL FRAMEWORK ===\n';
    enrichedText += psychologicalFrameworkContent.join('\n');
    enrichedText += '\n';
  }

  // DOMAIN MAPPINGS
  enrichedText += '=== DOMAIN MAPPINGS ===\n';
  Object.values(domainAggregation).forEach(domain => {
    enrichedText += `${domain.displayName}: ${domain.averageScore} (${domain.band.label})\n`;
    enrichedText += `  Description: ${domain.description}\n`;
    enrichedText += `  Traits: ${domain.traits.map(k => TRAIT_GUIDE[k]?.displayName || k).join(', ')}\n`;
  });
  enrichedText += '\n';

  // TRAIT INSIGHTS
  enrichedText += '=== TRAIT INSIGHTS ===\n';
  Object.entries(traitInterpretations).forEach(([traitKey, interpretation]) => {
    const trait = TRAIT_GUIDE[traitKey];
    if (trait) {
      enrichedText += `${trait.displayName} (${scoreBands[traitKey].score !== null ? scoreBands[traitKey].score : 'N/A'}):\n`;
      enrichedText += `  ${interpretation.label}: ${interpretation.interpretation}\n`;
      if (interpretation.behaviors && interpretation.behaviors.length > 0) {
        enrichedText += `  Typical Behaviors: ${interpretation.behaviors.join('; ')}\n`;
      }
    }
  });
  enrichedText += '\n';

  // CENTRAL TENSIONS & SYNERGIES
  if (tensions.length > 0) {
    enrichedText += '=== CENTRAL TENSIONS & SYNERGIES ===\n';
    tensions.forEach(tension => {
      enrichedText += `${tension.name} (${tension.type}):\n`;
      enrichedText += `  ${tension.narrative}\n`;
      if (tension.gap !== null) {
        enrichedText += `  Gap: ${Math.round(tension.gap)} points\n`;
      }
    });
    enrichedText += '\n';
  }

  // ROLE MATCH RATIONALE
  if (roleRationales.length > 0) {
    enrichedText += '=== ROLE MATCH RATIONALE ===\n';
    roleRationales.forEach((roleData, index) => {
      enrichedText += `${index + 1}. ${roleData.role} (Match Score: ${roleData.score})\n`;
      enrichedText += `   ${roleData.rationale}\n`;
    });
    enrichedText += '\n';
  }

  // SECTION REQUIREMENTS (new section)
  enrichedText += '=== SECTION REQUIREMENTS ===\n';
  enrichedText += generateSectionRequirements(scores);
  enrichedText += '\n';

  return enrichedText;
}
