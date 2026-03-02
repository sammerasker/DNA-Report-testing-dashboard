/**
 * Monolithic Report Generator
 * 
 * Generates DNA reports using a single API call with the original monolithic prompt.
 * Used for comparison with the chunked architecture.
 * 
 * @module monolithic-generator
 */

/**
 * System prompt for monolithic report generation
 */
const MONOLITHIC_SYSTEM_PROMPT = `You are an expert entrepreneurial psychologist and career advisor with deep expertise in startup ecosystems, leadership development, and organizational psychology.`;

/**
 * Creates the monolithic prompt from assessment data
 * 
 * @param {Object} assessmentData - Raw assessment data
 * @param {boolean} useEnrichment - Whether to use enriched context (default: false)
 * @param {string} enrichedContext - Pre-generated enriched context (optional)
 * @returns {string} Complete monolithic prompt
 */
function createMonolithicPrompt(assessmentData, useEnrichment = false, enrichedContext = null) {
  const profile = assessmentData.profile || {};
  const scores = assessmentData.scores || {};
  const rolesTop = assessmentData.rolesTop || [];
  
  const firstName = profile.name?.split(' ')[0] || 'User';
  const fullName = profile.name || 'User';
  const userTypeDescriptions = profile.userType || 'Entrepreneur';
  
  // If using enrichment and enriched context is provided, use it
  if (useEnrichment && enrichedContext) {
    const prompt = `Generate a comprehensive, highly detailed, and deeply personalized Entrepreneurial DNA Report for ${firstName}.

${enrichedContext}

CRITICAL REQUIREMENT - USER-TYPE-SPECIFIC INSIGHTS:
For each trait analyzed in this report, you MUST provide user-type-specific insights:
1. STRENGTHS: Explain how each strength will specifically help ${firstName} succeed in their chosen path(s): ${userTypeDescriptions}. Be specific about how these strengths translate to success in their particular entrepreneurial journey.
2. DEVELOPMENT AREAS: Explain how each area for improvement may hinder ${firstName}'s progress in their chosen path(s). Provide specific examples of how these limitations could impact their ability to achieve their goals as ${userTypeDescriptions}.
3. TRAIT-SPECIFIC GUIDANCE: For each trait, tailor recommendations to their user type(s), showing how they can leverage strengths and address weaknesses within their specific context.

Generate a detailed 4-5 page professional analysis with the following structure:

EXECUTIVE OVERVIEW (3-4 paragraphs)
Provide a compelling, holistic overview of ${firstName}'s entrepreneurial identity.

COGNITIVE & STRATEGIC CAPABILITIES (4-5 paragraphs)
Analyze ${firstName}'s cognitive style in depth. Tailor all insights to how these cognitive capabilities will help or hinder ${firstName} specifically as ${userTypeDescriptions}.

LEADERSHIP & INFLUENCE (4-5 paragraphs)
Examine ${firstName}'s leadership approach. Connect leadership strengths to how they will help ${firstName} succeed as ${userTypeDescriptions}.

EXECUTION & OPERATIONAL EXCELLENCE (3-4 paragraphs)
Detail ${firstName}'s execution capabilities. Explain how execution strengths will be particularly valuable for ${firstName} as ${userTypeDescriptions}.

EMOTIONAL INTELLIGENCE & RELATIONSHIPS (4-5 paragraphs)
Analyze ${firstName}'s interpersonal effectiveness. Detail how emotional intelligence strengths will help ${firstName} build the relationships and networks critical for success as ${userTypeDescriptions}.

RISK PROFILE & RESILIENCE (3-4 paragraphs)
Examine ${firstName}'s approach to risk and adversity. Connect risk and resilience traits to ${firstName}'s specific path as ${userTypeDescriptions}.

MOTIVATION & VALUES ALIGNMENT (3-4 paragraphs)
Explore what drives ${firstName}. Analyze how ${firstName}'s motivation profile aligns with the demands and rewards of being ${userTypeDescriptions}.

OPTIMAL ROLES & ENVIRONMENTS (5-6 paragraphs)
Provide highly specific guidance on ideal roles, company stages, and environments. Prioritize recommendations that align with ${firstName}'s chosen path as ${userTypeDescriptions}.

STRATEGIC DEVELOPMENT PLAN (4-5 paragraphs)
Create a comprehensive growth strategy. All development recommendations must be tailored to ${firstName}'s path as ${userTypeDescriptions}.

ACTIONABLE RECOMMENDATIONS (8-12 specific items)
Provide concrete, immediately actionable steps organized by priority. Every recommendation must be relevant to ${firstName}'s path as ${userTypeDescriptions}.

FORMATTING REQUIREMENTS:
- Write in clear prose paragraphs only
- DO NOT use tables, charts, diagrams, or markdown tables
- DO NOT use bullet points for narrative sections (use prose)
- Use numbered lists ONLY for the Actionable Recommendations section
- Maintain a conversational, professional tone throughout

Write in a professional yet warm and encouraging tone. Be highly specific, avoiding generic advice. Reference the actual data provided. Make insights personal, actionable, and inspiring.`;

    return prompt;
  }
  
  // Otherwise, use simple raw data prompt (original behavior)
  // Build traits description
  const traitsDescription = Object.entries(scores)
    .map(([trait, score]) => `${trait}: ${score}`)
    .join(', ');
  
  // Build roles description
  const rolesDescription = rolesTop
    .map(role => `${role.role} (${role.score}% match)`)
    .join(', ');
  
  const prompt = `Generate a comprehensive, highly detailed, and deeply personalized Entrepreneurial DNA Report for ${firstName}.

ASSESSMENT DATA:
- Profile Summary: Innovative entrepreneur with unique strengths
- User Type/Path: ${userTypeDescriptions}
- Key Trait Scores: ${traitsDescription}
- Top Role Matches: ${rolesDescription}
- Domain Strengths: Well-rounded capabilities
- Identified Strengths: Strong problem-solving and strategic thinking
- Development Opportunities: Continuous growth mindset

CRITICAL REQUIREMENT - USER-TYPE-SPECIFIC INSIGHTS:
For each trait analyzed in this report, you MUST provide user-type-specific insights:
1. STRENGTHS: Explain how each strength will specifically help ${firstName} succeed in their chosen path(s): ${userTypeDescriptions}. Be specific about how these strengths translate to success in their particular entrepreneurial journey.
2. DEVELOPMENT AREAS: Explain how each area for improvement may hinder ${firstName}'s progress in their chosen path(s). Provide specific examples of how these limitations could impact their ability to achieve their goals as ${userTypeDescriptions}.
3. TRAIT-SPECIFIC GUIDANCE: For each trait, tailor recommendations to their user type(s), showing how they can leverage strengths and address weaknesses within their specific context.

Generate a detailed 4-5 page professional analysis with the following structure:

EXECUTIVE OVERVIEW (3-4 paragraphs)
Provide a compelling, holistic overview of ${firstName}'s entrepreneurial identity.

COGNITIVE & STRATEGIC CAPABILITIES (4-5 paragraphs)
Analyze ${firstName}'s cognitive style in depth. Tailor all insights to how these cognitive capabilities will help or hinder ${firstName} specifically as ${userTypeDescriptions}.

LEADERSHIP & INFLUENCE (4-5 paragraphs)
Examine ${firstName}'s leadership approach. Connect leadership strengths to how they will help ${firstName} succeed as ${userTypeDescriptions}.

EXECUTION & OPERATIONAL EXCELLENCE (3-4 paragraphs)
Detail ${firstName}'s execution capabilities. Explain how execution strengths will be particularly valuable for ${firstName} as ${userTypeDescriptions}.

EMOTIONAL INTELLIGENCE & RELATIONSHIPS (4-5 paragraphs)
Analyze ${firstName}'s interpersonal effectiveness. Detail how emotional intelligence strengths will help ${firstName} build the relationships and networks critical for success as ${userTypeDescriptions}.

RISK PROFILE & RESILIENCE (3-4 paragraphs)
Examine ${firstName}'s approach to risk and adversity. Connect risk and resilience traits to ${firstName}'s specific path as ${userTypeDescriptions}.

MOTIVATION & VALUES ALIGNMENT (3-4 paragraphs)
Explore what drives ${firstName}. Analyze how ${firstName}'s motivation profile aligns with the demands and rewards of being ${userTypeDescriptions}.

OPTIMAL ROLES & ENVIRONMENTS (5-6 paragraphs)
Provide highly specific guidance on ideal roles, company stages, and environments. Prioritize recommendations that align with ${firstName}'s chosen path as ${userTypeDescriptions}.

STRATEGIC DEVELOPMENT PLAN (4-5 paragraphs)
Create a comprehensive growth strategy. All development recommendations must be tailored to ${firstName}'s path as ${userTypeDescriptions}.

ACTIONABLE RECOMMENDATIONS (8-12 specific items)
Provide concrete, immediately actionable steps organized by priority. Every recommendation must be relevant to ${firstName}'s path as ${userTypeDescriptions}.

FORMATTING REQUIREMENTS:
- Write in clear prose paragraphs only
- DO NOT use tables, charts, diagrams, or markdown tables
- DO NOT use bullet points for narrative sections (use prose)
- Use numbered lists ONLY for the Actionable Recommendations section
- Maintain a conversational, professional tone throughout

Write in a professional yet warm and encouraging tone. Be highly specific, avoiding generic advice. Reference the actual data provided. Make insights personal, actionable, and inspiring.`;

  return prompt;
}

/**
 * MonolithicGenerator class
 * Generates complete DNA reports in a single API call
 */
class MonolithicGenerator {
  /**
   * @param {Object} apiProvider - API provider instance (Cerebras or OpenRouter)
   */
  constructor(apiProvider) {
    this.apiProvider = apiProvider;
  }

  /**
   * Generate complete report using monolithic approach
   * 
   * @param {Object} assessmentData - Raw assessment data
   * @param {Object} options - Generation options
   * @param {number} options.maxTokens - Maximum tokens for response (default: 4000)
   * @param {number} options.temperature - Temperature for generation (default: 0.7)
   * @param {string} options.systemPrompt - Custom system prompt (optional, uses default if not provided)
   * @param {boolean} options.useEnrichment - Whether to use enriched context (default: false)
   * @param {string} options.enrichedContext - Pre-generated enriched context (optional)
   * @returns {Promise<Object>} Generation result with content, tokens, and latency
   */
  async generateReport(assessmentData, options = {}) {
    const { 
      maxTokens = 4000, 
      temperature = 0.7,
      systemPrompt = MONOLITHIC_SYSTEM_PROMPT,
      useEnrichment = false,
      enrichedContext = null
    } = options;
    
    console.log('[MonolithicGenerator] Starting monolithic report generation');
    console.log(`[MonolithicGenerator] Using enrichment: ${useEnrichment}`);
    const startTime = Date.now();
    
    try {
      // Create monolithic prompt
      const userPrompt = createMonolithicPrompt(assessmentData, useEnrichment, enrichedContext);
      
      // Generate report via API
      const result = await this.apiProvider.generateCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        maxTokens,
        temperature
      });
      
      const latency = Date.now() - startTime;
      
      // Check for API errors
      if (result.error) {
        throw {
          message: result.error.message,
          type: result.error.type
        };
      }
      
      console.log(`[MonolithicGenerator] Generation complete in ${latency}ms`);
      console.log(`[MonolithicGenerator] Tokens: ${result.metadata?.totalTokens || 0}`);
      
      return {
        content: result.content || '',
        promptTokens: result.metadata?.promptTokens || 0,
        responseTokens: result.metadata?.responseTokens || 0,
        totalTokens: result.metadata?.totalTokens || 0,
        latency,
        status: 'success'
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error('[MonolithicGenerator] Generation failed:', error);
      
      return {
        content: '',
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0,
        latency,
        status: 'error',
        error: {
          message: error.message || 'Monolithic generation failed',
          type: error.type || 'unknown'
        }
      };
    }
  }
}

/**
 * Factory function to create a MonolithicGenerator instance
 * 
 * @param {Object} apiProvider - API provider instance
 * @returns {MonolithicGenerator} New generator instance
 */
export function createMonolithicGenerator(apiProvider) {
  return new MonolithicGenerator(apiProvider);
}

/**
 * Export function to generate monolithic prompt data for display/editing
 * This allows the UI to show what data will be sent to the API
 * 
 * @param {Object} assessmentData - Raw assessment data
 * @param {boolean} useEnrichment - Whether to use enriched context
 * @param {string} enrichedContext - Pre-generated enriched context (optional)
 * @returns {string} The monolithic prompt that would be sent to the API
 */
export function generateMonolithicPromptData(assessmentData, useEnrichment = false, enrichedContext = null) {
  return createMonolithicPrompt(assessmentData, useEnrichment, enrichedContext);
}

export default MonolithicGenerator;
