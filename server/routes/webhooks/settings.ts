import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';
import { log } from '../../vite';
import crypto from 'crypto';

const router = Router();

// Validation schema for webhook settings
const webhookSettingsSchema = z.object({
  webhookEnabled: z.boolean().optional(),
  webhookEndpoints: z.object({
    orders: z.boolean().optional(),
    notifications: z.boolean().optional(),
    payments: z.boolean().optional()
  }).optional(),
  webhookRetryAttempts: z.number().min(1).max(10).optional(),
  webhookTimeoutMs: z.number().min(5000).max(120000).optional()
});

/**
 * Generate a secure webhook secret
 */
function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get webhook settings for the current tenant
 */
router.get('/', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const tenant = await storage.getTenant(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Return webhook configuration (without exposing the full secret)
    const webhookSettings = {
      webhookEnabled: tenant.webhookEnabled || false,
      webhookEndpoints: tenant.webhookEndpoints || {
        orders: true,
        notifications: true,
        payments: true
      },
      webhookRetryAttempts: tenant.webhookRetryAttempts || 3,
      webhookTimeoutMs: tenant.webhookTimeoutMs || 30000,
      hasWebhookSecret: !!tenant.webhookSecret,
      webhookSecretPreview: tenant.webhookSecret ? 
        `${tenant.webhookSecret.substring(0, 8)}...${tenant.webhookSecret.substring(-4)}` : 
        null,
      webhookUrls: {
        orders: `${process.env.CLIENT_URL || 'http://localhost:5000'}/api/webhooks/orders`,
        notifications: `${process.env.CLIENT_URL || 'http://localhost:5000'}/api/webhooks/notifications`,
        payments: `${process.env.CLIENT_URL || 'http://localhost:5000'}/api/webhooks/payments`,
        health: `${process.env.CLIENT_URL || 'http://localhost:5000'}/api/webhooks/health`
      }
    };

    res.json(webhookSettings);
  } catch (error) {
    log(`Error fetching webhook settings: ${error}`, 'webhook');
    res.status(500).json({ message: 'Failed to fetch webhook settings' });
  }
});

/**
 * Update webhook settings for the current tenant
 */
router.patch('/', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const validatedData = webhookSettingsSchema.parse(req.body);
    const storage = await getStorage();
    
    const updateData: any = {
      updatedAt: new Date()
    };

    // Update webhook settings
    if (validatedData.webhookEnabled !== undefined) {
      updateData.webhookEnabled = validatedData.webhookEnabled;
    }
    
    if (validatedData.webhookEndpoints) {
      updateData.webhookEndpoints = validatedData.webhookEndpoints;
    }
    
    if (validatedData.webhookRetryAttempts !== undefined) {
      updateData.webhookRetryAttempts = validatedData.webhookRetryAttempts;
    }
    
    if (validatedData.webhookTimeoutMs !== undefined) {
      updateData.webhookTimeoutMs = validatedData.webhookTimeoutMs;
    }

    const updatedTenant = await storage.updateTenant(req.tenantId, updateData);
    
    if (!updatedTenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    log(`Webhook settings updated for tenant ${req.tenantId}`, 'webhook');
    
    res.json({ 
      message: 'Webhook settings updated successfully',
      settings: {
        webhookEnabled: updatedTenant.webhookEnabled,
        webhookEndpoints: updatedTenant.webhookEndpoints,
        webhookRetryAttempts: updatedTenant.webhookRetryAttempts,
        webhookTimeoutMs: updatedTenant.webhookTimeoutMs
      }
    });
  } catch (error) {
    log(`Error updating webhook settings: ${error}`, 'webhook');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid webhook settings data',
        errors: error.errors
      });
    }
    
    res.status(500).json({ message: 'Failed to update webhook settings' });
  }
});

/**
 * Generate a new webhook secret
 */
router.post('/generate-secret', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const newSecret = generateWebhookSecret();
    
    const updateData = {
      webhookSecret: newSecret,
      updatedAt: new Date()
    };

    const updatedTenant = await storage.updateTenant(req.tenantId, updateData);
    
    if (!updatedTenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    log(`New webhook secret generated for tenant ${req.tenantId}`, 'webhook');
    
    res.json({ 
      message: 'Webhook secret generated successfully',
      secret: newSecret,
      preview: `${newSecret.substring(0, 8)}...${newSecret.substring(-4)}`
    });
  } catch (error) {
    log(`Error generating webhook secret: ${error}`, 'webhook');
    res.status(500).json({ message: 'Failed to generate webhook secret' });
  }
});

/**
 * Get webhook secret (full secret for copying)
 */
router.get('/secret', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const tenant = await storage.getTenant(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (!tenant.webhookSecret) {
      return res.status(404).json({ message: 'No webhook secret configured' });
    }

    res.json({ 
      secret: tenant.webhookSecret,
      preview: `${tenant.webhookSecret.substring(0, 8)}...${tenant.webhookSecret.substring(-4)}`
    });
  } catch (error) {
    log(`Error fetching webhook secret: ${error}`, 'webhook');
    res.status(500).json({ message: 'Failed to fetch webhook secret' });
  }
});

/**
 * Test webhook configuration
 */
router.post('/test', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const tenant = await storage.getTenant(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (!tenant.webhookEnabled) {
      return res.status(400).json({ message: 'Webhooks are not enabled for this tenant' });
    }

    // Create a test notification to verify the system is working
    const { getNotificationService } = await import('../../services/notification');
    const notificationService = getNotificationService();
    
    const testNotification = await notificationService.createNotification({
      tenantId: req.tenantId.toString(),
      title: 'Webhook Test',
      message: 'This is a test notification to verify your webhook configuration is working correctly.',
      type: 'info',
      priority: 'low',
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'webhook-settings-test'
      }
    });

    log(`Webhook test notification created for tenant ${req.tenantId}`, 'webhook');
    
    res.json({ 
      message: 'Webhook test completed successfully',
      testNotificationId: testNotification._id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log(`Error testing webhook configuration: ${error}`, 'webhook');
    res.status(500).json({ message: 'Failed to test webhook configuration' });
  }
});

export default router;
