/**
 * Raw Data Panel Component
 * 
 * Displays and allows editing of raw assessment JSON data.
 * Includes JSON syntax highlighting, validation, and file loading.
 * 
 * @component
 */

import React, { useState, useEffect } from 'react';
import styles from './RawDataPanel.module.css';

/**
 * @typedef {Object} RawDataPanelProps
 * @property {Object} data - Assessment data object
 * @property {Function} onDataChange - Callback when data is modified
 */

/**
 * RawDataPanel component for displaying and editing assessment JSON
 * @param {RawDataPanelProps} props
 */
export default function RawDataPanel({ data, onDataChange }) {
  // Derive initial JSON text from data prop
  const [jsonText, setJsonText] = useState(() => 
    data ? JSON.stringify(data, null, 2) : ''
  );
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Synchronize with data prop changes (valid use case for useEffect)
  // Only update if not currently editing to preserve user input
  useEffect(() => {
    if (data && !isEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJsonText(JSON.stringify(data, null, 2));
      setIsValid(true);
      setValidationError('');
    }
  }, [data, isEditing]);

  // Handle text change
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setJsonText(newText);
    setIsEditing(true);

    // Validate JSON
    try {
      const parsed = JSON.parse(newText);
      setIsValid(true);
      setValidationError('');
      
      // Call onDataChange with parsed data
      if (onDataChange) {
        onDataChange(parsed);
      }
    } catch (error) {
      setIsValid(false);
      setValidationError(error.message);
    }
  };

  // Handle file upload
  const handleFileLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        setJsonText(JSON.stringify(parsed, null, 2));
        setIsValid(true);
        setValidationError('');
        setIsEditing(false);
        
        if (onDataChange) {
          onDataChange(parsed);
        }
      } catch (error) {
        setIsValid(false);
        setValidationError(`File parsing error: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Format JSON
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setIsValid(true);
      setValidationError('');
    } catch (error) {
      // Already invalid, do nothing
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Calculate character count
  const charCount = jsonText.length;
  const lineCount = jsonText.split('\n').length;

  return (
    <div className={styles.rawDataPanel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Raw Assessment Data</h2>
        
        {/* Validation Indicator */}
        <div className={`${styles.validationBadge} ${isValid ? styles.valid : styles.invalid}`}>
          {isValid ? '✓ Valid JSON' : '✗ Invalid JSON'}
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <label htmlFor="file-upload" className={styles.toolbarButton}>
          📁 Load from File
          <input
            id="file-upload"
            type="file"
            accept=".json"
            onChange={handleFileLoad}
            className={styles.fileInput}
          />
        </label>
        
        <button 
          onClick={handleFormat}
          disabled={!isValid}
          className={styles.toolbarButton}
        >
          ✨ Format
        </button>
        
        <button 
          onClick={handleCopy}
          className={styles.toolbarButton}
        >
          📋 Copy
        </button>

        <div className={styles.stats}>
          <span className={styles.stat}>{lineCount} lines</span>
          <span className={styles.stat}>{charCount.toLocaleString()} chars</span>
        </div>
      </div>

      {/* JSON Editor */}
      <div className={styles.editorContainer}>
        <textarea
          value={jsonText}
          onChange={handleTextChange}
          className={`${styles.editor} ${!isValid ? styles.editorError : ''}`}
          spellCheck={false}
          placeholder="Paste or load assessment JSON data..."
        />
      </div>

      {/* Validation Error */}
      {!isValid && validationError && (
        <div className={styles.errorMessage}>
          <strong>Validation Error:</strong> {validationError}
        </div>
      )}

      {/* Edit Warning */}
      {isEditing && isValid && (
        <div className={styles.infoMessage}>
          Data has been modified. Changes are applied automatically.
        </div>
      )}
    </div>
  );
}
