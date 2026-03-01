/**
 * Quick test for Moonshot only
 */

import dotenv from 'dotenv';
import { createMoonshotProvider } from './lib/dna-report-chunked/api-provider.js';

dotenv.config({ path: '.env.local' });

async function testProvider(name, icon, createFn) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${icon} Testing ${name} API`);
  console.log('='.repeat(60));
  
  const provider = createFn();
  
  console.log('\nConfiguration:');
  console.log(`  Endpoint: ${provider.endpoint}`);
  console.log(`  Model: ${provider.model}`);
  console.log(`  API Key: ${provider.apiKey ? provider.apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
  
  if (!provider.apiKey) {
    console.log('\n❌ SKIPPED: No API key configured');
    return { name, status: 'skipped' };
  }
  
  console.log('\nSending test request...');
  const startTime = Date.now();
  
  try {
    const result = await provider.generateCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: `Say "Hello from ${name}!" and nothing else.` }
      ],
      maxTokens: 50,
      temperature: 0.7
    });
    
    const elapsed = Date.now() - startTime;
    
    if (result.error) {
      console.log('\n❌ FAILED');
      console.log(`  Error Type: ${result.error.type}`);
      console.log(`  Error Message: ${result.error.message}`);
      console.log(`  Status Code: ${result.error.statusCode || 'N/A'}`);
      
      if (result.error.statusCode === 401) {
        console.log('\n💡 Invalid or expired API key');
      } else if (result.error.statusCode === 402) {
        console.log('\n💡 Valid key but needs billing/credits');
      } else if (result.error.statusCode === 404) {
        console.log('\n💡 Model not found or no permission');
      }
      
      return { name, status: 'failed', error: result.error };
    }
    
    console.log('\n✅ SUCCESS!');
    console.log(`  Response: ${result.content}`);
    console.log(`  Latency: ${result.metadata.latency}ms`);
    console.log(`  Tokens: ${result.metadata.totalTokens} (${result.metadata.promptTokens} + ${result.metadata.responseTokens})`);
    console.log(`  Total Time: ${elapsed}ms`);
    
    return { name, status: 'success', latency: result.metadata.latency, tokens: result.metadata.totalTokens };
    
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    return { name, status: 'error', error: error.message };
  }
}

async function main() {
  console.log('\n🧪 Testing Moonshot API\n');
  
  const results = [];
  
  results.push(await testProvider('Moonshot', '🌙', createMoonshotProvider));
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(r => {
    if (r.status === 'success') {
      console.log(`✅ ${r.name}: Working (${r.latency}ms, ${r.tokens} tokens)`);
    } else if (r.status === 'failed') {
      console.log(`❌ ${r.name}: ${r.error.type} (${r.error.statusCode})`);
    } else if (r.status === 'skipped') {
      console.log(`⏭️  ${r.name}: Skipped (no key)`);
    } else {
      console.log(`⚠️  ${r.name}: Error`);
    }
  });
  
  console.log('');
}

main().catch(console.error);
