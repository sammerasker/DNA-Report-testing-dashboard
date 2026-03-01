/**
 * Constants for DNA Report Chunked Pipeline
 * Defines chunk definitions, API configurations, and other system-wide values
 * 
 * NOTE: Trait definitions, domains, and score bands are now in trait-definitions.js
 */

// Re-export trait-related constants for backward compatibility
export { TRAIT_GUIDE, DOMAIN_DEFINITIONS, SCORE_BANDS, TENSION_RULES } from './trait-definitions.js';

/**
 * Chunk definitions with target word counts and sections
 * @type {Array<Object>}
 */
export const CHUNK_DEFINITIONS = [
  {
    id: 1,
    sections: ['Executive Overview', 'Cognitive & Strategic Capabilities'],
    targetWordCount: { min: 600, max: 800 },
    description: 'Executive Overview and Cognitive & Strategic Capabilities'
  },
  {
    id: 2,
    sections: ['Leadership & Influence', 'Execution & Operational Excellence'],
    targetWordCount: { min: 600, max: 800 },
    description: 'Leadership & Influence and Execution & Operational Excellence'
  },
  {
    id: 3,
    sections: ['Emotional Intelligence & Relationships', 'Risk Profile & Resilience'],
    targetWordCount: { min: 600, max: 800 },
    description: 'Emotional Intelligence & Relationships and Risk Profile & Resilience'
  },
  {
    id: 4,
    sections: ['Motivation & Values Alignment', 'Optimal Roles & Environments'],
    targetWordCount: { min: 600, max: 900 },
    description: 'Motivation & Values Alignment and Optimal Roles & Environments'
  },
  {
    id: 5,
    sections: ['Strategic Development Plan'],
    targetWordCount: { min: 500, max: 700 },
    description: 'Strategic Development Plan'
  },
  {
    id: 6,
    sections: ['Actionable Recommendations'],
    targetWordCount: { min: 400, max: 500 },
    description: 'Actionable Recommendations'
  }
];

/**
 * Expected sections in the final report
 * @type {Array<string>}
 */
export const EXPECTED_SECTIONS = [
  'Executive Overview',
  'Cognitive & Strategic Capabilities',
  'Leadership & Influence',
  'Execution & Operational Excellence',
  'Emotional Intelligence & Relationships',
  'Risk Profile & Resilience',
  'Motivation & Values Alignment',
  'Optimal Roles & Environments',
  'Strategic Development Plan',
  'Actionable Recommendations'
];

/**
 * API provider configurations
 * Uses environment variables for API keys (fallback to hardcoded for backward compatibility)
 * @type {Object}
 */
export const API_PROVIDERS = {
  OPENROUTER: {
    name: 'OpenRouter',
    endpoint: process.env.OPENROUTER_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    defaultModel: process.env.OPENROUTER_MODEL || 'openrouter/free'
  },
  HUGGINGFACE: {
    name: 'Hugging Face',
    endpoint: process.env.HUGGINGFACE_ENDPOINT || 'https://router.huggingface.co/v1/chat/completions',
    apiKey: process.env.HUGGINGFACE_API_KEY || '',
    defaultModel: process.env.HUGGINGFACE_MODEL || 'openai/gpt-oss-20b'
  },
  MOONSHOT: {
    name: 'Moonshot',
    endpoint: process.env.MOONSHOT_ENDPOINT || 'https://api.moonshot.cn/v1/chat/completions',
    apiKey: process.env.MOONSHOT_API_KEY || '',
    defaultModel: process.env.MOONSHOT_MODEL || 'moonshot-v1-8k'
  }
};

/**
 * Quality metrics thresholds
 * @type {Object}
 */
export const QUALITY_THRESHOLDS = {
  SCORE_REFERENCES: { target: 10, description: 'Trait scores mentioned' },
  USER_TYPE_MENTIONS: { minimum: 6, description: 'User type references' },
  SECTION_COMPLETENESS: { target: 10, description: 'Sections present' },
  WORD_COUNT: { min: 2500, max: 4000, description: 'Total word count' },
  DOMAIN_REFERENCES: { target: 4, description: 'Domains mentioned' },
  CENTRAL_TENSION_REFERENCES: { minimum: 2, description: 'Central tension mentions' }
};

/**
 * Shared system prompt for all chunks
 * @type {string}
 */
export const SHARED_SYSTEM_PROMPT = `You are an expert business psychologist and executive coach specializing in entrepreneurial assessment. You write clear, insightful, and actionable reports that help entrepreneurs understand their strengths and development areas. Your writing is professional yet warm, data-driven yet human-centered.`;

/**
 * Default generation options
 * @type {Object}
 */
export const DEFAULT_GENERATION_OPTIONS = {
  temperature: 0.7,
  maxTokens: 1500,
  topP: 0.9,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0
};

/**
 * Retry configuration for API calls
 * @type {Object}
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  delays: [1000, 2000, 4000], // milliseconds
  retryableStatusCodes: [429, 500, 502, 503, 504]
};

/**
 * Request timeout in milliseconds
 * @type {number}
 */
export const REQUEST_TIMEOUT = 30000;
