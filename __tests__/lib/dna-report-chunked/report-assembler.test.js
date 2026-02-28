/**
 * @fileoverview Unit tests for ReportAssembler
 * Tests specific scenarios and edge cases
 */

import ReportAssembler from '../../../lib/dna-report-chunked/report-assembler.js';

describe('ReportAssembler - Unit Tests', () => {
  let assembler;

  beforeEach(() => {
    assembler = new ReportAssembler();
  });

  describe('assembleReport', () => {
    const mockUserProfile = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      userType: 'Visionary Entrepreneur'
    };

    it('should assemble report with all 6 chunks present', () => {
      const chunks = [
        { chunkId: 1, content: 'Executive overview content', success: true },
        { chunkId: 2, content: 'Leadership content', success: true },
        { chunkId: 3, content: 'Emotional intelligence content', success: true },
        { chunkId: 4, content: 'Motivation content', success: true },
        { chunkId: 5, content: 'Development plan content', success: true },
        { chunkId: 6, content: 'Recommendations content', success: true }
      ];

      const report = assembler.assembleReport(chunks, mockUserProfile);

      // Verify document header
      expect(report).toContain('# DNA Leadership Assessment Report');
      expect(report).toContain('**Name:** John Doe');
      expect(report).toContain('**Email:** john.doe@example.com');
      expect(report).toContain('**Profile Type:** Visionary Entrepreneur');

      // Verify all section headers
      expect(report).toContain('## Executive Overview & Cognitive Capabilities');
      expect(report).toContain('## Leadership & Execution Excellence');
      expect(report).toContain('## Emotional Intelligence & Resilience');
      expect(report).toContain('## Motivation & Optimal Environments');
      expect(report).toContain('## Strategic Development Plan');
      expect(report).toContain('## Actionable Recommendations');

      // Verify all content
      expect(report).toContain('Executive overview content');
      expect(report).toContain('Leadership content');
      expect(report).toContain('Emotional intelligence content');
      expect(report).toContain('Motivation content');
      expect(report).toContain('Development plan content');
      expect(report).toContain('Recommendations content');
    });

    it('should handle missing chunks with placeholders', () => {
      const chunks = [
        { chunkId: 1, content: 'Executive overview content', success: true },
        { chunkId: 2, content: '', success: false, error: 'API timeout' },
        { chunkId: 3, content: 'Emotional intelligence content', success: true },
        { chunkId: 4, content: '', success: false },
        { chunkId: 5, content: 'Development plan content', success: true },
        { chunkId: 6, content: 'Recommendations content', success: true }
      ];

      const report = assembler.assembleReport(chunks, mockUserProfile);

      // Verify successful chunks are present
      expect(report).toContain('Executive overview content');
      expect(report).toContain('Emotional intelligence content');
      expect(report).toContain('Development plan content');
      expect(report).toContain('Recommendations content');

      // Verify placeholders for failed chunks
      expect(report).toContain('[Content for this section is currently unavailable]');
      expect(report).toContain('*Error: API timeout*');
    });

    it('should handle chunks in random order', () => {
      const chunks = [
        { chunkId: 4, content: 'Chunk 4', success: true },
        { chunkId: 1, content: 'Chunk 1', success: true },
        { chunkId: 6, content: 'Chunk 6', success: true },
        { chunkId: 2, content: 'Chunk 2', success: true },
        { chunkId: 5, content: 'Chunk 5', success: true },
        { chunkId: 3, content: 'Chunk 3', success: true }
      ];

      const report = assembler.assembleReport(chunks, mockUserProfile);

      // Verify chunks appear in correct order
      const chunk1Pos = report.indexOf('Chunk 1');
      const chunk2Pos = report.indexOf('Chunk 2');
      const chunk3Pos = report.indexOf('Chunk 3');
      const chunk4Pos = report.indexOf('Chunk 4');
      const chunk5Pos = report.indexOf('Chunk 5');
      const chunk6Pos = report.indexOf('Chunk 6');

      expect(chunk1Pos).toBeLessThan(chunk2Pos);
      expect(chunk2Pos).toBeLessThan(chunk3Pos);
      expect(chunk3Pos).toBeLessThan(chunk4Pos);
      expect(chunk4Pos).toBeLessThan(chunk5Pos);
      expect(chunk5Pos).toBeLessThan(chunk6Pos);
    });

    it('should handle missing user profile gracefully', () => {
      const chunks = [
        { chunkId: 1, content: 'Content', success: true }
      ];

      const report = assembler.assembleReport(chunks, null);

      expect(report).toContain('# DNA Leadership Assessment Report');
      expect(report).toContain('**Name:** N/A');
      expect(report).toContain('**Email:** N/A');
      expect(report).toContain('**Profile Type:** N/A');
    });

    it('should handle partial user profile', () => {
      const partialProfile = {
        name: 'Jane Smith'
        // email and userType missing
      };

      const chunks = [
        { chunkId: 1, content: 'Content', success: true }
      ];

      const report = assembler.assembleReport(chunks, partialProfile);

      expect(report).toContain('**Name:** Jane Smith');
      expect(report).toContain('**Email:** N/A');
      expect(report).toContain('**Profile Type:** N/A');
    });

    it('should throw error for invalid chunks input', () => {
      expect(() => {
        assembler.assembleReport('not an array', mockUserProfile);
      }).toThrow('Chunks must be an array');
    });
  });

  describe('normalizeFormatting', () => {
    it('should normalize excessive newlines', () => {
      const content = 'Paragraph 1\n\n\n\n\nParagraph 2';
      const normalized = assembler.normalizeFormatting(content);

      expect(normalized).toBe('Paragraph 1\n\nParagraph 2');
      expect(normalized).not.toMatch(/\n{3,}/);
    });

    it('should remove duplicate section headers', () => {
      const content = '## Executive Overview & Cognitive Capabilities\n\nSome content here';
      const normalized = assembler.normalizeFormatting(content);

      expect(normalized).not.toContain('## Executive Overview & Cognitive Capabilities');
      expect(normalized).toContain('Some content here');
    });

    it('should sanitize script tags', () => {
      const content = 'Safe content <script>alert("xss")</script> more content';
      const normalized = assembler.normalizeFormatting(content);

      expect(normalized).not.toContain('<script>');
      expect(normalized).not.toContain('</script>');
      expect(normalized).toContain('Safe content');
      expect(normalized).toContain('more content');
    });

    it('should sanitize style tags', () => {
      const content = 'Content <style>body { display: none; }</style> more';
      const normalized = assembler.normalizeFormatting(content);

      expect(normalized).not.toContain('<style>');
      expect(normalized).not.toContain('</style>');
      expect(normalized).toContain('Content');
      expect(normalized).toContain('more');
    });

    it('should trim leading and trailing whitespace', () => {
      const content = '   \n\n  Content here  \n\n   ';
      const normalized = assembler.normalizeFormatting(content);

      expect(normalized).toBe('Content here');
    });

    it('should handle empty string', () => {
      const normalized = assembler.normalizeFormatting('');
      expect(normalized).toBe('');
    });

    it('should handle null', () => {
      const normalized = assembler.normalizeFormatting(null);
      expect(normalized).toBe('');
    });

    it('should handle undefined', () => {
      const normalized = assembler.normalizeFormatting(undefined);
      expect(normalized).toBe('');
    });

    it('should handle non-string input', () => {
      const normalized = assembler.normalizeFormatting(123);
      expect(normalized).toBe('');
    });
  });

  describe('insertHeaders', () => {
    it('should insert header for chunk 1', () => {
      const content = 'Executive overview content';
      const result = assembler.insertHeaders(content, 1);

      expect(result).toContain('## Executive Overview & Cognitive Capabilities');
      expect(result).toContain('Executive overview content');
    });

    it('should not duplicate header if already present', () => {
      const content = '## Executive Overview & Cognitive Capabilities\n\nContent';
      const result = assembler.insertHeaders(content, 1);

      const headerCount = (result.match(/## Executive Overview & Cognitive Capabilities/g) || []).length;
      expect(headerCount).toBe(1);
    });

    it('should handle all chunk IDs', () => {
      const chunkIds = [1, 2, 3, 4, 5, 6];
      const expectedHeaders = [
        '## Executive Overview & Cognitive Capabilities',
        '## Leadership & Execution Excellence',
        '## Emotional Intelligence & Resilience',
        '## Motivation & Optimal Environments',
        '## Strategic Development Plan',
        '## Actionable Recommendations'
      ];

      chunkIds.forEach((id, index) => {
        const result = assembler.insertHeaders('Content', id);
        expect(result).toContain(expectedHeaders[index]);
      });
    });

    it('should handle invalid chunk ID gracefully', () => {
      const content = 'Some content';
      const result = assembler.insertHeaders(content, 99);

      expect(result).toBe(content);
    });
  });

  describe('_createDocumentHeader', () => {
    it('should create header with full user profile', () => {
      const userProfile = {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        userType: 'Strategic Leader'
      };

      const header = assembler._createDocumentHeader(userProfile);

      expect(header).toContain('# DNA Leadership Assessment Report');
      expect(header).toContain('**Name:** Alice Johnson');
      expect(header).toContain('**Email:** alice@example.com');
      expect(header).toContain('**Profile Type:** Strategic Leader');
      expect(header).toContain('**Generated:**');
    });

    it('should handle null user profile', () => {
      const header = assembler._createDocumentHeader(null);

      expect(header).toContain('# DNA Leadership Assessment Report');
      expect(header).toContain('---');
    });
  });

  describe('_getSectionHeader', () => {
    it('should return correct headers for all chunk IDs', () => {
      expect(assembler._getSectionHeader(1)).toBe('## Executive Overview & Cognitive Capabilities');
      expect(assembler._getSectionHeader(2)).toBe('## Leadership & Execution Excellence');
      expect(assembler._getSectionHeader(3)).toBe('## Emotional Intelligence & Resilience');
      expect(assembler._getSectionHeader(4)).toBe('## Motivation & Optimal Environments');
      expect(assembler._getSectionHeader(5)).toBe('## Strategic Development Plan');
      expect(assembler._getSectionHeader(6)).toBe('## Actionable Recommendations');
    });

    it('should return empty string for invalid chunk ID', () => {
      expect(assembler._getSectionHeader(0)).toBe('');
      expect(assembler._getSectionHeader(7)).toBe('');
      expect(assembler._getSectionHeader(null)).toBe('');
    });
  });

  describe('_createPlaceholder', () => {
    it('should create placeholder with error message', () => {
      const placeholder = assembler._createPlaceholder(2, 'Connection timeout');

      expect(placeholder).toContain('## Leadership & Execution Excellence');
      expect(placeholder).toContain('[Content for this section is currently unavailable]');
      expect(placeholder).toContain('*Error: Connection timeout*');
    });

    it('should create placeholder without error message', () => {
      const placeholder = assembler._createPlaceholder(3);

      expect(placeholder).toContain('## Emotional Intelligence & Resilience');
      expect(placeholder).toContain('[Content for this section is currently unavailable]');
      expect(placeholder).not.toContain('*Error:');
    });
  });
});
