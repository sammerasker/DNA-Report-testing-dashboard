/**
 * Chunk Definitions and Prompts for DNA Report Chunked Pipeline
 * 
 * This module defines the 6 chunk specifications with their prompts, sections,
 * and word count targets. Each chunk is designed to stay within the coherent
 * output window of smaller models (<1500 tokens per call).
 */

/**
 * Shared system prompt for all chunks
 * Establishes the expert persona and writing style
 * @type {string}
 */
export const SHARED_SYSTEM_PROMPT = `You are an expert business psychologist and executive coach specializing in entrepreneurial assessment. You write clear, insightful, and actionable reports that help entrepreneurs understand their strengths and development areas. Your writing is professional yet warm, data-driven yet human-centered.`;

/**
 * Chunk 1: Executive Overview + Cognitive & Strategic Capabilities
 * Target: 600-800 words
 */
export const CHUNK_1_DEFINITION = {
  id: 1,
  sections: ['Executive Overview', 'Cognitive & Strategic Capabilities'],
  targetWordCount: { min: 600, max: 800 },
  description: 'Executive Overview and Cognitive & Strategic Capabilities',
  prompt: `Generate the first two sections of an Entrepreneurial DNA Report:

**Section 1: Executive Overview**
- Provide a compelling 2-3 paragraph summary of the entrepreneur's profile
- Highlight their user type and what makes their profile unique
- Mention their central tension (vision-execution gap) if present
- Set the tone for the entire report

**Section 2: Cognitive & Strategic Capabilities**
- Analyze Strategic Thinking, Innovation, and Vision scores
- Discuss how these traits work together in their cognitive domain
- Provide specific examples of how these capabilities manifest
- Connect to their user type and overall profile

**Requirements:**
- Target 600-800 words total across both sections
- Reference specific trait scores from the enriched context
- Use the user's name and user type naturally throughout
- Write in a professional yet warm tone
- Be specific and actionable, not generic
- Write in clear prose paragraphs only. Do not use tables, charts, or diagrams.

Use the enriched context provided to ground all insights in their actual assessment data.`
};

/**
 * Chunk 2: Leadership & Influence + Execution & Operational Excellence
 * Target: 600-800 words
 */
export const CHUNK_2_DEFINITION = {
  id: 2,
  sections: ['Leadership & Influence', 'Execution & Operational Excellence'],
  targetWordCount: { min: 600, max: 800 },
  description: 'Leadership & Influence and Execution & Operational Excellence',
  prompt: `Generate the next two sections of an Entrepreneurial DNA Report:

**Section 3: Leadership & Influence**
- Analyze Leadership, Influence, and Emotional Intelligence scores
- Discuss their social and influence capabilities
- Explain how they lead and inspire others
- Connect to their user type and role matches

**Section 4: Execution & Operational Excellence**
- Analyze Execution, Discipline, and Attention to Detail scores
- Discuss their execution domain strengths and challenges
- Explain how they translate vision into action
- Address any vision-execution gaps if present

**Requirements:**
- Target 600-800 words total across both sections
- Reference specific trait scores from the enriched context
- Discuss how these domains interact with each other
- Be specific about strengths and development areas
- Connect insights to their optimal roles
- Write in clear prose paragraphs only. Do not use tables, charts, or diagrams.

Use the enriched context provided to ground all insights in their actual assessment data.`
};

/**
 * Chunk 3: Emotional Intelligence & Relationships + Risk Profile & Resilience
 * Target: 600-800 words
 */
export const CHUNK_3_DEFINITION = {
  id: 3,
  sections: ['Emotional Intelligence & Relationships', 'Risk Profile & Resilience'],
  targetWordCount: { min: 600, max: 800 },
  description: 'Emotional Intelligence & Relationships and Risk Profile & Resilience',
  prompt: `Generate the next two sections of an Entrepreneurial DNA Report:

**Section 5: Emotional Intelligence & Relationships**
- Deep dive into Emotional Intelligence score and implications
- Discuss how they build and maintain relationships
- Explain their interpersonal strengths and blind spots
- Connect to their leadership and influence capabilities

**Section 6: Risk Profile & Resilience**
- Analyze Resilience and Risk Tolerance scores
- Discuss how they handle uncertainty and setbacks
- Explain their approach to risk-taking and decision-making
- Connect to their overall entrepreneurial profile

**Requirements:**
- Target 600-800 words total across both sections
- Reference specific trait scores from the enriched context
- Discuss how emotional intelligence and resilience work together
- Be specific about how these traits manifest in entrepreneurial contexts
- Provide actionable insights
- Write in clear prose paragraphs only. Do not use tables, charts, or diagrams.

Use the enriched context provided to ground all insights in their actual assessment data.`
};

/**
 * Chunk 4: Motivation & Values Alignment + Optimal Roles & Environments
 * Target: 600-900 words
 */
export const CHUNK_4_DEFINITION = {
  id: 4,
  sections: ['Motivation & Values Alignment', 'Optimal Roles & Environments'],
  targetWordCount: { min: 600, max: 900 },
  description: 'Motivation & Values Alignment and Optimal Roles & Environments',
  prompt: `Generate the next two sections of an Entrepreneurial DNA Report:

**Section 7: Motivation & Values Alignment**
- Discuss what drives and motivates this entrepreneur
- Explain how their trait profile reveals their core values
- Connect their motivations to their user type
- Discuss alignment between their capabilities and aspirations

**Section 8: Optimal Roles & Environments**
- Present their top role matches with detailed rationale
- Explain why each role fits their unique profile
- Discuss the types of environments where they thrive
- Address potential role mismatches or challenges

**Requirements:**
- Target 600-900 words total across both sections
- Reference specific role matches from the enriched context
- Explain the "why" behind each role recommendation
- Be specific about ideal team structures and organizational contexts
- Connect to all four domains (Cognitive, Execution, Social, Resilience)
- Write in clear prose paragraphs only. Do not use tables, charts, or diagrams.

Use the enriched context provided to ground all insights in their actual assessment data.`
};

/**
 * Chunk 5: Strategic Development Plan
 * Target: 500-700 words
 */
export const CHUNK_5_DEFINITION = {
  id: 5,
  sections: ['Strategic Development Plan'],
  targetWordCount: { min: 500, max: 700 },
  description: 'Strategic Development Plan',
  prompt: `Generate the Strategic Development Plan section of an Entrepreneurial DNA Report:

**Section 9: Strategic Development Plan**
- Identify 3-4 key development priorities based on their profile
- For each priority, explain:
  - Why it matters for their success
  - How it connects to their trait scores
  - Specific strategies for development
- Address their central tension if present
- Provide a roadmap for growth

**Requirements:**
- Target 500-700 words
- Prioritize development areas that will have the highest impact
- Be specific and actionable, not generic advice
- Connect development priorities to their user type and role goals
- Balance addressing gaps with leveraging strengths
- Reference specific trait scores and domains
- Write in clear prose paragraphs only. Do not use tables, charts, or diagrams.

Use the enriched context provided to ground all insights in their actual assessment data.`
};

/**
 * Chunk 6: Actionable Recommendations
 * Target: 400-500 words
 */
export const CHUNK_6_DEFINITION = {
  id: 6,
  sections: ['Actionable Recommendations'],
  targetWordCount: { min: 400, max: 500 },
  description: 'Actionable Recommendations',
  prompt: `Generate the final Actionable Recommendations section of an Entrepreneurial DNA Report:

**Section 10: Actionable Recommendations**
- Provide 5-7 specific, immediately actionable recommendations
- Each recommendation should:
  - Be concrete and specific (not generic advice)
  - Connect to their trait profile and user type
  - Be achievable within 30-90 days
  - Address both strengths to leverage and gaps to address
- End with an inspiring call to action

**Requirements:**
- Target 400-500 words
- Make recommendations specific to their profile
- Include a mix of quick wins and longer-term actions
- Reference their optimal roles and development priorities
- End on an empowering, forward-looking note
- Ensure recommendations are practical and actionable
- Write in clear prose paragraphs only. Do not use tables, charts, or diagrams.

Use the enriched context provided to ground all insights in their actual assessment data.`
};

/**
 * Array of all chunk definitions in order
 * @type {Array<Object>}
 */
export const CHUNK_DEFINITIONS = [
  CHUNK_1_DEFINITION,
  CHUNK_2_DEFINITION,
  CHUNK_3_DEFINITION,
  CHUNK_4_DEFINITION,
  CHUNK_5_DEFINITION,
  CHUNK_6_DEFINITION
];

/**
 * Get chunk definition by ID
 * @param {number} chunkId - Chunk identifier (1-6)
 * @returns {Object} Chunk definition object
 */
export function getChunkDefinition(chunkId) {
  if (chunkId < 1 || chunkId > 6) {
    throw new Error(`Invalid chunk ID: ${chunkId}. Must be between 1 and 6.`);
  }
  return CHUNK_DEFINITIONS[chunkId - 1];
}

/**
 * Get chunk prompt by ID
 * @param {number} chunkId - Chunk identifier (1-6)
 * @returns {string} Chunk-specific prompt
 */
export function getChunkPrompt(chunkId) {
  const definition = getChunkDefinition(chunkId);
  return definition.prompt;
}

/**
 * Get all chunk IDs
 * @returns {Array<number>} Array of chunk IDs [1, 2, 3, 4, 5, 6]
 */
export function getAllChunkIds() {
  return CHUNK_DEFINITIONS.map(def => def.id);
}

/**
 * Validate chunk word count
 * @param {number} chunkId - Chunk identifier (1-6)
 * @param {number} wordCount - Actual word count
 * @returns {Object} Validation result with pass/fail and details
 */
export function validateChunkWordCount(chunkId, wordCount) {
  const definition = getChunkDefinition(chunkId);
  const { min, max } = definition.targetWordCount;
  const pass = wordCount >= min && wordCount <= max;
  
  return {
    pass,
    chunkId,
    wordCount,
    target: { min, max },
    message: pass 
      ? `Chunk ${chunkId} word count (${wordCount}) is within target range (${min}-${max})`
      : `Chunk ${chunkId} word count (${wordCount}) is outside target range (${min}-${max})`
  };
}
