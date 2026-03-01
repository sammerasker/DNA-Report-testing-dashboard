/**
 * Test script for Moonshot API
 * Verifies API key and endpoint configuration
 */

import dotenv from 'dotenv';
import { createMoonshotProvider } from './lib/dna-report-chunked/api-provider.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testMoonshotAPI() {
  console.log('🌙 Testing Moonshot API...\n');
  
  const provider = createMoonshotProvider();
  
  console.log('Configuration:');
  console.log(`  Provider: ${provider.provider}`);
  console.log(`  Endpoint: ${provider.endpoint}`);
  console.log(`  Model: ${provider.model}`);
  console.log(`  API Key: ${provider.apiKey ? provider.apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log('');
  
  if (!provider.apiKey) {
    console.error('❌ ERROR: NEXT_PUBLIC_MOONSHOT_API_KEY is not set in .env.local');
    process.exit(1);
  }
  
  console.log('Sending test request...');
  const startTime = Date.now();
  
  try {
    const result = await provider.generateCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello from Moonshot!" and nothing else.' }
      ],
      maxTokens: 50,
      temperature: 0.7
    });
    
    const elapsed = Date.now() - startTime;
    
    if (result.error) {
      console.error('\n❌ API Request Failed:');
      console.error(`  Error Type: ${result.error.type}`);
      console.error(`  Error Message: ${result.error.message}`);
      console.error(`  Status Code: ${result.error.statusCode || 'N/A'}`);
      console.error(`  Retryable: ${result.error.retryable ? 'Yes' : 'No'}`);
      
      if (result.error.type === 'authentication') {
        console.error('\n💡 The API key appears to be invalid. Please check:');
        console.error('   1. The key is correctly copied in .env.local');
        console.error('   2. The key has not expired');
        console.error('   3. The key has proper permissions');
      }
      
      process.exit(1);
    }
    
    console.log('\n✅ SUCCESS! Moonshot API is working correctly.\n');
    console.log('Response:');
    console.log(`  Content: ${result.content}`);
    console.log('');
    console.log('Metadata:');
    console.log(`  Latency: ${result.metadata.latency}ms`);
    console.log(`  Prompt Tokens: ${result.metadata.promptTokens}`);
    console.log(`  Response Tokens: ${result.metadata.responseTokens}`);
    console.log(`  Total Tokens: ${result.metadata.totalTokens}`);
    console.log(`  Timestamp: ${result.metadata.timestamp}`);
    console.log('');
    console.log(`⏱️  Total elapsed time: ${elapsed}ms`);
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

testMoonshotAPI();
