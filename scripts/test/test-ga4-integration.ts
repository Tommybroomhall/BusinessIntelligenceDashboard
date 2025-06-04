import dotenv from 'dotenv';
import { GA4Service } from '../../server/services/ga4-service';
import { TrafficAnalyticsService } from '../../server/services/traffic-analytics';

// Load environment variables
dotenv.config();

async function testGA4Integration() {
  console.log('🧪 Testing Google Analytics 4 Integration\n');

  // Test 1: Environment Variables
  console.log('1. Checking Environment Variables...');
  const requiredEnvVars = [
    'GA4_PROPERTY_ID',
    'GA4_SERVICE_ACCOUNT_EMAIL',
    'GA4_SERVICE_ACCOUNT_PRIVATE_KEY',
    'GA4_SERVICE_ACCOUNT_PROJECT_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars.join(', '));
    console.log('   Please set these in your .env file');
    return;
  }
  console.log('✅ All required environment variables are set\n');

  // Test 2: GA4 Service Creation
  console.log('2. Testing GA4 Service Creation...');
  try {
    const propertyId = process.env.GA4_PROPERTY_ID!;
    const ga4Service = GA4Service.createFromEnv(propertyId);
    console.log('✅ GA4 Service created successfully\n');

    // Test 3: Connection Test
    console.log('3. Testing GA4 API Connection...');
    const connectionResult = await ga4Service.testConnection();
    
    if (connectionResult.success) {
      console.log('✅ GA4 API connection successful');
      console.log(`   Message: ${connectionResult.message}\n`);
    } else {
      console.log('❌ GA4 API connection failed');
      console.log(`   Message: ${connectionResult.message}\n`);
      return;
    }

    // Test 4: Data Fetching
    console.log('4. Testing GA4 Data Fetching...');
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7); // Last 7 days

      const analyticsData = await ga4Service.getAnalyticsData(
        GA4Service.formatDate(startDate),
        GA4Service.formatDate(endDate)
      );

      console.log('✅ GA4 data fetched successfully');
      console.log(`   Page Views: ${analyticsData.metrics.pageViews}`);
      console.log(`   Sessions: ${analyticsData.metrics.sessions}`);
      console.log(`   Users: ${analyticsData.metrics.users}`);
      console.log(`   Bounce Rate: ${(analyticsData.metrics.bounceRate * 100).toFixed(1)}%`);
      console.log(`   Traffic Sources: ${analyticsData.trafficSources.length}`);
      console.log(`   Top Pages: ${analyticsData.topPages.length}`);
      console.log(`   Device Categories: ${analyticsData.deviceDistribution.length}\n`);

    } catch (error) {
      console.log('❌ GA4 data fetching failed');
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

  } catch (error) {
    console.log('❌ GA4 Service creation failed');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    return;
  }

  // Test 5: Traffic Analytics Service Integration
  console.log('5. Testing Traffic Analytics Service Integration...');
  try {
    // Create a mock tenant object for testing
    const mockTenant = {
      _id: 'test-tenant-id',
      ga4Key: process.env.VITE_GA_MEASUREMENT_ID || 'G-TEST123456',
      ga4PropertyId: process.env.GA4_PROPERTY_ID
    };

    // Test connection through TrafficAnalyticsService
    const serviceConnectionResult = await TrafficAnalyticsService.testConnection(
      mockTenant._id,
      'google_analytics'
    );

    if (serviceConnectionResult.success) {
      console.log('✅ TrafficAnalyticsService connection test successful');
      console.log(`   Message: ${serviceConnectionResult.message}\n`);
    } else {
      console.log('❌ TrafficAnalyticsService connection test failed');
      console.log(`   Message: ${serviceConnectionResult.message}\n`);
    }

  } catch (error) {
    console.log('❌ TrafficAnalyticsService integration test failed');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }

  console.log('🎉 GA4 Integration Test Complete!');
  console.log('\nNext Steps:');
  console.log('1. Configure your tenant with GA4 credentials in the settings page');
  console.log('2. Test the /api/traffic/analytics endpoint');
  console.log('3. Verify data appears in the Traffic Analytics dashboard');
}

// Run the test
testGA4Integration().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});
