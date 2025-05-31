import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Notification, INotification } from '../models';
import { log } from '../vite';

export interface NotificationData {
  tenantId: string;
  userId?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'order' | 'payment' | 'system';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export class NotificationService {
  private io: SocketIOServer;
  private static instance: NotificationService;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.CLIENT_URL || "https://yourdomain.com"
          : ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupSocketHandlers();
    NotificationService.instance = this;
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      throw new Error('NotificationService not initialized. Call constructor first.');
    }
    return NotificationService.instance;
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      log(`Client connected: ${socket.id}`, 'notification');

      // Join tenant-specific room for notifications
      socket.on('join-tenant', (tenantId: string) => {
        socket.join(`tenant-${tenantId}`);
        log(`Client ${socket.id} joined tenant room: ${tenantId}`, 'notification');
      });

      // Leave tenant room
      socket.on('leave-tenant', (tenantId: string) => {
        socket.leave(`tenant-${tenantId}`);
        log(`Client ${socket.id} left tenant room: ${tenantId}`, 'notification');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        log(`Client disconnected: ${socket.id}`, 'notification');
      });

      // Handle notification acknowledgment
      socket.on('notification-received', (notificationId: string) => {
        log(`Notification ${notificationId} acknowledged by ${socket.id}`, 'notification');
      });
    });
  }

  /**
   * Create and broadcast a notification
   */
  async createNotification(data: NotificationData): Promise<INotification> {
    try {
      // Create notification in database
      const notification = new Notification({
        tenantId: data.tenantId,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        priority: data.priority || 'medium',
        actionUrl: data.actionUrl,
        actionText: data.actionText,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata,
        expiresAt: data.expiresAt,
        isRead: false,
        isDismissed: false
      });

      const savedNotification = await notification.save();
      log(`Created notification: ${savedNotification._id}`, 'notification');

      // Broadcast to tenant room
      this.broadcastToTenant(data.tenantId, 'new-notification', {
        id: savedNotification._id,
        title: savedNotification.title,
        message: savedNotification.message,
        type: savedNotification.type,
        priority: savedNotification.priority,
        actionUrl: savedNotification.actionUrl,
        actionText: savedNotification.actionText,
        createdAt: savedNotification.createdAt,
        metadata: savedNotification.metadata
      });

      return savedNotification;
    } catch (error) {
      log(`Error creating notification: ${error}`, 'notification');
      throw error;
    }
  }

  /**
   * Broadcast notification to specific tenant
   */
  broadcastToTenant(tenantId: string, event: string, data: any) {
    this.io.to(`tenant-${tenantId}`).emit(event, data);
    log(`Broadcasted ${event} to tenant ${tenantId}`, 'notification');
  }

  /**
   * Broadcast notification to specific user
   */
  broadcastToUser(userId: string, event: string, data: any) {
    this.io.to(`user-${userId}`).emit(event, data);
    log(`Broadcasted ${event} to user ${userId}`, 'notification');
  }

  /**
   * Broadcast system-wide notification
   */
  broadcastGlobal(event: string, data: any) {
    this.io.emit(event, data);
    log(`Broadcasted ${event} globally`, 'notification');
  }

  /**
   * Get Socket.IO instance for external use
   */
  getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Get connected clients count for a tenant
   */
  getTenantClientsCount(tenantId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`tenant-${tenantId}`);
    return room ? room.size : 0;
  }

  /**
   * Quick notification helpers for common scenarios
   */
  async notifyNewOrder(tenantId: string, orderData: any) {
    return this.createNotification({
      tenantId,
      title: 'New Order Received',
      message: `Order #${orderData.orderNumber} from ${orderData.customerName}`,
      type: 'order',
      priority: 'high',
      actionUrl: `/orders/${orderData.id}`,
      actionText: 'View Order',
      entityType: 'order',
      entityId: orderData.id,
      metadata: {
        orderNumber: orderData.orderNumber,
        customerName: orderData.customerName,
        amount: orderData.amount
      }
    });
  }

  async notifyPaymentReceived(tenantId: string, paymentData: any) {
    return this.createNotification({
      tenantId,
      title: 'Payment Received',
      message: `Payment of ${paymentData.amount} received for order #${paymentData.orderNumber}`,
      type: 'payment',
      priority: 'medium',
      actionUrl: `/orders/${paymentData.orderId}`,
      actionText: 'View Order',
      entityType: 'payment',
      entityId: paymentData.id,
      metadata: paymentData
    });
  }

  async notifyLowStock(tenantId: string, productData: any) {
    return this.createNotification({
      tenantId,
      title: 'Low Stock Alert',
      message: `${productData.name} is running low (${productData.stockLevel})`,
      type: 'warning',
      priority: 'medium',
      actionUrl: `/products/${productData.id}`,
      actionText: 'Manage Stock',
      entityType: 'product',
      entityId: productData.id,
      metadata: productData
    });
  }

  async notifySystemAlert(tenantId: string, alertData: any) {
    return this.createNotification({
      tenantId,
      title: alertData.title || 'System Alert',
      message: alertData.message,
      type: 'system',
      priority: alertData.priority || 'medium',
      metadata: alertData
    });
  }
}

// Export singleton instance getter
export const getNotificationService = (): NotificationService => {
  return NotificationService.getInstance();
};
