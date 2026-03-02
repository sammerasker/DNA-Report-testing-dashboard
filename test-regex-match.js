import { enrichAssessmentData } from './lib/dna-report-chunked/enrichment.js';

const sample = {
  profile: { name: 'Test', email: 'test@test.com' },
  scores: { speed: 50 },
  rolesTop: []
};

const enrichedContext = enrichAssessmentData(sample);

// Extract the balanced framing section
const startIdx = enrichedContext.indexOf('=== BALANCED TRAIT FRAMING ===');
const endIdx = enrichedContext.indexOf('===', startIdx + 30);
const balancedFramingSection = enrichedContext.substring(startIdx, endIdx);

console.log('Balanced Framing Section (first 1000 chars):');
console.log('='.repeat(80));
console.log(balancedFramingSection.substring(0, 1000));
console.log('='.repeat(80));

const pattern = /extreme.*inflexible|inflexible.*extreme/i;
console.log(`\nDoes it match /extreme.*inflexible|inflexible.*extreme/i? ${pattern.test(balancedFramingSection)}`);

// Find where extreme and inflexible appear
const lines = balancedFramingSection.split('\n');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('extreme') || line.toLowerCase().includes('inflexible')) {
    console.log(`Line ${i}: ${line.trim()}`);
  }
});
