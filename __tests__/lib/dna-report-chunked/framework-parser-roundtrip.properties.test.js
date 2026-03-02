/**
 * Property-Based Tests for Framework Parser Round-Trip Equivalence
 * Uses fast-check for universal property validation
 * 
 * Feature: enhanced-enrichment-layer
 * 
 * These tests verify that serializing → parsing → serializing produces equivalent output.
 */

import { describe, test, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { 
  parsePsychologicalFramework,
  parseBehavioralIndicators
} from '../../../lib/dna-report-chunked/framework-parser.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Framework Parser - Round-Trip Property Tests', () => {
  
  /**
   * Feature: enhanced-enrichment-layer, Property 28: JSON Round-Trip Equivalence
   * 
   * **Validates: Requirements 9.7**
   * 
   * For any valid psychological framework or behavioral indicators data structure,
   * serializing to JSON then parsing then serializing again should produce equivalent JSON output.
   * 
   * This property ensures that:
   * 1. The parser doesn't lose or corrupt data during parsing
   * 2. The serialization is consistent and deterministic
   * 3. The round-trip process is idempotent (applying it multiple times has the same effect as once)
   */
  test('Property 28: Psychological framework JSON round-trip produces equivalent output', () => {
    // Generator for non-whitespace strings
    const nonWhitespaceString = (minLength, maxLength) => 
      fc.string({ minLength, maxLength })
        .filter(s => s.trim().length >= minLength)
        .map(s => s.trim() || 'a'.repeat(minLength));
    
    // Generator for valid psychological framework JSON
    const psychFrameworkGenerator = fc.record({
      version: fc.constant('psy-v1'),
      language: fc.constant('en'),
      traits: fc.record(
        // Generate framework data for a subset of traits (to keep test fast)
        Object.fromEntries(
          ['speed', 'abstraction', 'structure'].map(traitKey => [
            traitKey,
            fc.record({
              low: fc.record({
                name: nonWhitespaceString(5, 50),
                key_strengths: fc.array(nonWhitespaceString(10, 100), { minLength: 3, maxLength: 5 }),
                risk_factors: fc.array(nonWhitespaceString(10, 100), { minLength: 2, maxLength: 4 }),
                suggestions: fc.array(nonWhitespaceString(10, 100), { minLength: 3, maxLength: 5 }),
                how_to_use_strengths: fc.array(nonWhitespaceString(10, 100), { minLength: 2, maxLength: 3 }),
                accommodations: fc.array(nonWhitespaceString(10, 100), { minLength: 2, maxLength: 3 })
              }),
              high: fc.record({
                name: nonWhitespaceString(5, 50),
                key_strengths: fc.array(nonWhitespaceString(10, 100), { minLength: 3, maxLength: 5 }),
                risk_factors: fc.array(nonWhitespaceString(10, 100), { minLength: 2, maxLength: 4 }),
                suggestions: fc.array(nonWhitespaceString(10, 100), { minLength: 3, maxLength: 5 }),
                how_to_use_strengths: fc.array(nonWhitespaceString(10, 100), { minLength: 2, maxLength: 3 }),
                accommodations: fc.array(nonWhitespaceString(10, 100), { minLength: 2, maxLength: 3 })
              })
            })
          ])
        )
      )
    });

    fc.assert(
      fc.property(
        psychFrameworkGenerator,
        (originalData) => {
          const tempDir = os.tmpdir();
          const tempFile1 = path.join(tempDir, `test-roundtrip-1-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);
          const tempFile2 = path.join(tempDir, `test-roundtrip-2-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);
          
          try {
            // Step 1: Serialize original data to JSON file
            const serialized1 = JSON.stringify(originalData, null, 2);
            fs.writeFileSync(tempFile1, serialized1);
            
            // Step 2: Parse the JSON file
            const parsed = parsePsychologicalFramework(tempFile1);
            
            // Step 3: Serialize the parsed data to JSON file
            const serialized2 = JSON.stringify(parsed, null, 2);
            fs.writeFileSync(tempFile2, serialized2);
            
            // Step 4: Parse the second JSON file
            const parsedAgain = parsePsychologicalFramework(tempFile2);
            
            // Step 5: Serialize again
            const serialized3 = JSON.stringify(parsedAgain, null, 2);
            
            // Verify: serialized2 should equal serialized3 (idempotent)
            expect(serialized2).toBe(serialized3);
            
            // Verify: parsed data should deeply equal original data
            expect(parsed).toEqual(originalData);
            expect(parsedAgain).toEqual(originalData);
            
            return true;
          } finally {
            // Clean up temporary files
            if (fs.existsSync(tempFile1)) {
              fs.unlinkSync(tempFile1);
            }
            if (fs.existsSync(tempFile2)) {
              fs.unlinkSync(tempFile2);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: enhanced-enrichment-layer, Property 28: JSON Round-Trip Equivalence
   * 
   * **Validates: Requirements 9.7**
   * 
   * For behavioral indicators data structure, serializing to JSON then parsing
   * then serializing again should produce equivalent JSON output.
   */
  test('Property 28: Behavioral indicators JSON round-trip produces equivalent output', () => {
    // Generator for non-whitespace strings
    const nonWhitespaceString = (minLength, maxLength) => 
      fc.string({ minLength, maxLength })
        .filter(s => s.trim().length >= minLength)
        .map(s => s.trim() || 'a'.repeat(minLength));
    
    // Generator for valid behavioral indicators JSON
    const behavioralIndicatorsGenerator = fc.record({
      version: fc.constant('psy-v1'),
      language: fc.constant('en'),
      traits: fc.record(
        // Generate behavioral data for a subset of traits (to keep test fast)
        Object.fromEntries(
          ['speed', 'abstraction', 'structure'].map(traitKey => [
            traitKey,
            fc.record({
              scale: fc.record({
                low: nonWhitespaceString(5, 50),
                high: nonWhitespaceString(5, 50)
              }),
              measures: nonWhitespaceString(10, 100),
              entrepreneurial_relevance: nonWhitespaceString(10, 100),
              behaviors: fc.array(
                fc.record({
                  id: nonWhitespaceString(3, 30),
                  name: nonWhitespaceString(5, 50),
                  description: nonWhitespaceString(10, 100),
                  low: nonWhitespaceString(10, 150),
                  mid: nonWhitespaceString(10, 150),
                  high: nonWhitespaceString(10, 150)
                }),
                { minLength: 3, maxLength: 5 }
              )
            })
          ])
        )
      )
    });

    fc.assert(
      fc.property(
        behavioralIndicatorsGenerator,
        (originalData) => {
          const tempDir = os.tmpdir();
          const tempFile1 = path.join(tempDir, `test-roundtrip-behavioral-1-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);
          const tempFile2 = path.join(tempDir, `test-roundtrip-behavioral-2-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);
          
          try {
            // Step 1: Serialize original data to JSON file
            const serialized1 = JSON.stringify(originalData, null, 2);
            fs.writeFileSync(tempFile1, serialized1);
            
            // Step 2: Parse the JSON file
            const parsed = parseBehavioralIndicators(tempFile1);
            
            // Step 3: Serialize the parsed data to JSON file
            const serialized2 = JSON.stringify(parsed, null, 2);
            fs.writeFileSync(tempFile2, serialized2);
            
            // Step 4: Parse the second JSON file
            const parsedAgain = parseBehavioralIndicators(tempFile2);
            
            // Step 5: Serialize again
            const serialized3 = JSON.stringify(parsedAgain, null, 2);
            
            // Verify: serialized2 should equal serialized3 (idempotent)
            expect(serialized2).toBe(serialized3);
            
            // Verify: parsed data should deeply equal original data
            expect(parsed).toEqual(originalData);
            expect(parsedAgain).toEqual(originalData);
            
            return true;
          } finally {
            // Clean up temporary files
            if (fs.existsSync(tempFile1)) {
              fs.unlinkSync(tempFile1);
            }
            if (fs.existsSync(tempFile2)) {
              fs.unlinkSync(tempFile2);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
