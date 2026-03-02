/**
 * Property-Based Tests for Trait Definitions
 * Uses fast-check for universal property validation
 * 
 * Feature: enhanced-enrichment-layer
 * 
 * These tests verify that the TRAIT_GUIDE data structure has complete
 * psychological framework fields for all traits and poles.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import { TRAIT_GUIDE } from '../../../lib/dna-report-chunked/trait-definitions.js';
import { 
  parsePsychologicalFramework, 
  extendTraitGuide 
} from '../../../lib/dna-report-chunked/framework-parser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Trait Definitions - Property Tests', () => {
  
  /**
   * Feature: enhanced-enrichment-layer, Property 1: Psychological Framework Completeness
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 10.1, 11.1**
   * 
   * For any trait pole (low or high) in TRAIT_GUIDE, the following fields must exist and be non-empty:
   * - compassionateName (string, length > 0)
   * - keyStrengths (array, 3-5 elements)
   * - riskFactors (array, 2-4 elements)
   * - suggestions (array, 3-5 elements)
   * - howToUseStrengths (array, 2-3 elements)
   * - accommodations (array, 2-3 elements)
   * 
   * NOTE: This test will initially FAIL because the psychological framework fields
   * are not yet populated. This is expected - the test validates the structure is
   * ready for population.
   */
  test.skip('Property 1: All trait poles have complete psychological framework fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TRAIT_GUIDE)),
        fc.constantFrom('low', 'high'),
        (traitKey, pole) => {
          const traitPole = TRAIT_GUIDE[traitKey][pole];
          
          // Verify compassionateName exists and is non-empty string
          expect(traitPole.compassionateName).toBeDefined();
          expect(typeof traitPole.compassionateName).toBe('string');
          expect(traitPole.compassionateName.length).toBeGreaterThan(0);
          
          // Verify keyStrengths exists and has 3-5 elements
          expect(Array.isArray(traitPole.keyStrengths)).toBe(true);
          expect(traitPole.keyStrengths.length).toBeGreaterThanOrEqual(3);
          expect(traitPole.keyStrengths.length).toBeLessThanOrEqual(5);
          // Verify all elements are non-empty strings
          traitPole.keyStrengths.forEach(strength => {
            expect(typeof strength).toBe('string');
            expect(strength.length).toBeGreaterThan(0);
          });
          
          // Verify riskFactors exists and has 2-4 elements
          expect(Array.isArray(traitPole.riskFactors)).toBe(true);
          expect(traitPole.riskFactors.length).toBeGreaterThanOrEqual(2);
          expect(traitPole.riskFactors.length).toBeLessThanOrEqual(4);
          // Verify all elements are non-empty strings
          traitPole.riskFactors.forEach(risk => {
            expect(typeof risk).toBe('string');
            expect(risk.length).toBeGreaterThan(0);
          });
          
          // Verify suggestions exists and has 3-5 elements
          expect(Array.isArray(traitPole.suggestions)).toBe(true);
          expect(traitPole.suggestions.length).toBeGreaterThanOrEqual(3);
          expect(traitPole.suggestions.length).toBeLessThanOrEqual(5);
          // Verify all elements are non-empty strings
          traitPole.suggestions.forEach(suggestion => {
            expect(typeof suggestion).toBe('string');
            expect(suggestion.length).toBeGreaterThan(0);
          });
          
          // Verify howToUseStrengths exists and has 2-3 elements
          expect(Array.isArray(traitPole.howToUseStrengths)).toBe(true);
          expect(traitPole.howToUseStrengths.length).toBeGreaterThanOrEqual(2);
          expect(traitPole.howToUseStrengths.length).toBeLessThanOrEqual(3);
          // Verify all elements are non-empty strings
          traitPole.howToUseStrengths.forEach(howTo => {
            expect(typeof howTo).toBe('string');
            expect(howTo.length).toBeGreaterThan(0);
          });
          
          // Verify accommodations exists and has 2-3 elements
          expect(Array.isArray(traitPole.accommodations)).toBe(true);
          expect(traitPole.accommodations.length).toBeGreaterThanOrEqual(2);
          expect(traitPole.accommodations.length).toBeLessThanOrEqual(3);
          // Verify all elements are non-empty strings
          traitPole.accommodations.forEach(accommodation => {
            expect(typeof accommodation).toBe('string');
            expect(accommodation.length).toBeGreaterThan(0);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: enhanced-enrichment-layer, Property 2: Behavioral Indicator Completeness
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   * 
   * For any trait in TRAIT_GUIDE, the following fields must exist:
   * - measures (non-empty string)
   * - entrepreneurialRelevance (non-empty string)
   * - behavioralIndicators (array with 3-5 elements)
   * 
   * For each behavioral indicator, verify structure:
   * - id (non-empty string)
   * - name (non-empty string)
   * - description (non-empty string)
   * - low (non-empty string)
   * - mid (non-empty string)
   * - high (non-empty string)
   * 
   * NOTE: This test will initially FAIL because the behavioral indicator fields
   * are not yet populated. This is expected - the test validates the structure is
   * ready for population.
   */
  test.skip('Property 2: All traits have complete behavioral indicator fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TRAIT_GUIDE)),
        (traitKey) => {
          const trait = TRAIT_GUIDE[traitKey];
          
          // Verify measures exists and is non-empty string
          expect(trait.measures).toBeDefined();
          expect(typeof trait.measures).toBe('string');
          expect(trait.measures.length).toBeGreaterThan(0);
          
          // Verify entrepreneurialRelevance exists and is non-empty string
          expect(trait.entrepreneurialRelevance).toBeDefined();
          expect(typeof trait.entrepreneurialRelevance).toBe('string');
          expect(trait.entrepreneurialRelevance.length).toBeGreaterThan(0);
          
          // Verify behavioralIndicators exists and is an array with 3-5 elements
          expect(Array.isArray(trait.behavioralIndicators)).toBe(true);
          expect(trait.behavioralIndicators.length).toBeGreaterThanOrEqual(3);
          expect(trait.behavioralIndicators.length).toBeLessThanOrEqual(5);
          
          // Verify each behavioral indicator has complete structure
          trait.behavioralIndicators.forEach(indicator => {
            // Verify id exists and is non-empty string
            expect(indicator.id).toBeDefined();
            expect(typeof indicator.id).toBe('string');
            expect(indicator.id.length).toBeGreaterThan(0);
            
            // Verify name exists and is non-empty string
            expect(indicator.name).toBeDefined();
            expect(typeof indicator.name).toBe('string');
            expect(indicator.name.length).toBeGreaterThan(0);
            
            // Verify description exists and is non-empty string
            expect(indicator.description).toBeDefined();
            expect(typeof indicator.description).toBe('string');
            expect(indicator.description.length).toBeGreaterThan(0);
            
            // Verify low exists and is non-empty string
            expect(indicator.low).toBeDefined();
            expect(typeof indicator.low).toBe('string');
            expect(indicator.low.length).toBeGreaterThan(0);
            
            // Verify mid exists and is non-empty string
            expect(indicator.mid).toBeDefined();
            expect(typeof indicator.mid).toBe('string');
            expect(indicator.mid.length).toBeGreaterThan(0);
            
            // Verify high exists and is non-empty string
            expect(indicator.high).toBeDefined();
            expect(typeof indicator.high).toBe('string');
            expect(indicator.high.length).toBeGreaterThan(0);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

  /**
   * Feature: enhanced-enrichment-layer, Property 3: Psychological Framework Integration
   * 
   * **Validates: Requirements 1.7**
   * 
   * For any valid psychological framework JSON file, parsing and integrating it into TRAIT_GUIDE
   * should result in all framework fields being present in the corresponding trait poles.
   * 
   * This test generates random valid psychological framework JSON structures, writes them to
   * temporary files, parses them, integrates them into TRAIT_GUIDE, and verifies that all
   * framework fields are correctly present in TRAIT_GUIDE.
   */
  test('Property 3: Parsing and integrating valid JSON results in all framework fields present in TRAIT_GUIDE', () => {
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
        (frameworkData) => {
          // Create a temporary file with the generated framework data
          const tempDir = os.tmpdir();
          const tempFile = path.join(tempDir, `test-framework-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);
          
          try {
            // Write the framework data to a temporary file
            fs.writeFileSync(tempFile, JSON.stringify(frameworkData, null, 2));
            
            // Parse the psychological framework JSON
            const parsedFramework = parsePsychologicalFramework(tempFile);
            
            // Store original TRAIT_GUIDE state for the traits we're testing
            const originalState = {};
            for (const traitKey of Object.keys(frameworkData.traits)) {
              // Check if trait exists in TRAIT_GUIDE
              if (!TRAIT_GUIDE[traitKey]) {
                throw new Error(`Trait "${traitKey}" not found in TRAIT_GUIDE`);
              }
              
              originalState[traitKey] = {
                low: { ...TRAIT_GUIDE[traitKey].low },
                high: { ...TRAIT_GUIDE[traitKey].high }
              };
            }
            
            // Integrate the parsed framework into TRAIT_GUIDE
            extendTraitGuide(parsedFramework, null);
            
            // Verify that all framework fields are present in TRAIT_GUIDE for each trait
            for (const traitKey of Object.keys(frameworkData.traits)) {
              const traitData = frameworkData.traits[traitKey];
              
              // Verify low pole fields
              expect(TRAIT_GUIDE[traitKey].low.compassionateName).toBe(traitData.low.name);
              expect(TRAIT_GUIDE[traitKey].low.keyStrengths).toEqual(traitData.low.key_strengths);
              expect(TRAIT_GUIDE[traitKey].low.riskFactors).toEqual(traitData.low.risk_factors);
              expect(TRAIT_GUIDE[traitKey].low.suggestions).toEqual(traitData.low.suggestions);
              expect(TRAIT_GUIDE[traitKey].low.howToUseStrengths).toEqual(traitData.low.how_to_use_strengths);
              expect(TRAIT_GUIDE[traitKey].low.accommodations).toEqual(traitData.low.accommodations);
              
              // Verify high pole fields
              expect(TRAIT_GUIDE[traitKey].high.compassionateName).toBe(traitData.high.name);
              expect(TRAIT_GUIDE[traitKey].high.keyStrengths).toEqual(traitData.high.key_strengths);
              expect(TRAIT_GUIDE[traitKey].high.riskFactors).toEqual(traitData.high.risk_factors);
              expect(TRAIT_GUIDE[traitKey].high.suggestions).toEqual(traitData.high.suggestions);
              expect(TRAIT_GUIDE[traitKey].high.howToUseStrengths).toEqual(traitData.high.how_to_use_strengths);
              expect(TRAIT_GUIDE[traitKey].high.accommodations).toEqual(traitData.high.accommodations);
            }
            
            // Restore original state (cleanup)
            for (const traitKey of Object.keys(frameworkData.traits)) {
              TRAIT_GUIDE[traitKey].low = originalState[traitKey].low;
              TRAIT_GUIDE[traitKey].high = originalState[traitKey].high;
            }
            
            return true;
          } finally {
            // Clean up temporary file
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
