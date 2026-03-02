/**
 * Unit tests for framework-parser module
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { 
  parsePsychologicalFramework, 
  parseBehavioralIndicators,
  validateFrameworkStructure, 
  validateBehavioralStructure 
} from '../../../lib/dna-report-chunked/framework-parser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data directory
const TEST_DATA_DIR = path.join(__dirname, '__test-data__');

// Setup and teardown for test files
beforeAll(() => {
  // Create test data directory
  if (!fs.existsSync(TEST_DATA_DIR)) {
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
});

afterAll(() => {
  // Clean up test data directory
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
});

describe('parsePsychologicalFramework', () => {
  it('should successfully parse valid psychological framework JSON', () => {
    const validFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          low: {
            name: 'Thoughtful Decision-Maker',
            key_strengths: ['Reduces costly mistakes', 'Builds confidence', 'Identifies risks'],
            risk_factors: ['May feel pressure', 'Can experience anxiety'],
            suggestions: ['Establish decision frameworks', 'Communicate timeline', 'Practice good enough'],
            how_to_use_strengths: ['Position as quality control', 'Take ownership of high-stakes'],
            accommodations: ['Request 24-48 hour windows', 'Use decision matrices']
          },
          high: {
            name: 'Decisive Action-Taker',
            key_strengths: ['Captures opportunities', 'Maintains momentum', 'Iterates quickly'],
            risk_factors: ['May feel restless', 'Can make decisions without input'],
            suggestions: ['Build decision checklist', 'Partner with detail-oriented', 'Practice 70% rule'],
            how_to_use_strengths: ['Take point on time-sensitive', 'Lead rapid prototyping'],
            accommodations: ['Create fast-feedback loops', 'Use reversible frameworks']
          }
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'valid-psych-framework.json');
    fs.writeFileSync(testFile, JSON.stringify(validFramework, null, 2));

    const result = parsePsychologicalFramework(testFile);

    expect(result.version).toBe('psy-v1');
    expect(result.language).toBe('en');
    expect(result.traits.speed.low.name).toBe('Thoughtful Decision-Maker');
    expect(result.traits.speed.low.key_strengths).toHaveLength(3);
    expect(result.traits.speed.high.name).toBe('Decisive Action-Taker');
  });

  it('should throw error for missing file', () => {
    const nonExistentFile = path.join(TEST_DATA_DIR, 'does-not-exist.json');

    expect(() => parsePsychologicalFramework(nonExistentFile)).toThrow('File not found');
  });

  it('should throw error for invalid file path', () => {
    expect(() => parsePsychologicalFramework('')).toThrow('Invalid file path');
    expect(() => parsePsychologicalFramework(null)).toThrow('Invalid file path');
    expect(() => parsePsychologicalFramework(undefined)).toThrow('Invalid file path');
    expect(() => parsePsychologicalFramework(123)).toThrow('Invalid file path');
  });

  it('should throw error for malformed JSON', () => {
    const malformedFile = path.join(TEST_DATA_DIR, 'malformed-psych.json');
    fs.writeFileSync(malformedFile, '{ "version": "psy-v1", invalid json }');

    expect(() => parsePsychologicalFramework(malformedFile)).toThrow('Malformed JSON');
  });

  it('should throw error for missing version field', () => {
    const invalidFramework = {
      language: 'en',
      traits: {}
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-version-psych.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidFramework));

    expect(() => parsePsychologicalFramework(testFile)).toThrow("Missing required field 'version'");
  });

  it('should throw error for missing language field', () => {
    const invalidFramework = {
      version: 'psy-v1',
      traits: {}
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-language-psych.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidFramework));

    expect(() => parsePsychologicalFramework(testFile)).toThrow("Missing required field 'language'");
  });

  it('should throw error for missing traits object', () => {
    const invalidFramework = {
      version: 'psy-v1',
      language: 'en'
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-traits-psych.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidFramework));

    expect(() => parsePsychologicalFramework(testFile)).toThrow("Missing or invalid 'traits' object");
  });

  it('should throw error for missing low pole', () => {
    const invalidFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          high: {
            name: 'Test',
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          }
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-low-pole-psych.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidFramework));

    expect(() => parsePsychologicalFramework(testFile)).toThrow("Missing or invalid 'low' pole for trait 'speed'");
  });

  it('should throw error for missing high pole', () => {
    const invalidFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          low: {
            name: 'Test',
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          }
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-high-pole-psych.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidFramework));

    expect(() => parsePsychologicalFramework(testFile)).toThrow("Missing or invalid 'high' pole for trait 'speed'");
  });

  it('should throw error for missing required pole fields', () => {
    const invalidFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          low: {
            name: 'Test',
            key_strengths: ['Strength 1']
            // Missing risk_factors, suggestions, how_to_use_strengths, accommodations
          },
          high: {
            name: 'Test',
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          }
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-pole-fields-psych.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidFramework));

    expect(() => parsePsychologicalFramework(testFile)).toThrow("Missing required field 'risk_factors'");
  });

  it('should throw error for empty array fields', () => {
    const invalidFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          low: {
            name: 'Test',
            key_strengths: [],  // Empty array
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          },
          high: {
            name: 'Test',
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          }
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'empty-array-psych.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidFramework));

    expect(() => parsePsychologicalFramework(testFile)).toThrow("Field 'key_strengths' cannot be empty");
  });

  it('should throw error for wrong field types', () => {
    const invalidFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          low: {
            name: 123,  // Should be string
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          },
          high: {
            name: 'Test',
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          }
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'wrong-type-psych.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidFramework));

    expect(() => parsePsychologicalFramework(testFile)).toThrow("Field 'name' must be a string");
  });
});

describe('parseBehavioralIndicators', () => {
  it('should successfully parse valid behavioral indicators JSON', () => {
    const validBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing',
            high: 'Fast-Cycle Decision-Making'
          },
          measures: 'Decision latency and action initiation speed',
          entrepreneurial_relevance: 'Critical for market timing and competitive response',
          behaviors: [
            {
              id: 'decision_latency',
              name: 'Decision Latency',
              description: 'Time from information receipt to decision commitment',
              low: 'Takes 3-5 days to make decisions',
              mid: 'Makes decisions within 24-48 hours',
              high: 'Makes decisions within hours'
            }
          ]
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'valid-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(validBehavioral, null, 2));

    const result = parseBehavioralIndicators(testFile);

    expect(result.version).toBe('psy-v1');
    expect(result.language).toBe('en');
    expect(result.traits.speed.measures).toBe('Decision latency and action initiation speed');
    expect(result.traits.speed.behaviors).toHaveLength(1);
    expect(result.traits.speed.behaviors[0].id).toBe('decision_latency');
  });

  it('should throw error for missing file', () => {
    const nonExistentFile = path.join(TEST_DATA_DIR, 'does-not-exist-behavioral.json');

    expect(() => parseBehavioralIndicators(nonExistentFile)).toThrow('File not found');
  });

  it('should throw error for invalid file path', () => {
    expect(() => parseBehavioralIndicators('')).toThrow('Invalid file path');
    expect(() => parseBehavioralIndicators(null)).toThrow('Invalid file path');
    expect(() => parseBehavioralIndicators(undefined)).toThrow('Invalid file path');
    expect(() => parseBehavioralIndicators(123)).toThrow('Invalid file path');
  });

  it('should throw error for malformed JSON', () => {
    const malformedFile = path.join(TEST_DATA_DIR, 'malformed-behavioral.json');
    fs.writeFileSync(malformedFile, '{ "version": "psy-v1", invalid json }');

    expect(() => parseBehavioralIndicators(malformedFile)).toThrow('Malformed JSON');
  });

  it('should throw error for missing version field', () => {
    const invalidBehavioral = {
      language: 'en',
      traits: {}
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-version-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidBehavioral));

    expect(() => parseBehavioralIndicators(testFile)).toThrow("Missing required field 'version'");
  });

  it('should throw error for missing language field', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      traits: {}
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-language-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidBehavioral));

    expect(() => parseBehavioralIndicators(testFile)).toThrow("Missing required field 'language'");
  });

  it('should throw error for missing traits object', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      language: 'en'
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-traits-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidBehavioral));

    expect(() => parseBehavioralIndicators(testFile)).toThrow("Missing or invalid 'traits' object");
  });

  it('should throw error for missing scale object', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          measures: 'Test',
          entrepreneurial_relevance: 'Test',
          behaviors: []
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-scale-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidBehavioral));

    expect(() => parseBehavioralIndicators(testFile)).toThrow("Missing or invalid 'scale' object for trait 'speed'");
  });

  it('should throw error for missing scale.low', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            high: 'Fast-Cycle Decision-Making'
          },
          measures: 'Test',
          entrepreneurial_relevance: 'Test',
          behaviors: []
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-scale-low-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidBehavioral));

    expect(() => parseBehavioralIndicators(testFile)).toThrow("Missing or invalid 'scale.low' for trait 'speed'");
  });

  it('should throw error for missing scale.high', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing'
          },
          measures: 'Test',
          entrepreneurial_relevance: 'Test',
          behaviors: []
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-scale-high-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidBehavioral));

    expect(() => parseBehavioralIndicators(testFile)).toThrow("Missing or invalid 'scale.high' for trait 'speed'");
  });

  it('should throw error for missing measures field', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing',
            high: 'Fast-Cycle Decision-Making'
          },
          entrepreneurial_relevance: 'Test',
          behaviors: []
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-measures-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidBehavioral));

    expect(() => parseBehavioralIndicators(testFile)).toThrow("Missing or invalid 'measures' field for trait 'speed'");
  });

  it('should throw error for missing entrepreneurial_relevance field', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing',
            high: 'Fast-Cycle Decision-Making'
          },
          measures: 'Test',
          behaviors: []
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-relevance-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidBehavioral));

    expect(() => parseBehavioralIndicators(testFile)).toThrow("Missing or invalid 'entrepreneurial_relevance' field for trait 'speed'");
  });

  it('should throw error for empty behaviors array', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing',
            high: 'Fast-Cycle Decision-Making'
          },
          measures: 'Test',
          entrepreneurial_relevance: 'Test',
          behaviors: []
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'empty-behaviors-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidBehavioral));

    expect(() => parseBehavioralIndicators(testFile)).toThrow("'behaviors' array cannot be empty for trait 'speed'");
  });

  it('should throw error for missing behavior fields', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing',
            high: 'Fast-Cycle Decision-Making'
          },
          measures: 'Test',
          entrepreneurial_relevance: 'Test',
          behaviors: [
            {
              id: 'test',
              name: 'Test'
              // Missing description, low, mid, high
            }
          ]
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'missing-behavior-fields-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidBehavioral));

    expect(() => parseBehavioralIndicators(testFile)).toThrow("Missing required field 'description' in behavior[0]");
  });

  it('should throw error for empty behavior field strings', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing',
            high: 'Fast-Cycle Decision-Making'
          },
          measures: 'Test',
          entrepreneurial_relevance: 'Test',
          behaviors: [
            {
              id: 'test',
              name: 'Test',
              description: '',  // Empty string
              low: 'Test',
              mid: 'Test',
              high: 'Test'
            }
          ]
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'empty-behavior-field-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidBehavioral));

    expect(() => parseBehavioralIndicators(testFile)).toThrow("Field 'description' cannot be empty in behavior[0]");
  });

  it('should throw error for wrong behavior field types', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing',
            high: 'Fast-Cycle Decision-Making'
          },
          measures: 'Test',
          entrepreneurial_relevance: 'Test',
          behaviors: [
            {
              id: 123,  // Should be string
              name: 'Test',
              description: 'Test',
              low: 'Test',
              mid: 'Test',
              high: 'Test'
            }
          ]
        }
      }
    };

    const testFile = path.join(TEST_DATA_DIR, 'wrong-behavior-type-behavioral.json');
    fs.writeFileSync(testFile, JSON.stringify(invalidBehavioral));

    expect(() => parseBehavioralIndicators(testFile)).toThrow("Field 'id' must be a string in behavior[0]");
  });
});

describe('validateFrameworkStructure', () => {
  it('should return valid for correct framework structure', () => {
    const validFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          low: {
            name: 'Thoughtful Decision-Maker',
            key_strengths: ['Strength 1', 'Strength 2', 'Strength 3'],
            risk_factors: ['Risk 1', 'Risk 2'],
            suggestions: ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'],
            how_to_use_strengths: ['How 1', 'How 2'],
            accommodations: ['Accommodation 1', 'Accommodation 2']
          },
          high: {
            name: 'Decisive Action-Taker',
            key_strengths: ['Strength 1', 'Strength 2', 'Strength 3'],
            risk_factors: ['Risk 1', 'Risk 2'],
            suggestions: ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'],
            how_to_use_strengths: ['How 1', 'How 2'],
            accommodations: ['Accommodation 1', 'Accommodation 2']
          }
        }
      }
    };

    const result = validateFrameworkStructure(validFramework);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should collect all errors for invalid framework structure', () => {
    const invalidFramework = {
      version: 'psy-v1',
      // missing language
      traits: {
        speed: {
          low: {
            name: 'Test',
            // missing key_strengths
            risk_factors: [],  // empty array
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          },
          high: {
            // missing name
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: 'not an array',  // wrong type
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          }
        }
      }
    };

    const result = validateFrameworkStructure(invalidFramework);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('language'))).toBe(true);
    expect(result.errors.some(e => e.includes('key_strengths'))).toBe(true);
    expect(result.errors.some(e => e.includes('risk_factors'))).toBe(true);
    expect(result.errors.some(e => e.includes('name'))).toBe(true);
    expect(result.errors.some(e => e.includes('suggestions'))).toBe(true);
  });

  it('should detect missing traits object', () => {
    const invalidFramework = {
      version: 'psy-v1',
      language: 'en'
      // missing traits
    };

    const result = validateFrameworkStructure(invalidFramework);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('traits'))).toBe(true);
  });

  it('should detect empty strings in arrays', () => {
    const invalidFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          low: {
            name: 'Test',
            key_strengths: ['Strength 1', '', 'Strength 3'],  // empty string
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          },
          high: {
            name: 'Test',
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          }
        }
      }
    };

    const result = validateFrameworkStructure(invalidFramework);
    expect(result.valid).toBe(false);
    // Check that the error mentions the field and array index
    expect(result.errors.some(e => e.includes('key_strengths') && e.includes('[1]'))).toBe(true);
  });
});

describe('validateBehavioralStructure', () => {
  it('should return valid for correct behavioral structure', () => {
    const validBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing',
            high: 'Fast-Cycle Decision-Making'
          },
          measures: 'Decision latency and action initiation speed',
          entrepreneurial_relevance: 'Critical for market timing',
          behaviors: [
            {
              id: 'decision_latency',
              name: 'Decision Latency',
              description: 'Time from information to decision',
              low: 'Takes 3-5 days',
              mid: 'Takes 24-48 hours',
              high: 'Takes hours'
            }
          ]
        }
      }
    };

    const result = validateBehavioralStructure(validBehavioral);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should collect all errors for invalid behavioral structure', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      // missing language
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing'
            // missing high
          },
          // missing measures
          entrepreneurial_relevance: 'Critical for market timing',
          behaviors: [
            {
              id: 'decision_latency',
              // missing name
              description: 'Time from information to decision',
              low: 'Takes 3-5 days',
              mid: '',  // empty string
              high: 'Takes hours'
            }
          ]
        }
      }
    };

    const result = validateBehavioralStructure(invalidBehavioral);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('language'))).toBe(true);
    expect(result.errors.some(e => e.includes('scale.high'))).toBe(true);
    expect(result.errors.some(e => e.includes('measures'))).toBe(true);
    expect(result.errors.some(e => e.includes('name'))).toBe(true);
    expect(result.errors.some(e => e.includes('mid'))).toBe(true);
  });

  it('should detect empty behaviors array', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing',
            high: 'Fast-Cycle Decision-Making'
          },
          measures: 'Decision latency',
          entrepreneurial_relevance: 'Critical',
          behaviors: []  // empty array
        }
      }
    };

    const result = validateBehavioralStructure(invalidBehavioral);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('behaviors array cannot be empty'))).toBe(true);
  });

  it('should detect missing behavior fields', () => {
    const invalidBehavioral = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing',
            high: 'Fast-Cycle Decision-Making'
          },
          measures: 'Decision latency',
          entrepreneurial_relevance: 'Critical',
          behaviors: [
            {
              id: 'decision_latency',
              name: 'Decision Latency',
              description: 'Time from information to decision'
              // missing low, mid, high
            }
          ]
        }
      }
    };

    const result = validateBehavioralStructure(invalidBehavioral);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('low'))).toBe(true);
    expect(result.errors.some(e => e.includes('mid'))).toBe(true);
    expect(result.errors.some(e => e.includes('high'))).toBe(true);
  });
});


describe('extendTraitGuide', () => {
  // Import the function and TRAIT_GUIDE
  let extendTraitGuide, TRAIT_GUIDE;

  beforeEach(async () => {
    // Dynamically import to get fresh instances for each test
    const parserModule = await import('../../../lib/dna-report-chunked/framework-parser.js');
    const traitModule = await import('../../../lib/dna-report-chunked/trait-definitions.js');
    extendTraitGuide = parserModule.extendTraitGuide;
    TRAIT_GUIDE = traitModule.TRAIT_GUIDE;

    // Reset TRAIT_GUIDE fields to undefined for testing
    for (const traitKey in TRAIT_GUIDE) {
      TRAIT_GUIDE[traitKey].measures = undefined;
      TRAIT_GUIDE[traitKey].entrepreneurialRelevance = undefined;
      TRAIT_GUIDE[traitKey].behavioralIndicators = undefined;
      
      if (TRAIT_GUIDE[traitKey].low) {
        delete TRAIT_GUIDE[traitKey].low.compassionateName;
        delete TRAIT_GUIDE[traitKey].low.keyStrengths;
        delete TRAIT_GUIDE[traitKey].low.riskFactors;
        delete TRAIT_GUIDE[traitKey].low.suggestions;
        delete TRAIT_GUIDE[traitKey].low.howToUseStrengths;
        delete TRAIT_GUIDE[traitKey].low.accommodations;
      }
      
      if (TRAIT_GUIDE[traitKey].high) {
        delete TRAIT_GUIDE[traitKey].high.compassionateName;
        delete TRAIT_GUIDE[traitKey].high.keyStrengths;
        delete TRAIT_GUIDE[traitKey].high.riskFactors;
        delete TRAIT_GUIDE[traitKey].high.suggestions;
        delete TRAIT_GUIDE[traitKey].high.howToUseStrengths;
        delete TRAIT_GUIDE[traitKey].high.accommodations;
      }
    }
  });

  it('should integrate psychological framework data into TRAIT_GUIDE', () => {
    const psychFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          low: {
            name: 'Thoughtful Decision-Maker',
            key_strengths: ['Reduces costly mistakes', 'Builds confidence', 'Identifies risks'],
            risk_factors: ['May feel pressure', 'Can experience anxiety'],
            suggestions: ['Establish decision frameworks', 'Communicate timeline', 'Practice good enough'],
            how_to_use_strengths: ['Position as quality control', 'Take ownership of high-stakes'],
            accommodations: ['Request 24-48 hour windows', 'Use decision matrices']
          },
          high: {
            name: 'Decisive Action-Taker',
            key_strengths: ['Captures opportunities', 'Maintains momentum', 'Iterates quickly'],
            risk_factors: ['May feel restless', 'Can make decisions without input'],
            suggestions: ['Build decision checklist', 'Partner with detail-oriented', 'Practice 70% rule'],
            how_to_use_strengths: ['Take point on time-sensitive', 'Lead rapid prototyping'],
            accommodations: ['Create fast-feedback loops', 'Use reversible frameworks']
          }
        }
      }
    };

    const behavioralData = {
      version: 'psy-v1',
      language: 'en',
      traits: {}
    };

    extendTraitGuide(psychFramework, behavioralData);

    // Verify low pole mapping
    expect(TRAIT_GUIDE.speed.low.compassionateName).toBe('Thoughtful Decision-Maker');
    expect(TRAIT_GUIDE.speed.low.keyStrengths).toEqual(['Reduces costly mistakes', 'Builds confidence', 'Identifies risks']);
    expect(TRAIT_GUIDE.speed.low.riskFactors).toEqual(['May feel pressure', 'Can experience anxiety']);
    expect(TRAIT_GUIDE.speed.low.suggestions).toEqual(['Establish decision frameworks', 'Communicate timeline', 'Practice good enough']);
    expect(TRAIT_GUIDE.speed.low.howToUseStrengths).toEqual(['Position as quality control', 'Take ownership of high-stakes']);
    expect(TRAIT_GUIDE.speed.low.accommodations).toEqual(['Request 24-48 hour windows', 'Use decision matrices']);

    // Verify high pole mapping
    expect(TRAIT_GUIDE.speed.high.compassionateName).toBe('Decisive Action-Taker');
    expect(TRAIT_GUIDE.speed.high.keyStrengths).toEqual(['Captures opportunities', 'Maintains momentum', 'Iterates quickly']);
    expect(TRAIT_GUIDE.speed.high.riskFactors).toEqual(['May feel restless', 'Can make decisions without input']);
    expect(TRAIT_GUIDE.speed.high.suggestions).toEqual(['Build decision checklist', 'Partner with detail-oriented', 'Practice 70% rule']);
    expect(TRAIT_GUIDE.speed.high.howToUseStrengths).toEqual(['Take point on time-sensitive', 'Lead rapid prototyping']);
    expect(TRAIT_GUIDE.speed.high.accommodations).toEqual(['Create fast-feedback loops', 'Use reversible frameworks']);
  });

  it('should integrate behavioral indicators data into TRAIT_GUIDE', () => {
    const psychFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {}
    };

    const behavioralData = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          scale: {
            low: 'Deliberate Pacing',
            high: 'Fast-Cycle Decision-Making'
          },
          measures: 'Decision latency and action initiation speed',
          entrepreneurial_relevance: 'Critical for market timing and competitive response',
          behaviors: [
            {
              id: 'decision_latency',
              name: 'Decision Latency',
              description: 'Time from information receipt to decision commitment',
              low: 'Takes 3-5 days to make decisions',
              mid: 'Makes decisions within 24-48 hours',
              high: 'Makes decisions within hours'
            }
          ]
        }
      }
    };

    extendTraitGuide(psychFramework, behavioralData);

    // Verify behavioral indicator mapping
    expect(TRAIT_GUIDE.speed.measures).toBe('Decision latency and action initiation speed');
    expect(TRAIT_GUIDE.speed.entrepreneurialRelevance).toBe('Critical for market timing and competitive response');
    expect(TRAIT_GUIDE.speed.behavioralIndicators).toEqual([
      {
        id: 'decision_latency',
        name: 'Decision Latency',
        description: 'Time from information receipt to decision commitment',
        low: 'Takes 3-5 days to make decisions',
        mid: 'Makes decisions within 24-48 hours',
        high: 'Makes decisions within hours'
      }
    ]);
  });

  it('should integrate both psychological framework and behavioral data together', () => {
    const psychFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        abstraction: {
          low: {
            name: 'Concrete Thinker',
            key_strengths: ['Pragmatic', 'Detail-oriented', 'Tactical'],
            risk_factors: ['May miss patterns', 'Can be too narrow'],
            suggestions: ['Practice zooming out', 'Seek diverse perspectives', 'Review trends'],
            how_to_use_strengths: ['Focus on execution', 'Handle tactical details'],
            accommodations: ['Provide concrete examples', 'Break down abstractions']
          },
          high: {
            name: 'Strategic Visionary',
            key_strengths: ['Sees patterns', 'Connects dots', 'Strategic thinking'],
            risk_factors: ['May overlook details', 'Can be too abstract'],
            suggestions: ['Partner with tactical thinkers', 'Validate assumptions', 'Test hypotheses'],
            how_to_use_strengths: ['Lead strategic planning', 'Identify opportunities'],
            accommodations: ['Allow time for synthesis', 'Provide big picture context']
          }
        }
      }
    };

    const behavioralData = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        abstraction: {
          scale: {
            low: 'Concrete & Tactical',
            high: 'Strategic Pattern-Spotter'
          },
          measures: 'Ability to synthesize patterns and think strategically',
          entrepreneurial_relevance: 'Essential for identifying market opportunities',
          behaviors: [
            {
              id: 'pattern_recognition',
              name: 'Pattern Recognition',
              description: 'Ability to connect disparate information',
              low: 'Focuses on immediate tactical problems',
              mid: 'Balances tactical and strategic thinking',
              high: 'Naturally sees patterns and connections'
            }
          ]
        }
      }
    };

    extendTraitGuide(psychFramework, behavioralData);

    // Verify both types of data are integrated
    expect(TRAIT_GUIDE.abstraction.low.compassionateName).toBe('Concrete Thinker');
    expect(TRAIT_GUIDE.abstraction.high.compassionateName).toBe('Strategic Visionary');
    expect(TRAIT_GUIDE.abstraction.measures).toBe('Ability to synthesize patterns and think strategically');
    expect(TRAIT_GUIDE.abstraction.entrepreneurialRelevance).toBe('Essential for identifying market opportunities');
    expect(TRAIT_GUIDE.abstraction.behavioralIndicators).toHaveLength(1);
  });

  it('should preserve existing TRAIT_GUIDE fields during integration', () => {
    const psychFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          low: {
            name: 'Thoughtful Decision-Maker',
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          },
          high: {
            name: 'Decisive Action-Taker',
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          }
        }
      }
    };

    const behavioralData = {
      version: 'psy-v1',
      language: 'en',
      traits: {}
    };

    // Store original values
    const originalKey = TRAIT_GUIDE.speed.key;
    const originalDisplayName = TRAIT_GUIDE.speed.displayName;
    const originalLowLabel = TRAIT_GUIDE.speed.low.label;
    const originalLowInterpretation = TRAIT_GUIDE.speed.low.interpretation;
    const originalLowBehaviors = TRAIT_GUIDE.speed.low.behaviors;

    extendTraitGuide(psychFramework, behavioralData);

    // Verify existing fields are preserved
    expect(TRAIT_GUIDE.speed.key).toBe(originalKey);
    expect(TRAIT_GUIDE.speed.displayName).toBe(originalDisplayName);
    expect(TRAIT_GUIDE.speed.low.label).toBe(originalLowLabel);
    expect(TRAIT_GUIDE.speed.low.interpretation).toBe(originalLowInterpretation);
    expect(TRAIT_GUIDE.speed.low.behaviors).toEqual(originalLowBehaviors);
  });

  it('should handle missing traits gracefully with warning', () => {
    const psychFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        nonexistent_trait: {
          low: {
            name: 'Test',
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          },
          high: {
            name: 'Test',
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          }
        }
      }
    };

    const behavioralData = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        another_nonexistent_trait: {
          scale: { low: 'Low', high: 'High' },
          measures: 'Test',
          entrepreneurial_relevance: 'Test',
          behaviors: [
            {
              id: 'test',
              name: 'Test',
              description: 'Test',
              low: 'Test',
              mid: 'Test',
              high: 'Test'
            }
          ]
        }
      }
    };

    // Mock console.warn to capture warnings
    const originalWarn = console.warn;
    const warnings = [];
    console.warn = (msg) => warnings.push(msg);

    extendTraitGuide(psychFramework, behavioralData);

    // Restore console.warn
    console.warn = originalWarn;

    // Verify warnings were logged
    expect(warnings.length).toBe(2);
    expect(warnings[0]).toContain('nonexistent_trait');
    expect(warnings[0]).toContain('not found in TRAIT_GUIDE');
    expect(warnings[1]).toContain('another_nonexistent_trait');
    expect(warnings[1]).toContain('not found in TRAIT_GUIDE');
  });

  it('should handle null or undefined inputs gracefully', () => {
    // Should not throw errors
    expect(() => extendTraitGuide(null, null)).not.toThrow();
    expect(() => extendTraitGuide(undefined, undefined)).not.toThrow();
    expect(() => extendTraitGuide({}, {})).not.toThrow();
    expect(() => extendTraitGuide({ traits: {} }, { traits: {} })).not.toThrow();
  });

  it('should handle partial data gracefully', () => {
    const psychFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        speed: {
          low: {
            name: 'Thoughtful Decision-Maker',
            key_strengths: ['Strength 1'],
            risk_factors: ['Risk 1'],
            suggestions: ['Suggestion 1'],
            how_to_use_strengths: ['How 1'],
            accommodations: ['Accommodation 1']
          }
          // Missing high pole
        }
      }
    };

    const behavioralData = {
      version: 'psy-v1',
      language: 'en',
      traits: {}
    };

    // Should not throw errors
    expect(() => extendTraitGuide(psychFramework, behavioralData)).not.toThrow();

    // Verify low pole was integrated
    expect(TRAIT_GUIDE.speed.low.compassionateName).toBe('Thoughtful Decision-Maker');
    
    // Verify high pole was not modified (should not have compassionateName)
    expect(TRAIT_GUIDE.speed.high.compassionateName).toBeUndefined();
  });

  it('should map all required psychological framework fields correctly', () => {
    const psychFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        creativity: {
          low: {
            name: 'Proven Playbook User',
            key_strengths: ['Reliable', 'Efficient', 'Proven'],
            risk_factors: ['May resist innovation', 'Can be inflexible'],
            suggestions: ['Try small experiments', 'Learn from others', 'Challenge one assumption'],
            how_to_use_strengths: ['Optimize existing processes', 'Ensure quality'],
            accommodations: ['Provide templates', 'Show proven examples']
          },
          high: {
            name: 'Creative Innovator',
            key_strengths: ['Innovative', 'Adaptable', 'Original'],
            risk_factors: ['May overcomplicate', 'Can be impractical'],
            suggestions: ['Test ideas quickly', 'Get feedback early', 'Balance novelty with practicality'],
            how_to_use_strengths: ['Lead innovation initiatives', 'Solve novel problems'],
            accommodations: ['Allow exploration time', 'Provide creative freedom']
          }
        }
      }
    };

    const behavioralData = {
      version: 'psy-v1',
      language: 'en',
      traits: {}
    };

    extendTraitGuide(psychFramework, behavioralData);

    // Verify all fields are mapped for low pole
    expect(TRAIT_GUIDE.creativity.low.compassionateName).toBe('Proven Playbook User');
    expect(TRAIT_GUIDE.creativity.low.keyStrengths).toHaveLength(3);
    expect(TRAIT_GUIDE.creativity.low.riskFactors).toHaveLength(2);
    expect(TRAIT_GUIDE.creativity.low.suggestions).toHaveLength(3);
    expect(TRAIT_GUIDE.creativity.low.howToUseStrengths).toHaveLength(2);
    expect(TRAIT_GUIDE.creativity.low.accommodations).toHaveLength(2);

    // Verify all fields are mapped for high pole
    expect(TRAIT_GUIDE.creativity.high.compassionateName).toBe('Creative Innovator');
    expect(TRAIT_GUIDE.creativity.high.keyStrengths).toHaveLength(3);
    expect(TRAIT_GUIDE.creativity.high.riskFactors).toHaveLength(2);
    expect(TRAIT_GUIDE.creativity.high.suggestions).toHaveLength(3);
    expect(TRAIT_GUIDE.creativity.high.howToUseStrengths).toHaveLength(2);
    expect(TRAIT_GUIDE.creativity.high.accommodations).toHaveLength(2);
  });

  it('should map all required behavioral indicator fields correctly', () => {
    const psychFramework = {
      version: 'psy-v1',
      language: 'en',
      traits: {}
    };

    const behavioralData = {
      version: 'psy-v1',
      language: 'en',
      traits: {
        risk: {
          scale: {
            low: 'Risk-Conscious',
            high: 'Calculated Risk-Taker'
          },
          measures: 'Comfort with uncertainty and asymmetric bets',
          entrepreneurial_relevance: 'Critical for seizing opportunities and managing downside',
          behaviors: [
            {
              id: 'bet_sizing',
              name: 'Bet Sizing',
              description: 'Size and frequency of risky decisions',
              low: 'Makes small, reversible bets with clear safeguards',
              mid: 'Balances risk and safety based on context',
              high: 'Makes large, asymmetric bets with high upside potential'
            },
            {
              id: 'uncertainty_tolerance',
              name: 'Uncertainty Tolerance',
              description: 'Comfort acting without complete information',
              low: 'Requires thorough due diligence before acting',
              mid: 'Acts with reasonable confidence and data',
              high: 'Comfortable acting with minimal information'
            }
          ]
        }
      }
    };

    extendTraitGuide(psychFramework, behavioralData);

    // Verify all behavioral fields are mapped
    expect(TRAIT_GUIDE.risk.measures).toBe('Comfort with uncertainty and asymmetric bets');
    expect(TRAIT_GUIDE.risk.entrepreneurialRelevance).toBe('Critical for seizing opportunities and managing downside');
    expect(TRAIT_GUIDE.risk.behavioralIndicators).toHaveLength(2);
    expect(TRAIT_GUIDE.risk.behavioralIndicators[0].id).toBe('bet_sizing');
    expect(TRAIT_GUIDE.risk.behavioralIndicators[0].low).toBe('Makes small, reversible bets with clear safeguards');
    expect(TRAIT_GUIDE.risk.behavioralIndicators[0].mid).toBe('Balances risk and safety based on context');
    expect(TRAIT_GUIDE.risk.behavioralIndicators[0].high).toBe('Makes large, asymmetric bets with high upside potential');
  });
});
