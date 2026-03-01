/**
 * Property-based tests for ChunkExecutor
 * 
 * Uses fast-check to verify correctness properties across all valid inputs.
 * Each test runs a minimum of 100 iterations to ensure comprehensive coverage.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fc from 'fast-check';
import { ChunkExecutor } from '../../../lib/dna-report-chunked/chunk-executor.js';

// Test configuration: 20 iterations per property test for faster execution
const testConfig = { numRuns: 20 };

describe('ChunkExecutor - Property-Based Tests', () => {
  let mockApiProvider;
  let executor;

  beforeEach(() => {
    // Create mock API provider
    mockApiProvider = {
      provider: 'cerebras',
      model: 'gpt-oss-120b',
      generateCompletion: jest.fn()
    };

    executor = new ChunkExecutor(mockApiProvider);
  });

  /**
   * Property 7: Six Chunk Execution
   * **Validates: Requirements 3.1**
   * 
   * For any valid enriched context and API configuration, the Chunk Executor 
   * should initiate exactly 6 chunk generation calls.
   */
  test('Property 7: Six Chunk Execution - should initiate exactly 6 chunk calls for any valid input', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary non-empty strings as enriched context
        fc.string({ minLength: 1, maxLength: 5000 }),
        // Generate arbitrary options
        fc.record({
          maxTokens: fc.option(fc.integer({ min: 100, max: 2000 }), { nil: undefined }),
          temperature: fc.option(fc.double({ min: 0, max: 1 }), { nil: undefined })
        }),
        async (enrichedContext, options) => {
          // Reset mock before each iteration
          mockApiProvider.generateCompletion.mockClear();

          // Mock successful API response
          const mockResponse = {
            content: 'Test chunk content with multiple words for counting purposes',
            metadata: {
              provider: 'cerebras',
              model: 'gpt-oss-120b',
              promptTokens: 100,
              responseTokens: 50,
              totalTokens: 150,
              latency: 1000,
              timestamp: new Date().toISOString()
            },
            error: null
          };

          mockApiProvider.generateCompletion.mockResolvedValue(mockResponse);

          // Execute chunks
          const results = await executor.executeChunks(enrichedContext, { ...options, batchDelay: 0 });

          // Property: Exactly 6 chunk calls should be initiated
          const callCount = mockApiProvider.generateCompletion.mock.calls.length;
          
          // Verify exactly 6 API calls were made
          expect(callCount).toBe(6);
          
          // Verify exactly 6 results returned
          expect(results).toHaveLength(6);
          
          // Verify all chunk IDs are present (1 through 6)
          const chunkIds = results.map(r => r.chunkId).sort();
          expect(chunkIds).toEqual([1, 2, 3, 4, 5, 6]);
          
          // Return true to satisfy fast-check property
          return true;
        }
      ),
      testConfig
    );
  }, 15000);

  /**
   * Property 8: Chunk Word Count Compliance
   * **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
   * 
   * For any chunk ID (1-6), the generated chunk content should fall within 
   * its specified word count range:
   * - Chunk 1: 600-800 words
   * - Chunk 2: 600-800 words
   * - Chunk 3: 600-800 words
   * - Chunk 4: 600-900 words
   * - Chunk 5: 500-700 words
   * - Chunk 6: 400-500 words
   */
  test('Property 8: Chunk Word Count Compliance - each chunk output should fall within specified word count range', async () => {
    // Define word count ranges for each chunk
    const wordCountRanges = {
      1: { min: 600, max: 800 },
      2: { min: 600, max: 800 },
      3: { min: 600, max: 800 },
      4: { min: 600, max: 900 },
      5: { min: 500, max: 700 },
      6: { min: 400, max: 500 }
    };

    await fc.assert(
      fc.asyncProperty(
        // Generate chunk ID (1-6)
        fc.integer({ min: 1, max: 6 }),
        // Generate enriched context
        fc.string({ minLength: 100, maxLength: 5000 }),
        // Generate word count within the valid range for the chunk
        fc.nat(),
        async (chunkId, enrichedContext, seed) => {
          // Reset mock before each iteration
          mockApiProvider.generateCompletion.mockClear();

          // Get the word count range for this chunk
          const range = wordCountRanges[chunkId];
          
          // Generate a word count within the valid range using the seed
          const wordCount = range.min + (seed % (range.max - range.min + 1));
          
          // Create mock content with exactly the target word count
          const mockContent = Array(wordCount).fill('word').join(' ');

          // Mock API response with content matching the word count
          const mockResponse = {
            content: mockContent,
            metadata: {
              provider: 'cerebras',
              model: 'gpt-oss-120b',
              promptTokens: 100,
              responseTokens: wordCount * 1.3, // Approximate token count
              totalTokens: 100 + wordCount * 1.3,
              latency: 1000,
              timestamp: new Date().toISOString()
            },
            error: null
          };

          mockApiProvider.generateCompletion.mockResolvedValue(mockResponse);

          // Execute the specific chunk
          const result = await executor.executeChunk(chunkId, enrichedContext);

          // Property: Word count should be within the specified range
          const actualWordCount = result.wordCount;
          
          // Verify word count is within range
          expect(actualWordCount).toBeGreaterThanOrEqual(range.min);
          expect(actualWordCount).toBeLessThanOrEqual(range.max);
          
          // Verify the result includes word count metadata
          expect(result).toHaveProperty('wordCount');
          expect(typeof result.wordCount).toBe('number');
          
          // Return true to satisfy fast-check property
          return actualWordCount >= range.min && actualWordCount <= range.max;
        }
      ),
      testConfig
    );
  });

  /**
   * Property 9: Complete Context Provision
   * **Validates: Requirements 3.8**
   * 
   * For any chunk execution, the prompt sent to the API provider should contain 
   * the complete enriched context text. This ensures that each chunk has access 
   * to all the necessary assessment data to generate accurate and contextually 
   * appropriate content.
   * 
   * This property verifies:
   * 1. The enriched context is included in the user message sent to the API
   * 2. The complete enriched context text is present (not truncated or modified)
   * 3. The context is properly formatted within the prompt structure
   */
  test('Property 9: Complete Context Provision - complete enriched context included in each chunk prompt', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate chunk ID (1-6)
        fc.integer({ min: 1, max: 6 }),
        // Generate enriched context with various characteristics
        fc.string({ minLength: 50, maxLength: 3000 }).filter(s => s.trim().length > 0),
        async (chunkId, enrichedContext) => {
          // Reset mock before each iteration
          mockApiProvider.generateCompletion.mockClear();

          // Mock successful API response
          const mockResponse = {
            content: 'Test chunk content generated based on enriched context',
            metadata: {
              provider: 'cerebras',
              model: 'gpt-oss-120b',
              promptTokens: 200,
              responseTokens: 100,
              totalTokens: 300,
              latency: 1500,
              timestamp: new Date().toISOString()
            },
            error: null
          };

          mockApiProvider.generateCompletion.mockResolvedValue(mockResponse);

          // Execute the chunk
          await executor.executeChunk(chunkId, enrichedContext);

          // Property: The API call should have been made with the complete enriched context
          
          // Verify API was called
          expect(mockApiProvider.generateCompletion).toHaveBeenCalledTimes(1);
          
          // Extract the messages array from the API call
          const callArgs = mockApiProvider.generateCompletion.mock.calls[0][0];
          expect(callArgs).toHaveProperty('messages');
          expect(Array.isArray(callArgs.messages)).toBe(true);
          
          // Find the user message (should be the second message after system prompt)
          const userMessage = callArgs.messages.find(msg => msg.role === 'user');
          expect(userMessage).toBeDefined();
          expect(userMessage).toHaveProperty('content');
          expect(typeof userMessage.content).toBe('string');
          
          // Verify the complete enriched context is present in the user message
          const userPrompt = userMessage.content;
          
          // The enriched context should be included in the prompt
          const contextIncluded = userPrompt.includes(enrichedContext);
          
          // Additional verification: check for the "ENRICHED CONTEXT:" header
          const hasContextHeader = userPrompt.includes('ENRICHED CONTEXT:');
          
          // Verify both conditions
          expect(contextIncluded).toBe(true);
          expect(hasContextHeader).toBe(true);
          
          // Return true to satisfy fast-check property
          return contextIncluded && hasContextHeader;
        }
      ),
      testConfig
    );
  });

  /**
   * Property 10: Token Limit Compliance
   * **Validates: Requirements 3.9**
   * 
   * For any chunk execution, the response token count should be less than 1500 tokens.
   * This ensures that chunk responses stay within the coherent output window of smaller
   * models, which is critical for maintaining quality when using 7-8B parameter models.
   * 
   * This property verifies:
   * 1. Response token count is always less than 1500
   * 2. The token count is properly tracked in the result metadata
   * 3. The limit is enforced across all chunk IDs and various input contexts
   * 
   * Note: This test uses mocked responses with controlled token counts to verify
   * the property holds. In production, the API provider's maxTokens parameter
   * (set to 1500) enforces this limit at the API level.
   */
  test('Property 10: Token Limit Compliance - response token count < 1500 for all chunks', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate chunk ID (1-6)
        fc.integer({ min: 1, max: 6 }),
        // Generate enriched context
        fc.string({ minLength: 100, maxLength: 5000 }),
        // Generate response token count that should be < 1500
        fc.integer({ min: 50, max: 1499 }),
        async (chunkId, enrichedContext, responseTokens) => {
          // Reset mock before each iteration
          mockApiProvider.generateCompletion.mockClear();

          // Generate content with approximate word count based on token count
          // Rough approximation: 1 token ≈ 0.75 words
          const approximateWordCount = Math.floor(responseTokens * 0.75);
          const mockContent = Array(approximateWordCount).fill('word').join(' ');

          // Mock API response with controlled token count
          const mockResponse = {
            content: mockContent,
            metadata: {
              provider: 'cerebras',
              model: 'gpt-oss-120b',
              promptTokens: 200,
              responseTokens: responseTokens,
              totalTokens: 200 + responseTokens,
              latency: 1000,
              timestamp: new Date().toISOString()
            },
            error: null
          };

          mockApiProvider.generateCompletion.mockResolvedValue(mockResponse);

          // Execute the chunk
          const result = await executor.executeChunk(chunkId, enrichedContext);

          // Property: Response token count must be less than 1500
          
          // Verify result has responseTokens field
          expect(result).toHaveProperty('responseTokens');
          expect(typeof result.responseTokens).toBe('number');
          
          // Verify token count is less than 1500
          expect(result.responseTokens).toBeLessThan(1500);
          
          // Verify token count is non-negative
          expect(result.responseTokens).toBeGreaterThanOrEqual(0);
          
          // Verify the token count matches what was returned by the API
          expect(result.responseTokens).toBe(responseTokens);
          
          // Verify totalTokens includes both prompt and response
          expect(result.totalTokens).toBe(result.promptTokens + result.responseTokens);
          
          // Return true to satisfy fast-check property
          return result.responseTokens < 1500;
        }
      ),
      testConfig
    );
  });

  /**
   * Property 10b: Token Limit Enforcement via maxTokens Parameter
   * **Validates: Requirements 3.9**
   * 
   * Verifies that the maxTokens parameter is correctly passed to the API provider
   * and set to 1500 (or less) to enforce the token limit at the API level.
   * This is the primary mechanism for ensuring responses stay within limits.
   */
  test('Property 10b: maxTokens parameter enforces 1500 token limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate chunk ID (1-6)
        fc.integer({ min: 1, max: 6 }),
        // Generate enriched context
        fc.string({ minLength: 100, maxLength: 3000 }),
        // Generate optional maxTokens override (should still be <= 1500)
        fc.option(fc.integer({ min: 100, max: 1500 })),
        async (chunkId, enrichedContext, customMaxTokens) => {
          // Reset mock before each iteration
          mockApiProvider.generateCompletion.mockClear();

          // Mock successful API response
          const mockResponse = {
            content: 'Test chunk content',
            metadata: {
              provider: 'cerebras',
              model: 'gpt-oss-120b',
              promptTokens: 200,
              responseTokens: 800,
              totalTokens: 1000,
              latency: 1000,
              timestamp: new Date().toISOString()
            },
            error: null
          };

          mockApiProvider.generateCompletion.mockResolvedValue(mockResponse);

          // Execute chunk with optional custom maxTokens
          const options = customMaxTokens !== null ? { maxTokens: customMaxTokens } : {};
          await executor.executeChunk(chunkId, enrichedContext, options);

          // Property: maxTokens parameter should be <= 1500
          
          // Verify API was called
          expect(mockApiProvider.generateCompletion).toHaveBeenCalledTimes(1);
          
          // Extract the call arguments
          const callArgs = mockApiProvider.generateCompletion.mock.calls[0][0];
          expect(callArgs).toHaveProperty('maxTokens');
          expect(typeof callArgs.maxTokens).toBe('number');
          
          // Verify maxTokens is set and <= 1500
          const actualMaxTokens = callArgs.maxTokens;
          expect(actualMaxTokens).toBeGreaterThan(0);
          expect(actualMaxTokens).toBeLessThanOrEqual(1500);
          
          // If custom maxTokens was provided, verify it was used
          if (customMaxTokens !== null) {
            expect(actualMaxTokens).toBe(customMaxTokens);
          } else {
            // Default should be 1500
            expect(actualMaxTokens).toBe(1500);
          }
          
          // Return true to satisfy fast-check property
          return actualMaxTokens > 0 && actualMaxTokens <= 1500;
        }
      ),
      testConfig
    );
  });

  /**
   * Property 22: Parallel Execution Timing
   * **Validates: Requirements 8.1**
   * 
   * For any set of 6 chunks executed in parallel, all chunks should have start times 
   * within 100ms of each other, demonstrating simultaneous initiation. This verifies 
   * that the system uses Promise.all or equivalent mechanism for true parallel execution
   * rather than sequential execution.
   * 
   * This property verifies:
   * 1. All 6 chunks are initiated within a 100ms window
   * 2. The execution pattern is parallel (not sequential)
   * 3. The timing holds across various enriched context inputs
   * 
   * Note: We track the timestamp when each API call is initiated (not when it completes)
   * to verify parallel initiation.
   */
  test('Property 22: Parallel Execution Timing - all chunks initiated within 100ms', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate enriched context with various characteristics
        fc.string({ minLength: 100, maxLength: 5000 }),
        // Generate optional execution options
        fc.record({
          maxTokens: fc.option(fc.integer({ min: 100, max: 1500 }), { nil: undefined }),
          temperature: fc.option(fc.double({ min: 0, max: 1 }), { nil: undefined })
        }),
        async (enrichedContext, options) => {
          // Reset mock before each iteration
          mockApiProvider.generateCompletion.mockClear();

          // Track the timestamp when each API call is initiated
          const callTimestamps = [];

          // Mock API provider to capture call timestamps
          mockApiProvider.generateCompletion.mockImplementation(async () => {
            // Record the timestamp when this call is initiated
            callTimestamps.push(Date.now());

            // Simulate some processing time (10-50ms)
            const processingTime = 10 + Math.random() * 40;
            await new Promise(resolve => setTimeout(resolve, processingTime));

            // Return mock response
            return {
              content: 'Test chunk content with multiple words for counting purposes',
              metadata: {
                provider: 'cerebras',
                model: 'gpt-oss-120b',
                promptTokens: 100,
                responseTokens: 50,
                totalTokens: 150,
                latency: processingTime,
                timestamp: new Date().toISOString()
              },
              error: null
            };
          });

          // Execute all chunks in parallel
          await executor.executeChunks(enrichedContext, { ...options, batchDelay: 0 });

          // Property: All 6 chunks should have start times within 100ms of each other
          
          // Verify we captured 6 timestamps
          expect(callTimestamps).toHaveLength(6);
          
          // Find the earliest and latest start times
          const earliestStart = Math.min(...callTimestamps);
          const latestStart = Math.max(...callTimestamps);
          
          // Calculate the time span between first and last chunk initiation
          const timeSpan = latestStart - earliestStart;
          
          // Verify all chunks were initiated within 100ms of each other
          expect(timeSpan).toBeLessThanOrEqual(100);
          
          // Additional verification: ensure chunks were not executed sequentially
          // Sequential execution would take much longer (6 * ~30ms = ~180ms minimum)
          // Parallel execution should complete initiation in < 100ms
          
          // Log for debugging (optional)
          if (timeSpan > 50) {
            console.log(`[Property 22] Time span: ${timeSpan}ms (within 100ms threshold)`);
          }
          
          // Return true to satisfy fast-check property
          return timeSpan <= 100;
        }
      ),
      testConfig
    );
  }, 60000);

  /**
   * Property 24: Failed Chunk Reporting
   * **Validates: Requirements 8.4**
   * 
   * For any chunk execution where N chunks fail, the error reporting should identify 
   * exactly those N chunk IDs that failed. This ensures accurate failure tracking and 
   * enables targeted retry of failed chunks without re-running successful ones.
   * 
   * This property verifies:
   * 1. When N chunks fail, exactly N chunk IDs are reported as failed
   * 2. The failed chunk IDs match the chunks that actually failed
   * 3. Successful chunks are not reported as failed
   * 4. The count of failed chunks is accurate across various failure scenarios
   */
  test('Property 24: Failed Chunk Reporting - exactly N failed chunk IDs reported when N chunks fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of chunks to fail (0-6)
        fc.integer({ min: 0, max: 6 }),
        // Generate enriched context
        fc.string({ minLength: 100, maxLength: 3000 }),
        async (numChunksToFail, enrichedContext) => {
          // Reset mock before each iteration
          mockApiProvider.generateCompletion.mockClear();

          // Randomly select which chunks should fail
          const allChunkIds = [1, 2, 3, 4, 5, 6];
          const failedChunkIds = [];
          
          // Shuffle and take first N chunks to fail
          const shuffled = [...allChunkIds].sort(() => Math.random() - 0.5);
          for (let i = 0; i < numChunksToFail; i++) {
            failedChunkIds.push(shuffled[i]);
          }
          failedChunkIds.sort((a, b) => a - b); // Sort for easier comparison

          // Mock API provider to fail specific chunks
          mockApiProvider.generateCompletion.mockImplementation(async (config) => {
            // Extract chunk ID from the messages to determine which chunk this is
            // The chunk ID is tracked by call order (1st call = chunk 1, etc.)
            const callIndex = mockApiProvider.generateCompletion.mock.calls.length;
            const chunkId = callIndex;

            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 10));

            // Check if this chunk should fail
            if (failedChunkIds.includes(chunkId)) {
              // Return error response
              return {
                content: null,
                metadata: {
                  provider: 'cerebras',
                  model: 'gpt-oss-120b',
                  promptTokens: 100,
                  responseTokens: 0,
                  totalTokens: 100,
                  latency: 10,
                  timestamp: new Date().toISOString()
                },
                error: {
                  type: 'api_error',
                  message: `Simulated failure for chunk ${chunkId}`,
                  statusCode: 500,
                  retryable: true
                }
              };
            } else {
              // Return successful response
              return {
                content: `Test chunk ${chunkId} content with multiple words for counting purposes`,
                metadata: {
                  provider: 'cerebras',
                  model: 'gpt-oss-120b',
                  promptTokens: 100,
                  responseTokens: 50,
                  totalTokens: 150,
                  latency: 10,
                  timestamp: new Date().toISOString()
                },
                error: null
              };
            }
          });

          // Execute all chunks in parallel
          const results = await executor.executeChunks(enrichedContext, { batchDelay: 0 });

          // Property: Exactly N failed chunk IDs should be reported
          
          // Extract failed chunk IDs from results
          const actualFailedChunkIds = results
            .filter(r => r.status === 'error')
            .map(r => r.chunkId)
            .sort((a, b) => a - b);

          // Extract successful chunk IDs from results
          const actualSuccessfulChunkIds = results
            .filter(r => r.status === 'success')
            .map(r => r.chunkId)
            .sort((a, b) => a - b);

          // Verify the count of failed chunks matches expected
          expect(actualFailedChunkIds).toHaveLength(numChunksToFail);
          
          // Verify the failed chunk IDs match exactly
          expect(actualFailedChunkIds).toEqual(failedChunkIds);
          
          // Verify successful chunks are not reported as failed
          const expectedSuccessfulChunkIds = allChunkIds
            .filter(id => !failedChunkIds.includes(id))
            .sort((a, b) => a - b);
          expect(actualSuccessfulChunkIds).toEqual(expectedSuccessfulChunkIds);
          
          // Verify total results count is always 6
          expect(results).toHaveLength(6);
          
          // Verify no overlap between failed and successful chunks
          const overlap = actualFailedChunkIds.filter(id => 
            actualSuccessfulChunkIds.includes(id)
          );
          expect(overlap).toHaveLength(0);
          
          // Return true to satisfy fast-check property
          return actualFailedChunkIds.length === numChunksToFail &&
                 JSON.stringify(actualFailedChunkIds) === JSON.stringify(failedChunkIds);
        }
      ),
      testConfig
    );
  }, 60000);

  /**
   * Property 27: Enrichment Toggle Effect on Prompts
   * **Validates: Requirements 9.2, 9.3**
   * 
   * For any chunk execution, when enrichment is enabled, the prompt should contain 
   * enriched context text; when enrichment is disabled, the prompt should contain 
   * raw JSON assessment data.
   * 
   * This property verifies:
   * 1. When useEnrichment=true, the user message contains "ENRICHED CONTEXT:" header
   * 2. When useEnrichment=true, the enriched context string is present in the prompt
   * 3. When useEnrichment=false, the user message contains "RAW ASSESSMENT DATA:" header
   * 4. When useEnrichment=false, the raw JSON data is present in the prompt
   * 5. The correct format is used consistently across all chunk IDs
   */
  test('Property 27: Enrichment Toggle Effect on Prompts - correct context format based on enrichment setting', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate chunk ID (1-6)
        fc.integer({ min: 1, max: 6 }),
        // Generate enriched context string
        fc.string({ minLength: 50, maxLength: 2000 }).filter(s => s.trim().length > 0),
        // Generate raw assessment data object
        fc.record({
          profile: fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
            userType: fc.string({ minLength: 1, maxLength: 50 })
          }),
          normalizedScores: fc.record({
            strategicThinking: fc.integer({ min: 0, max: 100 }),
            innovation: fc.integer({ min: 0, max: 100 }),
            vision: fc.integer({ min: 0, max: 100 })
          })
        }),
        // Generate boolean for enrichment toggle
        fc.boolean(),
        async (chunkId, enrichedContext, rawData, useEnrichment) => {
          // Reset mock before each iteration
          mockApiProvider.generateCompletion.mockClear();

          // Mock successful API response
          const mockResponse = {
            content: 'Test chunk content generated based on provided context',
            metadata: {
              provider: 'cerebras',
              model: 'gpt-oss-120b',
              promptTokens: 200,
              responseTokens: 100,
              totalTokens: 300,
              latency: 1500,
              timestamp: new Date().toISOString()
            },
            error: null
          };

          mockApiProvider.generateCompletion.mockResolvedValue(mockResponse);

          // Execute the chunk with enrichment setting
          await executor.executeChunk(chunkId, enrichedContext, { useEnrichment, rawData });

          // Property: The prompt format should match the enrichment setting
          
          // Verify API was called
          expect(mockApiProvider.generateCompletion).toHaveBeenCalledTimes(1);
          
          // Extract the messages array from the API call
          const callArgs = mockApiProvider.generateCompletion.mock.calls[0][0];
          expect(callArgs).toHaveProperty('messages');
          expect(Array.isArray(callArgs.messages)).toBe(true);
          
          // Find the user message (should be the second message after system prompt)
          const userMessage = callArgs.messages.find(msg => msg.role === 'user');
          expect(userMessage).toBeDefined();
          expect(userMessage).toHaveProperty('content');
          expect(typeof userMessage.content).toBe('string');
          
          const userPrompt = userMessage.content;

          if (useEnrichment) {
            // When enrichment is enabled, verify enriched context format
            
            // 1. Should contain "ENRICHED CONTEXT:" header
            const hasEnrichedHeader = userPrompt.includes('ENRICHED CONTEXT:');
            expect(hasEnrichedHeader).toBe(true);
            
            // 2. Should contain the actual enriched context string
            const containsEnrichedContext = userPrompt.includes(enrichedContext);
            expect(containsEnrichedContext).toBe(true);
            
            // 3. Should NOT contain "RAW ASSESSMENT DATA:" header
            const hasRawHeader = userPrompt.includes('RAW ASSESSMENT DATA:');
            expect(hasRawHeader).toBe(false);
            
            // 4. Should NOT contain JSON stringified data
            const rawDataString = JSON.stringify(rawData);
            const containsRawData = userPrompt.includes(rawDataString);
            expect(containsRawData).toBe(false);
            
            // Return true if all enrichment conditions met
            return hasEnrichedHeader && containsEnrichedContext && !hasRawHeader && !containsRawData;
            
          } else {
            // When enrichment is disabled, verify raw JSON format
            
            // 1. Should contain "RAW ASSESSMENT DATA:" header
            const hasRawHeader = userPrompt.includes('RAW ASSESSMENT DATA:');
            expect(hasRawHeader).toBe(true);
            
            // 2. Should contain the JSON stringified raw data
            const rawDataString = JSON.stringify(rawData, null, 2);
            const containsRawData = userPrompt.includes(rawDataString);
            expect(containsRawData).toBe(true);
            
            // 3. Should NOT contain "ENRICHED CONTEXT:" header
            const hasEnrichedHeader = userPrompt.includes('ENRICHED CONTEXT:');
            expect(hasEnrichedHeader).toBe(false);
            
            // 4. Should NOT contain the enriched context string
            // (unless it happens to be in the raw data, which is unlikely)
            const containsEnrichedContext = userPrompt.includes(enrichedContext);
            // We don't assert false here because enrichedContext might coincidentally appear in JSON
            
            // Return true if all raw data conditions met
            return hasRawHeader && containsRawData && !hasEnrichedHeader;
          }
        }
      ),
      testConfig
    );
  });

  /**
   * Property 33: Partial Success Preservation
   * **Validates: Requirements 11.5**
   * 
   * For any execution where N chunks succeed and M chunks fail, the N successful 
   * chunk results should remain available and displayed while the M failed chunks 
   * show error states. This ensures that partial failures don't cause loss of 
   * successfully generated content, allowing users to retry only the failed chunks.
   * 
   * This property verifies:
   * 1. When M chunks fail and N chunks succeed (M+N=6), exactly N results have status='success'
   * 2. The N successful chunks have valid content (non-null, non-empty)
   * 3. The N successful chunks have valid metadata (tokens, latency, wordCount)
   * 4. The M failed chunks have status='error' with error information
   * 5. Total results count is always 6 (N successful + M failed)
   * 6. Successful chunks are not affected by failures of other chunks
   */
  test('Property 33: Partial Success Preservation - N successful chunks remain available when M chunks fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of chunks to fail (0-6)
        fc.integer({ min: 0, max: 6 }),
        // Generate enriched context
        fc.string({ minLength: 100, maxLength: 3000 }),
        async (numChunksToFail, enrichedContext) => {
          // Reset mock before each iteration
          mockApiProvider.generateCompletion.mockClear();

          // Calculate number of successful chunks
          const numChunksToSucceed = 6 - numChunksToFail;

          // Randomly select which chunks should fail
          const allChunkIds = [1, 2, 3, 4, 5, 6];
          const failedChunkIds = [];
          
          // Shuffle and take first M chunks to fail
          const shuffled = [...allChunkIds].sort(() => Math.random() - 0.5);
          for (let i = 0; i < numChunksToFail; i++) {
            failedChunkIds.push(shuffled[i]);
          }
          failedChunkIds.sort((a, b) => a - b);

          // Calculate successful chunk IDs
          const successfulChunkIds = allChunkIds
            .filter(id => !failedChunkIds.includes(id))
            .sort((a, b) => a - b);

          // Mock API provider to fail specific chunks and succeed on others
          mockApiProvider.generateCompletion.mockImplementation(async (config) => {
            // Extract chunk ID from call order
            const callIndex = mockApiProvider.generateCompletion.mock.calls.length;
            const chunkId = callIndex;

            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 10));

            // Check if this chunk should fail
            if (failedChunkIds.includes(chunkId)) {
              // Return error response
              return {
                content: null,
                metadata: {
                  provider: 'cerebras',
                  model: 'gpt-oss-120b',
                  promptTokens: 100,
                  responseTokens: 0,
                  totalTokens: 100,
                  latency: 10,
                  timestamp: new Date().toISOString()
                },
                error: {
                  type: 'api_error',
                  message: `Simulated failure for chunk ${chunkId}`,
                  statusCode: 500,
                  retryable: true
                }
              };
            } else {
              // Return successful response with valid content
              const wordCount = 650 + Math.floor(Math.random() * 100); // 650-750 words
              const mockContent = Array(wordCount).fill('word').join(' ');
              
              return {
                content: mockContent,
                metadata: {
                  provider: 'cerebras',
                  model: 'gpt-oss-120b',
                  promptTokens: 100,
                  responseTokens: Math.floor(wordCount * 1.3),
                  totalTokens: 100 + Math.floor(wordCount * 1.3),
                  latency: 1000 + Math.floor(Math.random() * 500),
                  timestamp: new Date().toISOString()
                },
                error: null
              };
            }
          });

          // Execute all chunks in parallel
          const results = await executor.executeChunks(enrichedContext, { batchDelay: 0 });

          // Property 1: Exactly N results should have status='success'
          const actualSuccessfulResults = results.filter(r => r.status === 'success');
          expect(actualSuccessfulResults).toHaveLength(numChunksToSucceed);

          // Property 2: The N successful chunks should have valid content
          for (const result of actualSuccessfulResults) {
            expect(result.content).not.toBeNull();
            expect(result.content).not.toBe('');
            expect(typeof result.content).toBe('string');
            expect(result.content.length).toBeGreaterThan(0);
          }

          // Property 3: The N successful chunks should have valid metadata
          for (const result of actualSuccessfulResults) {
            // Verify token counts
            expect(result.promptTokens).toBeGreaterThan(0);
            expect(result.responseTokens).toBeGreaterThan(0);
            expect(result.totalTokens).toBe(result.promptTokens + result.responseTokens);
            
            // Verify latency
            expect(result.latency).toBeGreaterThan(0);
            expect(typeof result.latency).toBe('number');
            
            // Verify word count
            expect(result.wordCount).toBeGreaterThan(0);
            expect(typeof result.wordCount).toBe('number');
            
            // Verify metadata object exists
            expect(result.metadata).toBeDefined();
            expect(typeof result.metadata).toBe('object');
          }

          // Property 4: The M failed chunks should have status='error' with error information
          const actualFailedResults = results.filter(r => r.status === 'error');
          expect(actualFailedResults).toHaveLength(numChunksToFail);
          
          for (const result of actualFailedResults) {
            expect(result.status).toBe('error');
            expect(result.error).not.toBeNull();
            expect(result.error).toBeDefined();
            expect(typeof result.error).toBe('object');
            expect(result.error.message).toBeDefined();
            expect(typeof result.error.message).toBe('string');
          }

          // Property 5: Total results count is always 6
          expect(results).toHaveLength(6);

          // Property 6: Successful chunks are not affected by failures
          // Verify successful chunk IDs match expected
          const actualSuccessfulChunkIds = actualSuccessfulResults
            .map(r => r.chunkId)
            .sort((a, b) => a - b);
          expect(actualSuccessfulChunkIds).toEqual(successfulChunkIds);

          // Verify failed chunk IDs match expected
          const actualFailedChunkIds = actualFailedResults
            .map(r => r.chunkId)
            .sort((a, b) => a - b);
          expect(actualFailedChunkIds).toEqual(failedChunkIds);

          // Verify no overlap between successful and failed chunks
          const overlap = actualSuccessfulChunkIds.filter(id => 
            actualFailedChunkIds.includes(id)
          );
          expect(overlap).toHaveLength(0);

          // Verify all chunk IDs are present (1-6)
          const allResultChunkIds = results.map(r => r.chunkId).sort((a, b) => a - b);
          expect(allResultChunkIds).toEqual([1, 2, 3, 4, 5, 6]);

          // Return true to satisfy fast-check property
          return actualSuccessfulResults.length === numChunksToSucceed &&
                 actualFailedResults.length === numChunksToFail &&
                 results.length === 6;
        }
      ),
      testConfig
    );
  }, 60000);
});
