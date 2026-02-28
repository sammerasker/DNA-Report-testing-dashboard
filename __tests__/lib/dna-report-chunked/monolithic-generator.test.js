/**
 * Unit tests for Monolithic Report Generator
 * 
 * Tests single-call report generation using the original monolithic prompt
 * and verifies quality metrics calculation.
 */

import { createMonolithicGenerator } from '../../../lib/dna-report-chunked/monolithic-generator';

// Mock API provider
class MockAPIProvider {
  constructor(mockResponse) {
    this.mockResponse = mockResponse;
    this.callCount = 0;
    this.lastRequest = null;
  }

  async generateCompletion(params) {
    this.callCount++;
    this.lastRequest = params;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return this.mockResponse;
  }
}

describe('MonolithicGenerator', () => {
  describe('Single-call generation', () => {
    test('should generate complete report in single API call', async () => {
      const mockContent = `# EXECUTIVE OVERVIEW
This is a comprehensive entrepreneurial DNA report.

# COGNITIVE & STRATEGIC CAPABILITIES
Strong analytical thinking and strategic vision.

# LEADERSHIP & INFLUENCE
Natural leadership abilities with strong influence.

# EXECUTION & OPERATIONAL EXCELLENCE
Excellent execution capabilities.

# EMOTIONAL INTELLIGENCE & RELATIONSHIPS
High emotional intelligence and relationship building.

# RISK PROFILE & RESILIENCE
Balanced risk tolerance with strong resilience.

# MOTIVATION & VALUES ALIGNMENT
Intrinsically motivated with clear values.

# OPTIMAL ROLES & ENVIRONMENTS
Best suited for CEO or Founder roles.

# STRATEGIC DEVELOPMENT PLAN
Focus on scaling leadership capabilities.

# ACTIONABLE RECOMMENDATIONS
1. Build strategic partnerships
2. Develop team leadership skills`;

      const mockProvider = new MockAPIProvider({
        content: mockContent,
        metadata: {
          promptTokens: 500,
          responseTokens: 1500,
          totalTokens: 2000,
          latency: 2000
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const assessmentData = {
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
          userType: 'Visionary Entrepreneur'
        },
        scores: {
          strategicThinking: 85,
          innovation: 90,
          execution: 75
        },
        rolesTop: [
          { role: 'CEO', score: 92 },
          { role: 'Founder', score: 88 }
        ]
      };

      const result = await generator.generateReport(assessmentData);

      // Verify single API call
      expect(mockProvider.callCount).toBe(1);
      
      // Verify result structure
      expect(result.status).toBe('success');
      expect(result.content).toBe(mockContent);
      expect(result.totalTokens).toBe(2000);
      expect(result.promptTokens).toBe(500);
      expect(result.responseTokens).toBe(1500);
      expect(result.latency).toBeGreaterThan(0);
    });

    test('should include user name and type in prompt', async () => {
      const mockProvider = new MockAPIProvider({
        content: 'Test report',
        metadata: {
          promptTokens: 100,
          responseTokens: 200,
          totalTokens: 300
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const assessmentData = {
        profile: {
          name: 'Jane Smith',
          userType: 'Technical Founder'
        },
        scores: {},
        rolesTop: []
      };

      await generator.generateReport(assessmentData);

      // Verify prompt includes user details
      const messages = mockProvider.lastRequest.messages;
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toContain('Jane');
      expect(messages[1].content).toContain('Technical Founder');
    });

    test('should include trait scores in prompt', async () => {
      const mockProvider = new MockAPIProvider({
        content: 'Test report',
        metadata: {
          promptTokens: 100,
          responseTokens: 200,
          totalTokens: 300
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const assessmentData = {
        profile: { name: 'Test User' },
        scores: {
          strategicThinking: 85,
          innovation: 90,
          execution: 75
        },
        rolesTop: []
      };

      await generator.generateReport(assessmentData);

      // Verify prompt includes scores
      const userMessage = mockProvider.lastRequest.messages[1].content;
      expect(userMessage).toContain('strategicThinking: 85');
      expect(userMessage).toContain('innovation: 90');
      expect(userMessage).toContain('execution: 75');
    });

    test('should include role matches in prompt', async () => {
      const mockProvider = new MockAPIProvider({
        content: 'Test report',
        metadata: {
          promptTokens: 100,
          responseTokens: 200,
          totalTokens: 300
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const assessmentData = {
        profile: { name: 'Test User' },
        scores: {},
        rolesTop: [
          { role: 'CEO', score: 92 },
          { role: 'CTO', score: 88 }
        ]
      };

      await generator.generateReport(assessmentData);

      // Verify prompt includes roles
      const userMessage = mockProvider.lastRequest.messages[1].content;
      expect(userMessage).toContain('CEO (92% match)');
      expect(userMessage).toContain('CTO (88% match)');
    });
  });

  describe('API provider configuration', () => {
    test('should work with Cerebras provider configuration', async () => {
      const mockProvider = new MockAPIProvider({
        content: 'Cerebras report',
        metadata: {
          provider: 'cerebras',
          model: 'gpt-oss-120b',
          promptTokens: 500,
          responseTokens: 1500,
          totalTokens: 2000
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const result = await generator.generateReport({
        profile: { name: 'Test' },
        scores: {},
        rolesTop: []
      });

      expect(result.status).toBe('success');
      expect(result.content).toBe('Cerebras report');
    });

    test('should work with OpenRouter provider configuration', async () => {
      const mockProvider = new MockAPIProvider({
        content: 'OpenRouter report',
        metadata: {
          provider: 'openrouter',
          model: 'openrouter/free',
          promptTokens: 500,
          responseTokens: 1500,
          totalTokens: 2000
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const result = await generator.generateReport({
        profile: { name: 'Test' },
        scores: {},
        rolesTop: []
      });

      expect(result.status).toBe('success');
      expect(result.content).toBe('OpenRouter report');
    });

    test('should respect custom maxTokens parameter', async () => {
      const mockProvider = new MockAPIProvider({
        content: 'Test report',
        metadata: {
          promptTokens: 100,
          responseTokens: 200,
          totalTokens: 300
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      await generator.generateReport(
        { profile: { name: 'Test' }, scores: {}, rolesTop: [] },
        { maxTokens: 5000 }
      );

      expect(mockProvider.lastRequest.maxTokens).toBe(5000);
    });

    test('should respect custom temperature parameter', async () => {
      const mockProvider = new MockAPIProvider({
        content: 'Test report',
        metadata: {
          promptTokens: 100,
          responseTokens: 200,
          totalTokens: 300
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      await generator.generateReport(
        { profile: { name: 'Test' }, scores: {}, rolesTop: [] },
        { temperature: 0.9 }
      );

      expect(mockProvider.lastRequest.temperature).toBe(0.9);
    });

    test('should use default parameters when not specified', async () => {
      const mockProvider = new MockAPIProvider({
        content: 'Test report',
        metadata: {
          promptTokens: 100,
          responseTokens: 200,
          totalTokens: 300
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      await generator.generateReport({
        profile: { name: 'Test' },
        scores: {},
        rolesTop: []
      });

      expect(mockProvider.lastRequest.maxTokens).toBe(4000);
      expect(mockProvider.lastRequest.temperature).toBe(0.7);
    });
  });

  describe('Error handling', () => {
    test('should handle API errors gracefully', async () => {
      const mockProvider = new MockAPIProvider({
        content: null,
        metadata: null,
        error: {
          type: 'rate_limit',
          message: 'Rate limit exceeded'
        }
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const result = await generator.generateReport({
        profile: { name: 'Test' },
        scores: {},
        rolesTop: []
      });

      expect(result.status).toBe('error');
      expect(result.content).toBe('');
      expect(result.totalTokens).toBe(0);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Rate limit exceeded');
    });

    test('should handle timeout errors', async () => {
      const mockProvider = new MockAPIProvider({
        content: null,
        metadata: null,
        error: {
          type: 'timeout',
          message: 'Request timed out'
        }
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const result = await generator.generateReport({
        profile: { name: 'Test' },
        scores: {},
        rolesTop: []
      });

      expect(result.status).toBe('error');
      expect(result.error.message).toContain('Request timed out');
    });

    test('should handle network errors', async () => {
      const mockProvider = new MockAPIProvider({
        content: null,
        metadata: null,
        error: {
          type: 'network',
          message: 'Network error'
        }
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const result = await generator.generateReport({
        profile: { name: 'Test' },
        scores: {},
        rolesTop: []
      });

      expect(result.status).toBe('error');
      expect(result.error.message).toContain('Network error');
    });

    test('should handle missing assessment data gracefully', async () => {
      const mockProvider = new MockAPIProvider({
        content: 'Test report',
        metadata: {
          promptTokens: 100,
          responseTokens: 200,
          totalTokens: 300
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      // Test with minimal data
      const result = await generator.generateReport({});

      expect(result.status).toBe('success');
      expect(mockProvider.callCount).toBe(1);
    });
  });

  describe('Quality metrics compatibility', () => {
    test('should generate report compatible with quality metrics calculation', async () => {
      const mockContent = `# EXECUTIVE OVERVIEW
Comprehensive analysis of strategic thinking, innovation, and vision capabilities.

# COGNITIVE & STRATEGIC CAPABILITIES
Strong strategic thinking (85) and innovation (90) scores indicate excellent cognitive abilities.

# LEADERSHIP & INFLUENCE
Leadership and influence are key strengths in the Cognitive & Vision domain.

# EXECUTION & OPERATIONAL EXCELLENCE
Execution capabilities support the Execution & Discipline domain.

# EMOTIONAL INTELLIGENCE & RELATIONSHIPS
Social & Influence domain shows strong emotional intelligence.

# RISK PROFILE & RESILIENCE
Resilience & Drive domain demonstrates balanced risk tolerance.

# MOTIVATION & VALUES ALIGNMENT
Visionary Entrepreneur profile aligns with intrinsic motivation.

# OPTIMAL ROLES & ENVIRONMENTS
CEO and Founder roles are optimal matches.

# STRATEGIC DEVELOPMENT PLAN
Development plan focuses on scaling capabilities.

# ACTIONABLE RECOMMENDATIONS
1. Build strategic partnerships
2. Develop team leadership skills`;

      const mockProvider = new MockAPIProvider({
        content: mockContent,
        metadata: {
          promptTokens: 500,
          responseTokens: 1500,
          totalTokens: 2000
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const result = await generator.generateReport({
        profile: {
          name: 'Test User',
          userType: 'Visionary Entrepreneur'
        },
        scores: {
          strategicThinking: 85,
          innovation: 90
        },
        rolesTop: []
      });

      // Verify report contains expected sections
      expect(result.content).toContain('EXECUTIVE OVERVIEW');
      expect(result.content).toContain('COGNITIVE & STRATEGIC CAPABILITIES');
      expect(result.content).toContain('LEADERSHIP & INFLUENCE');
      expect(result.content).toContain('EXECUTION & OPERATIONAL EXCELLENCE');
      expect(result.content).toContain('EMOTIONAL INTELLIGENCE & RELATIONSHIPS');
      expect(result.content).toContain('RISK PROFILE & RESILIENCE');
      expect(result.content).toContain('MOTIVATION & VALUES ALIGNMENT');
      expect(result.content).toContain('OPTIMAL ROLES & ENVIRONMENTS');
      expect(result.content).toContain('STRATEGIC DEVELOPMENT PLAN');
      expect(result.content).toContain('ACTIONABLE RECOMMENDATIONS');
      
      // Verify report contains trait references
      expect(result.content).toContain('strategic thinking');
      expect(result.content).toContain('innovation');
      
      // Verify report contains domain references
      expect(result.content).toContain('Cognitive & Vision');
      expect(result.content).toContain('Execution & Discipline');
      expect(result.content).toContain('Social & Influence');
      expect(result.content).toContain('Resilience & Drive');
      
      // Verify report contains user type references
      expect(result.content).toContain('Visionary Entrepreneur');
    });
  });

  describe('Performance tracking', () => {
    test('should track latency for successful generation', async () => {
      const mockProvider = new MockAPIProvider({
        content: 'Test report',
        metadata: {
          promptTokens: 500,
          responseTokens: 1500,
          totalTokens: 2000,
          latency: 2500
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const result = await generator.generateReport({
        profile: { name: 'Test' },
        scores: {},
        rolesTop: []
      });

      expect(result.latency).toBeGreaterThan(0);
      expect(typeof result.latency).toBe('number');
    });

    test('should track latency for failed generation', async () => {
      const mockProvider = new MockAPIProvider({
        content: null,
        metadata: null,
        error: {
          type: 'api_error',
          message: 'API error'
        }
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const result = await generator.generateReport({
        profile: { name: 'Test' },
        scores: {},
        rolesTop: []
      });

      expect(result.latency).toBeGreaterThan(0);
      expect(result.status).toBe('error');
    });

    test('should track token usage accurately', async () => {
      const mockProvider = new MockAPIProvider({
        content: 'Test report',
        metadata: {
          promptTokens: 750,
          responseTokens: 2250,
          totalTokens: 3000
        },
        error: null
      });

      const generator = createMonolithicGenerator(mockProvider);
      
      const result = await generator.generateReport({
        profile: { name: 'Test' },
        scores: {},
        rolesTop: []
      });

      expect(result.promptTokens).toBe(750);
      expect(result.responseTokens).toBe(2250);
      expect(result.totalTokens).toBe(3000);
    });
  });
});
