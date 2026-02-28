/**
 * Debug Panel Component
 * 
 * Displays detailed execution information for each chunk including
 * prompts, responses, token counts, latency, and error messages.
 * 
 * @component
 */

import React, { useState } from 'react';
import styles from './DebugPanel.module.css';

/**
 * @typedef {Object} ChunkResult
 * @property {number} chunkId - Chunk identifier (1-6)
 * @property {string} content - Generated text
 * @property {number} promptTokens - Tokens in prompt
 * @property {number} responseTokens - Tokens in response
 * @property {number} totalTokens - Total tokens
 * @property {number} latency - Latency in milliseconds
 * @property {string} status - Status ('success', 'error', 'pending')
 * @property {Object} [error] - Error object if failed
 * @property {string} [prompt] - Full prompt sent to API
 * @property {string} [response] - Full response from API
 */

/**
 * @typedef {Object} DebugPanelProps
 * @property {ChunkResult[]} chunks - Array of chunk results
 * @property {Function} onRetryChunk - Callback to retry a failed chunk
 */

/**
 * DebugPanel component for displaying chunk execution details
 * @param {DebugPanelProps} props
 */
export default function DebugPanel({ chunks = [], onRetryChunk }) {
  const [expandedChunks, setExpandedChunks] = useState({});

  // Toggle chunk expansion
  const toggleChunk = (chunkId) => {
    setExpandedChunks(prev => ({
      ...prev,
      [chunkId]: !prev[chunkId]
    }));
  };

  // Expand/collapse all
  const handleExpandAll = () => {
    const allExpanded = Object.keys(expandedChunks).length === chunks.length &&
                        Object.values(expandedChunks).every(v => v);
    
    const newState = {};
    chunks.forEach(chunk => {
      newState[chunk.chunkId] = !allExpanded;
    });
    setExpandedChunks(newState);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'pending': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  // Format latency
  const formatLatency = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!chunks || chunks.length === 0) {
    return (
      <div className={styles.debugPanel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Debug Panel</h2>
        </div>
        <div className={styles.emptyMessage}>
          <p>No chunk execution data available.</p>
          <p>Generate a report to see debug information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.debugPanel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Debug Panel</h2>
        <button onClick={handleExpandAll} className={styles.expandButton}>
          {Object.values(expandedChunks).every(v => v) ? '▼ Collapse All' : '▶ Expand All'}
        </button>
      </div>

      <div className={styles.chunksContainer}>
        {chunks.map((chunk) => {
          const isExpanded = expandedChunks[chunk.chunkId];
          const isError = chunk.status === 'error';
          const isPending = chunk.status === 'pending';

          return (
            <div key={chunk.chunkId} className={styles.chunkSection}>
              {/* Chunk Header */}
              <button
                onClick={() => toggleChunk(chunk.chunkId)}
                className={styles.chunkHeader}
              >
                <div className={styles.chunkHeaderLeft}>
                  <span className={styles.expandIcon}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span className={styles.chunkTitle}>
                    Chunk {chunk.chunkId}
                  </span>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(chunk.status) }}
                  >
                    {chunk.status}
                  </span>
                </div>

                <div className={styles.chunkHeaderRight}>
                  {!isPending && (
                    <>
                      <span className={styles.stat}>
                        {chunk.totalTokens?.toLocaleString() || 0} tokens
                      </span>
                      <span className={styles.stat}>
                        {formatLatency(chunk.latency || 0)}
                      </span>
                    </>
                  )}
                </div>
              </button>

              {/* Chunk Details */}
              {isExpanded && (
                <div className={styles.chunkDetails}>
                  {/* Token Breakdown */}
                  {!isPending && (
                    <div className={styles.detailSection}>
                      <h4 className={styles.detailTitle}>Token Usage</h4>
                      <div className={styles.tokenStats}>
                        <div className={styles.tokenStat}>
                          <span className={styles.tokenLabel}>Prompt:</span>
                          <span className={styles.tokenValue}>
                            {chunk.promptTokens?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className={styles.tokenStat}>
                          <span className={styles.tokenLabel}>Response:</span>
                          <span className={styles.tokenValue}>
                            {chunk.responseTokens?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className={styles.tokenStat}>
                          <span className={styles.tokenLabel}>Total:</span>
                          <span className={styles.tokenValue}>
                            {chunk.totalTokens?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className={styles.tokenStat}>
                          <span className={styles.tokenLabel}>Latency:</span>
                          <span className={styles.tokenValue}>
                            {formatLatency(chunk.latency || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {isError && chunk.error && (
                    <div className={styles.detailSection}>
                      <h4 className={styles.detailTitle}>Error</h4>
                      <div className={styles.errorBox}>
                        <div className={styles.errorMessage}>
                          <strong>Message:</strong> {chunk.error.message || 'Unknown error'}
                        </div>
                        {chunk.error.code && (
                          <div className={styles.errorCode}>
                            <strong>Code:</strong> {chunk.error.code}
                          </div>
                        )}
                        {onRetryChunk && chunk.error.retryable !== false && (
                          <button
                            onClick={() => onRetryChunk(chunk.chunkId)}
                            className={styles.retryButton}
                          >
                            🔄 Retry Chunk
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prompt */}
                  {chunk.prompt && (
                    <div className={styles.detailSection}>
                      <h4 className={styles.detailTitle}>Prompt Sent to API</h4>
                      <pre className={styles.codeBlock}>{chunk.prompt}</pre>
                    </div>
                  )}

                  {/* Response */}
                  {chunk.response && (
                    <div className={styles.detailSection}>
                      <h4 className={styles.detailTitle}>Response from API</h4>
                      <pre className={styles.codeBlock}>{chunk.response}</pre>
                    </div>
                  )}

                  {/* Content */}
                  {chunk.content && !isError && (
                    <div className={styles.detailSection}>
                      <h4 className={styles.detailTitle}>Generated Content</h4>
                      <div className={styles.contentBox}>
                        {chunk.content}
                      </div>
                    </div>
                  )}

                  {/* Pending State */}
                  {isPending && (
                    <div className={styles.detailSection}>
                      <div className={styles.pendingMessage}>
                        <span className={styles.spinner}>⏳</span>
                        Chunk is being generated...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
