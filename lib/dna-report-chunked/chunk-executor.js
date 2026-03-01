/**
 * Chunk Executor for DNA Report Chunked Pipeline
 * 
 * Orchestrates parallel execution of all 6 report chunks using the API provider
 * abstraction. Handles parallel execution with Promise.allSettled and returns results
 * with metadata, preserving successful chunks even when some chunks fail.
 * 
 * Features:
 * - Parallel execution of all 6 chunks simultaneously
 * - Individual chunk execution with error handling
 * - Metadata tracking (tokens, latency, status)
 * - Support for enriched context or raw JSON prompts
 * - Partial failure handling: successful chunks preserved when others fail
 * - Individual chunk retry capability for failed chunks
 */

import { 
  SHARED_SYSTEM_PROMPT, 
  CHUNK_DEFINITIONS,
  getChunkDefinition,
  getChunkPrompt 
} from './chunk-definitions.js';

/**
 * ChunkExecutor class
 * Manages parallel execution of 6 report chunks
 */
export class ChunkExecutor {
  /**
   * @param {Object} apiProvider - API provider instance (Cerebras or OpenRouter)
   */
  constructor(apiProvider) {
    this.apiProvider = apiProvider;
  }

  /**
   * Execute all 6 chunks in batches of 2 with configurable delay
   * 
   * @param {string} enrichedContext - Enriched assessment data (when useEnrichment=true)
   * @param {Object} options - Execution options
   * @param {number} [options.maxTokens=1500] - Maximum tokens per chunk
   * @param {number} [options.temperature=0.7] - Sampling temperature
   * @param {boolean} [options.useEnrichment=true] - Whether to use enriched context or raw JSON
   * @param {Object} [options.rawData] - Raw assessment JSON (when useEnrichment=false)
   * @param {number} [options.batchDelay=5] - Delay in seconds between batches (0, 2, 5, 10, 15)
   * @param {Array<string>} [options.providerFallback] - Array of provider names to try in order
   * @returns {Promise<Array<Object>>} Array of chunk results with metadata (includes both successful and failed chunks)
   */
  async executeChunks(enrichedContext, options = {}) {
    const { 
      maxTokens = 1500, 
      temperature = 0.7, 
      useEnrichment = true, 
      rawData = null,
      batchDelay = 5,
      providerFallback = []
    } = options;

    // Validate input based on enrichment mode
    if (useEnrichment) {
      if (!enrichedContext || typeof enrichedContext !== 'string') {
        throw new Error('enrichedContext must be a non-empty string when useEnrichment is true');
      }
    } else {
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('rawData must be a non-empty object when useEnrichment is false');
      }
    }

    console.log(`[ChunkExecutor] Starting batched execution of 6 chunks (batch size: 2, delay: ${batchDelay}s, enrichment: ${useEnrichment})`);
    const startTime = Date.now();

    // Split chunks into batches of 2
    const batches = [
      [1, 2], // Batch 1
      [3, 4], // Batch 2
      [5, 6]  // Batch 3
    ];

    const results = [];

    // Execute batches sequentially with delay
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`[ChunkExecutor] Executing batch ${batchIndex + 1}: chunks ${batch.join(', ')}`);

      // Execute chunks in current batch in parallel
      const batchPromises = batch.map(chunkId => 
        this.executeChunk(chunkId, enrichedContext, { 
          maxTokens, 
          temperature, 
          useEnrichment, 
          rawData,
          providerFallback 
        })
      );

      const settledResults = await Promise.allSettled(batchPromises);

      // Process settled results
      const batchResults = settledResults.map((settled, index) => {
        const chunkId = batch[index];
        
        if (settled.status === 'fulfilled') {
          return settled.value;
        } else {
          console.error(`[ChunkExecutor] Chunk ${chunkId} promise rejected:`, settled.reason);
          return this._createErrorResult(chunkId, {
            type: 'exception',
            message: settled.reason?.message || 'Promise rejected'
          });
        }
      });

      results.push(...batchResults);

      // Add delay before next batch (except after last batch)
      if (batchIndex < batches.length - 1 && batchDelay > 0) {
        console.log(`[ChunkExecutor] Waiting ${batchDelay}s before next batch...`);
        await this._delay(batchDelay * 1000);
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'error').length;
    
    console.log(`[ChunkExecutor] Execution completed in ${totalTime}ms: ${successCount} succeeded, ${failureCount} failed`);
    
    if (failureCount > 0) {
      const failedChunkIds = results
        .filter(r => r.status === 'error')
        .map(r => r.chunkId)
        .join(', ');
      console.log(`[ChunkExecutor] Failed chunks: ${failedChunkIds}`);
    }

    return results;
  }

  /**
   * Execute a single chunk with provider fallback
   * 
   * @param {number} chunkId - Chunk identifier (1-6)
   * @param {string} enrichedContext - Enriched assessment data (when useEnrichment=true)
   * @param {Object} options - Execution options
   * @param {number} [options.maxTokens=1500] - Maximum tokens for response
   * @param {number} [options.temperature=0.7] - Sampling temperature
   * @param {boolean} [options.useEnrichment=true] - Whether to use enriched context or raw JSON
   * @param {Object} [options.rawData] - Raw assessment JSON (when useEnrichment=false)
   * @param {Array<Object>} [options.providerFallback] - Array of fallback providers to try
   * @returns {Promise<Object>} Chunk result with content, tokens, latency, status
   */
  async executeChunk(chunkId, enrichedContext, options = {}) {
    const { 
      maxTokens = 1500, 
      temperature = 0.7, 
      useEnrichment = true, 
      rawData = null,
      providerFallback = []
    } = options;

    // Validate chunk ID
    if (chunkId < 1 || chunkId > 6) {
      return this._createErrorResult(chunkId, {
        type: 'validation',
        message: `Invalid chunk ID: ${chunkId}. Must be between 1 and 6.`
      });
    }

    // Get chunk definition and prompt
    const definition = getChunkDefinition(chunkId);
    const chunkPrompt = getChunkPrompt(chunkId);

    console.log(`[ChunkExecutor] Executing chunk ${chunkId}: ${definition.description}`);
    
    // Try primary provider first, then fallbacks
    const providersToTry = [this.apiProvider, ...providerFallback];
    let lastError = null;
    
    for (let i = 0; i < providersToTry.length; i++) {
      const currentProvider = providersToTry[i];
      const isFallback = i > 0;
      
      if (isFallback) {
        console.log(`[ChunkExecutor] Chunk ${chunkId}: Trying fallback provider ${i} (${currentProvider.provider})`);
      }
      
      const startTime = Date.now();

      try {
        // Build messages array with system prompt and user prompt
        const messages = [
          {
            role: 'system',
            content: SHARED_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: this._buildUserPrompt(chunkPrompt, enrichedContext, useEnrichment, rawData)
          }
        ];

        // Call API provider
        const response = await currentProvider.generateCompletion({
          messages,
          maxTokens,
          temperature
        });

        const latency = Date.now() - startTime;

        // Handle API error - check if retryable
        if (response.error) {
          lastError = response.error;
          
          // Check if error is retryable (rate limit, timeout, network)
          const isRetryable = response.error.retryable || 
                             response.error.type === 'rate_limit' ||
                             response.error.type === 'timeout' ||
                             response.error.type === 'network';
          
          if (isRetryable && i < providersToTry.length - 1) {
            console.warn(`[ChunkExecutor] Chunk ${chunkId} failed with ${currentProvider.provider} (${response.error.type}), trying fallback...`);
            continue; // Try next provider
          } else {
            // Not retryable or no more fallbacks
            console.error(`[ChunkExecutor] Chunk ${chunkId} failed:`, response.error);
            return this._createErrorResult(chunkId, response.error, latency, response.metadata);
          }
        }

        // Calculate word count
        const wordCount = this._countWords(response.content);

        // Success result
        const result = {
          chunkId,
          content: response.content,
          promptTokens: response.metadata.promptTokens,
          responseTokens: response.metadata.responseTokens,
          totalTokens: response.metadata.totalTokens,
          latency,
          wordCount,
          status: 'success',
          error: null,
          metadata: {
            ...response.metadata,
            sections: definition.sections,
            targetWordCount: definition.targetWordCount,
            useEnrichment,
            usedFallback: isFallback,
            fallbackIndex: isFallback ? i : 0
          }
        };

        if (isFallback) {
          console.log(`[ChunkExecutor] Chunk ${chunkId} succeeded with fallback provider ${i} (${currentProvider.provider}): ${wordCount} words, ${latency}ms`);
        } else {
          console.log(`[ChunkExecutor] Chunk ${chunkId} completed: ${wordCount} words, ${latency}ms`);
        }
        
        return result;

      } catch (error) {
        const latency = Date.now() - startTime;
        lastError = {
          type: 'exception',
          message: error.message || 'Unknown error occurred'
        };
        
        console.error(`[ChunkExecutor] Chunk ${chunkId} exception with ${currentProvider.provider}:`, error);
        
        // Try next provider if available
        if (i < providersToTry.length - 1) {
          console.log(`[ChunkExecutor] Chunk ${chunkId}: Trying next fallback provider...`);
          continue;
        }
        
        // No more providers to try
        return this._createErrorResult(chunkId, lastError, latency);
      }
    }
    
    // All providers failed
    return this._createErrorResult(chunkId, lastError || {
      type: 'all_providers_failed',
      message: 'All providers failed'
    });
  }

  /**
   * Retry a single failed chunk
   * 
   * This method allows retrying individual chunks that failed during parallel execution
   * without re-running successful chunks. Useful for handling transient failures like
   * rate limits or network issues.
   * 
   * @param {number} chunkId - Chunk identifier (1-6) to retry
   * @param {string} enrichedContext - Enriched assessment data (when useEnrichment=true)
   * @param {Object} options - Execution options
   * @param {number} [options.maxTokens=1500] - Maximum tokens for response
   * @param {number} [options.temperature=0.7] - Sampling temperature
   * @param {boolean} [options.useEnrichment=true] - Whether to use enriched context or raw JSON
   * @param {Object} [options.rawData] - Raw assessment JSON (when useEnrichment=false)
   * @returns {Promise<Object>} Chunk result with content, tokens, latency, status
   */
  async retryChunk(chunkId, enrichedContext, options = {}) {
    console.log(`[ChunkExecutor] Retrying chunk ${chunkId}`);
    return this.executeChunk(chunkId, enrichedContext, options);
  }

  /**
   * Build user prompt combining chunk-specific prompt with enriched context or raw JSON
   * @private
   * @param {string} chunkPrompt - Chunk-specific prompt
   * @param {string} enrichedContext - Enriched context (when useEnrichment=true)
   * @param {boolean} useEnrichment - Whether to use enriched context or raw JSON
   * @param {Object} rawData - Raw assessment JSON (when useEnrichment=false)
   * @returns {string} Complete user prompt
   */
  _buildUserPrompt(chunkPrompt, enrichedContext, useEnrichment = true, rawData = null) {
    if (useEnrichment) {
      // Use enriched context string
      return `${chunkPrompt}

---

**ENRICHED CONTEXT:**

${enrichedContext}`;
    } else {
      // Use raw JSON assessment data
      const rawDataString = JSON.stringify(rawData, null, 2);
      return `${chunkPrompt}

---

**RAW ASSESSMENT DATA:**

${rawDataString}`;
    }
  }

  /**
   * Delay helper for batch execution
   * @private
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Count words in text (space-separated tokens)
   * @private
   */
  _countWords(text) {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Create error result object
   * @private
   */
  _createErrorResult(chunkId, error, latency = 0, metadata = null) {
    return {
      chunkId,
      content: null,
      promptTokens: 0,
      responseTokens: 0,
      totalTokens: 0,
      latency,
      wordCount: 0,
      status: 'error',
      error: {
        type: error.type || 'unknown',
        message: error.message || 'Unknown error',
        statusCode: error.statusCode,
        retryable: error.retryable || false
      },
      metadata: metadata || {
        provider: this.apiProvider.provider,
        model: this.apiProvider.model,
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Create ChunkExecutor instance with API provider
 * 
 * @param {Object} apiProvider - API provider instance (from api-provider.js)
 * @returns {ChunkExecutor}
 */
export function createChunkExecutor(apiProvider) {
  if (!apiProvider) {
    throw new Error('apiProvider is required');
  }
  return new ChunkExecutor(apiProvider);
}
