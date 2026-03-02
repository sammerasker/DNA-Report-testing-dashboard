/**
 * Complete 16-Trait Psychometric Framework
 * Authoritative source of truth for all trait definitions
 * 
 * Each trait includes:
 * - key: machine identifier
 * - displayName: human-readable name
 * - domain: which of 6 domains it belongs to
 * - domainDisplayName: human-readable domain name
 * - definition: one-sentence description
 * - measures?: {string} What this trait measures (optional, populated via JSON parsing)
 * - entrepreneurialRelevance?: {string} Why this trait matters for entrepreneurs (optional, populated via JSON parsing)
 * - behavioralIndicators?: {BehavioralIndicator[]} 3-5 concrete behavioral indicators (optional, populated via JSON parsing)
 * - low/high: interpretations and typical behaviors for each end
 * 
 * Each trait pole (low/high) includes:
 * - label: {string} Pole name
 * - interpretation: {string} Pole description
 * - behaviors: {string[]} Observable behaviors
 * - compassionateName?: {string} Compassionate, strengths-based pole name
 * - keyStrengths?: {string[]} 3-5 key strengths for this pole
 * - riskFactors?: {string[]} 2-4 risk factors with emotional context
 * - suggestions?: {string[]} 3-5 actionable suggestions
 * - howToUseStrengths?: {string[]} 2-3 strategies for leveraging strengths
 * - accommodations?: {string[]} 2-3 environmental accommodations
 */

/**
 * Behavioral indicator structure for trait score levels
 * @typedef {Object} BehavioralIndicator
 * @property {string} id - Unique identifier for the behavioral indicator
 * @property {string} name - Display name of the behavioral indicator
 * @property {string} description - Description of what this indicator measures
 * @property {string} low - Concrete behavior at low scores (0-39)
 * @property {string} mid - Concrete behavior at mid scores (40-69)
 * @property {string} high - Concrete behavior at high scores (70-100)
 */

/**
 * Complete trait definitions for all 16 traits
 * @type {Object}
 */
export const TRAIT_GUIDE = {
  // ===== COGNITIVE & VISION DOMAIN =====
  speed: {
    key: 'speed',
    displayName: 'Tempo & Bias for Action',
    domain: 'cognitive_vision',
    domainDisplayName: 'Cognitive & Vision',
    definition: 'How quickly someone absorbs information and turns it into decisions.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined, // {string} What this trait measures
    entrepreneurialRelevance: undefined, // {string} Why this trait matters for entrepreneurs
    behavioralIndicators: undefined, // {BehavioralIndicator[]} 3-5 concrete behavioral indicators
    /**
     * @typedef {Object} TraitPole
     * @property {string} label - Pole name
     * @property {string} interpretation - Pole description
     * @property {string[]} behaviors - Observable behaviors
     * @property {string} [compassionateName] - Compassionate, strengths-based pole name
     * @property {string[]} [keyStrengths] - 3-5 key strengths for this pole
     * @property {string[]} [riskFactors] - 2-4 risk factors with emotional context
     * @property {string[]} [suggestions] - 3-5 actionable suggestions
     * @property {string[]} [howToUseStrengths] - 2-3 strategies for leveraging strengths
     * @property {string[]} [accommodations] - 2-3 environmental accommodations
     */
    low: {
      label: 'Deliberate Pacing',
      interpretation: 'More deliberate pacing; prefers additional context before acting.',
      behaviors: ['Pauses before committing', 'Seeks clarification', 'Avoids rushed calls']
    },
    high: {
      label: 'Fast-Cycle Decision-Making',
      interpretation: 'Fast-cycle decision-making; acts quickly and keeps momentum high.',
      behaviors: ['Rapid decisions', 'Quick iteration', 'Pushes execution tempo']
    }
  },

  abstraction: {
    key: 'abstraction',
    displayName: 'Pattern Recognition',
    domain: 'cognitive_vision',
    domainDisplayName: 'Cognitive & Vision',
    definition: 'Ability to zoom out and connect dots others miss.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Concrete & Tactical',
      interpretation: 'Stronger focus on concrete details over broad synthesis.',
      behaviors: ['Pragmatic focus', 'Immediate-problem oriented', 'Tactical framing']
    },
    high: {
      label: 'Strategic Pattern-Spotter',
      interpretation: 'Sees strategic patterns early; connects weak signals quickly.',
      behaviors: ['Big-picture thinking', 'Trend spotting', 'Strategic reframing']
    }
  },

  creativity: {
    key: 'creativity',
    displayName: 'Creative Divergence',
    domain: 'cognitive_vision',
    domainDisplayName: 'Cognitive & Vision',
    definition: 'Ease of generating fresh options when obvious routes stall.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Proven Playbooks',
      interpretation: 'Preference for proven approaches and known playbooks.',
      behaviors: ['Applies existing templates', 'Optimizes current solutions', 'Follows established patterns']
    },
    high: {
      label: 'Novel Explorer',
      interpretation: 'Frequent ideation and exploration of novel alternatives.',
      behaviors: ['Brainstorms broadly', 'Challenges assumptions', 'Experiments often']
    }
  },

  // ===== EXECUTION & OPERATIONS DOMAIN =====
  structure: {
    key: 'structure',
    displayName: 'Systems & Cadence',
    domain: 'execution_operations',
    domainDisplayName: 'Execution & Operations',
    definition: 'How someone imposes order, rituals, and accountability.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Flexible & Adaptive',
      interpretation: 'Flexible, less process-heavy style.',
      behaviors: ['Lighter routines', 'Adaptive workflows', 'Informal coordination']
    },
    high: {
      label: 'Process-Disciplined',
      interpretation: 'Strong process orientation and operational discipline.',
      behaviors: ['Recurring rituals', 'Checklists', 'Clear ownership and follow-through']
    }
  },

  planning: {
    key: 'planning',
    displayName: 'Forward Mapping',
    domain: 'execution_operations',
    domainDisplayName: 'Execution & Operations',
    definition: 'Translating strategy into roadmaps and guardrails.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Reactive & Opportunistic',
      interpretation: 'More reactive or opportunistic planning style.',
      behaviors: ['Shorter planning horizon', 'Adapts plans on the fly', 'Responds to immediate needs']
    },
    high: {
      label: 'Strategic Roadmapper',
      interpretation: 'Strong anticipation and sequencing of future work.',
      behaviors: ['Milestone mapping', 'Risk planning', 'Clear dependency tracking']
    }
  },

  risk: {
    key: 'risk',
    displayName: 'Risk Posture',
    domain: 'execution_operations',
    domainDisplayName: 'Execution & Operations',
    definition: 'Comfort with asymmetric bets and reversibility.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Risk-Conscious',
      interpretation: 'Risk-conscious; emphasizes downside protection.',
      behaviors: ['Seeks safeguards', 'Prefers reversible or smaller moves', 'Thorough due diligence']
    },
    high: {
      label: 'Calculated Risk-Taker',
      interpretation: 'Comfortable taking calculated bets under uncertainty.',
      behaviors: ['Pursues upside opportunities', 'Acts with incomplete certainty', 'Embraces asymmetric bets']
    }
  },

  // ===== SOCIAL & EMOTIONAL INTELLIGENCE DOMAIN =====
  empathy: {
    key: 'empathy',
    displayName: 'Empathy & Attunement',
    domain: 'social_emotional',
    domainDisplayName: 'Social & Emotional Intelligence',
    definition: 'Reading emotional context and adjusting approach accordingly.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Task-First',
      interpretation: 'More task-first than emotion-first interaction style.',
      behaviors: ['Direct and efficient communication', 'Less emotional mirroring', 'Outcome-focused interactions']
    },
    high: {
      label: 'Interpersonal Sensor',
      interpretation: 'Strong interpersonal sensing and adaptation.',
      behaviors: ['Active listening', 'Tone adjustment', 'Nuanced stakeholder handling']
    }
  },

  conflict: {
    key: 'conflict',
    displayName: 'Conflict Navigation',
    domain: 'social_emotional',
    domainDisplayName: 'Social & Emotional Intelligence',
    definition: 'Instinct to lean into or diffuse friction.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Harmony-Seeking',
      interpretation: 'More harmony-seeking; may avoid direct confrontation.',
      behaviors: ['De-escalates quickly', 'Protects relationships', 'Avoids prolonged debate']
    },
    high: {
      label: 'Tension Surfacer',
      interpretation: 'Comfortable surfacing tension to resolve issues.',
      behaviors: ['Addresses disagreements head-on', 'Clarifies positions early', 'Uses friction productively']
    }
  },

  expressiveness: {
    key: 'expressiveness',
    displayName: 'Story & Communication',
    domain: 'social_emotional',
    domainDisplayName: 'Social & Emotional Intelligence',
    definition: 'How openly and vividly ideas are shared.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Concise & Reserved',
      interpretation: 'Concise, reserved communication style.',
      behaviors: ['Brief updates', 'Minimal narrative layering', 'Lets work speak for itself']
    },
    high: {
      label: 'Energetic Storyteller',
      interpretation: 'Energetic storytelling and message amplification.',
      behaviors: ['Persuasive framing', 'Frequent communication', 'Vivid examples and narratives']
    }
  },

  trust: {
    key: 'trust',
    displayName: 'Delegation & Trust',
    domain: 'social_emotional',
    domainDisplayName: 'Social & Emotional Intelligence',
    definition: 'Confidence in handing off ownership to others.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Hands-On Controller',
      interpretation: 'Tighter control and closer oversight tendencies.',
      behaviors: ['Frequent check-ins', 'Hands-on involvement', 'Slower handoff of responsibilities']
    },
    high: {
      label: 'Empowering Delegator',
      interpretation: 'Strong empowerment and distributed ownership.',
      behaviors: ['Clear ownership transfer', 'Autonomy granted', 'Outcome-focused follow-up']
    }
  },

  // ===== MOTIVATION & DRIVE DOMAIN =====
  mission: {
    key: 'mission',
    displayName: 'Mission Anchoring',
    domain: 'motivation_drive',
    domainDisplayName: 'Motivation & Drive',
    definition: 'Linking work to purpose beyond immediate sprint goals.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Execution-Immediate',
      interpretation: 'More execution-immediate orientation than mission framing.',
      behaviors: ['Prioritizes practical delivery', 'Focuses on near-term outputs', 'Less emphasis on narrative purpose']
    },
    high: {
      label: 'Purpose-Led',
      interpretation: 'Strong purpose-led motivation and alignment behavior.',
      behaviors: ['References mission in decisions', 'Aligns teams around why', 'Sustains motivation through purpose']
    }
  },

  competition: {
    key: 'competition',
    displayName: 'Competitive Drive',
    domain: 'motivation_drive',
    domainDisplayName: 'Motivation & Drive',
    definition: 'Energy gained from outperforming peers and benchmarks.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Collaboration-First',
      interpretation: 'Less comparison-driven; often collaboration-first.',
      behaviors: ['Cooperative framing', 'Lower emphasis on rivalry', 'Team success over personal ranking']
    },
    high: {
      label: 'Performance-Intense',
      interpretation: 'Benchmark-oriented and performance-intense.',
      behaviors: ['Tracks rankings and targets', 'Pushes standards higher', 'Seeks competitive advantage']
    }
  },

  // ===== RESILIENCE & ADAPTABILITY DOMAIN =====
  stress: {
    key: 'stress',
    displayName: 'Pressure Regulation',
    domain: 'resilience_adaptability',
    domainDisplayName: 'Resilience & Adaptability',
    definition: 'Steadiness under volatility and pressure.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Pressure-Sensitive',
      interpretation: 'Higher sensitivity to stress load and volatility.',
      behaviors: ['Visible strain under sustained uncertainty', 'May need reset intervals', 'Performance dips under prolonged pressure']
    },
    high: {
      label: 'Pressure-Steady',
      interpretation: 'Better emotional steadiness in high-pressure contexts.',
      behaviors: ['Composed under pressure', 'Stabilizes team affect', 'Maintains clarity in crisis']
    }
  },

  ambiguity: {
    key: 'ambiguity',
    displayName: 'Ambiguity Comfort',
    domain: 'resilience_adaptability',
    domainDisplayName: 'Resilience & Adaptability',
    definition: 'Willingness to move without full data.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Clarity-Seeking',
      interpretation: 'Prefers clarity before committing.',
      behaviors: ['Seeks validation before action', 'Asks for clearer assumptions', 'Uncomfortable with unspecified parameters']
    },
    high: {
      label: 'Uncertainty Navigator',
      interpretation: 'Comfortable progressing in uncertainty.',
      behaviors: ['Takes exploratory action', 'Tests hypotheses quickly', 'Moves forward with partial information']
    }
  },

  // ===== LEADERSHIP PRESENCE DOMAIN =====
  visibility: {
    key: 'visibility',
    displayName: 'Visibility & Presence',
    domain: 'leadership_presence',
    domainDisplayName: 'Leadership Presence',
    definition: 'Comfort being seen, heard, and recognized.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Behind-the-Scenes',
      interpretation: 'Prefers working behind the scenes; less comfort with spotlight.',
      behaviors: ['Avoids public attention', 'Delegates external representation', 'Focuses on internal contributions']
    },
    high: {
      label: 'Stage-Ready',
      interpretation: 'Comfortable with visibility and public presence.',
      behaviors: ['Seeks speaking opportunities', 'Represents organization externally', 'Builds personal brand']
    }
  },

  influence: {
    key: 'influence',
    displayName: 'Influence & Persuasion',
    domain: 'leadership_presence',
    domainDisplayName: 'Leadership Presence',
    definition: 'Ability to shape decisions and move others to action.',
    // NEW FIELDS: Behavioral Indicators (optional, populated via JSON parsing)
    measures: undefined,
    entrepreneurialRelevance: undefined,
    behavioralIndicators: undefined,
    low: {
      label: 'Collaborative Contributor',
      interpretation: 'More collaborative than directive influence style.',
      behaviors: ['Builds consensus', 'Facilitates rather than directs', 'Shares decision-making power']
    },
    high: {
      label: 'Directive Influencer',
      interpretation: 'Strong persuasive capability and directive influence.',
      behaviors: ['Shapes strategic direction', 'Moves stakeholders decisively', 'Drives alignment through conviction']
    }
  }
};


/**
 * Domain definitions with metadata
 * @type {Object}
 */
export const DOMAIN_DEFINITIONS = {
  cognitive_vision: {
    key: 'cognitive_vision',
    displayName: 'Cognitive & Vision',
    description: 'How someone processes information, spots patterns, and generates ideas.',
    traits: ['speed', 'abstraction', 'creativity']
  },
  execution_operations: {
    key: 'execution_operations',
    displayName: 'Execution & Operations',
    description: 'How someone translates vision into action through systems and planning.',
    traits: ['structure', 'planning', 'risk']
  },
  social_emotional: {
    key: 'social_emotional',
    displayName: 'Social & Emotional Intelligence',
    description: 'How someone reads people, navigates relationships, and communicates.',
    traits: ['empathy', 'conflict', 'expressiveness', 'trust']
  },
  motivation_drive: {
    key: 'motivation_drive',
    displayName: 'Motivation & Drive',
    description: 'What energizes and sustains effort over time.',
    traits: ['mission', 'competition']
  },
  resilience_adaptability: {
    key: 'resilience_adaptability',
    displayName: 'Resilience & Adaptability',
    description: 'How someone handles pressure, uncertainty, and change.',
    traits: ['stress', 'ambiguity']
  },
  leadership_presence: {
    key: 'leadership_presence',
    displayName: 'Leadership Presence',
    description: 'How someone shows up, influences others, and commands attention.',
    traits: ['visibility', 'influence']
  }
};

/**
 * Score band thresholds and labels (5-tier system)
 * Uses neutral language that acknowledges different expressions of traits as valid and context-dependent
 * These tiers are used for LLM context enrichment only - not shown to users
 * @type {Object}
 */
export const SCORE_BANDS = {
  VERY_HIGH: { 
    min: 85, 
    max: 100, 
    label: 'High (Very High)',
    color: '#10b981',
    framing: 'This trait is one of the most pronounced aspects of their entrepreneurial style. It is deeply embedded in how they think, decide, and act.'
  },
  HIGH: { 
    min: 70, 
    max: 84, 
    label: 'High',
    color: '#22c55e',
    framing: 'This trait shows a stronger expression in their profile. It is a consistent part of how they approach their work and relationships.'
  },
  MID: { 
    min: 40, 
    max: 69, 
    label: 'Mid',
    color: '#3b82f6',
    framing: 'This trait shows a balanced expression — flexible and context-dependent. They can adapt their approach based on what the situation requires.'
  },
  LOW: { 
    min: 25, 
    max: 39, 
    label: 'Low',
    color: '#8b5cf6',
    framing: 'This trait has a calmer expression in their profile. This brings distinct advantages in contexts where this quieter approach is valuable.'
  },
  VERY_LOW: { 
    min: 0, 
    max: 24, 
    label: 'Low (Very Low)',
    color: '#a855f7',
    framing: 'This trait has a very calm expression. Rather than viewing this as something to "fix," consider how team composition, partnerships, or complementary collaborators can provide this capability.'
  }
};

/**
 * Tension rules for identifying trait conflicts and synergies
 * Each rule defines a pattern, threshold, and narrative template
 * @type {Array<Object>}
 */
export const TENSION_RULES = [
  {
    id: 'vision_execution_gap',
    name: 'Vision-Execution Gap',
    pattern: { high: ['abstraction', 'creativity'], low: ['structure', 'planning'] },
    threshold: 30,
    narrative: 'Strong visionary thinking without matching execution discipline. May generate ambitious ideas that struggle to reach completion.',
    type: 'tension'
  },
  {
    id: 'execution_without_vision',
    name: 'Execution Without Vision',
    pattern: { high: ['structure', 'planning'], low: ['abstraction', 'creativity'] },
    threshold: 30,
    narrative: 'Strong operational discipline without strategic vision. Excellent at executing defined plans but may miss bigger-picture opportunities.',
    type: 'tension'
  },
  {
    id: 'speed_without_planning',
    name: 'Speed Without Planning',
    pattern: { high: ['speed'], low: ['planning'] },
    threshold: 35,
    narrative: 'Fast decision-making without forward planning. Quick to act but may lack strategic roadmap.',
    type: 'tension'
  },
  {
    id: 'risk_without_structure',
    name: 'Risk Without Structure',
    pattern: { high: ['risk'], low: ['structure'] },
    threshold: 30,
    narrative: 'High risk tolerance without operational guardrails. Bold bets without systematic risk management.',
    type: 'tension'
  },
  {
    id: 'influence_without_empathy',
    name: 'Influence Without Empathy',
    pattern: { high: ['influence'], low: ['empathy'] },
    threshold: 30,
    narrative: 'Strong persuasive capability without interpersonal attunement. May push decisions without reading emotional context.',
    type: 'tension'
  },
  {
    id: 'empathy_without_conflict',
    name: 'Empathy Without Conflict Navigation',
    pattern: { high: ['empathy'], low: ['conflict'] },
    threshold: 30,
    narrative: 'Strong interpersonal sensing but avoids confrontation. May prioritize harmony over necessary difficult conversations.',
    type: 'tension'
  },
  {
    id: 'mission_without_competition',
    name: 'Mission Without Competitive Drive',
    pattern: { high: ['mission'], low: ['competition'] },
    threshold: 25,
    narrative: 'Purpose-driven but less benchmark-oriented. Strong why but may lack intensity to outperform.',
    type: 'tension'
  },
  {
    id: 'competition_without_mission',
    name: 'Competition Without Mission',
    pattern: { high: ['competition'], low: ['mission'] },
    threshold: 25,
    narrative: 'Performance-intense but less purpose-anchored. Driven to win but may lack deeper motivational anchor.',
    type: 'tension'
  },
  {
    id: 'visibility_without_influence',
    name: 'Visibility Without Influence',
    pattern: { high: ['visibility'], low: ['influence'] },
    threshold: 30,
    narrative: 'Comfortable with spotlight but less directive. Visible presence without strong persuasive impact.',
    type: 'tension'
  },
  {
    id: 'trust_without_structure',
    name: 'Trust Without Structure',
    pattern: { high: ['trust'], low: ['structure'] },
    threshold: 30,
    narrative: 'Strong delegation without operational systems. Empowers others but may lack accountability mechanisms.',
    type: 'tension'
  },
  {
    id: 'strategic_executor',
    name: 'Strategic Executor',
    pattern: { high: ['abstraction', 'structure', 'planning'] },
    threshold: 70,
    narrative: 'Rare combination of strategic vision and operational discipline. Can both see the big picture and execute systematically.',
    type: 'synergy'
  },
  {
    id: 'resilient_risk_taker',
    name: 'Resilient Risk-Taker',
    pattern: { high: ['risk', 'stress', 'ambiguity'] },
    threshold: 70,
    narrative: 'Comfortable taking bold bets under pressure and uncertainty. Thrives in high-stakes, ambiguous environments.',
    type: 'synergy'
  },
  {
    id: 'influential_communicator',
    name: 'Influential Communicator',
    pattern: { high: ['influence', 'expressiveness', 'empathy'] },
    threshold: 70,
    narrative: 'Powerful combination of persuasive capability, storytelling, and interpersonal attunement. Moves people through both logic and emotion.',
    type: 'synergy'
  },
  {
    id: 'mission_driven_competitor',
    name: 'Mission-Driven Competitor',
    pattern: { high: ['mission', 'competition'] },
    threshold: 70,
    narrative: 'Purpose-anchored and performance-intense. Driven by both meaning and winning.',
    type: 'synergy'
  }
];
