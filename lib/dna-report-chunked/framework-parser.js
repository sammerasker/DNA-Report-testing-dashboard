/**
 * Framework Parser Module
 * 
 * Parses and validates external JSON files containing psychological frameworks
 * and behavioral indicators for trait interpretation.
 * 
 * @module framework-parser
 */

import fs from 'fs';
import { TRAIT_GUIDE } from './trait-definitions.js';

/**
 * Parses psychological framework JSON file and returns structured data.
 * 
 * Expected JSON Schema:
 * {
 *   "version": "psy-v1",
 *   "language": "en",
 *   "traits": {
 *     "<traitKey>": {
 *       "low": {
 *         "name": "string",
 *         "key_strengths": ["string"],
 *         "risk_factors": ["string"],
 *         "suggestions": ["string"],
 *         "how_to_use_strengths": ["string"],
 *         "accommodations": ["string"]
 *       },
 *       "high": { (same structure as low) }
 *     }
 *   }
 * }
 * 
 * @param {string} jsonPath - Path to psychological framework JSON file
 * @returns {Object} Parsed framework data keyed by trait
 * @throws {Error} If file doesn't exist, path is invalid, JSON is malformed, or required fields are missing
 * 
 * @example
 * const framework = parsePsychologicalFramework('./data/psychological-framework.json');
 * console.log(framework.traits.speed.low.name); // "Thoughtful Decision-Maker"
 */
export function parsePsychologicalFramework(jsonPath) {
  // Validate input path
  if (!jsonPath || typeof jsonPath !== 'string') {
    throw new Error('Invalid file path: path must be a non-empty string');
  }

  // Check if file exists
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File not found: ${jsonPath}`);
  }

  // Read and parse JSON
  let data;
  try {
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    data = JSON.parse(fileContent);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Malformed JSON in ${jsonPath}: ${error.message}`);
    }
    throw new Error(`Failed to read file ${jsonPath}: ${error.message}`);
  }

  // Validate required top-level fields
  if (!data.version) {
    throw new Error(`Missing required field 'version' in ${jsonPath}`);
  }
  if (!data.language) {
    throw new Error(`Missing required field 'language' in ${jsonPath}`);
  }
  if (!data.traits || typeof data.traits !== 'object') {
    throw new Error(`Missing or invalid 'traits' object in ${jsonPath}`);
  }

  // Validate each trait structure
  for (const [traitKey, traitData] of Object.entries(data.traits)) {
    // Validate low pole
    if (!traitData.low || typeof traitData.low !== 'object') {
      throw new Error(`Missing or invalid 'low' pole for trait '${traitKey}' in ${jsonPath}`);
    }
    validatePsychologicalPole(traitData.low, traitKey, 'low', jsonPath);

    // Validate high pole
    if (!traitData.high || typeof traitData.high !== 'object') {
      throw new Error(`Missing or invalid 'high' pole for trait '${traitKey}' in ${jsonPath}`);
    }
    validatePsychologicalPole(traitData.high, traitKey, 'high', jsonPath);
  }

  return data;
}

/**
 * Validates a single psychological framework pole structure.
 * 
 * @private
 * @param {Object} pole - Pole data to validate
 * @param {string} traitKey - Trait identifier
 * @param {string} poleName - 'low' or 'high'
 * @param {string} jsonPath - Path to JSON file (for error messages)
 * @throws {Error} If required fields are missing or invalid
 */
function validatePsychologicalPole(pole, traitKey, poleName, jsonPath) {
  const requiredFields = [
    { name: 'name', type: 'string' },
    { name: 'key_strengths', type: 'array' },
    { name: 'risk_factors', type: 'array' },
    { name: 'suggestions', type: 'array' },
    { name: 'how_to_use_strengths', type: 'array' },
    { name: 'accommodations', type: 'array' }
  ];

  for (const field of requiredFields) {
    if (!(field.name in pole)) {
      throw new Error(
        `Missing required field '${field.name}' in trait '${traitKey}' ${poleName} pole in ${jsonPath}`
      );
    }

    if (field.type === 'string' && typeof pole[field.name] !== 'string') {
      throw new Error(
        `Field '${field.name}' must be a string in trait '${traitKey}' ${poleName} pole in ${jsonPath}`
      );
    }

    if (field.type === 'array' && !Array.isArray(pole[field.name])) {
      throw new Error(
        `Field '${field.name}' must be an array in trait '${traitKey}' ${poleName} pole in ${jsonPath}`
      );
    }

    // Validate array is not empty
    if (field.type === 'array' && pole[field.name].length === 0) {
      throw new Error(
        `Field '${field.name}' cannot be empty in trait '${traitKey}' ${poleName} pole in ${jsonPath}`
      );
    }
  }
}

/**
 * Parses behavioral indicators JSON file and returns structured data.
 * 
 * Expected JSON Schema:
 * {
 *   "version": "psy-v1",
 *   "language": "en",
 *   "traits": {
 *     "<traitKey>": {
 *       "scale": { "low": "string", "high": "string" },
 *       "measures": "string",
 *       "entrepreneurial_relevance": "string",
 *       "behaviors": [
 *         {
 *           "id": "string",
 *           "name": "string",
 *           "description": "string",
 *           "low": "string",
 *           "mid": "string",
 *           "high": "string"
 *         }
 *       ]
 *     }
 *   }
 * }
 * 
 * @param {string} jsonPath - Path to behavioral indicators JSON file
 * @returns {Object} Parsed behavioral data keyed by trait
 * @throws {Error} If file doesn't exist, path is invalid, JSON is malformed, or required fields are missing
 * 
 * @example
 * const indicators = parseBehavioralIndicators('./data/behavioral-indicators.json');
 * console.log(indicators.traits.speed.measures); // "Decision latency and action initiation speed"
 */
export function parseBehavioralIndicators(jsonPath) {
  // Validate input path
  if (!jsonPath || typeof jsonPath !== 'string') {
    throw new Error('Invalid file path: path must be a non-empty string');
  }

  // Check if file exists
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File not found: ${jsonPath}`);
  }

  // Read and parse JSON
  let data;
  try {
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    data = JSON.parse(fileContent);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Malformed JSON in ${jsonPath}: ${error.message}`);
    }
    throw new Error(`Failed to read file ${jsonPath}: ${error.message}`);
  }

  // Validate required top-level fields
  if (!data.version) {
    throw new Error(`Missing required field 'version' in ${jsonPath}`);
  }
  if (!data.language) {
    throw new Error(`Missing required field 'language' in ${jsonPath}`);
  }
  if (!data.traits || typeof data.traits !== 'object') {
    throw new Error(`Missing or invalid 'traits' object in ${jsonPath}`);
  }

  // Validate each trait structure
  for (const [traitKey, traitData] of Object.entries(data.traits)) {
    // Validate scale
    if (!traitData.scale || typeof traitData.scale !== 'object') {
      throw new Error(`Missing or invalid 'scale' object for trait '${traitKey}' in ${jsonPath}`);
    }
    if (!traitData.scale.low || typeof traitData.scale.low !== 'string') {
      throw new Error(`Missing or invalid 'scale.low' for trait '${traitKey}' in ${jsonPath}`);
    }
    if (!traitData.scale.high || typeof traitData.scale.high !== 'string') {
      throw new Error(`Missing or invalid 'scale.high' for trait '${traitKey}' in ${jsonPath}`);
    }

    // Validate measures
    if (!traitData.measures || typeof traitData.measures !== 'string') {
      throw new Error(`Missing or invalid 'measures' field for trait '${traitKey}' in ${jsonPath}`);
    }

    // Validate entrepreneurial_relevance
    if (!traitData.entrepreneurial_relevance || typeof traitData.entrepreneurial_relevance !== 'string') {
      throw new Error(`Missing or invalid 'entrepreneurial_relevance' field for trait '${traitKey}' in ${jsonPath}`);
    }

    // Validate behaviors array
    if (!Array.isArray(traitData.behaviors)) {
      throw new Error(`Missing or invalid 'behaviors' array for trait '${traitKey}' in ${jsonPath}`);
    }
    if (traitData.behaviors.length === 0) {
      throw new Error(`'behaviors' array cannot be empty for trait '${traitKey}' in ${jsonPath}`);
    }

    // Validate each behavior
    for (let i = 0; i < traitData.behaviors.length; i++) {
      const behavior = traitData.behaviors[i];
      validateBehavior(behavior, traitKey, i, jsonPath);
    }
  }

  return data;
}

/**
 * Validates a single behavioral indicator structure.
 * 
 * @private
 * @param {Object} behavior - Behavior data to validate
 * @param {string} traitKey - Trait identifier
 * @param {number} index - Behavior index in array
 * @param {string} jsonPath - Path to JSON file (for error messages)
 * @throws {Error} If required fields are missing or invalid
 */
function validateBehavior(behavior, traitKey, index, jsonPath) {
  const requiredFields = ['id', 'name', 'description', 'low', 'mid', 'high'];

  for (const field of requiredFields) {
    if (!(field in behavior)) {
      throw new Error(
        `Missing required field '${field}' in behavior[${index}] for trait '${traitKey}' in ${jsonPath}`
      );
    }

    if (typeof behavior[field] !== 'string') {
      throw new Error(
        `Field '${field}' must be a string in behavior[${index}] for trait '${traitKey}' in ${jsonPath}`
      );
    }

    if (behavior[field].trim() === '') {
      throw new Error(
        `Field '${field}' cannot be empty in behavior[${index}] for trait '${traitKey}' in ${jsonPath}`
      );
    }
  }
}

/**
 * Validates psychological framework structure.
 * 
 * Checks that the framework data has the correct structure with all required fields
 * and proper types. Collects all validation errors before returning (does not fail fast).
 * 
 * @param {Object} frameworkData - Parsed framework data from parsePsychologicalFramework()
 * @returns {Object} Validation result with { valid: boolean, errors: string[] }
 * 
 * @example
 * const framework = parsePsychologicalFramework('./data/framework.json');
 * const result = validateFrameworkStructure(framework);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 */
export function validateFrameworkStructure(frameworkData) {
  const errors = [];

  // Validate input is an object
  if (!frameworkData || typeof frameworkData !== 'object') {
    errors.push('Framework data must be an object');
    return { valid: false, errors };
  }

  // Validate top-level fields
  if (!frameworkData.version || typeof frameworkData.version !== 'string') {
    errors.push('Missing or invalid "version" field (must be a non-empty string)');
  }

  if (!frameworkData.language || typeof frameworkData.language !== 'string') {
    errors.push('Missing or invalid "language" field (must be a non-empty string)');
  }

  if (!frameworkData.traits || typeof frameworkData.traits !== 'object') {
    errors.push('Missing or invalid "traits" field (must be an object)');
    return { valid: errors.length === 0, errors };
  }

  // Validate each trait
  for (const [traitKey, traitData] of Object.entries(frameworkData.traits)) {
    if (!traitData || typeof traitData !== 'object') {
      errors.push(`Trait "${traitKey}" must be an object`);
      continue;
    }

    // Validate low pole
    if (!traitData.low || typeof traitData.low !== 'object') {
      errors.push(`Trait "${traitKey}" missing or invalid "low" pole (must be an object)`);
    } else {
      validateFrameworkPoleStructure(traitData.low, traitKey, 'low', errors);
    }

    // Validate high pole
    if (!traitData.high || typeof traitData.high !== 'object') {
      errors.push(`Trait "${traitKey}" missing or invalid "high" pole (must be an object)`);
    } else {
      validateFrameworkPoleStructure(traitData.high, traitKey, 'high', errors);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a single psychological framework pole structure.
 * Collects errors in the provided errors array.
 * 
 * @private
 * @param {Object} pole - Pole data to validate
 * @param {string} traitKey - Trait identifier
 * @param {string} poleName - 'low' or 'high'
 * @param {string[]} errors - Array to collect validation errors
 */
function validateFrameworkPoleStructure(pole, traitKey, poleName, errors) {
  const requiredFields = [
    { name: 'name', type: 'string' },
    { name: 'key_strengths', type: 'array' },
    { name: 'risk_factors', type: 'array' },
    { name: 'suggestions', type: 'array' },
    { name: 'how_to_use_strengths', type: 'array' },
    { name: 'accommodations', type: 'array' }
  ];

  for (const field of requiredFields) {
    const fieldPath = `Trait "${traitKey}" ${poleName} pole field "${field.name}"`;

    if (!(field.name in pole)) {
      errors.push(`${fieldPath} is missing`);
      continue;
    }

    if (field.type === 'string') {
      if (typeof pole[field.name] !== 'string') {
        errors.push(`${fieldPath} must be a string`);
      } else if (pole[field.name].trim() === '') {
        errors.push(`${fieldPath} cannot be empty`);
      }
    }

    if (field.type === 'array') {
      if (!Array.isArray(pole[field.name])) {
        errors.push(`${fieldPath} must be an array`);
      } else if (pole[field.name].length === 0) {
        errors.push(`${fieldPath} cannot be an empty array`);
      } else {
        // Validate all array elements are non-empty strings
        for (let i = 0; i < pole[field.name].length; i++) {
          if (typeof pole[field.name][i] !== 'string') {
            errors.push(`${fieldPath}[${i}] must be a string`);
          } else if (pole[field.name][i].trim() === '') {
            errors.push(`${fieldPath}[${i}] cannot be empty`);
          }
        }
      }
    }
  }
}

/**
 * Validates behavioral indicators structure.
 * 
 * Checks that the behavioral data has the correct structure with all required fields
 * and proper types. Collects all validation errors before returning (does not fail fast).
 * 
 * @param {Object} behavioralData - Parsed behavioral data from parseBehavioralIndicators()
 * @returns {Object} Validation result with { valid: boolean, errors: string[] }
 * 
 * @example
 * const indicators = parseBehavioralIndicators('./data/indicators.json');
 * const result = validateBehavioralStructure(indicators);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 */
export function validateBehavioralStructure(behavioralData) {
  const errors = [];

  // Validate input is an object
  if (!behavioralData || typeof behavioralData !== 'object') {
    errors.push('Behavioral data must be an object');
    return { valid: false, errors };
  }

  // Validate top-level fields
  if (!behavioralData.version || typeof behavioralData.version !== 'string') {
    errors.push('Missing or invalid "version" field (must be a non-empty string)');
  }

  if (!behavioralData.language || typeof behavioralData.language !== 'string') {
    errors.push('Missing or invalid "language" field (must be a non-empty string)');
  }

  if (!behavioralData.traits || typeof behavioralData.traits !== 'object') {
    errors.push('Missing or invalid "traits" field (must be an object)');
    return { valid: errors.length === 0, errors };
  }

  // Validate each trait
  for (const [traitKey, traitData] of Object.entries(behavioralData.traits)) {
    if (!traitData || typeof traitData !== 'object') {
      errors.push(`Trait "${traitKey}" must be an object`);
      continue;
    }

    // Validate scale
    if (!traitData.scale || typeof traitData.scale !== 'object') {
      errors.push(`Trait "${traitKey}" missing or invalid "scale" field (must be an object)`);
    } else {
      if (!traitData.scale.low || typeof traitData.scale.low !== 'string') {
        errors.push(`Trait "${traitKey}" scale.low must be a non-empty string`);
      }
      if (!traitData.scale.high || typeof traitData.scale.high !== 'string') {
        errors.push(`Trait "${traitKey}" scale.high must be a non-empty string`);
      }
    }

    // Validate measures
    if (!traitData.measures || typeof traitData.measures !== 'string') {
      errors.push(`Trait "${traitKey}" missing or invalid "measures" field (must be a non-empty string)`);
    }

    // Validate entrepreneurial_relevance
    if (!traitData.entrepreneurial_relevance || typeof traitData.entrepreneurial_relevance !== 'string') {
      errors.push(`Trait "${traitKey}" missing or invalid "entrepreneurial_relevance" field (must be a non-empty string)`);
    }

    // Validate behaviors array
    if (!Array.isArray(traitData.behaviors)) {
      errors.push(`Trait "${traitKey}" missing or invalid "behaviors" field (must be an array)`);
      continue;
    }

    if (traitData.behaviors.length === 0) {
      errors.push(`Trait "${traitKey}" behaviors array cannot be empty`);
      continue;
    }

    // Validate each behavior
    for (let i = 0; i < traitData.behaviors.length; i++) {
      const behavior = traitData.behaviors[i];
      const behaviorPath = `Trait "${traitKey}" behaviors[${i}]`;

      if (!behavior || typeof behavior !== 'object') {
        errors.push(`${behaviorPath} must be an object`);
        continue;
      }

      const requiredBehaviorFields = ['id', 'name', 'description', 'low', 'mid', 'high'];

      for (const field of requiredBehaviorFields) {
        if (!(field in behavior)) {
          errors.push(`${behaviorPath} missing field "${field}"`);
        } else if (typeof behavior[field] !== 'string') {
          errors.push(`${behaviorPath} field "${field}" must be a string`);
        } else if (behavior[field].trim() === '') {
          errors.push(`${behaviorPath} field "${field}" cannot be empty`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Integrates parsed psychological framework and behavioral indicator data into TRAIT_GUIDE.
 * 
 * This function mutates TRAIT_GUIDE in place by mapping JSON fields to the TRAIT_GUIDE structure.
 * It preserves all existing fields and adds new psychological framework and behavioral indicator data.
 * 
 * Field Mapping - Psychological Framework JSON → TRAIT_GUIDE:
 * - traits[traitKey].low.name → TRAIT_GUIDE[traitKey].low.compassionateName
 * - traits[traitKey].low.key_strengths → TRAIT_GUIDE[traitKey].low.keyStrengths
 * - traits[traitKey].low.risk_factors → TRAIT_GUIDE[traitKey].low.riskFactors
 * - traits[traitKey].low.suggestions → TRAIT_GUIDE[traitKey].low.suggestions
 * - traits[traitKey].low.how_to_use_strengths → TRAIT_GUIDE[traitKey].low.howToUseStrengths
 * - traits[traitKey].low.accommodations → TRAIT_GUIDE[traitKey].low.accommodations
 * - (Same mapping for high pole)
 * 
 * Field Mapping - Behavioral Indicators JSON → TRAIT_GUIDE:
 * - traits[traitKey].measures → TRAIT_GUIDE[traitKey].measures
 * - traits[traitKey].entrepreneurial_relevance → TRAIT_GUIDE[traitKey].entrepreneurialRelevance
 * - traits[traitKey].behaviors → TRAIT_GUIDE[traitKey].behavioralIndicators
 * 
 * @param {Object} psychFramework - Parsed psychological framework data from parsePsychologicalFramework()
 * @param {Object} behavioralData - Parsed behavioral indicators data from parseBehavioralIndicators()
 * @returns {void} Mutates TRAIT_GUIDE in place
 * 
 * @example
 * const psychFramework = parsePsychologicalFramework('./data/psychological-framework.json');
 * const behavioralData = parseBehavioralIndicators('./data/behavioral-indicators.json');
 * extendTraitGuide(psychFramework, behavioralData);
 * // TRAIT_GUIDE now contains all psychological framework and behavioral indicator data
 */
export function extendTraitGuide(psychFramework, behavioralData) {
  // Integrate psychological framework data
  if (psychFramework && psychFramework.traits) {
    for (const [traitKey, traitData] of Object.entries(psychFramework.traits)) {
      // Check if trait exists in TRAIT_GUIDE
      if (!TRAIT_GUIDE[traitKey]) {
        console.warn(`Warning: Trait "${traitKey}" from psychological framework not found in TRAIT_GUIDE. Skipping.`);
        continue;
      }

      // Map low pole fields
      if (traitData.low) {
        TRAIT_GUIDE[traitKey].low.compassionateName = traitData.low.name;
        TRAIT_GUIDE[traitKey].low.keyStrengths = traitData.low.key_strengths;
        TRAIT_GUIDE[traitKey].low.riskFactors = traitData.low.risk_factors;
        TRAIT_GUIDE[traitKey].low.suggestions = traitData.low.suggestions;
        TRAIT_GUIDE[traitKey].low.howToUseStrengths = traitData.low.how_to_use_strengths;
        TRAIT_GUIDE[traitKey].low.accommodations = traitData.low.accommodations;
      }

      // Map high pole fields
      if (traitData.high) {
        TRAIT_GUIDE[traitKey].high.compassionateName = traitData.high.name;
        TRAIT_GUIDE[traitKey].high.keyStrengths = traitData.high.key_strengths;
        TRAIT_GUIDE[traitKey].high.riskFactors = traitData.high.risk_factors;
        TRAIT_GUIDE[traitKey].high.suggestions = traitData.high.suggestions;
        TRAIT_GUIDE[traitKey].high.howToUseStrengths = traitData.high.how_to_use_strengths;
        TRAIT_GUIDE[traitKey].high.accommodations = traitData.high.accommodations;
      }
    }
  }

  // Integrate behavioral indicators data
  if (behavioralData && behavioralData.traits) {
    for (const [traitKey, traitData] of Object.entries(behavioralData.traits)) {
      // Check if trait exists in TRAIT_GUIDE
      if (!TRAIT_GUIDE[traitKey]) {
        console.warn(`Warning: Trait "${traitKey}" from behavioral indicators not found in TRAIT_GUIDE. Skipping.`);
        continue;
      }

      // Map behavioral indicator fields
      TRAIT_GUIDE[traitKey].measures = traitData.measures;
      TRAIT_GUIDE[traitKey].entrepreneurialRelevance = traitData.entrepreneurial_relevance;
      TRAIT_GUIDE[traitKey].behavioralIndicators = traitData.behaviors;
    }
  }
}
