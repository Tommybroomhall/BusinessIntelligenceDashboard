# Google Analytics 4 Setup Guide

## Overview

This guide will walk you through setting up Google Analytics 4 (GA4) to pull live data into your Business Intelligence Dashboard. You'll need to configure both client-side tracking and server-side analytics API access.

## Prerequisites

- Google account with access to Google Analytics
- Google Cloud Platform account (free tier is sufficient)
- Your website/application domain
- Admin access to your dashboard

## Part 1: Google Analytics 4 Property Setup

### Step 1: Create GA4 Property

1. **Go to Google Analytics**: Visit [analytics.google.com](https://analytics.google.com)
2. **Create Account**: Click "Start measuring" or use existing account
3. **Account Setup**:
   - Account name: Your business name
   - Data sharing settings: Configure as needed
4. **Property Setup**:
   - Property name: Your website/app name
   - Reporting time zone: Your business timezone
   - Currency: Your business currency
5. **Business Information**:
   - Industry category: Select appropriate category
   - Business size: Select your company size
   - Intended use: Select "Examine user behavior"

### Step 2: Set Up Data Stream

1. **Choose Platform**: Select "Web" for website tracking
2. **Configure Stream**:
   - Website URL: Your domain (e.g., `https://yourdomain.com`)
   - Stream name: Your website name
3. **Enhanced Measurement**: Enable recommended events (page views, scrolls, etc.)
4. **Save and Continue**

### Step 3: Get Your Measurement ID

1. **Find Measurement ID**: In your data stream details, copy the **Measurement ID**
   - Format: `G-XXXXXXXXXX`
   - Example: `G-ABC123DEF4`
2. **Save this ID**: You'll need it for client-side tracking

### Step 4: Get Your Property ID

1. **Go to Property Settings**: Click gear icon → Property Settings
2. **Find Property ID**: Look for "Property ID" (numeric value)
   - Format: `123456789`
   - Example: `987654321`
3. **Save this ID**: You'll need it for server-side analytics

## Part 2: Google Cloud Platform Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: Visit [console.cloud.google.com](https://console.cloud.google.com)
2. **Create New Project**:
   - Project name: `your-business-analytics`
   - Organization: Your organization (if applicable)
3. **Enable Billing**: Add billing account (required for API access)

### Step 2: Enable Google Analytics Data API

1. **Go to APIs & Services**: Navigate to "APIs & Services" → "Library"
2. **Search for API**: Search "Google Analytics Data API"
3. **Enable API**: Click "Google Analytics Data API" → "Enable"
4. **Wait for Activation**: This may take a few minutes

### Step 3: Create Service Account

1. **Go to Credentials**: Navigate to "APIs & Services" → "Credentials"
2. **Create Service Account**:
   - Click "Create Credentials" → "Service Account"
   - Service account name: `analytics-dashboard-service`
   - Service account ID: `analytics-dashboard-service`
   - Description: `Service account for dashboard analytics access`
3. **Skip Role Assignment**: Click "Continue" (we'll set permissions in GA4)
4. **Create Key**:
   - Click on your new service account
   - Go to "Keys" tab → "Add Key" → "Create New Key"
   - Choose "JSON" format
   - Download the JSON file securely

### Step 4: Extract Service Account Credentials

From your downloaded JSON file, extract these values:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "client_email": "analytics-dashboard-service@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

## Part 3: Grant Analytics Access

### Step 1: Add Service Account to GA4

1. **Go to GA4 Admin**: In Google Analytics, click Admin (gear icon)
2. **Property Access Management**: 
   - Select your property
   - Click "Property access management"
3. **Add User**:
   - Click "+" → "Add users"
   - Email: Use the `client_email` from your service account JSON
   - Role: Select "Viewer" (minimum required)
   - Notify user: Uncheck (it's a service account)
4. **Save**: Click "Add"

## Part 4: Dashboard Configuration

### Step 1: Environment Variables

Create/update your `.env` file with these values:

```bash
# Client-side tracking (for website analytics)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Server-side GA4 Data API (for dashboard analytics)
GA4_PROPERTY_ID=123456789
GA4_SERVICE_ACCOUNT_EMAIL=analytics-dashboard-service@your-project.iam.gserviceaccount.com
GA4_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
GA4_SERVICE_ACCOUNT_PROJECT_ID=your-project-id
```

**Important Notes:**
- Replace `G-XXXXXXXXXX` with your actual Measurement ID
- Replace `123456789` with your actual Property ID
- Use the exact values from your service account JSON
- Keep the private key quotes and newline characters intact

### Step 2: Test Configuration

Run the test script to verify everything is working:

```bash
npm run test:ga4
```

Expected output:
```
🧪 Testing Google Analytics 4 Integration

1. Checking Environment Variables...
✅ All required environment variables are set

2. Testing GA4 Service Creation...
✅ GA4 Service created successfully

3. Testing GA4 API Connection...
✅ GA4 API connection successful
   Message: Successfully connected to Google Analytics 4

4. Testing GA4 Data Fetching...
✅ GA4 data fetched successfully
   Page Views: 1,234
   Sessions: 987
   Users: 654
   Bounce Rate: 45.2%
   Traffic Sources: 5
   Top Pages: 8
   Device Categories: 3

5. Testing Traffic Analytics Service Integration...
✅ TrafficAnalyticsService connection test successful
   Message: Successfully connected to Google Analytics 4

🎉 GA4 Integration Test Complete!
```

### Step 3: Configure in Dashboard

1. **Start Your Dashboard**: Run `npm run dev`
2. **Login**: Use your admin credentials
3. **Go to Settings**: Navigate to Settings → Integrations
4. **Configure Google Analytics**:
   - Enable Google Analytics toggle
   - Measurement ID: Enter your `G-XXXXXXXXXX`
   - Property ID: Enter your numeric property ID
   - Click "Test Connection"
   - Should show "✅ Google Analytics Fully Configured"

### Step 4: Verify Live Data

1. **Visit Traffic Page**: Go to Traffic Analytics in your dashboard
2. **Check Data**: You should see:
   - Real page view numbers
   - Actual session counts
   - Live user metrics
   - Real bounce rate
   - Actual traffic sources
   - Top pages from your website
   - Device distribution data

## Part 5: Troubleshooting

### Common Issues

**❌ "Missing environment variables"**
- Check your `.env` file exists and has all required variables
- Restart your development server after adding variables

**❌ "Failed to connect to Google Analytics"**
- Verify your service account email is added to GA4 with Viewer permissions
- Check that the Google Analytics Data API is enabled in Google Cloud
- Ensure your private key format is correct (includes newlines)

**❌ "Property not found"**
- Double-check your Property ID is numeric (not the Measurement ID)
- Verify the service account has access to the correct GA4 property

**❌ "No data available"**
- New GA4 properties may take 24-48 hours to show data
- Ensure your website has the GA4 tracking code installed
- Check that your website has recent traffic

### Data Delays

- **Real-time data**: Available within minutes
- **Standard reports**: 24-48 hour delay for new properties
- **API data**: Usually available within 4-6 hours
- **Historical data**: Available immediately for existing properties

### Testing with Sample Data

If you need to test before real data is available:

1. **Visit Your Website**: Generate some test traffic
2. **Use GA4 Debugger**: Install GA4 debug extension
3. **Check Real-time Reports**: Verify tracking in GA4 real-time view
4. **Wait for Processing**: Allow 4-6 hours for API data availability

## Part 6: Next Steps

### Optimization

1. **Set Up Goals**: Configure conversion events in GA4
2. **Custom Dimensions**: Add business-specific tracking
3. **Enhanced Ecommerce**: Track sales and revenue (if applicable)
4. **Audience Segments**: Create custom user segments

### Monitoring

1. **Regular Testing**: Run `npm run test:ga4` weekly
2. **Data Quality**: Monitor for data gaps or anomalies
3. **API Quotas**: Monitor Google Analytics API usage
4. **Performance**: Check dashboard loading times

### Security

1. **Rotate Keys**: Regularly rotate service account keys
2. **Minimal Permissions**: Use only Viewer role for service account
3. **Environment Security**: Keep `.env` file secure and out of version control
4. **Access Review**: Regularly review GA4 user access

## Support

If you encounter issues:

1. **Check Logs**: Look at server console for detailed error messages
2. **Test Script**: Run the GA4 test script for diagnostics
3. **GA4 Help**: Visit [Google Analytics Help Center](https://support.google.com/analytics)
4. **API Documentation**: Check [GA4 Data API docs](https://developers.google.com/analytics/devguides/reporting/data/v1)

---

**🎉 Congratulations!** Your dashboard should now be pulling live data from Google Analytics 4. You'll see real metrics, traffic sources, and user behavior data in your Business Intelligence Dashboard.
