#!/usr/bin/env node

const mongoose = require('mongoose');
const { GoogleAnalyticsData, Tenant } = require('../../server/models');

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/business-intelligence';

async function seedAnalyticsData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(DATABASE_URL);
    console.log('Connected to MongoDB');

    // Get the first tenant (or create one if none exists)
    let tenant = await Tenant.findOne();
    if (!tenant) {
      tenant = await Tenant.create({
        name: 'Sample Business',
        email: 'contact@samplebusiness.com',
        website: 'https://samplebusiness.com'
      });
      console.log('Created sample tenant');
    }

    console.log(`Using tenant: ${tenant.name} (ID: ${tenant._id})`);

    // Clear existing analytics data for this tenant
    await GoogleAnalyticsData.deleteMany({ tenantId: tenant._id });
    console.log('Cleared existing analytics data');

    // Create date ranges for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // Expires in 30 minutes



    // Sample Google Analytics data
    const gaData = {
      tenantId: tenant._id,
      propertyId: 'GA4-SAMPLE-123',
      dateRange: {
        from: thirtyDaysAgo,
        to: now
      },
      metrics: {
        pageViews: 15678,
        sessions: 11234,
        users: 9876,
        bounceRate: 0.45
      },
      dimensions: {
        trafficSources: [
          { source: 'google', medium: 'organic', sessions: 5400 },
          { source: '(direct)', medium: '(none)', sessions: 3200 },
          { source: 'facebook.com', medium: 'social', sessions: 1500 },
          { source: 'twitter.com', medium: 'social', sessions: 900 },
          { source: 'linkedin.com', medium: 'social', sessions: 700 },
          { source: 'newsletter', medium: 'email', sessions: 534 }
        ],
        topPages: [
          { page: '/', pageViews: 6200, uniquePageViews: 4800 },
          { page: '/dashboard', pageViews: 3800, uniquePageViews: 3200 },
          { page: '/products', pageViews: 2400, uniquePageViews: 2100 },
          { page: '/about', pageViews: 1600, uniquePageViews: 1400 },
          { page: '/pricing', pageViews: 1200, uniquePageViews: 1050 },
          { page: '/contact', pageViews: 678, uniquePageViews: 620 }
        ],
        deviceCategory: [
          { deviceCategory: 'desktop', sessions: 6740, percentage: 60 },
          { deviceCategory: 'mobile', sessions: 3370, percentage: 30 },
          { deviceCategory: 'tablet', sessions: 1124, percentage: 10 }
        ],
        countries: [
          { country: 'United States', sessions: 5600 },
          { country: 'United Kingdom', sessions: 2100 },
          { country: 'Canada', sessions: 1400 },
          { country: 'Germany', sessions: 1000 },
          { country: 'France', sessions: 800 },
          { country: 'Australia', sessions: 334 }
        ]
      },
      expiresAt
    };

    const gaRecord = await GoogleAnalyticsData.create(gaData);
    console.log('Created Google Analytics data');

    console.log('\n✅ Sample analytics data created successfully!');
    console.log('\nData Summary:');
    console.log(`- Tenant: ${tenant.name}`);
    console.log(`- Google Analytics: ${gaData.metrics.pageViews} page views, ${gaData.metrics.sessions} sessions`);
    console.log(`- Date Range: ${thirtyDaysAgo.toDateString()} to ${now.toDateString()}`);
    console.log(`- Data expires: ${expiresAt.toLocaleString()}`);

    console.log('\nYou can now test the traffic analytics dashboard with this sample data!');

  } catch (error) {
    console.error('Error seeding analytics data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedAnalyticsData();
}

module.exports = { seedAnalyticsData }; 