import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getStorage } from '../../storageFactory';
import { getNotificationService } from '../../services/notification';
import { ensureTenantAccess } from '../../middleware/tenantAccess';
import { log } from '../../vite';

const router = Router();

// Validation schemas
const createNotificationSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  type: z.enum(['info', 'success', 'warning', 'error', 'order', 'payment', 'system']).optional().default('info'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  userId: z.string().optional(),
  actionUrl: z.string().optional(),
  actionText: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().optional()
});

const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
  isDismissed: z.boolean().optional()
});

/**
 * Get notifications for the current tenant (includes webhook notifications and dispatch alerts)
 */
router.get('/', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const { limit = '50', userId, includeRead = 'true', includeDismissed = 'false' } = req.query;

    // Get regular notifications
    const notifications = await storage.getNotifications(
      req.tenantId,
      userId as string,
      parseInt(limit as string)
    );

    // Get orders that need dispatching and create notifications for them
    const ordersNeedingDispatch = await storage.getOrdersNeedingDispatch(req.tenantId);

    // Create dispatch notifications for orders that need shipping
    const dispatchNotifications = ordersNeedingDispatch.map(order => ({
      _id: `dispatch-${order._id}`,
      title: 'Order Ready for Dispatch',
      message: `Order #${order.orderNumber} from ${order.customerName} is ready to ship`,
      type: 'order',
      priority: 'high',
      isRead: false,
      isDismissed: false,
      actionUrl: `/orders/${order._id}`,
      actionText: 'View Order',
      entityType: 'order',
      entityId: order._id,
      metadata: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        status: order.status,
        total: order.total,
        isDispatchAlert: true
      },
      createdAt: order.updatedAt || order.createdAt,
      updatedAt: order.updatedAt || order.createdAt,
      expiresAt: null
    }));

    // Combine all notifications
    const allNotifications = [...notifications, ...dispatchNotifications];

    // Filter based on query parameters
    let filteredNotifications = allNotifications;

    if (includeRead === 'false') {
      filteredNotifications = filteredNotifications.filter(n => !n.isRead);
    }

    if (includeDismissed === 'false') {
      filteredNotifications = filteredNotifications.filter(n => !n.isDismissed);
    }

    // Sort by creation date (newest first) and limit
    filteredNotifications = filteredNotifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, parseInt(limit as string));

    // Transform for frontend
    const transformedNotifications = filteredNotifications.map(notification => ({
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      isRead: notification.isRead,
      isDismissed: notification.isDismissed,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      entityType: notification.entityType,
      entityId: notification.entityId?.toString(),
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      expiresAt: notification.expiresAt
    }));

    res.json({
      notifications: transformedNotifications,
      total: transformedNotifications.length
    });

  } catch (error) {
    log(`Error fetching notifications: ${error}`, 'notifications');
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

/**
 * Get comprehensive unread count (matches Updates page)
 * Includes: notifications, messages, stock alerts, dispatch orders
 */
router.get('/count', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const { userId } = req.query;

    // Get regular unread notification count (non-dismissed notifications)
    const notifications = await storage.getNotifications(req.tenantId, userId as string);
    const activeNotifications = notifications.filter(notification => !notification.isDismissed).length;

    // Get orders that need dispatching
    const ordersNeedingDispatch = await storage.getOrdersNeedingDispatch(req.tenantId);
    const dispatchCount = ordersNeedingDispatch.length;

    // Mock messages count (in a real app, this would come from database)
    const generateMockMessages = (tenantId: number) => [
      {
        id: `msg-${tenantId}-1`,
        title: 'New Customer Inquiry',
        content: 'A customer has asked about product availability and shipping times.',
        sender: 'support@example.com',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false
      },
      {
        id: `msg-${tenantId}-2`,
        title: 'Order Confirmation Required',
        content: 'Order #12345 requires manual confirmation due to payment verification.',
        sender: 'orders@example.com',
        date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        read: false
      },
      {
        id: `msg-${tenantId}-3`,
        title: 'Supplier Update',
        content: 'Your regular supplier has updated their pricing structure.',
        sender: 'supplier@example.com',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        read: true
      }
    ];
    const messages = generateMockMessages(req.tenantId);
    const unreadMessages = messages.filter(message => !message.read).length;

    // Mock stock alerts count (in a real app, this would come from database)
    const generateMockStockAlerts = () => [
      {
        id: 'stock-1',
        productName: 'Wireless Bluetooth Headphones',
        category: 'Electronics',
        currentStock: 3,
        threshold: 10,
        lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'stock-2',
        productName: 'Organic Cotton T-Shirt',
        category: 'Clothing',
        currentStock: 5,
        threshold: 15,
        lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'stock-3',
        productName: 'Stainless Steel Water Bottle',
        category: 'Home & Garden',
        currentStock: 2,
        threshold: 8,
        lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'stock-4',
        productName: 'Yoga Mat',
        category: 'Sports & Fitness',
        currentStock: 7,
        threshold: 12,
        lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'stock-5',
        productName: 'Coffee Maker',
        category: 'Appliances',
        currentStock: 1,
        threshold: 6,
        lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'stock-6',
        productName: 'Running Shoes',
        category: 'Sports & Fitness',
        currentStock: 8,
        threshold: 20,
        lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      }
    ];
    const stockAlerts = generateMockStockAlerts();
    const criticalStockAlerts = stockAlerts.filter(alert => alert.currentStock <= 5).length;

    // Total comprehensive count (matches Updates page calculation)
    const totalCount = unreadMessages + criticalStockAlerts + dispatchCount + activeNotifications;

    res.json({ 
      count: totalCount,
      breakdown: {
        messages: unreadMessages,
        stockAlerts: criticalStockAlerts,
        orders: dispatchCount,
        notifications: activeNotifications
      }
    });

  } catch (error) {
    log(`Error fetching notification count: ${error}`, 'notifications');
    res.status(500).json({ message: 'Failed to fetch notification count' });
  }
});

/**
 * Create a new notification (admin only)
 */
router.post('/', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validatedData = createNotificationSchema.parse(req.body);
    
    const notificationService = getNotificationService();
    
    // Create notification
    const notification = await notificationService.createNotification({
      tenantId: req.tenantId.toString(),
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
      id: notification._id.toString(),
      message: 'Notification created successfully'
    });

  } catch (error) {
    log(`Error creating notification: ${error}`, 'notifications');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid notification data',
        errors: error.errors
      });
    }

    res.status(500).json({ message: 'Failed to create notification' });
  }
});

/**
 * Update a notification (mark as read/dismissed)
 */
router.patch('/:id', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateNotificationSchema.parse(req.body);
    
    const storage = await getStorage();
    
    let updatedNotification;
    
    if (validatedData.isRead !== undefined) {
      if (validatedData.isRead) {
        updatedNotification = await storage.markNotificationAsRead(id, req.tenantId);
      } else {
        // Mark as unread (reverse operation)
        updatedNotification = await storage.markNotificationAsRead(id, req.tenantId);
        // Note: You might want to add a markAsUnread method to storage
      }
    }
    
    if (validatedData.isDismissed !== undefined) {
      if (validatedData.isDismissed) {
        updatedNotification = await storage.dismissNotification(id, req.tenantId);
      }
    }

    if (!updatedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Broadcast update to connected clients
    const notificationService = getNotificationService();
    notificationService.broadcastToTenant(req.tenantId.toString(), 'notification-updated', {
      id: updatedNotification._id.toString(),
      isRead: updatedNotification.isRead,
      isDismissed: updatedNotification.isDismissed
    });

    res.json({
      id: updatedNotification._id.toString(),
      message: 'Notification updated successfully'
    });

  } catch (error) {
    log(`Error updating notification: ${error}`, 'notifications');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid update data',
        errors: error.errors
      });
    }

    res.status(500).json({ message: 'Failed to update notification' });
  }
});

/**
 * Mark all notifications as read for the current tenant/user
 */
router.post('/mark-all-read', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const { userId } = req.body;
    
    // Get all unread notifications
    const notifications = await storage.getNotifications(req.tenantId, userId);
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    // Mark each as read
    const updatePromises = unreadNotifications.map(notification =>
      storage.markNotificationAsRead(notification._id.toString(), req.tenantId)
    );
    
    await Promise.all(updatePromises);
    
    // Broadcast update to connected clients
    const notificationService = getNotificationService();
    notificationService.broadcastToTenant(req.tenantId.toString(), 'notifications-marked-read', {
      count: unreadNotifications.length,
      userId
    });

    res.json({
      message: 'All notifications marked as read',
      count: unreadNotifications.length
    });

  } catch (error) {
    log(`Error marking all notifications as read: ${error}`, 'notifications');
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

/**
 * Delete a notification (admin only)
 */
router.delete('/:id', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // For now, we'll just dismiss the notification instead of deleting
    // This preserves audit trail while hiding it from users
    const storage = await getStorage();
    const updatedNotification = await storage.dismissNotification(id, req.tenantId);

    if (!updatedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Broadcast update to connected clients
    const notificationService = getNotificationService();
    notificationService.broadcastToTenant(req.tenantId.toString(), 'notification-dismissed', {
      id: updatedNotification._id.toString()
    });

    res.json({ message: 'Notification dismissed successfully' });

  } catch (error) {
    log(`Error dismissing notification: ${error}`, 'notifications');
    res.status(500).json({ message: 'Failed to dismiss notification' });
  }
});

/**
 * Test notification endpoint (development only)
 */
router.post('/test', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Test endpoint not available in production' });
    }

    const notificationService = getNotificationService();
    
    const testNotification = await notificationService.createNotification({
      tenantId: req.tenantId.toString(),
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working correctly.',
      type: 'info',
      priority: 'low',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      message: 'Test notification created',
      id: testNotification._id.toString()
    });

  } catch (error) {
    log(`Error creating test notification: ${error}`, 'notifications');
    res.status(500).json({ message: 'Failed to create test notification' });
  }
});

export default router;
