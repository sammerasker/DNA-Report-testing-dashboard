/**
 * Control Panel Component
 * 
 * Provides UI controls for configuring and triggering report generation.
 * Includes API provider selection, model selection, enrichment toggle,
 * comparison mode toggle, and status indicators.
 * 
 * @component
 */

import React from 'react';
import styles from './ControlPanel.module.css';

/**
 * @typedef {Object} ControlPanelProps
 * @property {Function} onGenerate - Callback when generate button is clicked
 * @property {Function} onProviderChange - Callback when API provider changes
 * @property {Function} onModelChange - Callback when model selection changes
 * @property {Function} onEnrichmentToggle - Callback when enrichment toggle changes
 * @property {Function} onArchitectureChange - Callback when architecture mode changes
 * @property {string} provider - Current API provider ('openrouter' or 'huggingface')
 * @property {string} model - Current model selection
 * @property {boolean} enrichmentEnabled - Whether data enrichment is enabled
 * @property {string} architecture - Architecture mode ('chunked', 'monolithic', 'comparison')
 * @property {string} status - Current status ('idle', 'generating', 'complete', 'error')
 * @property {number} tokenCount - Total tokens used
 * @property {number} elapsedTime - Elapsed time in milliseconds
 * @property {string} [errorMessage] - Error message if status is 'error'
 */

/**
 * ControlPanel component for DNA Report generation configuration
 * @param {ControlPanelProps} props
 */
export default function ControlPanel({
  onGenerate,
  onProviderChange,
  onModelChange,
  onEnrichmentToggle,
  onArchitectureChange,
  provider = 'openrouter',
  model = '',
  enrichmentEnabled = true,
  architecture = 'chunked',
  status = 'idle',
  tokenCount = 0,
  elapsedTime = 0,
  errorMessage = ''
}) {
  // Model options based on provider
  const modelOptions = {
    openrouter: [
      { value: 'openrouter/free', label: 'OpenRouter Free' },
      { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B Instruct (Free)' },
      { value: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B IT (Free)' }
    ],
    huggingface: [
      { value: 'openai/gpt-oss-20b', label: 'GPT-OSS-20B (Default)' },
      { value: 'meta-llama/Llama-3.2-3B-Instruct', label: 'Llama 3.2 3B Instruct' },
      { value: 'mistralai/Mistral-7B-Instruct-v0.2', label: 'Mistral 7B Instruct v0.2' },
      { value: 'google/flan-t5-xxl', label: 'FLAN-T5 XXL' }
    ]
  };

  const currentModelOptions = modelOptions[provider] || modelOptions.openrouter;
  const isGenerating = status === 'generating';
  const isComplete = status === 'complete';
  const isError = status === 'error';

  // Format elapsed time
  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Status indicator color
  const getStatusColor = () => {
    switch (status) {
      case 'generating': return '#ffa500';
      case 'complete': return '#4caf50';
      case 'error': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  return (
    <div className={styles.controlPanel}>
      <h2 className={styles.title}>Control Panel</h2>
      
      {/* API Provider Selection */}
      <div className={styles.formGroup}>
        <label htmlFor="provider" className={styles.label}>
          API Provider
        </label>
        <select
          id="provider"
          value={provider}
          onChange={(e) => onProviderChange(e.target.value)}
          disabled={isGenerating}
          className={styles.select}
        >
          <option value="openrouter">OpenRouter</option>
          <option value="huggingface">Hugging Face</option>
        </select>
      </div>

      {/* Model Selection */}
      <div className={styles.formGroup}>
        <label htmlFor="model" className={styles.label}>
          Model
        </label>
        <select
          id="model"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={isGenerating}
          className={styles.select}
        >
          {currentModelOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Enrichment Toggle */}
      <div className={styles.formGroup}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={enrichmentEnabled}
            onChange={(e) => onEnrichmentToggle(e.target.checked)}
            disabled={isGenerating}
            className={styles.checkbox}
          />
          <span className={styles.toggleText}>
            Enable Data Enrichment
          </span>
        </label>
        <p className={styles.helpText}>
          {enrichmentEnabled 
            ? 'Using enriched context with interpretations' 
            : 'Using raw JSON assessment data'}
        </p>
      </div>

      {/* Architecture Selection */}
      <div className={styles.formGroup}>
        <label htmlFor="architecture" className={styles.label}>
          Architecture Mode
        </label>
        <select
          id="architecture"
          value={architecture}
          onChange={(e) => onArchitectureChange(e.target.value)}
          disabled={isGenerating}
          className={styles.select}
        >
          <option value="chunked">Chunked (6 Parallel Chunks)</option>
          <option value="monolithic">Monolithic (Single Call)</option>
          <option value="comparison">Comparison (Both Side-by-Side)</option>
        </select>
        <p className={styles.helpText}>
          {architecture === 'chunked' && '⚡ Fast parallel execution with 6 chunks'}
          {architecture === 'monolithic' && '📄 Single coherent report in one API call'}
          {architecture === 'comparison' && '📊 Compare both architectures side-by-side'}
        </p>
        {architecture === 'comparison' && (
          <div className={styles.infoBox}>
            <strong>📊 What you'll see:</strong>
            <ul className={styles.infoList}>
              <li>Side-by-side report comparison</li>
              <li>Quality metrics for both approaches</li>
              <li>Token usage and performance stats</li>
              <li>Helps decide which architecture to use</li>
            </ul>
            <p className={styles.infoNote}>
              💡 Note: Uses 2x API calls and tokens. For testing only.
            </p>
          </div>
        )}
        {architecture === 'monolithic' && (
          <div className={styles.infoBox}>
            <strong>📄 Monolithic Mode:</strong>
            <ul className={styles.infoList}>
              <li>Single API call generates entire report</li>
              <li>Coherent narrative flow</li>
              <li>Lower token usage (3,000-5,000)</li>
              <li>Simpler error handling</li>
            </ul>
          </div>
        )}
        {architecture === 'chunked' && (
          <div className={styles.infoBox}>
            <strong>⚡ Chunked Mode:</strong>
            <ul className={styles.infoList}>
              <li>6 chunks execute in parallel</li>
              <li>Faster overall completion</li>
              <li>Can retry individual failed chunks</li>
              <li>Comprehensive coverage</li>
            </ul>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className={styles.formGroup}>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`${styles.generateButton} ${isGenerating ? styles.generating : ''}`}
        >
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Status Indicator */}
      <div className={styles.statusSection}>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Status:</span>
          <span 
            className={styles.statusIndicator}
            style={{ backgroundColor: getStatusColor() }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        {/* Token Counter */}
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Tokens:</span>
          <span className={styles.statusValue}>
            {tokenCount.toLocaleString()}
          </span>
        </div>

        {/* Timer */}
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Time:</span>
          <span className={styles.statusValue}>
            {formatTime(elapsedTime)}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {isError && errorMessage && (
        <div className={styles.errorMessage}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {/* Success Message */}
      {isComplete && (
        <div className={styles.successMessage}>
          Report generated successfully!
        </div>
      )}
    </div>
  );
}
