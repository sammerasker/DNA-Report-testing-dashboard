/**
 * Test script for enrichment function
 * Run with: node test-enrichment.js
 */

import { enrichAssessmentData } from './lib/dna-report-chunked/enrichment.js';
import fs from 'fs';

// Load sample data
const sampleData = JSON.parse(fs.readFileSync('./sampledata.json', 'utf8'));

// Transform to expected format
const assessmentData = {
  profile: {
    name: sampleData.fullName || sampleData.firstName,
    email: 'test@example.com', // Not in sample data
    userType: sampleData.userTypes?.[0] || 'Unknown',
    assessmentDate: sampleData.completedAt
  },
  scores: sampleData.normalizedScores || {},
  rolesTop: sampleData.rolesTop || []
};

console.log('=== Testing Enrichment Function ===\n');
console.log('Input Assessment Data:');
console.log(JSON.stringify(assessmentData, null, 2));
console.log('\n=== Enriched Output ===\n');

try {
  const enrichedContext = enrichAssessmentData(assessmentData);
  console.log(enrichedContext);
  console.log('\n=== Test Successful ===');
  console.log(`Output length: ${enrichedContext.length} characters`);
} catch (error) {
  console.error('=== Test Failed ===');
  console.error(error);
  process.exit(1);
}
