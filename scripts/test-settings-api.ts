/**
 * Test script for the Settings API
 * 
 * This script tests the new settings API endpoints to ensure they work correctly.
 * Run with: npx tsx scripts/test-settings-api.ts
 */

const BASE_URL = 'http://localhost:5000';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  details?: any;
}

async function runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
  try {
    const result = await testFn();
    return {
      name,
      success: true,
      message: 'Test passed',
      details: result
    };
  } catch (error) {
    return {
      name,
      success: false,
      message: error.message,
      details: error
    };
  }
}

async function testGetEnvironmentSettings(): Promise<any> {
  const response = await fetch(`${BASE_URL}/api/settings/env`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Verify expected fields are present
  const expectedFields = [
    'vercelApiToken', 'vercelProjectId', 'vercelTeamId', 'vercelEnabled',
    'ga4MeasurementId', 'ga4Enabled',
    'stripeSecretKey', 'stripePublicKey', 'stripePriceId', 'stripeEnabled',
    'databaseUrl', 'databaseEnabled',
    'sessionSecret', 'port', 'nodeEnv',
    'trafficDataSource', 'primaryTrafficSource', 'fallbackTrafficSource'
  ];

  for (const field of expectedFields) {
    if (!(field in data)) {
      throw new Error(`Missing expected field: ${field}`);
    }
  }

  // Verify secrets are masked
  if (data.stripeSecretKey && !data.stripeSecretKey.includes('*')) {
    throw new Error('Stripe secret key should be masked');
  }

  return data;
}

async function testConnectionTest(service: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/api/settings/test-connection/${service}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Verify response structure
  if (!('success' in data) || !('message' in data) || !('service' in data)) {
    throw new Error('Invalid response structure');
  }

  return data;
}

async function testUpdateSettings(): Promise<any> {
  const testSettings = {
    vercelApiToken: 'test_token_12345',
    ga4MeasurementId: 'G-TEST123456',
    nodeEnv: 'development',
    trafficDataSource: 'auto_detect',
    primaryTrafficSource: 'vercel_analytics',
    fallbackTrafficSource: 'google_analytics'
  };

  const response = await fetch(`${BASE_URL}/api/settings/env`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testSettings),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.message || !data.message.includes('updated')) {
    throw new Error('Update response should indicate success');
  }

  return data;
}

async function testTrafficConnection(): Promise<any> {
  const response = await fetch(`${BASE_URL}/api/settings/test-traffic-connection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (!('success' in data) || !('message' in data) || !('source' in data)) {
    throw new Error('Invalid traffic connection response structure');
  }

  return data;
}

async function testClearTrafficCache(): Promise<any> {
  const response = await fetch(`${BASE_URL}/api/settings/clear-traffic-cache`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success || !data.message.includes('cleared')) {
    throw new Error('Clear cache response should indicate success');
  }

  return data;
}

async function main() {
  console.log('🧪 Testing Settings API...\n');

  const tests = [
    () => runTest('Get Environment Settings', testGetEnvironmentSettings),
    () => runTest('Test MongoDB Connection', () => testConnectionTest('mongodb')),
    () => runTest('Test Cloudinary Connection', () => testConnectionTest('cloudinary')),
    () => runTest('Test Vercel Connection', () => testConnectionTest('vercel')),
    () => runTest('Test Google Analytics Config', () => testConnectionTest('google-analytics')),
    () => runTest('Test Stripe Connection', () => testConnectionTest('stripe')),
    () => runTest('Test Traffic Connection', testTrafficConnection),
    () => runTest('Test Clear Traffic Cache', testClearTrafficCache),
    () => runTest('Update Settings', testUpdateSettings),
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    const result = await test();
    results.push(result);
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.message}`);
    
    if (!result.success) {
      console.log(`   Error: ${result.details?.message || result.details}`);
    } else if (result.details && typeof result.details === 'object') {
      // Show some key details for successful tests
      if (result.name.includes('Connection')) {
        console.log(`   Service: ${result.details.service}, Success: ${result.details.success}`);
        if (result.details.details) {
          console.log(`   Details: ${JSON.stringify(result.details.details, null, 2).substring(0, 100)}...`);
        }
      }
    }
    console.log('');
  }

  // Summary
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n📊 Test Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Settings API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Run the tests
main().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
