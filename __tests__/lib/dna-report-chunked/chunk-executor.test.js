/**
 * Unit tests for ChunkExecutor
 * Tests parallel execution, single chunk execution, and error handling
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ChunkExecutor, createChunkExecutor } from '../../../lib/dna-report-chunked/chunk-executor.js';
import { CHUNK_DEFINITIONS } from '../../../lib/dna-report-chunked/chunk-definitions.js';

describe('ChunkExecutor', () => {
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

  describe('constructor', () => {
    test('should create instance with API provider', () => {
      expect(executor).toBeInstanceOf(ChunkExecutor);
      expect(executor.apiProvider).toBe(mockApiProvider);
    });
  });

  describe('executeChunk', () => {
    test('should execute single chunk successfully', async () => {
      const mockResponse = {
        content: 'This is a test report chunk with enough words to count properly and verify the implementation.',
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

      const enrichedContext = 'Test enriched context data';
      const result = await executor.executeChunk(1, enrichedContext);

      expect(result).toMatchObject({
        chunkId: 1,
        content: mockResponse.content,
        promptTokens: 100,
        responseTokens: 50,
        totalTokens: 150,
        status: 'success',
        error: null
      });

      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(mockApiProvider.generateCompletion).toHaveBeenCalledTimes(1);
    });

    test('should include chunk metadata in result', async () => {
      const mockResponse = {
        content: 'Test content',
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

      const result = await executor.executeChunk(1, 'test context');

      expect(result.metadata).toBeDefined();
      expect(result.metadata.sections).toEqual(CHUNK_DEFINITIONS[0].sections);
      expect(result.metadata.targetWordCount).toEqual(CHUNK_DEFINITIONS[0].targetWordCount);
    });

    test('should handle invalid chunk ID', async () => {
      const result = await executor.executeChunk(0, 'test context');

      expect(result.status).toBe('error');
      expect(result.error.type).toBe('validation');
      expect(result.error.message).toContain('Invalid chunk ID');
    });

    test('should handle API error response', async () => {
      const mockResponse = {
        content: null,
        metadata: {
          provider: 'cerebras',
          model: 'gpt-oss-120b',
          promptTokens: 0,
          responseTokens: 0,
          totalTokens: 0,
          latency: 500,
          timestamp: new Date().toISOString()
        },
        error: {
          type: 'rate_limit',
          message: 'Rate limit exceeded',
          statusCode: 429,
          retryable: true
        }
      };

      mockApiProvider.generateCompletion.mockResolvedValue(mockResponse);

      const result = await executor.executeChunk(1, 'test context');

      expect(result.status).toBe('error');
      expect(result.error.type).toBe('rate_limit');
      expect(result.error.retryable).toBe(true);
    });

    test('should handle exception during execution', async () => {
      mockApiProvider.generateCompletion.mockRejectedValue(
        new Error('Network connection failed')
      );

      const result = await executor.executeChunk(1, 'test context');

      expect(result.status).toBe('error');
      expect(result.error.type).toBe('exception');
      expect(result.error.message).toContain('Network connection failed');
    });

    test('should pass correct messages to API provider', async () => {
      const mockResponse = {
        content: 'Test content',
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

      const enrichedContext = 'Test enriched context';
      await executor.executeChunk(1, enrichedContext);

      const callArgs = mockApiProvider.generateCompletion.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(2);
      expect(callArgs.messages[0].role).toBe('system');
      expect(callArgs.messages[1].role).toBe('user');
      expect(callArgs.messages[1].content).toContain(enrichedContext);
    });

    test('should use provided options for API call', async () => {
      const mockResponse = {
        content: 'Test content',
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

      await executor.executeChunk(1, 'test context', {
        maxTokens: 2000,
        temperature: 0.9
      });

      const callArgs = mockApiProvider.generateCompletion.mock.calls[0][0];
      expect(callArgs.maxTokens).toBe(2000);
      expect(callArgs.temperature).toBe(0.9);
    });
  });

  describe('executeChunks', () => {
    test('should execute all 6 chunks in parallel', async () => {
      const mockResponse = {
        content: 'Test chunk content with multiple words for counting',
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

      const enrichedContext = 'Test enriched context';
      const results = await executor.executeChunks(enrichedContext, { batchDelay: 0 });

      expect(results).toHaveLength(6);
      expect(mockApiProvider.generateCompletion).toHaveBeenCalledTimes(6);

      // Verify all chunks have correct IDs
      results.forEach((result, index) => {
        expect(result.chunkId).toBe(index + 1);
        expect(result.status).toBe('success');
      });
    }, 15000);

    test('should handle partial failures', async () => {
      // Mock responses: chunks 1, 2, 3 succeed, chunks 4, 5, 6 fail
      let callCount = 0;
      mockApiProvider.generateCompletion.mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return Promise.resolve({
            content: 'Success content',
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
          });
        } else {
          return Promise.resolve({
            content: null,
            metadata: {
              provider: 'cerebras',
              model: 'gpt-oss-120b',
              promptTokens: 0,
              responseTokens: 0,
              totalTokens: 0,
              latency: 500,
              timestamp: new Date().toISOString()
            },
            error: {
              type: 'rate_limit',
              message: 'Rate limit exceeded',
              statusCode: 429,
              retryable: true
            }
          });
        }
      });

      const results = await executor.executeChunks('test context', { batchDelay: 0 });

      expect(results).toHaveLength(6);
      
      // First 3 chunks should succeed
      expect(results[0].status).toBe('success');
      expect(results[0].content).toBe('Success content');
      expect(results[1].status).toBe('success');
      expect(results[1].content).toBe('Success content');
      expect(results[2].status).toBe('success');
      expect(results[2].content).toBe('Success content');

      // Last 3 chunks should fail
      expect(results[3].status).toBe('error');
      expect(results[3].error.type).toBe('rate_limit');
      expect(results[4].status).toBe('error');
      expect(results[4].error.type).toBe('rate_limit');
      expect(results[5].status).toBe('error');
      expect(results[5].error.type).toBe('rate_limit');
    }, 10000);

    test('should preserve successful chunks when some fail', async () => {
      // Mock responses: chunks 2 and 5 fail, others succeed
      mockApiProvider.generateCompletion.mockImplementation((config) => {
        const userContent = config.messages[1].content;
        // Determine chunk ID from the prompt content
        const isChunk2 = userContent.includes('Leadership & Influence');
        const isChunk5 = userContent.includes('Strategic Development Plan');
        
        if (isChunk2 || isChunk5) {
          return Promise.resolve({
            content: null,
            metadata: {
              provider: 'cerebras',
              model: 'gpt-oss-120b',
              promptTokens: 0,
              responseTokens: 0,
              totalTokens: 0,
              latency: 500,
              timestamp: new Date().toISOString()
            },
            error: {
              type: 'timeout',
              message: 'Request timed out',
              statusCode: 408,
              retryable: true
            }
          });
        } else {
          return Promise.resolve({
            content: 'Successful chunk content',
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
          });
        }
      });

      const results = await executor.executeChunks('test context', { batchDelay: 0 });

      expect(results).toHaveLength(6);
      
      // Count successes and failures
      const successCount = results.filter(r => r.status === 'success').length;
      const failureCount = results.filter(r => r.status === 'error').length;
      
      expect(successCount).toBe(4);
      expect(failureCount).toBe(2);
      
      // Verify successful chunks have content
      results.filter(r => r.status === 'success').forEach(result => {
        expect(result.content).toBe('Successful chunk content');
        expect(result.totalTokens).toBeGreaterThan(0);
      });
      
      // Verify failed chunks have error info
      results.filter(r => r.status === 'error').forEach(result => {
        expect(result.content).toBeNull();
        expect(result.error).toBeDefined();
        expect(result.error.retryable).toBe(true);
      });
    }, 10000);

    test('should report which specific chunks failed', async () => {
      // Mock responses: chunks 1, 3, 5 fail
      let callCount = 0;
      mockApiProvider.generateCompletion.mockImplementation(() => {
        callCount++;
        const shouldFail = callCount === 1 || callCount === 3 || callCount === 5;
        
        if (shouldFail) {
          return Promise.resolve({
            content: null,
            metadata: {
              provider: 'cerebras',
              model: 'gpt-oss-120b',
              promptTokens: 0,
              responseTokens: 0,
              totalTokens: 0,
              latency: 500,
              timestamp: new Date().toISOString()
            },
            error: {
              type: 'api_error',
              message: 'API error',
              statusCode: 500,
              retryable: true
            }
          });
        } else {
          return Promise.resolve({
            content: 'Success',
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
          });
        }
      });

      const results = await executor.executeChunks('test context', { batchDelay: 0 });

      // Extract failed chunk IDs
      const failedChunkIds = results
        .filter(r => r.status === 'error')
        .map(r => r.chunkId);
      
      expect(failedChunkIds).toEqual([1, 3, 5]);
      
      // Verify successful chunk IDs
      const successChunkIds = results
        .filter(r => r.status === 'success')
        .map(r => r.chunkId);
      
      expect(successChunkIds).toEqual([2, 4, 6]);
    }, 10000);

    test('should handle all chunks failing', async () => {
      mockApiProvider.generateCompletion.mockResolvedValue({
        content: null,
        metadata: {
          provider: 'cerebras',
          model: 'gpt-oss-120b',
          promptTokens: 0,
          responseTokens: 0,
          totalTokens: 0,
          latency: 500,
          timestamp: new Date().toISOString()
        },
        error: {
          type: 'service_unavailable',
          message: 'Service unavailable',
          statusCode: 503,
          retryable: true
        }
      });

      const results = await executor.executeChunks('test context', { batchDelay: 0 });

      expect(results).toHaveLength(6);
      
      // All chunks should fail
      results.forEach(result => {
        expect(result.status).toBe('error');
        expect(result.error.type).toBe('service_unavailable');
      });
    }, 10000);

    test('should handle promise rejection in parallel execution', async () => {
      // Mock: chunks 1-3 succeed, chunk 4 rejects promise, chunks 5-6 succeed
      let callCount = 0;
      mockApiProvider.generateCompletion.mockImplementation(() => {
        callCount++;
        if (callCount === 4) {
          return Promise.reject(new Error('Network failure'));
        } else {
          return Promise.resolve({
            content: 'Success',
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
          });
        }
      });

      const results = await executor.executeChunks('test context', { batchDelay: 0 });

      expect(results).toHaveLength(6);
      
      // Chunk 4 should have error from rejected promise
      expect(results[3].status).toBe('error');
      expect(results[3].error.type).toBe('exception');
      expect(results[3].error.message).toContain('Network failure');
      
      // Other chunks should succeed
      [0, 1, 2, 4, 5].forEach(index => {
        expect(results[index].status).toBe('success');
      });
    }, 10000);

    test('should validate enrichedContext parameter', async () => {
      await expect(executor.executeChunks(null)).rejects.toThrow(
        'enrichedContext must be a non-empty string'
      );

      await expect(executor.executeChunks('')).rejects.toThrow(
        'enrichedContext must be a non-empty string'
      );

      await expect(executor.executeChunks(123)).rejects.toThrow(
        'enrichedContext must be a non-empty string'
      );
    });

    test('should pass options to all chunk executions', async () => {
      const mockResponse = {
        content: 'Test content',
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

      await executor.executeChunks('test context', {
        maxTokens: 2000,
        temperature: 0.8,
        batchDelay: 0
      });

      // Verify all 6 calls received the options
      expect(mockApiProvider.generateCompletion).toHaveBeenCalledTimes(6);
      mockApiProvider.generateCompletion.mock.calls.forEach(call => {
        expect(call[0].maxTokens).toBe(2000);
        expect(call[0].temperature).toBe(0.8);
      });
    }, 10000);
  });

  describe('createChunkExecutor', () => {
    test('should create ChunkExecutor instance', () => {
      const executor = createChunkExecutor(mockApiProvider);
      expect(executor).toBeInstanceOf(ChunkExecutor);
      expect(executor.apiProvider).toBe(mockApiProvider);
    });

    test('should throw error if apiProvider is missing', () => {
      expect(() => createChunkExecutor(null)).toThrow('apiProvider is required');
      expect(() => createChunkExecutor(undefined)).toThrow('apiProvider is required');
    });
  });

  describe('word counting', () => {
    test('should count words correctly', async () => {
      const mockResponse = {
        content: 'One two three four five',
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

      const result = await executor.executeChunk(1, 'test context');
      expect(result.wordCount).toBe(5);
    });

    test('should handle empty content', async () => {
      const mockResponse = {
        content: '',
        metadata: {
          provider: 'cerebras',
          model: 'gpt-oss-120b',
          promptTokens: 100,
          responseTokens: 0,
          totalTokens: 100,
          latency: 1000,
          timestamp: new Date().toISOString()
        },
        error: null
      };

      mockApiProvider.generateCompletion.mockResolvedValue(mockResponse);

      const result = await executor.executeChunk(1, 'test context');
      expect(result.wordCount).toBe(0);
    });
  });

  describe('enrichment toggle', () => {
    test('should use enriched context when useEnrichment is true', async () => {
      const mockResponse = {
        content: 'Test content',
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

      const enrichedContext = 'This is enriched context with interpretations';
      await executor.executeChunk(1, enrichedContext, { useEnrichment: true });

      const callArgs = mockApiProvider.generateCompletion.mock.calls[0][0];
      expect(callArgs.messages[1].content).toContain('ENRICHED CONTEXT:');
      expect(callArgs.messages[1].content).toContain(enrichedContext);
      expect(callArgs.messages[1].content).not.toContain('RAW ASSESSMENT DATA:');
    });

    test('should use raw JSON when useEnrichment is false', async () => {
      const mockResponse = {
        content: 'Test content',
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

      const rawData = {
        profile: { name: 'Test User', userType: 'Visionary' },
        normalizedScores: { strategicThinking: 85, innovation: 90 }
      };

      await executor.executeChunk(1, '', { useEnrichment: false, rawData });

      const callArgs = mockApiProvider.generateCompletion.mock.calls[0][0];
      expect(callArgs.messages[1].content).toContain('RAW ASSESSMENT DATA:');
      expect(callArgs.messages[1].content).toContain('"profile"');
      expect(callArgs.messages[1].content).toContain('"normalizedScores"');
      expect(callArgs.messages[1].content).not.toContain('ENRICHED CONTEXT:');
    });

    test('should default to enriched context when useEnrichment not specified', async () => {
      const mockResponse = {
        content: 'Test content',
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

      const enrichedContext = 'Default enriched context';
      await executor.executeChunk(1, enrichedContext);

      const callArgs = mockApiProvider.generateCompletion.mock.calls[0][0];
      expect(callArgs.messages[1].content).toContain('ENRICHED CONTEXT:');
      expect(callArgs.messages[1].content).toContain(enrichedContext);
    });

    test('should include useEnrichment flag in result metadata', async () => {
      const mockResponse = {
        content: 'Test content',
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

      const rawData = { profile: { name: 'Test' } };
      const result = await executor.executeChunk(1, '', { useEnrichment: false, rawData });

      expect(result.metadata.useEnrichment).toBe(false);
    });

    test('should validate rawData when useEnrichment is false', async () => {
      await expect(
        executor.executeChunks('', { useEnrichment: false, rawData: null, batchDelay: 0 })
      ).rejects.toThrow('rawData must be a non-empty object when useEnrichment is false');

      await expect(
        executor.executeChunks('', { useEnrichment: false, rawData: 'not an object', batchDelay: 0 })
      ).rejects.toThrow('rawData must be a non-empty object when useEnrichment is false');
    });

    test('should execute all chunks with raw JSON when useEnrichment is false', async () => {
      const mockResponse = {
        content: 'Test chunk content',
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

      const rawData = {
        profile: { name: 'Test User', userType: 'Visionary' },
        normalizedScores: { strategicThinking: 85 }
      };

      const results = await executor.executeChunks('', { useEnrichment: false, rawData, batchDelay: 0 });

      expect(results).toHaveLength(6);
      expect(mockApiProvider.generateCompletion).toHaveBeenCalledTimes(6);

      // Verify all chunks used raw JSON
      mockApiProvider.generateCompletion.mock.calls.forEach(call => {
        expect(call[0].messages[1].content).toContain('RAW ASSESSMENT DATA:');
        expect(call[0].messages[1].content).toContain('"profile"');
      });
    }, 10000);
  });

  describe('retryChunk', () => {
    test('should retry a single failed chunk', async () => {
      const mockResponse = {
        content: 'Retry successful content',
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

      const enrichedContext = 'Test enriched context';
      const result = await executor.retryChunk(3, enrichedContext);

      expect(result.chunkId).toBe(3);
      expect(result.status).toBe('success');
      expect(result.content).toBe('Retry successful content');
      expect(mockApiProvider.generateCompletion).toHaveBeenCalledTimes(1);
    });

    test('should retry with same options as original execution', async () => {
      const mockResponse = {
        content: 'Retry content',
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

      const options = {
        maxTokens: 2000,
        temperature: 0.9,
        useEnrichment: true
      };

      await executor.retryChunk(2, 'test context', options);

      const callArgs = mockApiProvider.generateCompletion.mock.calls[0][0];
      expect(callArgs.maxTokens).toBe(2000);
      expect(callArgs.temperature).toBe(0.9);
    });

    test('should retry with raw JSON when useEnrichment is false', async () => {
      const mockResponse = {
        content: 'Retry content',
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

      const rawData = {
        profile: { name: 'Test User', userType: 'Visionary' },
        normalizedScores: { strategicThinking: 85 }
      };

      await executor.retryChunk(4, '', { useEnrichment: false, rawData });

      const callArgs = mockApiProvider.generateCompletion.mock.calls[0][0];
      expect(callArgs.messages[1].content).toContain('RAW ASSESSMENT DATA:');
      expect(callArgs.messages[1].content).toContain('"profile"');
    });

    test('should handle retry failure', async () => {
      const mockResponse = {
        content: null,
        metadata: {
          provider: 'cerebras',
          model: 'gpt-oss-120b',
          promptTokens: 0,
          responseTokens: 0,
          totalTokens: 0,
          latency: 500,
          timestamp: new Date().toISOString()
        },
        error: {
          type: 'rate_limit',
          message: 'Rate limit still exceeded',
          statusCode: 429,
          retryable: true
        }
      };

      mockApiProvider.generateCompletion.mockResolvedValue(mockResponse);

      const result = await executor.retryChunk(5, 'test context');

      expect(result.status).toBe('error');
      expect(result.error.type).toBe('rate_limit');
      expect(result.error.retryable).toBe(true);
    });

    test('should validate chunk ID on retry', async () => {
      const result = await executor.retryChunk(0, 'test context');

      expect(result.status).toBe('error');
      expect(result.error.type).toBe('validation');
      expect(result.error.message).toContain('Invalid chunk ID');
    });

    test('should allow retrying any chunk ID from 1 to 6', async () => {
      const mockResponse = {
        content: 'Success',
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

      // Retry each chunk ID
      for (let chunkId = 1; chunkId <= 6; chunkId++) {
        const result = await executor.retryChunk(chunkId, 'test context');
        expect(result.chunkId).toBe(chunkId);
        expect(result.status).toBe('success');
      }

      expect(mockApiProvider.generateCompletion).toHaveBeenCalledTimes(6);
    });
  });
});
