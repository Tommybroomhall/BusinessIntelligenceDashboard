import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getStorage } from '../../storageFactory';
import { getNotificationService } from '../../services/notification';
import { log } from '../../vite';
import crypto from 'crypto';
import mongoose from 'mongoose';
import webhookSettingsRoutes from './settings';

const router = Router();

// Register webhook settings routes
router.use('/settings', webhookSettingsRoutes);

// Webhook validation schema for orders
const orderWebhookSchema = z.object({
  tenantId: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
  amount: z.number().positive(),
  status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'refunded', 'canceled']).optional().default('pending'),
  items: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive()
  })).optional(),
  metadata: z.record(z.any()).optional(),
  webhookSecret: z.string().optional()
});

// Generic notification webhook schema
const notificationWebhookSchema = z.object({
  tenantId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['info', 'success', 'warning', 'error', 'order', 'payment', 'system']).optional().default('info'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  userId: z.string().optional(),
  actionUrl: z.string().optional(),
  actionText: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().optional(),
  webhookSecret: z.string().optional()
});

/**
 * Verify webhook signature (optional security measure)
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    log(`Error verifying webhook signature: ${error}`, 'webhook');
    return false;
  }
}

/**
 * Middleware to capture raw body for signature verification
 */
function captureRawBody(req: Request, res: Response, next: Function) {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    data += chunk;
  });
  req.on('end', () => {
    (req as any).rawBody = data;
    next();
  });
}

/**
 * Order webhook endpoint
 * Receives order data from external systems (like Shopify headless)
 */
router.post('/orders', async (req: Request, res: Response) => {
  try {
    log('Received order webhook', 'webhook');

    // Validate the incoming data
    const validatedData = orderWebhookSchema.parse(req.body);

    // Get tenant and verify webhook is enabled
    const storage = await getStorage();
    const tenant = await storage.getTenant(validatedData.tenantId);

    if (!tenant) {
      log(`Webhook rejected: Tenant ${validatedData.tenantId} not found`, 'webhook');
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (!tenant.webhookEnabled) {
      log(`Webhook rejected: Webhooks disabled for tenant ${validatedData.tenantId}`, 'webhook');
      return res.status(403).json({ error: 'Webhooks are disabled for this tenant' });
    }

    if (!tenant.webhookEndpoints?.orders) {
      log(`Webhook rejected: Order webhooks disabled for tenant ${validatedData.tenantId}`, 'webhook');
      return res.status(403).json({ error: 'Order webhooks are disabled for this tenant' });
    }

    // Verify webhook signature using tenant's secret
    if (tenant.webhookSecret && req.headers['x-webhook-signature']) {
      const signature = req.headers['x-webhook-signature'] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      if (!verifyWebhookSignature(rawBody, signature, tenant.webhookSecret)) {
        log(`Invalid webhook signature for tenant ${validatedData.tenantId}`, 'webhook');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
      log(`Webhook signature verified for tenant ${validatedData.tenantId}`, 'webhook');
    } else if (tenant.webhookSecret) {
      log(`Webhook rejected: Missing signature for tenant ${validatedData.tenantId}`, 'webhook');
      return res.status(401).json({ error: 'Webhook signature required but not provided' });
    }

    const notificationService = getNotificationService();

    // Create the order in the database
    const orderData = {
      tenantId: mongoose.Types.ObjectId.createFromHexString(validatedData.tenantId),
      orderNumber: validatedData.orderNumber,
      customerName: validatedData.customerName,
      customerEmail: validatedData.customerEmail,
      amount: validatedData.amount,
      status: validatedData.status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Prepare order items - only include items with valid productId
    const orderItems = validatedData.items ? validatedData.items
      .filter(item => item.productId && mongoose.isValidObjectId(item.productId))
      .map(item => ({
        productId: mongoose.Types.ObjectId.createFromHexString(item.productId!),
        quantity: item.quantity,
        price: item.price
      })) : [];

    const newOrder = await storage.createOrder(orderData, orderItems);
    log(`Created order: ${newOrder.orderNumber}`, 'webhook');

    // Log activity
    await storage.logActivity({
      tenantId: validatedData.tenantId,
      activityType: 'order_created_webhook',
      description: `Order ${validatedData.orderNumber} created via webhook`,
      entityType: 'order',
      entityId: newOrder.id || newOrder._id,
      metadata: {
        orderNumber: validatedData.orderNumber,
        customerName: validatedData.customerName,
        amount: validatedData.amount,
        source: 'webhook'
      }
    });

    // Create and broadcast notification
    await notificationService.notifyNewOrder(validatedData.tenantId, {
      id: newOrder.id || newOrder._id,
      orderNumber: validatedData.orderNumber,
      customerName: validatedData.customerName,
      amount: validatedData.amount
    });

    // Broadcast dashboard refresh event
    notificationService.broadcastToTenant(validatedData.tenantId, 'dashboard-refresh', {
      type: 'new-order',
      orderId: newOrder.id || newOrder._id
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: newOrder.id || newOrder._id,
      orderNumber: validatedData.orderNumber
    });

  } catch (error) {
    log(`Error processing order webhook: ${error}`, 'webhook');

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid webhook data',
        details: error.errors
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process order webhook'
    });
  }
});

/**
 * Generic notification webhook endpoint
 * For sending custom notifications to the dashboard
 */
router.post('/notifications', async (req: Request, res: Response) => {
  try {
    log('Received notification webhook', 'webhook');

    // Validate the incoming data
    const validatedData = notificationWebhookSchema.parse(req.body);

    // Get tenant and verify webhook is enabled
    const storage = await getStorage();
    const tenant = await storage.getTenant(validatedData.tenantId);

    if (!tenant) {
      log(`Webhook rejected: Tenant ${validatedData.tenantId} not found`, 'webhook');
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (!tenant.webhookEnabled) {
      log(`Webhook rejected: Webhooks disabled for tenant ${validatedData.tenantId}`, 'webhook');
      return res.status(403).json({ error: 'Webhooks are disabled for this tenant' });
    }

    if (!tenant.webhookEndpoints?.notifications) {
      log(`Webhook rejected: Notification webhooks disabled for tenant ${validatedData.tenantId}`, 'webhook');
      return res.status(403).json({ error: 'Notification webhooks are disabled for this tenant' });
    }

    // Verify webhook signature using tenant's secret
    if (tenant.webhookSecret && req.headers['x-webhook-signature']) {
      const signature = req.headers['x-webhook-signature'] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      if (!verifyWebhookSignature(rawBody, signature, tenant.webhookSecret)) {
        log(`Invalid webhook signature for tenant ${validatedData.tenantId}`, 'webhook');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
      log(`Webhook signature verified for tenant ${validatedData.tenantId}`, 'webhook');
    } else if (tenant.webhookSecret) {
      log(`Webhook rejected: Missing signature for tenant ${validatedData.tenantId}`, 'webhook');
      return res.status(401).json({ error: 'Webhook signature required but not provided' });
    }

    const notificationService = getNotificationService();

    // Create and broadcast notification
    const notification = await notificationService.createNotification({
      tenantId: validatedData.tenantId,
      userId: validatedData.userId,
      title: validatedData.title,
      message: validatedData.message,
      type: validatedData.type,
      priority: validatedData.priority,
      actionUrl: validatedData.actionUrl,
      actionText: validatedData.actionText,
      entityType: validatedData.entityType,
      entityId: validatedData.entityId,
      metadata: validatedData.metadata,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notificationId: notification._id
    });

  } catch (error) {
    log(`Error processing notification webhook: ${error}`, 'webhook');

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid webhook data',
        details: error.errors
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process notification webhook'
    });
  }
});

/**
 * Payment webhook endpoint
 * For payment confirmations from payment processors
 */
router.post('/payments', async (req: Request, res: Response) => {
  try {
    log('Received payment webhook', 'webhook');

    const { tenantId, orderId, orderNumber, amount, status, paymentId, metadata } = req.body;

    if (!tenantId || !orderId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: tenantId, orderId, amount'
      });
    }

    const storage = await getStorage();
    const notificationService = getNotificationService();

    // Update order status if payment is successful
    if (status === 'paid' || status === 'completed') {
      await storage.updateOrderStatus(orderId, tenantId, 'paid');

      // Log activity
      await storage.logActivity({
        tenantId,
        activityType: 'payment_received_webhook',
        description: `Payment received for order ${orderNumber || orderId}`,
        entityType: 'payment',
        entityId: paymentId,
        metadata: {
          orderId,
          orderNumber,
          amount,
          paymentId,
          source: 'webhook'
        }
      });

      // Create and broadcast payment notification
      await notificationService.notifyPaymentReceived(tenantId, {
        id: paymentId,
        orderId,
        orderNumber: orderNumber || orderId,
        amount
      });

      // Broadcast dashboard refresh event
      notificationService.broadcastToTenant(tenantId, 'dashboard-refresh', {
        type: 'payment-received',
        orderId,
        paymentId
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment webhook processed successfully'
    });

  } catch (error) {
    log(`Error processing payment webhook: ${error}`, 'webhook');
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process payment webhook'
    });
  }
});

/**
 * Health check endpoint for webhook monitoring
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'webhook-service'
  });
});

export default router;
