/**
 * @fileoverview Report Assembler for DNA Report Chunked Pipeline
 * 
 * Combines individual report chunks into a coherent final report with:
 * - Sequential chunk assembly (1-6)
 * - Section header insertion
 * - Formatting normalization
 * - User profile header
 */

/**
 * @typedef {Object} ChunkResult
 * @property {number} chunkId - Chunk identifier (1-6)
 * @property {string} content - Generated chunk content
 * @property {boolean} success - Whether chunk generation succeeded
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {string} userType - User type classification
 */

/**
 * ReportAssembler class for combining chunks into final report
 */
class ReportAssembler {
  /**
   * Assemble chunks into final report
   * @param {ChunkResult[]} chunks - Array of chunk results
   * @param {UserProfile} userProfile - User profile information
   * @returns {string} Assembled report
   */
  assembleReport(chunks, userProfile) {
    // Validate input
    if (!Array.isArray(chunks)) {
      throw new Error('Chunks must be an array');
    }

    // Sort chunks by ID to ensure sequential order
    const sortedChunks = [...chunks].sort((a, b) => a.chunkId - b.chunkId);

    // Build report sections
    const sections = [];

    // Add document header
    sections.push(this._createDocumentHeader(userProfile));

    // Process each chunk
    for (let i = 0; i < sortedChunks.length; i++) {
      const chunk = sortedChunks[i];
      
      if (chunk.success && chunk.content) {
        // Add section header before chunk content
        const sectionHeader = this._getSectionHeader(chunk.chunkId);
        if (sectionHeader) {
          sections.push(sectionHeader);
        }

        // Normalize and add chunk content
        const normalizedContent = this.normalizeFormatting(chunk.content);
        sections.push(normalizedContent);
      } else {
        // Handle missing/failed chunks with placeholder
        sections.push(this._createPlaceholder(chunk.chunkId, chunk.error));
      }
    }

    // Join all sections with proper spacing
    return sections.join('\n\n');
  }

  /**
   * Create document header with user profile
   * @param {UserProfile} userProfile - User profile information
   * @returns {string} Formatted header
   * @private
   */
  _createDocumentHeader(userProfile) {
    const name = userProfile?.name || 'N/A';
    const email = userProfile?.email || 'N/A';
    const userType = userProfile?.userType || 'N/A';

    return `# DNA Leadership Assessment Report

**Name:** ${name}  
**Email:** ${email}  
**Profile Type:** ${userType}  
**Generated:** ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}

---`;
  }

  /**
   * Get section header for chunk
   * @param {number} chunkId - Chunk identifier
   * @returns {string} Section header
   * @private
   */
  _getSectionHeader(chunkId) {
    const headers = {
      1: '## Executive Overview & Cognitive Capabilities',
      2: '## Leadership & Execution Excellence',
      3: '## Emotional Intelligence & Resilience',
      4: '## Motivation & Optimal Environments',
      5: '## Strategic Development Plan',
      6: '## Actionable Recommendations'
    };

    return headers[chunkId] || '';
  }

  /**
   * Create placeholder for missing/failed chunk
   * @param {number} chunkId - Chunk identifier
   * @param {string} [error] - Error message
   * @returns {string} Placeholder text
   * @private
   */
  _createPlaceholder(chunkId, error) {
    const header = this._getSectionHeader(chunkId);
    const errorMsg = error ? `\n\n*Error: ${error}*` : '';
    
    return `${header}\n\n*[Content for this section is currently unavailable]*${errorMsg}`;
  }

  /**
   * Normalize formatting for consistency
   * @param {string} content - Raw chunk content
   * @returns {string} Normalized content
   */
  normalizeFormatting(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }

    let normalized = content;

    // Remove any existing section headers that match our standard headers
    const headerPatterns = [
      /^##\s*Executive Overview.*$/gim,
      /^##\s*Leadership.*$/gim,
      /^##\s*Emotional Intelligence.*$/gim,
      /^##\s*Motivation.*$/gim,
      /^##\s*Strategic Development.*$/gim,
      /^##\s*Actionable Recommendations.*$/gim
    ];

    headerPatterns.forEach(pattern => {
      normalized = normalized.replace(pattern, '');
    });

    // Normalize paragraph spacing - replace 3+ newlines with exactly 2
    normalized = normalized.replace(/\n{3,}/g, '\n\n');

    // Ensure proper line breaks between sections
    normalized = normalized.replace(/\n{2,}(#{1,3}\s)/g, '\n\n$1');

    // Sanitize unexpected HTML tags (basic sanitization)
    normalized = normalized.replace(/<script[^>]*>.*?<\/script>/gis, '');
    normalized = normalized.replace(/<style[^>]*>.*?<\/style>/gis, '');

    // Remove leading/trailing whitespace
    normalized = normalized.trim();

    return normalized;
  }

  /**
   * Insert section headers at chunk boundaries
   * @param {string} content - Content to process
   * @param {number} chunkId - Chunk identifier
   * @returns {string} Content with header
   */
  insertHeaders(content, chunkId) {
    const header = this._getSectionHeader(chunkId);
    if (!header) {
      return content;
    }

    // Check if content already starts with this header
    const headerRegex = new RegExp(`^${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (headerRegex.test(content.trim())) {
      return content;
    }

    return `${header}\n\n${content}`;
  }
}

export default ReportAssembler;
