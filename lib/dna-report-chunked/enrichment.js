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
  const scores = assessmentData.scores || {};
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

  return enrichedText;
}
