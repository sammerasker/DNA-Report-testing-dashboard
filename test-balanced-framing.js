import { enrichAssessmentData } from './lib/dna-report-chunked/enrichment.js';

const sample = {
  profile: { name: 'Test', email: 'test@test.com' },
  scores: { speed: 50, structure: 60 },
  rolesTop: []
};

const enrichedContext = enrichAssessmentData(sample);

const guidanceStatements = [
  { pattern: /40-69.*balanced|balanced.*40-69/i, name: '40-69 balanced' },
  { pattern: /extreme.*inflexible|inflexible.*extreme/i, name: 'extreme inflexible' },
  { pattern: /both poles.*strength|strength.*both poles/i, name: 'both poles strength' },
  { pattern: /no value judgment|avoid.*judgment/i, name: 'no value judgment' },
  { pattern: /context.*optimal|optimal.*context/i, name: 'context optimal' }
];

console.log('Testing balanced framing guidance patterns:\n');

guidanceStatements.forEach(({ pattern, name }) => {
  const matches = pattern.test(enrichedContext);
  console.log(`${matches ? '✓' : '✗'} ${name}: ${matches ? 'PASS' : 'FAIL'}`);
  
  if (!matches) {
    // Try to find similar text
    const patternStr = pattern.toString().replace(/\//g, '').replace(/i$/, '');
    const parts = patternStr.split('|');
    console.log(`  Looking for: ${parts.join(' OR ')}`);
    
    // Search for key words
    const keywords = patternStr.match(/\w+/g);
    if (keywords) {
      keywords.forEach(keyword => {
        if (enrichedContext.toLowerCase().includes(keyword.toLowerCase())) {
          console.log(`  Found keyword "${keyword}" in context`);
        }
      });
    }
  }
});
