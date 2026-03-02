/**
 * API Provider Abstraction Layer
 * Unified interface for OpenRouter and Hugging Face APIs
 */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class APIProvider {
  constructor(config) {
    this.provider = config.provider;
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.timeout = config.timeout || 30000;
  }

  async generateCompletion(params) {
    const { messages, model, maxTokens, temperature } = params;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        content: null,
        metadata: null,
        error: {
          type: 'validation',
          message: 'Invalid parameters: messages array is required and must not be empty'
        }
      };
    }

    const startTime = Date.now();
    const requestModel = model || this.model;
    const requestMaxTokens = maxTokens ?? 1500;
    const requestTemperature = temperature ?? 0.7;

    const retryDelays = [1000, 2000, 4000];
    let lastError = null;

    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
      try {
        const result = await this._makeRequest({
          model: requestModel,
          messages,
          max_tokens: requestMaxTokens,
          temperature: requestTemperature
        }, startTime);

        return result;

      } catch (error) {
        lastError = error;
        const shouldRetry = this._shouldRetry(error, attempt);
        
        if (shouldRetry && attempt < retryDelays.length) {
          const delay = retryDelays[attempt];
          await sleep(delay);
          continue;
        }

        break;
      }
    }

    const latency = Date.now() - startTime;
    return {
      content: null,
      metadata: {
        provider: this.provider,
        model: requestModel,
        latency,
        timestamp: new Date().toISOString(),
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0
      },
      error: lastError
    };
  }

  async _makeRequest(requestBody, startTime) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this._createError(response.status, errorData);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;
      const content = data.choices?.[0]?.message?.content || '';
      const usage = data.usage || {};

      return {
        content,
        metadata: {
          provider: this.provider,
          model: requestBody.model,
          latency,
          timestamp: new Date().toISOString(),
          promptTokens: usage.prompt_tokens || 0,
          responseTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0
        },
        error: null
      };

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw {
          type: 'timeout',
          message: `Request timed out after ${this.timeout}ms`,
          statusCode: 0,
          retryable: false
        };
      }

      if (error.message && error.message.includes('fetch')) {
        throw {
          type: 'network',
          message: 'Network error: Unable to connect to the API',
          statusCode: 0,
          retryable: false
        };
      }

      if (error.type) {
        throw error;
      }

      throw {
        type: 'unknown',
        message: `Unexpected error: ${error.message || 'Unknown error occurred'}`,
        statusCode: 0,
        retryable: false
      };
    }
  }

  _createError(statusCode, errorData) {
    const errorMessage = errorData.error?.message || errorData.message || 'Unknown error';

    switch (statusCode) {
      case 429:
        return {
          type: 'rate_limit',
          message: `Rate limit exceeded: ${errorMessage}`,
          statusCode,
          retryable: true
        };

      case 401:
        return {
          type: 'authentication',
          message: `Authentication failed: Invalid API key for ${this.provider}`,
          statusCode,
          retryable: false
        };

      case 403:
        return {
          type: 'authorization',
          message: `Authorization failed for ${this.provider}`,
          statusCode,
          retryable: false
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: 'server_error',
          message: `Server error (${statusCode}): ${errorMessage}`,
          statusCode,
          retryable: true
        };

      default:
        return {
          type: 'api_error',
          message: `API error (${statusCode}): ${errorMessage}`,
          statusCode,
          retryable: false
        };
    }
  }

  _shouldRetry(error, attempt) {
    if (attempt >= 3) {
      return false;
    }
    return error.retryable === true;
  }
}

export function createOpenRouterProvider() {
  return new APIProvider({
    provider: 'openrouter',
    endpoint: process.env.NEXT_PUBLIC_OPENROUTER_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
    model: process.env.NEXT_PUBLIC_OPENROUTER_MODEL || 'openrouter/free',
    timeout: 30000
  });
}

export function createHuggingFaceProvider() {
  return new APIProvider({
    provider: 'huggingface',
    endpoint: process.env.NEXT_PUBLIC_HUGGINGFACE_ENDPOINT || 'https://router.huggingface.co/v1/chat/completions',
    apiKey: process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || '',
    model: process.env.NEXT_PUBLIC_HUGGINGFACE_MODEL || 'openai/gpt-oss-20b',
    timeout: 30000
  });
}

export function createMoonshotProvider() {
  return new APIProvider({
    provider: 'moonshot',
    endpoint: process.env.NEXT_PUBLIC_MOONSHOT_ENDPOINT || 'https://api.moonshot.cn/v1/chat/completions',
    apiKey: process.env.NEXT_PUBLIC_MOONSHOT_API_KEY || '',
    model: process.env.NEXT_PUBLIC_MOONSHOT_MODEL || 'moonshot-v1-128k',
    timeout: 30000
  });
}
