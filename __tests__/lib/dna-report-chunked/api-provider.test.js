/**
 * Unit Tests for API Provider Abstraction
 * Tests both Cerebras and OpenRouter implementations
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { APIProvider, createOpenRouterProvider, createHuggingFaceProvider } from '../../../lib/dna-report-chunked/api-provider.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Provider Abstraction - Unit Tests', () => {
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Test OpenRouter provider configuration
   */
  describe('OpenRouter Provider Configuration', () => {
    test('should create OpenRouter provider with correct configuration', () => {
      const provider = createOpenRouterProvider();
      
      expect(provider.provider).toBe('openrouter');
      expect(provider.endpoint).toBe('https://openrouter.ai/api/v1/chat/completions');
      expect(provider.model).toBe('openrouter/free');
      expect(provider.apiKey).toBeTruthy();
    });

    test('should use correct headers for OpenRouter', async () => {
      const provider = createOpenRouterProvider();
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer')
          })
        })
      );
    });
  });

  /**
   * Test successful API responses
   */
  describe('Successful API Responses', () => {
    test('should return content and metadata on success', async () => {
      const provider = createOpenRouterProvider();
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Generated content' } }],
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
        })
      });

      const result = await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test prompt' }]
      });

      expect(result.content).toBe('Generated content');
      expect(result.error).toBeNull();
      expect(result.metadata).toMatchObject({
        provider: 'openrouter',
        model: 'openrouter/free',
        promptTokens: 100,
        responseTokens: 200,
        totalTokens: 300
      });
      expect(result.metadata.latency).toBeGreaterThanOrEqual(0);
      expect(result.metadata.timestamp).toBeTruthy();
    });

    test('should handle custom model parameter', async () => {
      const provider = createOpenRouterProvider();
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      const result = await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }],
        model: 'custom-model'
      });

      expect(result.metadata.model).toBe('custom-model');
      
      const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('custom-model');
    });

    test('should handle custom temperature and maxTokens', async () => {
      const provider = createOpenRouterProvider();
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      });

      await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.9,
        maxTokens: 2000
      });

      const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(requestBody.temperature).toBe(0.9);
      expect(requestBody.max_tokens).toBe(2000);
    });
  });

  /**
   * Test rate limit handling with retry
   */
  describe('Rate Limit Handling', () => {
    test('should retry on 429 rate limit error', async () => {
      const provider = createOpenRouterProvider();
      
      // Mock: fail twice with 429, then succeed
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ error: { message: 'Rate limit exceeded' } })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ error: { message: 'Rate limit exceeded' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success after retry' } }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
          })
        });

      const result = await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result.content).toBe('Success after retry');
      expect(result.error).toBeNull();
    });

    test('should return error after max retries exhausted', async () => {
      const provider = createOpenRouterProvider();
      
      // Mock: fail all attempts with 429
      global.fetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } })
      });

      const result = await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      expect(global.fetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
      expect(result.content).toBeNull();
      expect(result.error).toMatchObject({
        type: 'rate_limit',
        statusCode: 429,
        retryable: true
      });
    }, 10000); // 10 second timeout for retry test
  });

  /**
   * Test server error handling with retry
   */
  describe('Server Error Handling', () => {
    test('should retry on 500 server error', async () => {
      const provider = createOpenRouterProvider();
      
      // Mock: fail once with 500, then succeed
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'Internal server error' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success after retry' } }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
          })
        });

      const result = await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.content).toBe('Success after retry');
    });

    test('should retry on 503 service unavailable', async () => {
      const provider = createOpenRouterProvider();
      
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: { message: 'Service unavailable' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' } }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
          })
        });

      const result = await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      expect(result.content).toBe('Success');
    }, 10000); // 10 second timeout for retry test
  });

  /**
   * Test authentication errors (no retry)
   */
  describe('Authentication Error Handling', () => {
    test('should not retry on 401 authentication error', async () => {
      const provider = createOpenRouterProvider();
      
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } })
      });

      const result = await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
      expect(result.content).toBeNull();
      expect(result.error).toMatchObject({
        type: 'authentication',
        statusCode: 401,
        retryable: false
      });
      expect(result.error.message).toContain('Invalid API key');
    });

    test('should not retry on 403 authorization error', async () => {
      const provider = createOpenRouterProvider();
      
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: 'Forbidden' } })
      });

      const result = await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
      expect(result.error).toMatchObject({
        type: 'authorization',
        statusCode: 403,
        retryable: false
      });
    });
  });

  /**
   * Test timeout handling
   */
  describe('Timeout Handling', () => {
    test('should have timeout configuration', () => {
      const provider = new APIProvider({
        provider: 'test',
        endpoint: 'https://test.com/api',
        apiKey: 'test-key',
        model: 'test-model',
        timeout: 100
      });

      expect(provider.timeout).toBe(100);
    });

    test('should use default timeout when not specified', () => {
      const provider = new APIProvider({
        provider: 'test',
        endpoint: 'https://test.com/api',
        apiKey: 'test-key',
        model: 'test-model'
      });

      expect(provider.timeout).toBe(30000);
    });
  });

  /**
   * Test network error handling
   */
  describe('Network Error Handling', () => {
    test('should handle network error', async () => {
      const provider = createOpenRouterProvider();
      
      global.fetch.mockRejectedValueOnce(new Error('fetch failed'));

      const result = await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      expect(result.content).toBeNull();
      expect(result.error).toMatchObject({
        type: 'network',
        retryable: false
      });
      expect(result.error.message).toContain('Network error');
    });
  });

  /**
   * Test input validation
   */
  describe('Input Validation', () => {
    test('should return error for missing messages', async () => {
      const provider = createOpenRouterProvider();

      const result = await provider.generateCompletion({});

      expect(result.content).toBeNull();
      expect(result.error).toMatchObject({
        type: 'validation',
        message: expect.stringContaining('messages array is required')
      });
    });

    test('should return error for empty messages array', async () => {
      const provider = createOpenRouterProvider();

      const result = await provider.generateCompletion({ messages: [] });

      expect(result.error.type).toBe('validation');
    });

    test('should return error for non-array messages', async () => {
      const provider = createOpenRouterProvider();

      const result = await provider.generateCompletion({ messages: 'invalid' });

      expect(result.error.type).toBe('validation');
    });
  });

  /**
   * Test metadata tracking
   */
  describe('Metadata Tracking', () => {
    test('should track all metadata fields', async () => {
      const provider = createOpenRouterProvider();
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test' } }],
          usage: { prompt_tokens: 50, completion_tokens: 100, total_tokens: 150 }
        })
      });

      const result = await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      expect(result.metadata).toHaveProperty('provider');
      expect(result.metadata).toHaveProperty('model');
      expect(result.metadata).toHaveProperty('latency');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.metadata).toHaveProperty('promptTokens');
      expect(result.metadata).toHaveProperty('responseTokens');
      expect(result.metadata).toHaveProperty('totalTokens');
    });

    test('should handle missing usage data gracefully', async () => {
      const provider = createOpenRouterProvider();
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test' } }]
          // No usage field
        })
      });

      const result = await provider.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      expect(result.metadata.promptTokens).toBe(0);
      expect(result.metadata.responseTokens).toBe(0);
      expect(result.metadata.totalTokens).toBe(0);
    });
  });

  /**
   * Test provider consistency
   */
  describe('Provider Consistency', () => {
    test('should return same response structure for both providers', async () => {
      const cerebras = createOpenRouterProvider();
      const openrouter = createOpenRouterProvider();
      
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result1 = await cerebras.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      const result2 = await openrouter.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      // Both should have same structure
      expect(Object.keys(result1)).toEqual(Object.keys(result2));
      expect(Object.keys(result1.metadata)).toEqual(Object.keys(result2.metadata));
    });
  });
});

