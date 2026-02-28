/**
 * @fileoverview Property-based tests for ReportAssembler
 * Tests universal properties that should hold for all valid inputs
 */

import fc from 'fast-check';
import ReportAssembler from '../../../lib/dna-report-chunked/report-assembler.js';

describe('ReportAssembler - Property Tests', () => {
  let assembler;

  beforeEach(() => {
    assembler = new ReportAssembler();
  });

  /**
   * Property 23: Sequential Assembly Order
   * Validates: Requirements 8.3, 10.1
   * Verify chunks appear in order 1-2-3-4-5-6 in assembled report
   */
  describe('Property 23: Sequential Assembly Order', () => {
    it('should assemble chunks in sequential order 1-2-3-4-5-6', () => {
      fc.assert(
        fc.property(
          // Generate array of 6 chunks with random content
          fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 6, maxLength: 6 }),
          fc.record({
            name: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            userType: fc.string({ minLength: 1 })
          }),
          (contentArray, userProfile) => {
            // Create chunks in random order
            const chunks = contentArray.map((content, index) => ({
              chunkId: index + 1,
              content: `CHUNK_${index + 1}_START ${content} CHUNK_${index + 1}_END`,
              success: true
            }));

            // Shuffle chunks to test ordering
            const shuffled = [...chunks].sort(() => Math.random() - 0.5);

            // Assemble report
            const report = assembler.assembleReport(shuffled, userProfile);

            // Verify chunks appear in sequential order
            const chunk1Pos = report.indexOf('CHUNK_1_START');
            const chunk2Pos = report.indexOf('CHUNK_2_START');
            const chunk3Pos = report.indexOf('CHUNK_3_START');
            const chunk4Pos = report.indexOf('CHUNK_4_START');
            const chunk5Pos = report.indexOf('CHUNK_5_START');
            const chunk6Pos = report.indexOf('CHUNK_6_START');

            // All chunks should be present
            expect(chunk1Pos).toBeGreaterThan(-1);
            expect(chunk2Pos).toBeGreaterThan(-1);
            expect(chunk3Pos).toBeGreaterThan(-1);
            expect(chunk4Pos).toBeGreaterThan(-1);
            expect(chunk5Pos).toBeGreaterThan(-1);
            expect(chunk6Pos).toBeGreaterThan(-1);

            // Chunks should appear in order
            expect(chunk1Pos).toBeLessThan(chunk2Pos);
            expect(chunk2Pos).toBeLessThan(chunk3Pos);
            expect(chunk3Pos).toBeLessThan(chunk4Pos);
            expect(chunk4Pos).toBeLessThan(chunk5Pos);
            expect(chunk5Pos).toBeLessThan(chunk6Pos);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain order even with missing chunks', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 6, maxLength: 6 }),
          fc.record({
            name: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            userType: fc.string({ minLength: 1 })
          }),
          (successFlags, userProfile) => {
            // Create chunks with some potentially missing
            const chunks = successFlags.map((success, index) => ({
              chunkId: index + 1,
              content: success ? `CHUNK_${index + 1}_CONTENT` : '',
              success: success
            }));

            const report = assembler.assembleReport(chunks, userProfile);

            // Find positions of present chunks
            const positions = [];
            for (let i = 1; i <= 6; i++) {
              const pos = report.indexOf(`CHUNK_${i}_CONTENT`);
              if (pos > -1) {
                positions.push({ chunkId: i, position: pos });
              }
            }

            // Verify present chunks are in order
            for (let i = 1; i < positions.length; i++) {
              expect(positions[i].chunkId).toBeGreaterThan(positions[i - 1].chunkId);
              expect(positions[i].position).toBeGreaterThan(positions[i - 1].position);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 29: Section Header Insertion
   * Validates: Requirements 10.2
   * Verify section headers present at chunk boundaries
   */
  describe('Property 29: Section Header Insertion', () => {
    it('should insert section headers for all successful chunks', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 6, maxLength: 6 }),
          fc.record({
            name: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            userType: fc.string({ minLength: 1 })
          }),
          (contentArray, userProfile) => {
            const chunks = contentArray.map((content, index) => ({
              chunkId: index + 1,
              content: content,
              success: true
            }));

            const report = assembler.assembleReport(chunks, userProfile);

            // Verify all expected headers are present
            expect(report).toContain('## Executive Overview & Cognitive Capabilities');
            expect(report).toContain('## Leadership & Execution Excellence');
            expect(report).toContain('## Emotional Intelligence & Resilience');
            expect(report).toContain('## Motivation & Optimal Environments');
            expect(report).toContain('## Strategic Development Plan');
            expect(report).toContain('## Actionable Recommendations');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not duplicate headers if chunk content includes them', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            userType: fc.string({ minLength: 1 })
          }),
          (userProfile) => {
            // Create chunks where some include their own headers
            const chunks = [
              { chunkId: 1, content: '## Executive Overview & Cognitive Capabilities\n\nContent here', success: true },
              { chunkId: 2, content: 'Content without header', success: true },
              { chunkId: 3, content: '## Emotional Intelligence & Resilience\n\nMore content', success: true },
              { chunkId: 4, content: 'Plain content', success: true },
              { chunkId: 5, content: 'More plain content', success: true },
              { chunkId: 6, content: 'Final content', success: true }
            ];

            const report = assembler.assembleReport(chunks, userProfile);

            // Count occurrences of each header - should appear exactly once
            const countOccurrences = (str, pattern) => {
              const matches = str.match(new RegExp(pattern, 'g'));
              return matches ? matches.length : 0;
            };

            expect(countOccurrences(report, '## Executive Overview & Cognitive Capabilities')).toBe(1);
            expect(countOccurrences(report, '## Emotional Intelligence & Resilience')).toBe(1);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 30: Formatting Normalization
   * Validates: Requirements 10.3, 10.4
   * Verify consistent paragraph spacing across chunks with inconsistent input
   */
  describe('Property 30: Formatting Normalization', () => {
    it('should normalize excessive newlines to exactly 2', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }),
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 50 }),
          (numNewlines, text1, text2) => {
            const content = `${text1}${'\n'.repeat(numNewlines)}${text2}`;
            const normalized = assembler.normalizeFormatting(content);

            // Should not contain 3 or more consecutive newlines
            expect(normalized).not.toMatch(/\n{3,}/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should remove script and style tags', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 50 }),
          (safeContent, scriptContent) => {
            const content = `${safeContent}<script>${scriptContent}</script><style>body{}</style>`;
            const normalized = assembler.normalizeFormatting(content);

            expect(normalized).not.toContain('<script>');
            expect(normalized).not.toContain('</script>');
            expect(normalized).not.toContain('<style>');
            expect(normalized).not.toContain('</style>');
            expect(normalized).toContain(safeContent.trim());
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should trim leading and trailing whitespace', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (content, leadingSpaces, trailingSpaces) => {
            const trimmedContent = content.trim();
            const paddedContent = ' '.repeat(leadingSpaces) + trimmedContent + ' '.repeat(trailingSpaces);
            const normalized = assembler.normalizeFormatting(paddedContent);

            expect(normalized).toBe(trimmedContent);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle empty or invalid input gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant(null),
            fc.constant(undefined)
          ),
          (invalidInput) => {
            const normalized = assembler.normalizeFormatting(invalidInput);
            expect(normalized).toBe('');
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
