/**
 * Utility functions for DNA Report Chunked Pipeline
 * Shared helpers for data processing, formatting, and validation
 */

import { SCORE_BANDS, TRAIT_NAMES } from './constants.js';

/**
 * Maps a score (0-100) to its corresponding score band
 * @param {number} score - The trait score to map
 * @returns {string} The score band label (e.g., 'Exceptional', 'Strong')
 */
export function getScoreBand(score) {
  if (score >= SCORE_BANDS.EXCEPTIONAL.min) return SCORE_BANDS.EXCEPTIONAL.label;
  if (score >= SCORE_BANDS.STRONG.min) return SCORE_BANDS.STRONG.label;
  if (score >= SCORE_BANDS.MODERATE.min) return SCORE_BANDS.MODERATE.label;
  if (score >= SCORE_BANDS.DEVELOPING.min) return SCORE_BANDS.DEVELOPING.label;
  return SCORE_BANDS.CRITICAL_GAP.label;
}

/**
 * Gets the display name for a trait
 * @param {string} traitKey - The trait key (e.g., 'speed', 'abstraction')
 * @returns {string} The display name (e.g., 'Speed', 'Strategic Thinking')
 */
export function getTraitDisplayName(traitKey) {
  return TRAIT_NAMES[traitKey] || traitKey;
}

/**
 * Counts words in a text string
 * @param {string} text - The text to count words in
 * @returns {number} The word count
 */
export function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Normalizes paragraph spacing in text
 * Ensures no more than 2 consecutive newlines
 * @param {string} text - The text to normalize
 * @returns {string} Normalized text
 */
export function normalizeSpacing(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\n{3,}/g, '\n\n');
}

/**
 * Sanitizes text by removing potentially problematic characters
 * @param {string} text - The text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  // Remove control characters except newlines and tabs
  return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Formats a timestamp for display
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(timestamp) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Calculates elapsed time in milliseconds
 * @param {number} startTime - Start time from performance.now()
 * @param {number} endTime - End time from performance.now()
 * @returns {number} Elapsed time in milliseconds
 */
export function calculateElapsedTime(startTime, endTime) {
  return Math.round(endTime - startTime);
}

/**
 * Formats latency for display
 * @param {number} latency - Latency in milliseconds
 * @returns {string} Formatted latency string
 */
export function formatLatency(latency) {
  if (latency < 1000) {
    return `${latency}ms`;
  }
  return `${(latency / 1000).toFixed(2)}s`;
}

/**
 * Validates assessment data structure
 * @param {Object} data - Assessment data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateAssessmentData(data) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Assessment data must be an object'] };
  }
  
  if (!data.normalizedScores || typeof data.normalizedScores !== 'object') {
    errors.push('Missing or invalid normalizedScores');
  }
  
  if (!data.fullName && !data.firstName) {
    errors.push('Missing user name (fullName or firstName)');
  }
  
  if (!Array.isArray(data.rolesTop)) {
    errors.push('Missing or invalid rolesTop array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Provides default values for missing assessment data fields
 * @param {Object} data - Partial assessment data
 * @returns {Object} Assessment data with defaults applied
 */
export function applyDefaults(data) {
  return {
    fullName: data.fullName || data.firstName || 'User',
    firstName: data.firstName || data.fullName || 'User',
    userTypes: data.userTypes || ['entrepreneur'],
    summary: data.summary || '',
    normalizedScores: data.normalizedScores || {},
    rolesTop: data.rolesTop || [],
    traitInsights: data.traitInsights || {},
    domains: data.domains || [],
    completedAt: data.completedAt || new Date().toISOString()
  };
}

/**
 * Extracts error message from various error types
 * @param {Error|Object|string} error - The error to extract message from
 * @returns {string} User-friendly error message
 */
export function extractErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  return 'An unknown error occurred';
}

/**
 * Checks if an error is retryable based on status code
 * @param {Object} error - Error object with status property
 * @returns {boolean} True if error is retryable
 */
export function isRetryableError(error) {
  const retryableStatusCodes = [429, 500, 502, 503, 504];
  return error?.status && retryableStatusCodes.includes(error.status);
}

/**
 * Creates a delay promise for retry logic
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>} Promise that resolves after delay
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncates text to a maximum length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Counts occurrences of a pattern in text (case-insensitive)
 * @param {string} text - Text to search in
 * @param {string|RegExp} pattern - Pattern to search for
 * @returns {number} Number of occurrences
 */
export function countOccurrences(text, pattern) {
  if (!text || typeof text !== 'string') return 0;
  
  if (typeof pattern === 'string') {
    const regex = new RegExp(pattern, 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }
  
  if (pattern instanceof RegExp) {
    const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
    const regex = new RegExp(pattern.source, flags);
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }
  
  return 0;
}

/**
 * Generates a unique ID for tracking purposes
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clones an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
