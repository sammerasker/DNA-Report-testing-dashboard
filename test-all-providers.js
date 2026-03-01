/**
 * Test all API providers
 * Comprehensive test of all configured providers
 */

import dotenv from 'dotenv';
import { 
  createOpenRouterProvider, 
  createHuggingFaceProvider,
  createMoonshotProvider
} from './lib/dna-report-chunked/api-provider.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const providers = [
  { name: 'OpenRouter', icon: '🔀', create: createOpenRouterProvider },
  { name: 'HuggingFace', icon: '🤗', create: createHuggingFaceProvider },
  { name: 'Moonshot', icon: '🌙', create: createMoonshotProvider }
];

async function testProvider(providerInfo) {
  const { name, icon, create } = providerInfo;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${icon} Testing ${name} API`);
  console.log('='.repeat(60));
  
  try {
    const provider = create();
    
    console.log('\nConfiguration:');
    console.log(`  Provider: ${provider.provider}`);
    console.log(`  Endpoint: ${provider.endpoint}`);
    console.log(`  Model: ${provider.model}`);
    console.log(`  API Key: ${provider.apiKey ? provider.apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
    
    if (!provider.apiKey) {
      console.log(`\n❌ SKIPPED: API key not configured`);
      return { provider: name, status: 'skipped', reason: 'No API key' };
    }
    
    console.log('\nSending test request...');
    const startTime = Date.now();
    
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
      console.log(`\n❌ FAILED`);
      console.log(`  Error Type: ${result.error.type}`);
      console.log(`  Error Message: ${result.error.message}`);
      console.log(`  Status Code: ${result.error.statusCode || 'N/A'}`);
      
      if (result.error.type === 'authentication') {
        console.log(`\n💡 The API key is invalid or expired`);
      } else if (result.error.statusCode === 402) {
        console.log(`\n💡 API key is valid but billing/credits needed`);
      }
      
      return { 
        provider: name, 
        status: 'failed', 
        error: result.error.type,
        statusCode: result.error.statusCode 
      };
    }
    
    console.log(`\n✅ SUCCESS!`);
    console.log(`  Response: ${result.content.substring(0, 100)}${result.content.length > 100 ? '...' : ''}`);
    console.log(`  Latency: ${result.metadata.latency}ms`);
    console.log(`  Tokens: ${result.metadata.totalTokens} (${result.metadata.promptTokens} prompt + ${result.metadata.responseTokens} response)`);
    console.log(`  Total Time: ${elapsed}ms`);
    
    return { 
      provider: name, 
      status: 'success', 
      latency: result.metadata.latency,
      tokens: result.metadata.totalTokens 
    };
    
  } catch (error) {
    console.log(`\n❌ UNEXPECTED ERROR: ${error.message}`);
    return { provider: name, status: 'error', error: error.message };
  }
}

async function testAllProviders() {
  console.log('\n🧪 API Provider Test Suite');
  console.log('Testing all configured providers...\n');
  
  const results = [];
  
  for (const provider of providers) {
    const result = await testProvider(provider);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between tests
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  const skipped = results.filter(r => r.status === 'skipped');
  const errors = results.filter(r => r.status === 'error');
  
  console.log(`✅ Successful: ${successful.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.provider}: ${r.latency}ms, ${r.tokens} tokens`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach(r => {
      console.log(`   - ${r.provider}: ${r.error} (${r.statusCode || 'N/A'})`);
    });
  }
  
  if (skipped.length > 0) {
    console.log(`\n⏭️  Skipped: ${skipped.length}`);
    skipped.forEach(r => {
      console.log(`   - ${r.provider}: ${r.reason}`);
    });
  }
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors: ${errors.length}`);
    errors.forEach(r => {
      console.log(`   - ${r.provider}: ${r.error}`);
    });
  }
  
  console.log('');
  console.log(`Total Providers Tested: ${results.length}`);
  console.log(`Working Providers: ${successful.length}/${results.length - skipped.length}`);
  console.log('');
}

testAllProviders().catch(console.error);
