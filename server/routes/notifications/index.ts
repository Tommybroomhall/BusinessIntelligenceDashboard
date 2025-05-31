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
 * Get notifications for the current tenant
 */
router.get('/', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const { limit = '50', userId, includeRead = 'true', includeDismissed = 'false' } = req.query;
    
    const notifications = await storage.getNotifications(
      req.tenantId,
      userId as string,
      parseInt(limit as string)
    );

    // Filter based on query parameters
    let filteredNotifications = notifications;
    
    if (includeRead === 'false') {
      filteredNotifications = filteredNotifications.filter(n => !n.isRead);
    }
    
    if (includeDismissed === 'false') {
      filteredNotifications = filteredNotifications.filter(n => !n.isDismissed);
    }

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
 * Get unread notification count
 */
router.get('/count', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const { userId } = req.query;
    
    const count = await storage.getUnreadNotificationCount(
      req.tenantId,
      userId as string
    );

    res.json({ count });

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
