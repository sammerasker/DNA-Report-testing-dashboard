/**
 * Trait Helper Functions
 * UI utility functions for working with traits, domains, and score bands
 */

import { TRAIT_GUIDE, DOMAIN_DEFINITIONS, SCORE_BANDS } from './trait-definitions.js';

/**
 * Gets the display name for a trait
 * @param {string} traitKey - Trait identifier (e.g., 'speed', 'abstraction')
 * @returns {string} Human-readable trait name
 */
export function getTraitDisplayName(traitKey) {
  const trait = TRAIT_GUIDE[traitKey];
  return trait ? trait.displayName : traitKey;
}

/**
 * Gets the domain for a trait
 * @param {string} traitKey - Trait identifier
 * @returns {Object|null} Domain object or null if not found
 */
export function getDomainForTrait(traitKey) {
  for (const domain of Object.values(DOMAIN_DEFINITIONS)) {
    if (domain.traits.includes(traitKey)) {
      return domain;
    }
  }
  return null;
}

/**
 * Gets the color for a score band (3-tier system)
 * @param {number} score - Trait score (0-100)
 * @returns {string} Hex color code
 */
export function getBandColor(score) {
  if (score >= SCORE_BANDS.HIGH.min) return SCORE_BANDS.HIGH.color;
  if (score >= SCORE_BANDS.MODERATE.min) return SCORE_BANDS.MODERATE.color;
  return SCORE_BANDS.EMERGING.color;
}

/**
 * Gets the label for a score band (3-tier system)
 * @param {number} score - Trait score (0-100)
 * @returns {string} Band label (e.g., 'High', 'Moderate', 'Emerging')
 */
export function getBandLabel(score) {
  if (score >= SCORE_BANDS.HIGH.min) return SCORE_BANDS.HIGH.label;
  if (score >= SCORE_BANDS.MODERATE.min) return SCORE_BANDS.MODERATE.label;
  return SCORE_BANDS.EMERGING.label;
}

/**
 * Gets all traits organized by domain
 * @returns {Object} Object mapping domain keys to arrays of trait keys
 */
export function getTraitsByDomain() {
  const traitsByDomain = {};
  
  Object.entries(DOMAIN_DEFINITIONS).forEach(([domainKey, domain]) => {
    traitsByDomain[domainKey] = {
      displayName: domain.displayName,
      description: domain.description,
      traits: domain.traits.map(traitKey => ({
        key: traitKey,
        displayName: getTraitDisplayName(traitKey),
        definition: TRAIT_GUIDE[traitKey]?.definition || ''
      }))
    };
  });

  return traitsByDomain;
}

/**
 * Gets complete trait information
 * @param {string} traitKey - Trait identifier
 * @returns {Object|null} Complete trait object or null if not found
 */
export function getTraitInfo(traitKey) {
  return TRAIT_GUIDE[traitKey] || null;
}

/**
 * Validates if a trait key exists
 * @param {string} traitKey - Trait identifier
 * @returns {boolean} True if trait exists
 */
export function isValidTrait(traitKey) {
  return traitKey in TRAIT_GUIDE;
}

/**
 * Gets all trait keys
 * @returns {Array<string>} Array of all trait keys
 */
export function getAllTraitKeys() {
  return Object.keys(TRAIT_GUIDE);
}

/**
 * Gets all domain keys
 * @returns {Array<string>} Array of all domain keys
 */
export function getAllDomainKeys() {
  return Object.keys(DOMAIN_DEFINITIONS);
}
