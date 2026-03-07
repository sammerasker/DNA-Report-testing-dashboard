/**
 * Monolithic Data Panel Component
 * 
 * Displays the monolithic prompt data that will be sent to the API.
 * Allows viewing and editing the prompt before generation.
 * 
 * @component
 */

import React, { useState } from 'react';
import styles from './MonolithicDataPanel.module.css';

/**
 * @typedef {Object} MonolithicDataPanelProps
 * @property {string} monolithicPrompt - Monolithic prompt text
 * @property {Function} onPromptChange - Callback when prompt is edited
 */

/**
 * MonolithicDataPanel component for displaying and editing monolithic prompt
 * @param {MonolithicDataPanelProps} props
 */
export default function MonolithicDataPanel({ 
  monolithicPrompt = '', 
  onPromptChange
}) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(monolithicPrompt).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Calculate character and estimated token count
  const charCount = monolithicPrompt.length;
  const estimatedTokens = Math.ceil(charCount / 4); // Rough estimate: 1 token ≈ 4 characters

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Monolithic Prompt Data</h3>
      </div>

      <div className={styles.stats}>
        <span className={styles.stat}>
          Characters: <strong>{charCount.toLocaleString()}</strong>
        </span>
        <span className={styles.stat}>
          Est. Tokens: <strong>{estimatedTokens.toLocaleString()}</strong>
        </span>
        <button 
          onClick={handleCopy}
          className={styles.copyButton}
        >
          {copySuccess ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>

      <div className={styles.content}>
        <textarea
          value={monolithicPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className={styles.textarea}
          placeholder="Monolithic prompt will appear here..."
          spellCheck={false}
        />
      </div>

      <div className={styles.helpText}>
        <p>
          💡 This is the prompt that will be sent to the API. You can edit it before generating the report.
        </p>
      </div>
    </div>
  );
}
