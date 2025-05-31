/**
 * Test script for the webhook and notification system
 *
 * This script tests:
 * 1. Order webhook endpoint
 * 2. Notification webhook endpoint
 * 3. Payment webhook endpoint
 * 4. Real-time notification broadcasting
 *
 * Usage:
 * npm run ts-node -- scripts/test-webhook-system.ts
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:5000';
const TEST_TENANT_ID = '507f1f77bcf86cd799439011'; // Use a valid ObjectId format

// Function to generate webhook signature
function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
}

async function makeRequest(url: string, options: any = {}): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testOrderWebhook(): Promise<TestResult> {
  console.log('\n🧪 Testing Order Webhook...');

  const orderData = {
    tenantId: TEST_TENANT_ID,
    orderNumber: `TEST-${Date.now()}`,
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    amount: 99.99,
    status: 'paid',
    items: [
      {
        productName: 'Test Product',
        quantity: 2,
        price: 49.99
      }
    ],
    metadata: {
      source: 'test-script',
      timestamp: new Date().toISOString()
    }
  };

  const result = await makeRequest(`${BASE_URL}/api/webhooks/orders`, {
    method: 'POST',
    body: JSON.stringify(orderData)
  });

  if (result.success) {
    return {
      test: 'Order Webhook',
      success: true,
      message: `Order created successfully: ${result.data.orderNumber}`,
      data: result.data
    };
  } else {
    return {
      test: 'Order Webhook',
      success: false,
      message: `Failed: ${result.data?.error || result.error}`,
      data: result.data
    };
  }
}

async function testNotificationWebhook(): Promise<TestResult> {
  console.log('\n🧪 Testing Notification Webhook...');

  const notificationData = {
    tenantId: TEST_TENANT_ID,
    title: 'Test Notification',
    message: 'This is a test notification from the webhook system',
    type: 'info',
    priority: 'medium',
    actionUrl: '/dashboard',
    actionText: 'View Dashboard',
    metadata: {
      source: 'test-script',
      timestamp: new Date().toISOString()
    }
  };

  const result = await makeRequest(`${BASE_URL}/api/webhooks/notifications`, {
    method: 'POST',
    body: JSON.stringify(notificationData)
  });

  if (result.success) {
    return {
      test: 'Notification Webhook',
      success: true,
      message: `Notification created successfully: ${result.data.notificationId}`,
      data: result.data
    };
  } else {
    return {
      test: 'Notification Webhook',
      success: false,
      message: `Failed: ${result.data?.error || result.error}`,
      data: result.data
    };
  }
}

async function testPaymentWebhook(): Promise<TestResult> {
  console.log('\n🧪 Testing Payment Webhook...');

  const paymentData = {
    tenantId: TEST_TENANT_ID,
    orderId: '507f1f77bcf86cd799439012', // Mock order ID
    orderNumber: `TEST-PAY-${Date.now()}`,
    amount: 99.99,
    status: 'paid',
    paymentId: `pay_${Date.now()}`,
    metadata: {
      source: 'test-script',
      paymentMethod: 'stripe',
      timestamp: new Date().toISOString()
    }
  };

  const result = await makeRequest(`${BASE_URL}/api/webhooks/payments`, {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });

  if (result.success) {
    return {
      test: 'Payment Webhook',
      success: true,
      message: 'Payment webhook processed successfully',
      data: result.data
    };
  } else {
    return {
      test: 'Payment Webhook',
      success: false,
      message: `Failed: ${result.data?.error || result.error}`,
      data: result.data
    };
  }
}

async function testWebhookHealth(): Promise<TestResult> {
  console.log('\n🧪 Testing Webhook Health...');

  const result = await makeRequest(`${BASE_URL}/api/webhooks/health`);

  if (result.success) {
    return {
      test: 'Webhook Health',
      success: true,
      message: 'Webhook service is healthy',
      data: result.data
    };
  } else {
    return {
      test: 'Webhook Health',
      success: false,
      message: `Health check failed: ${result.error}`,
      data: result.data
    };
  }
}

async function testNotificationAPI(): Promise<TestResult> {
  console.log('\n🧪 Testing Notification API...');

  // First create a notification via API
  const createResult = await makeRequest(`${BASE_URL}/api/notifications`, {
    method: 'POST',
    headers: {
      'x-tenant-id': TEST_TENANT_ID
    },
    body: JSON.stringify({
      title: 'API Test Notification',
      message: 'This notification was created via the API',
      type: 'success',
      priority: 'high'
    })
  });

  if (!createResult.success) {
    return {
      test: 'Notification API',
      success: false,
      message: `Failed to create notification: ${createResult.data?.message || createResult.error}`,
      data: createResult.data
    };
  }

  // Then fetch notifications
  const fetchResult = await makeRequest(`${BASE_URL}/api/notifications`, {
    headers: {
      'x-tenant-id': TEST_TENANT_ID
    }
  });

  if (fetchResult.success) {
    return {
      test: 'Notification API',
      success: true,
      message: `API working correctly. Found ${fetchResult.data.notifications?.length || 0} notifications`,
      data: {
        created: createResult.data,
        fetched: fetchResult.data
      }
    };
  } else {
    return {
      test: 'Notification API',
      success: false,
      message: `Failed to fetch notifications: ${fetchResult.data?.message || fetchResult.error}`,
      data: fetchResult.data
    };
  }
}

async function testInvalidWebhookData(): Promise<TestResult> {
  console.log('\n🧪 Testing Invalid Webhook Data...');

  const invalidData = {
    // Missing required fields
    customerName: 'John Doe',
    amount: 'invalid-amount' // Should be a number
  };

  const result = await makeRequest(`${BASE_URL}/api/webhooks/orders`, {
    method: 'POST',
    body: JSON.stringify(invalidData)
  });

  if (!result.success && result.status === 400) {
    return {
      test: 'Invalid Webhook Data',
      success: true,
      message: 'Validation correctly rejected invalid data',
      data: result.data
    };
  } else {
    return {
      test: 'Invalid Webhook Data',
      success: false,
      message: 'Validation should have rejected invalid data',
      data: result.data
    };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Webhook System Tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Tenant ID: ${TEST_TENANT_ID}`);

  const tests = [
    testWebhookHealth,
    testWebhookSettings,
    testOrderWebhook,
    testNotificationWebhook,
    testPaymentWebhook,
    testNotificationAPI,
    testInvalidWebhookData,
    testWebhookSecurity
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);

      if (result.success) {
        console.log(`✅ ${result.test}: ${result.message}`);
      } else {
        console.log(`❌ ${result.test}: ${result.message}`);
      }
    } catch (error) {
      console.log(`💥 ${test.name}: Unexpected error - ${error.message}`);
      results.push({
        test: test.name,
        success: false,
        message: `Unexpected error: ${error.message}`
      });
    }
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');

  const passed = results.filter(r => r.success).length;
  const total = results.length;

  console.log(`Passed: ${passed}/${total}`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);

  if (passed === total) {
    console.log('\n🎉 All tests passed! Webhook system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }

  // Detailed results
  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    console.log(`\n${result.success ? '✅' : '❌'} ${result.test}`);
    console.log(`   Message: ${result.message}`);
    if (result.data && Object.keys(result.data).length > 0) {
      console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
    }
  });
}

async function testWebhookSettings(): Promise<TestResult> {
  console.log('\n🧪 Testing Webhook Settings API...');

  try {
    // Test getting webhook settings
    const getResult = await makeRequest(`${BASE_URL}/api/webhooks/settings`, {
      method: 'GET',
      headers: {
        'x-tenant-id': TEST_TENANT_ID
      }
    });

    if (!getResult.success) {
      return {
        test: 'Webhook Settings',
        success: false,
        message: `Failed to get webhook settings: ${getResult.data?.message || getResult.error}`,
        data: getResult.data
      };
    }

    // Test generating a webhook secret
    const generateResult = await makeRequest(`${BASE_URL}/api/webhooks/settings/generate-secret`, {
      method: 'POST',
      headers: {
        'x-tenant-id': TEST_TENANT_ID
      }
    });

    if (!generateResult.success) {
      return {
        test: 'Webhook Settings',
        success: false,
        message: `Failed to generate webhook secret: ${generateResult.data?.message || generateResult.error}`,
        data: generateResult.data
      };
    }

    return {
      test: 'Webhook Settings',
      success: true,
      message: 'Webhook settings API working correctly',
      data: {
        settings: getResult.data,
        secret: generateResult.data
      }
    };
  } catch (error) {
    return {
      test: 'Webhook Settings',
      success: false,
      message: `Unexpected error: ${error.message}`,
      data: null
    };
  }
}

async function testWebhookSecurity(): Promise<TestResult> {
  console.log('\n🧪 Testing Webhook Security...');

  try {
    // First, generate a webhook secret for testing
    const secretResult = await makeRequest(`${BASE_URL}/api/webhooks/settings/generate-secret`, {
      method: 'POST',
      headers: {
        'x-tenant-id': TEST_TENANT_ID
      }
    });

    if (!secretResult.success) {
      return {
        test: 'Webhook Security',
        success: false,
        message: 'Failed to generate test webhook secret',
        data: secretResult.data
      };
    }

    const webhookSecret = secretResult.data.secret;

    // Test order webhook with valid signature
    const orderData = {
      tenantId: TEST_TENANT_ID,
      orderNumber: `SEC-TEST-${Date.now()}`,
      customerName: 'Security Test Customer',
      customerEmail: 'security@test.com',
      amount: 99.99,
      items: [
        {
          productName: 'Security Test Product',
          quantity: 1,
          price: 99.99
        }
      ]
    };

    const payload = JSON.stringify(orderData);
    const signature = generateWebhookSignature(payload, webhookSecret);

    const validResult = await makeRequest(`${BASE_URL}/api/webhooks/orders`, {
      method: 'POST',
      headers: {
        'x-webhook-signature': signature
      },
      body: payload
    });

    if (!validResult.success) {
      return {
        test: 'Webhook Security',
        success: false,
        message: `Valid signature was rejected: ${validResult.data?.message || validResult.error}`,
        data: validResult.data
      };
    }

    // Test with invalid signature
    const invalidResult = await makeRequest(`${BASE_URL}/api/webhooks/orders`, {
      method: 'POST',
      headers: {
        'x-webhook-signature': 'invalid-signature'
      },
      body: payload
    });

    if (invalidResult.success) {
      return {
        test: 'Webhook Security',
        success: false,
        message: 'Invalid signature was accepted (security vulnerability!)',
        data: invalidResult.data
      };
    }

    return {
      test: 'Webhook Security',
      success: true,
      message: 'Webhook signature verification working correctly',
      data: {
        validSignatureAccepted: validResult.success,
        invalidSignatureRejected: !invalidResult.success
      }
    };
  } catch (error) {
    return {
      test: 'Webhook Security',
      success: false,
      message: `Unexpected error: ${error.message}`,
      data: null
    };
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

export { runAllTests };
