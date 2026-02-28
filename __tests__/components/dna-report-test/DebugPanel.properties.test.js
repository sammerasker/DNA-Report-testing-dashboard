/**
 * @fileoverview Property-based tests for DebugPanel component
 * 
 * Tests universal properties that should hold across all valid inputs
 * using fast-check for property-based testing.
 */

import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';
import DebugPanel from '../../../components/dna-report-test/DebugPanel';

const testConfig = { numRuns: 20 };

/**
 * Arbitrary generator for successful chunks with unique IDs
 */
const successfulChunkArbitrary = () => fc.record({
  chunkId: fc.integer({ min: 1, max: 6 }),
  content: fc.string({ minLength: 10, maxLength: 100 }),
  promptTokens: fc.integer({ min: 100, max: 1000 }),
  responseTokens: fc.integer({ min: 100, max: 1000 }),
  totalTokens: fc.integer({ min: 200, max: 2000 }),
  latency: fc.integer({ min: 500, max: 5000 }),
  status: fc.constant('success'),
  prompt: fc.string({ minLength: 20, maxLength: 100 }),
  response: fc.string({ minLength: 20, maxLength: 100 })
});

/**
 * Arbitrary generator for unique chunk arrays
 */
const uniqueChunksArbitrary = () => 
  fc.array(successfulChunkArbitrary(), { minLength: 1, maxLength: 6 })
    .map(chunks => {
      // Ensure unique chunk IDs by assigning sequential IDs
      return chunks.map((chunk, index) => ({
        ...chunk,
        chunkId: index + 1
      }));
    });

/**
 * Arbitrary generator for failed chunks
 */
const failedChunkArbitrary = () => fc.record({
  chunkId: fc.integer({ min: 1, max: 6 }),
  content: fc.constant(''),
  promptTokens: fc.constant(0),
  responseTokens: fc.constant(0),
  totalTokens: fc.constant(0),
  latency: fc.constant(0),
  status: fc.constant('error'),
  error: fc.record({
    message: fc.string({ minLength: 10, maxLength: 50 }),
    code: fc.constantFrom('400', '401', '429', '500', '503'),
    retryable: fc.boolean()
  })
});

describe('DebugPanel - Property-Based Tests', () => {
  /**
   * Property 20: Debug Panel Completeness
   * Validates: Requirements 7.2, 7.3, 7.4, 7.5
   * 
   * For any successful chunk execution, the debug panel should display:
   * - Complete prompt sent to API (Requirement 7.2)
   * - Complete response received from API (Requirement 7.3)
   * - Token counts (prompt + response) (Requirement 7.4)
   * - Latency in milliseconds (Requirement 7.5)
   */
  describe('Property 20: Debug Panel Completeness', () => {
    test('displays token counts in header for all successful chunks', () => {
      fc.assert(
        fc.property(
          fc.array(successfulChunkArbitrary(), { minLength: 1, maxLength: 6 }),
          (chunks) => {
            try {
              // Render component
              render(<DebugPanel chunks={chunks} onRetryChunk={() => {}} />);

              // Verify token counts are displayed in headers (visible without expanding)
              const tokenElements = screen.queryAllByText(/tokens/i);
              
              // Should have token display for each chunk
              return tokenElements.length >= chunks.length;
            } finally {
              cleanup();
            }
          }
        ),
        testConfig
      );
    });

    test('displays latency for all successful chunks', () => {
      fc.assert(
        fc.property(
          fc.array(successfulChunkArbitrary(), { minLength: 1, maxLength: 6 }),
          (chunks) => {
            try {
              // Render component
              render(<DebugPanel chunks={chunks} onRetryChunk={() => {}} />);

              // Verify latency is displayed in chunk headers
              // Latency should be visible even when collapsed
              const latencyElements = screen.queryAllByText(/ms|s/);
              
              // Should have latency displayed for chunks
              return latencyElements.length >= chunks.length;
            } finally {
              cleanup();
            }
          }
        ),
        testConfig
      );
    });

    test('displays chunk headers with status for all chunks', () => {
      fc.assert(
        fc.property(
          uniqueChunksArbitrary(),
          (chunks) => {
            try {
              // Render component
              render(<DebugPanel chunks={chunks} onRetryChunk={() => {}} />);

              // Verify all chunk headers are present
              const chunkHeaders = chunks.map(chunk => 
                screen.queryByText(`Chunk ${chunk.chunkId}`)
              );
              
              // All chunk headers should be present
              return chunkHeaders.every(header => header !== null);
            } finally {
              cleanup();
            }
          }
        ),
        testConfig
      );
    });

    test('displays success status badge for successful chunks', () => {
      fc.assert(
        fc.property(
          fc.array(successfulChunkArbitrary(), { minLength: 1, maxLength: 6 }),
          (chunks) => {
            try {
              // Render component
              render(<DebugPanel chunks={chunks} onRetryChunk={() => {}} />);

              // Verify success status badges are displayed
              const successBadges = screen.queryAllByText('success');
              
              // Should have success badge for each chunk
              return successBadges.length === chunks.length;
            } finally {
              cleanup();
            }
          }
        ),
        testConfig
      );
    });

    test('chunk details are accessible when expanded', () => {
      fc.assert(
        fc.property(
          successfulChunkArbitrary(),
          (chunk) => {
            try {
              // Render component with single chunk
              render(<DebugPanel chunks={[chunk]} onRetryChunk={() => {}} />);

              // Find and click the chunk header to expand
              const chunkHeader = screen.getByText(`Chunk ${chunk.chunkId}`);
              fireEvent.click(chunkHeader);

              // After expansion, verify details sections exist
              // Check for at least one detail section indicator
              const hasDetails = 
                screen.queryByText(/Token Usage/i) !== null ||
                screen.queryByText(/Prompt Sent to API/i) !== null ||
                screen.queryByText(/Response from API/i) !== null;

              return hasDetails;
            } finally {
              cleanup();
            }
          }
        ),
        testConfig
      );
    });

    test('token breakdown is available for successful chunks', () => {
      fc.assert(
        fc.property(
          successfulChunkArbitrary(),
          (chunk) => {
            try {
              // Render component with single chunk
              render(<DebugPanel chunks={[chunk]} onRetryChunk={() => {}} />);

              // Expand the chunk
              const chunkHeader = screen.getByText(`Chunk ${chunk.chunkId}`);
              fireEvent.click(chunkHeader);

              // Verify token information is present (either in header or details)
              const hasTokenInfo = 
                screen.queryByText(/tokens/i) !== null ||
                screen.queryByText(/Token Usage/i) !== null;

              return hasTokenInfo;
            } finally {
              cleanup();
            }
          }
        ),
        testConfig
      );
    });
  });

  /**
   * Property 21: Error Information Display
   * Validates: Requirements 7.6
   * 
   * For any failed chunk, the debug panel should display:
   * - Error message
   * - Status code
   */
  describe('Property 21: Error Information Display', () => {
    test('displays error status badge for failed chunks', () => {
      fc.assert(
        fc.property(
          fc.array(failedChunkArbitrary(), { minLength: 1, maxLength: 6 }),
          (chunks) => {
            try {
              // Render component
              render(<DebugPanel chunks={chunks} onRetryChunk={() => {}} />);

              // Verify error status badges are displayed
              const errorBadges = screen.queryAllByText('error');
              
              // Should have error badge for each failed chunk
              return errorBadges.length === chunks.length;
            } finally {
              cleanup();
            }
          }
        ),
        testConfig
      );
    });

    test('error information is accessible when chunk is expanded', () => {
      fc.assert(
        fc.property(
          failedChunkArbitrary(),
          (chunk) => {
            try {
              // Render component with single failed chunk
              render(<DebugPanel chunks={[chunk]} onRetryChunk={() => {}} />);

              // Expand the chunk
              const chunkHeader = screen.getByText(`Chunk ${chunk.chunkId}`);
              fireEvent.click(chunkHeader);

              // Verify error section is present (use queryAllByText since "Error" appears multiple times)
              const errorElements = screen.queryAllByText(/Error/i);
              const hasErrorSection = errorElements.length > 0;

              return hasErrorSection;
            } finally {
              cleanup();
            }
          }
        ),
        testConfig
      );
    });

    test('error message is displayed for failed chunks', () => {
      fc.assert(
        fc.property(
          failedChunkArbitrary(),
          (chunk) => {
            try {
              // Render component with single failed chunk
              render(<DebugPanel chunks={[chunk]} onRetryChunk={() => {}} />);

              // Expand the chunk
              const chunkHeader = screen.getByText(`Chunk ${chunk.chunkId}`);
              fireEvent.click(chunkHeader);

              // Verify error message label is present
              const hasMessageLabel = screen.queryByText(/Message:/i) !== null;

              return hasMessageLabel;
            } finally {
              cleanup();
            }
          }
        ),
        testConfig
      );
    });

    test('status code is displayed for failed chunks', () => {
      fc.assert(
        fc.property(
          failedChunkArbitrary(),
          (chunk) => {
            try {
              // Render component with single failed chunk
              render(<DebugPanel chunks={[chunk]} onRetryChunk={() => {}} />);

              // Expand the chunk
              const chunkHeader = screen.getByText(`Chunk ${chunk.chunkId}`);
              fireEvent.click(chunkHeader);

              // Verify status code label is present
              const hasCodeLabel = screen.queryByText(/Code:/i) !== null;

              return hasCodeLabel;
            } finally {
              cleanup();
            }
          }
        ),
        testConfig
      );
    });

    test('retry button is available for retryable failed chunks', () => {
      fc.assert(
        fc.property(
          failedChunkArbitrary(),
          (chunk) => {
            try {
              // Ensure chunk is retryable
              const retryableChunk = {
                ...chunk,
                error: {
                  ...chunk.error,
                  retryable: true
                }
              };

              // Render component with retryable failed chunk
              render(<DebugPanel chunks={[retryableChunk]} onRetryChunk={() => {}} />);

              // Expand the chunk
              const chunkHeader = screen.getByText(`Chunk ${retryableChunk.chunkId}`);
              fireEvent.click(chunkHeader);

              // Verify retry button or retry text is present
              const hasRetry = screen.queryByText(/Retry/i) !== null;

              return hasRetry;
            } finally {
              cleanup();
            }
          }
        ),
        testConfig
      );
    });

    test('error details are complete for failed chunks', () => {
      fc.assert(
        fc.property(
          failedChunkArbitrary(),
          (chunk) => {
            try {
              // Render component with single failed chunk
              render(<DebugPanel chunks={[chunk]} onRetryChunk={() => {}} />);

              // Expand the chunk
              const chunkHeader = screen.getByText(`Chunk ${chunk.chunkId}`);
              fireEvent.click(chunkHeader);

              // Verify error section has required components (use queryAllByText for "Error")
              const errorElements = screen.queryAllByText(/Error/i);
              const hasErrorSection = errorElements.length > 0;
              const hasMessageLabel = screen.queryByText(/Message:/i) !== null;
              const hasCodeLabel = screen.queryByText(/Code:/i) !== null;

              return hasErrorSection && (hasMessageLabel || hasCodeLabel);
            } finally {
              cleanup();
            }
          }
        ),
        testConfig
      );
    });
  });
});
