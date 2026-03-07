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
import LimitsCounter from './LimitsCounter';

/**
 * @typedef {Object} ControlPanelProps
 * @property {Function} onGenerate - Callback when generate button is clicked
 * @property {Function} onProviderChange - Callback when API provider changes
 * @property {Function} onModelChange - Callback when model selection changes
 * @property {Function} onSystemPromptChange - Callback when system prompt changes
 * @property {Function} onEnrichmentToggle - Callback when enrichment toggle changes (deprecated, kept for compatibility)
 * @property {Function} onMonolithicEnrichmentToggle - Callback when monolithic enrichment toggle changes
 * @property {Function} onTimeoutChange - Callback when timeout changes
 * @property {string} provider - Current API provider ('huggingface' or 'moonshot')
 * @property {string} model - Current model selection
 * @property {string} systemPrompt - Current system prompt
 * @property {boolean} enrichmentEnabled - Whether data enrichment is enabled (deprecated, kept for compatibility)
 * @property {boolean} monolithicEnrichmentEnabled - Whether monolithic enrichment is enabled
 * @property {number} timeout - Request timeout in milliseconds
 * @property {string} status - Current status ('idle', 'generating', 'complete', 'error')
 * @property {number} tokenCount - Total tokens used
 * @property {number} elapsedTime - Elapsed time in milliseconds
 * @property {string} [errorMessage] - Error message if status is 'error'
 * @property {number} [requestsUsed] - Number of API requests used in current generation
 */

/**
 * ControlPanel component for DNA Report generation configuration
 * @param {ControlPanelProps} props
 */
export default function ControlPanel({
  onGenerate,
  onProviderChange,
  onModelChange,
  onSystemPromptChange,
  onEnrichmentToggle,
  onMonolithicEnrichmentToggle,
  onTimeoutChange,
  // onArchitectureChange, // Chunked-specific - commented out
  // onBatchDelayChange, // Chunked-specific - commented out
  provider = 'moonshot',
  model = '',
  systemPrompt = '',
  enrichmentEnabled = true,
  monolithicEnrichmentEnabled = false,
  timeout = 45000,
  // architecture = 'chunked', // Chunked-specific - commented out
  // batchDelay = 5, // Chunked-specific - commented out
  status = 'idle',
  tokenCount = 0,
  elapsedTime = 0,
  errorMessage = '',
  requestsUsed = 0
}) {
  // Model options based on provider
  const modelOptions = {
    // OpenRouter - Temporarily disabled due to timeout issues
    // openrouter: [
    //   { value: 'openrouter/free', label: 'OpenRouter Free' },
    //   { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B Instruct (Free)' },
    //   { value: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B IT (Free)' }
    // ],
    huggingface: [
      { value: 'openai/gpt-oss-20b', label: 'GPT-OSS-20B (Default)' },
      { value: 'meta-llama/Llama-3.2-3B-Instruct', label: 'Llama 3.2 3B Instruct' },
      { value: 'mistralai/Mistral-7B-Instruct-v0.2', label: 'Mistral 7B Instruct v0.2' },
      { value: 'google/flan-t5-xxl', label: 'FLAN-T5 XXL' }
    ],
    moonshot: [
      { value: 'moonshot-v1-128k', label: 'Moonshot v1 128K (Default)' },
      { value: 'moonshot-v1-8k', label: 'Moonshot v1 8K' },
      { value: 'moonshot-v1-32k', label: 'Moonshot v1 32K' },
      { value: 'kimi-latest', label: 'Kimi Latest' },
      { value: 'kimi-latest-8k', label: 'Kimi Latest 8K' },
      { value: 'kimi-latest-32k', label: 'Kimi Latest 32K' },
      { value: 'kimi-latest-128k', label: 'Kimi Latest 128K' },
      { value: 'kimi-k2', label: 'Kimi K2' },
      { value: 'kimi-k2.5', label: 'Kimi K2.5' }
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
          {/* <option value="openrouter">OpenRouter</option> */}
          <option value="huggingface">Hugging Face</option>
          <option value="moonshot">Moonshot</option>
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

      {/* System Prompt Editor - Show for all modes */}
      <div className={styles.formGroup}>
        <label htmlFor="systemPrompt" className={styles.label}>
          System Prompt
        </label>
        <textarea
          id="systemPrompt"
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          disabled={isGenerating}
          className={styles.textarea}
          rows={4}
          placeholder="Enter system prompt for the AI..."
        />
        <p className={styles.helpText}>
          Customize the AI&apos;s role and expertise. Default: Expert entrepreneurial psychologist.
        </p>
      </div>

      {/* Monolithic Enrichment Toggle */}
      <div className={styles.formGroup}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={monolithicEnrichmentEnabled}
            onChange={(e) => onMonolithicEnrichmentToggle(e.target.checked)}
            disabled={isGenerating}
            className={styles.checkbox}
          />
          <span className={styles.toggleText}>
            Use Enriched Context
          </span>
        </label>
        <p className={styles.helpText}>
          {monolithicEnrichmentEnabled 
            ? '📚 Using detailed enriched context (12 sections, ~6000 tokens)' 
            : '📄 Using simple raw data prompt (~500 tokens)'}
        </p>
      </div>

      {/* Architecture Selection - COMMENTED OUT - Only monolithic mode now */}
      {/* <div className={styles.formGroup}>
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
          {architecture === 'chunked' && '⚡ Batched execution: 2 chunks at a time'}
          {architecture === 'monolithic' && '📄 Single coherent report in one API call'}
          {architecture === 'comparison' && '📊 Compare both architectures side-by-side'}
        </p>
        {architecture === 'comparison' && (
          <div className={styles.infoBox}>
            <strong>📊 What you&apos;ll see:</strong>
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
              <li>Executes 2 chunks at a time (3 batches total)</li>
              <li>Configurable delay between batches</li>
              <li>Automatic provider fallback on errors</li>
              <li>Can retry individual failed chunks</li>
            </ul>
          </div>
        )}
      </div> */}

      {/* Batch Delay Selection - COMMENTED OUT - Chunked-specific */}
      {/* {architecture === 'chunked' && (
        <div className={styles.formGroup}>
          <label htmlFor="batchDelay" className={styles.label}>
            Batch Delay (Rate Limit Protection)
          </label>
          <select
            id="batchDelay"
            value={batchDelay}
            onChange={(e) => onBatchDelayChange(Number(e.target.value))}
            disabled={isGenerating}
            className={styles.select}
          >
            <option value={0}>0 seconds (No delay)</option>
            <option value={2}>2 seconds</option>
            <option value={5}>5 seconds (Recommended)</option>
            <option value={10}>10 seconds (Very safe)</option>
            <option value={15}>15 seconds (Maximum safety)</option>
          </select>
          <p className={styles.helpText}>
            {batchDelay === 0 && '⚠️ No delay - may hit rate limits'}
            {batchDelay === 2 && '⏱️ Short delay - good for most providers'}
            {batchDelay === 5 && '✅ Balanced - recommended for free tiers'}
            {batchDelay === 10 && '🛡️ Safe - avoids most rate limits'}
            {batchDelay === 15 && '🐢 Maximum safety - slowest but safest'}
          </p>
        </div>
      )} */}

      {/* Timeout Selection */}
      <div className={styles.formGroup}>
        <label htmlFor="timeout" className={styles.label}>
          Request Timeout
        </label>
        <select
          id="timeout"
          value={timeout}
          onChange={(e) => onTimeoutChange(Number(e.target.value))}
          disabled={isGenerating}
          className={styles.select}
        >
          <option value={30000}>30 seconds</option>
          <option value={45000}>45 seconds (Default)</option>
          <option value={60000}>60 seconds (1 minute)</option>
          <option value={90000}>90 seconds (1.5 minutes)</option>
          <option value={120000}>120 seconds (2 minutes)</option>
          <option value={180000}>180 seconds (3 minutes)</option>
          <option value={240000}>240 seconds (4 minutes)</option>
        </select>
        <p className={styles.helpText}>
          {timeout === 30000 && '⚠️ Short timeout - may fail for large reports'}
          {timeout === 45000 && '✅ Default - good for most reports'}
          {timeout === 60000 && '⏱️ Extended - for longer reports'}
          {timeout === 90000 && '🕐 Long - for complex reports'}
          {timeout === 120000 && '🕑 Very long - for detailed reports'}
          {timeout === 180000 && '🕒 Extra long - for comprehensive reports'}
          {timeout === 240000 && '🕓 Maximum - for very large reports'}
        </p>
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

      {/* API Limits Counter */}
      <LimitsCounter 
        currentProvider={provider}
        requestsUsed={requestsUsed}
      />
    </div>
  );
}
