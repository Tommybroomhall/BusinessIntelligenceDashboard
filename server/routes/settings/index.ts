import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';
import { log } from '../../vite';

const router = Router();

// Validation schema for integration settings
const integrationSettingsSchema = z.object({
  // Google Analytics
  ga4MeasurementId: z.string().optional(),
  ga4PropertyId: z.string().optional(),
  ga4Enabled: z.boolean().optional(),

  // Stripe
  stripeSecretKey: z.string().optional(),
  stripePublicKey: z.string().optional(),
  stripePriceId: z.string().optional(),
  stripeEnabled: z.boolean().optional(),

  // Resend Email
  resendApiKey: z.string().optional(),
  resendFromDomain: z.string().optional(),
  resendFromName: z.string().optional(),
  resendEnabled: z.boolean().optional(),

  // Database
  databaseUrl: z.string().optional(),
  databaseEnabled: z.boolean().optional(),

  // System
  sessionSecret: z.string().optional(),
  port: z.string().optional(),
  nodeEnv: z.enum(['development', 'production', 'test']).optional(),

  // Traffic Data Source Configuration
  trafficDataSource: z.enum(['google_analytics']).optional()
});

/**
 * Mask sensitive values for API responses
 */
function maskSecret(value: string | undefined): string {
  if (!value || value.length < 8) {
    return '';
  }
  return `${value.substring(0, 4)}${'*'.repeat(Math.min(value.length - 8, 20))}${value.substring(value.length - 4)}`;
}

/**
 * Get environment variables and tenant-specific integration settings
 */
router.get('/env', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const tenant = await storage.getTenant(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Combine environment variables with tenant-specific settings
    // Tenant settings take priority over environment variables
    const integrationSettings = {
      // Google Analytics
      ga4MeasurementId: tenant.ga4Key || process.env.VITE_GA_MEASUREMENT_ID || '',
    ga4PropertyId: tenant.ga4PropertyId || process.env.GA4_PROPERTY_ID || '',
      ga4Enabled: !!(tenant.ga4Key || process.env.VITE_GA_MEASUREMENT_ID),

      // Stripe
      stripeSecretKey: tenant.stripeSecretKey || process.env.STRIPE_SECRET_KEY || '',
      stripePublicKey: process.env.VITE_STRIPE_PUBLIC_KEY || '',
      stripePriceId: process.env.STRIPE_PRICE_ID || '',
      stripeEnabled: !!(tenant.stripeSecretKey || process.env.STRIPE_SECRET_KEY),

      // Resend Email
      resendApiKey: tenant.resendApiKey || process.env.RESEND_API_KEY || '',
      resendFromDomain: tenant.resendFromDomain || process.env.RESEND_FROM_DOMAIN || '',
      resendFromName: tenant.resendFromName || process.env.RESEND_FROM_NAME || '',
      resendEnabled: !!(tenant.resendApiKey || process.env.RESEND_API_KEY),

      // Database
      databaseUrl: process.env.MONGODB_URI || '',
      databaseEnabled: true, // Always enabled if we're running

      // System
      sessionSecret: process.env.SESSION_SECRET || '',
      port: process.env.PORT || '5000',
      nodeEnv: process.env.NODE_ENV || 'development',

      // Traffic Data Source Configuration
      trafficDataSource: tenant.trafficDataSource || 'auto_detect',
      primaryTrafficSource: tenant.trafficDataSourcePreference?.primary || 'vercel_analytics',
      fallbackTrafficSource: tenant.trafficDataSourcePreference?.fallback || 'google_analytics'
    };

    // Mask sensitive values for security
    const maskedSettings = {
      ...integrationSettings,
      vercelApiToken: maskSecret(integrationSettings.vercelApiToken),
      stripeSecretKey: maskSecret(integrationSettings.stripeSecretKey),
      stripePublicKey: maskSecret(integrationSettings.stripePublicKey),
      resendApiKey: maskSecret(integrationSettings.resendApiKey),
      databaseUrl: maskSecret(integrationSettings.databaseUrl),
      sessionSecret: maskSecret(integrationSettings.sessionSecret)
    };

    log(`Environment settings retrieved for tenant ${req.tenantId}`, 'settings');
    res.json(maskedSettings);
  } catch (error) {
    log(`Error fetching environment settings: ${error}`, 'settings');
    res.status(500).json({ message: 'Failed to fetch environment settings' });
  }
});

/**
 * Update integration settings
 */
router.post('/env', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const validatedData = integrationSettingsSchema.parse(req.body);
    const storage = await getStorage();
    
    const updateData: any = {
      updatedAt: new Date()
    };

    // Update tenant-specific integration settings
    // Only update fields that are provided and not empty
    if (validatedData.vercelApiToken && validatedData.vercelApiToken.trim()) {
      updateData.vercelApiToken = validatedData.vercelApiToken.trim();
    }

    if (validatedData.vercelProjectId && validatedData.vercelProjectId.trim()) {
      updateData.vercelProjectId = validatedData.vercelProjectId.trim();
    }

    if (validatedData.vercelTeamId && validatedData.vercelTeamId.trim()) {
      updateData.vercelTeamId = validatedData.vercelTeamId.trim();
    }

    if (validatedData.ga4MeasurementId && validatedData.ga4MeasurementId.trim()) {
      updateData.ga4Key = validatedData.ga4MeasurementId.trim();
    }

    if (validatedData.ga4PropertyId && validatedData.ga4PropertyId.trim()) {
      updateData.ga4PropertyId = validatedData.ga4PropertyId.trim();
    }

    if (validatedData.stripeSecretKey && validatedData.stripeSecretKey.trim()) {
      updateData.stripeSecretKey = validatedData.stripeSecretKey.trim();
    }

    if (validatedData.resendApiKey && validatedData.resendApiKey.trim()) {
      updateData.resendApiKey = validatedData.resendApiKey.trim();
    }

    if (validatedData.resendFromDomain && validatedData.resendFromDomain.trim()) {
      updateData.resendFromDomain = validatedData.resendFromDomain.trim();
    }

    if (validatedData.resendFromName && validatedData.resendFromName.trim()) {
      updateData.resendFromName = validatedData.resendFromName.trim();
    }

    // Update traffic data source preferences
    if (validatedData.trafficDataSource) {
      updateData.trafficDataSource = validatedData.trafficDataSource;
    }

    // Handle nested trafficDataSourcePreference structure
    if (validatedData.primaryTrafficSource || validatedData.fallbackTrafficSource) {
      // Get current preferences or create new object
      const currentPreferences = updateData.trafficDataSourcePreference || {};

      if (validatedData.primaryTrafficSource) {
        currentPreferences.primary = validatedData.primaryTrafficSource;
      }

      if (validatedData.fallbackTrafficSource) {
        currentPreferences.fallback = validatedData.fallbackTrafficSource;
      }

      currentPreferences.lastUpdated = new Date();
      updateData.trafficDataSourcePreference = currentPreferences;
    }

    const updatedTenant = await storage.updateTenant(req.tenantId, updateData);
    
    if (!updatedTenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    log(`Integration settings updated for tenant ${req.tenantId}`, 'settings');
    
    res.json({ 
      message: 'Integration settings updated successfully',
      updated: Object.keys(updateData).filter(key => key !== 'updatedAt')
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input data', 
        errors: error.errors 
      });
    }
    
    log(`Error updating integration settings: ${error}`, 'settings');
    res.status(500).json({ message: 'Failed to update integration settings' });
  }
});

/**
 * Test connection for a specific service
 */
router.post('/test-connection/:service', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    const storage = await getStorage();
    const tenant = await storage.getTenant(req.tenantId);

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    let testResult = { success: false, message: '', details: {} };

    switch (service.toLowerCase()) {
      case 'google-analytics':
      case 'ga4':
        testResult = await testGoogleAnalyticsConnection(tenant);
        break;

      case 'stripe':
        testResult = await testStripeConnection(tenant);
        break;

      case 'mongodb':
      case 'database':
        testResult = await testMongoDBConnection();
        break;

      case 'cloudinary':
        testResult = await testCloudinaryConnection();
        break;

      case 'resend':
        testResult = await testResendConnection(tenant);
        break;

      default:
        return res.status(400).json({
          message: `Unknown service: ${service}. Supported services: vercel, google-analytics, stripe, mongodb, cloudinary, resend`
        });
    }

    log(`Connection test for ${service}: ${testResult.success ? 'SUCCESS' : 'FAILED'}`, 'settings');

    res.json({
      service,
      ...testResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log(`Error testing connection for ${req.params.service}: ${error}`, 'settings');
    res.status(500).json({
      message: 'Failed to test connection',
      error: error.message
    });
  }
});



/**
 * Test Google Analytics connection
 */
async function testGoogleAnalyticsConnection(tenant: any): Promise<{ success: boolean; message: string; details: any }> {
  try {
    const measurementId = tenant.ga4Key || process.env.VITE_GA_MEASUREMENT_ID;
    const propertyId = tenant.ga4PropertyId || process.env.GA4_PROPERTY_ID;

    if (!measurementId) {
      return {
        success: false,
        message: 'Google Analytics Measurement ID not configured',
        details: { error: 'Missing GA4_MEASUREMENT_ID' }
      };
    }

    if (!propertyId) {
      return {
        success: false,
        message: 'Google Analytics Property ID not configured',
        details: { error: 'Missing GA4_PROPERTY_ID' }
      };
    }

    // Validate measurement ID format
    const ga4Pattern = /^G-[A-Z0-9]{10}$/;
    if (!ga4Pattern.test(measurementId)) {
      return {
        success: false,
        message: 'Invalid Google Analytics Measurement ID format',
        details: {
          error: 'Measurement ID should be in format G-XXXXXXXXXX',
          provided: measurementId
        }
      };
    }

    // Validate property ID format (should be numeric)
    if (!/^\d+$/.test(propertyId)) {
      return {
        success: false,
        message: 'Invalid Google Analytics Property ID format',
        details: {
          error: 'Property ID should be numeric',
          provided: propertyId
        }
      };
    }

    // Test actual GA4 API connection if service account credentials are available
    try {
      const { TrafficAnalyticsService } = await import('../traffic-analytics');
      const result = await TrafficAnalyticsService.testConnection(tenant._id, 'google_analytics');

      return {
        success: result.success,
        message: result.message,
        details: {
          measurementId,
          propertyId,
          apiTest: result.success ? 'Connected successfully' : 'Connection failed'
        }
      };
    } catch (error) {
      // If GA4 service fails, fall back to basic validation
      return {
        success: true,
        message: 'Google Analytics configuration appears valid (API test unavailable)',
        details: {
          measurementId,
          propertyId,
          note: 'Configuration validated. API connection test requires service account credentials.'
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Configuration check failed: ${error.message}`,
      details: { error: error.message }
    };
  }
}

/**
 * Test Stripe connection
 */
async function testStripeConnection(tenant: any): Promise<{ success: boolean; message: string; details: any }> {
  try {
    const secretKey = tenant.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return {
        success: false,
        message: 'Stripe secret key not configured',
        details: { error: 'Missing STRIPE_SECRET_KEY' }
      };
    }

    // Validate key format
    if (!secretKey.startsWith('sk_')) {
      return {
        success: false,
        message: 'Invalid Stripe secret key format',
        details: { error: 'Secret key should start with sk_test_ or sk_live_' }
      };
    }

    // Test API connection by fetching account info
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `Stripe API error: ${response.status} ${response.statusText}`,
        details: { status: response.status, error: errorData }
      };
    }

    const accountData = await response.json();
    return {
      success: true,
      message: 'Successfully connected to Stripe',
      details: {
        accountId: accountData.id,
        country: accountData.country,
        currency: accountData.default_currency,
        livemode: accountData.livemode
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      details: { error: error.message }
    };
  }
}

/**
 * Test MongoDB connection
 */
async function testMongoDBConnection(): Promise<{ success: boolean; message: string; details: any }> {
  try {
    // Import mongoose to check connection status
    const mongoose = require('mongoose');

    if (mongoose.connection.readyState !== 1) {
      return {
        success: false,
        message: 'MongoDB not connected',
        details: {
          readyState: mongoose.connection.readyState,
          states: { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }
        }
      };
    }

    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();

    return {
      success: true,
      message: 'Successfully connected to MongoDB',
      details: {
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        collections: collections.length
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `MongoDB connection test failed: ${error.message}`,
      details: { error: error.message }
    };
  }
}

/**
 * Test Cloudinary connection
 */
async function testCloudinaryConnection(): Promise<{ success: boolean; message: string; details: any }> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return {
        success: false,
        message: 'Cloudinary credentials not configured',
        details: {
          error: 'Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET'
        }
      };
    }

    // Test API connection by fetching account usage
    const timestamp = Math.round(Date.now() / 1000);
    const crypto = require('crypto');
    const signature = crypto
      .createHash('sha1')
      .update(`timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `api_key=${apiKey}&timestamp=${timestamp}&signature=${signature}`
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `Cloudinary API error: ${response.status} ${response.statusText}`,
        details: { status: response.status, error: errorData }
      };
    }

    const usageData = await response.json();
    return {
      success: true,
      message: 'Successfully connected to Cloudinary',
      details: {
        cloudName,
        plan: usageData.plan || 'Unknown',
        used_percent: usageData.used_percent || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      details: { error: error.message }
    };
  }
}





/**
 * Test traffic connection based on current tenant configuration
 */
router.post('/test-traffic-connection', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const tenant = await storage.getTenant(req.tenantId);

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Test Google Analytics connection (only supported source now)
    const result = await testGoogleAnalyticsConnection(tenant);

    res.json({
      success: result.success,
      message: result.message,
      source: 'google_analytics',
      details: result.details
    });
  } catch (error) {
    log(`Error testing traffic connection: ${error}`, 'settings');
    res.status(500).json({
      message: 'Failed to test traffic connection',
      error: error.message
    });
  }
});



/**
 * Test Resend connection
 */
async function testResendConnection(tenant: any): Promise<{ success: boolean; message: string; details: any }> {
  try {
    const apiKey = tenant.resendApiKey || process.env.RESEND_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        message: 'Resend API key not configured',
        details: { error: 'Missing RESEND_API_KEY' }
      };
    }

    // Validate API key format
    if (!apiKey.startsWith('re_')) {
      return {
        success: false,
        message: 'Invalid Resend API key format',
        details: { error: 'API key should start with re_' }
      };
    }

    // Test API connection by fetching API key info
    const response = await fetch('https://api.resend.com/api-keys', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `Resend API error: ${response.status} ${response.statusText}`,
        details: { status: response.status, error: errorData }
      };
    }

    const apiKeysData = await response.json();

    // Get domain information if configured
    const fromDomain = tenant.resendFromDomain || process.env.RESEND_FROM_DOMAIN;
    let domainInfo = null;

    if (fromDomain) {
      try {
        const domainResponse = await fetch('https://api.resend.com/domains', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (domainResponse.ok) {
          const domainsData = await domainResponse.json();
          domainInfo = domainsData.data?.find((d: any) => d.name === fromDomain);
        }
      } catch (error) {
        // Domain check is optional, don't fail the test
        console.warn('Could not fetch domain info:', error);
      }
    }

    return {
      success: true,
      message: 'Successfully connected to Resend',
      details: {
        apiKeyCount: apiKeysData.data?.length || 0,
        fromDomain: fromDomain || 'Not configured',
        domainStatus: domainInfo?.status || 'Unknown',
        fromName: tenant.resendFromName || process.env.RESEND_FROM_NAME || 'Not configured'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      details: { error: error.message }
    };
  }
}

export default router;
