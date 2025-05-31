import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useToast } from './use-toast';
import { apiRequest, getQueryFn } from '@/lib/queryClient';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'payment' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  isDismissed: boolean;
  actionUrl?: string;
  actionText?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

interface UseNotificationsOptions {
  tenantId?: string;
  userId?: string;
  enableRealTime?: boolean;
  showToasts?: boolean;
  autoRefreshInterval?: number;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:5000';

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    tenantId,
    userId,
    enableRealTime = true,
    showToasts = true,
    autoRefreshInterval = 30000 // 30 seconds
  } = options;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null
  });

  // Fetch notifications from API
  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    error: notificationsError,
    refetch: refetchNotifications
  } = useQuery({
    queryKey: ['notifications', tenantId, userId],
    queryFn: async () => {
      console.log('🔍 Fetching notifications for:', { tenantId, userId });
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('includeRead', 'true');
      params.append('includeDismissed', 'false');
      
      const url = `/api/notifications?${params.toString()}`;
      console.log('🔗 Notifications URL:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📦 Notifications response:', result);
      return result;
    },
    enabled: !!tenantId,
    refetchInterval: autoRefreshInterval,
    staleTime: 10000 // 10 seconds
  });

  // Fetch unread count
  const {
    data: countData,
    refetch: refetchCount
  } = useQuery({
    queryKey: ['notifications-count', tenantId, userId],
    queryFn: async () => {
      console.log('🔢 Fetching notification count for:', { tenantId, userId });
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      
      const url = `/api/notifications/count?${params.toString()}`;
      console.log('🔗 Count URL:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notification count: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📊 Count response:', result);
      return result;
    },
    enabled: !!tenantId,
    refetchInterval: autoRefreshInterval,
    staleTime: 5000 // 5 seconds
  });

  // Update state when data changes
  useEffect(() => {
    if (notificationsData?.notifications) {
      setState(prev => ({
        ...prev,
        notifications: notificationsData.notifications,
        isLoading: false,
        error: null
      }));
    }
  }, [notificationsData]);

  useEffect(() => {
    if (countData?.count !== undefined) {
      setState(prev => ({
        ...prev,
        unreadCount: countData.count
      }));
    }
  }, [countData]);

  useEffect(() => {
    if (notificationsError) {
      setState(prev => ({
        ...prev,
        error: notificationsError.message || 'Failed to load notifications',
        isLoading: false
      }));
    }
  }, [notificationsError]);

  // Socket.IO connection and event handlers
  useEffect(() => {
    if (!enableRealTime || !tenantId) return;

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to notification service');

      // Join tenant room for notifications
      socket.emit('join-tenant', tenantId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from notification service');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to connect to real-time notifications'
      }));
    });

    // Handle new notifications
    socket.on('new-notification', (notification: Notification) => {
      console.log('Received new notification:', notification);
      
      // Update notifications list
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications],
        unreadCount: prev.unreadCount + 1
      }));

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });

      // Show toast notification if enabled
      if (showToasts) {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default',
          duration: notification.priority === 'urgent' ? 10000 : 5000,
          action: notification.actionUrl ? {
            altText: notification.actionText || 'View',
            onClick: () => {
              if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
              }
            }
          } : undefined
        });
      }

      // Acknowledge receipt
      socket.emit('notification-received', notification.id);
    });

    // Handle notification updates
    socket.on('notification-updated', (data: { id: string; isRead: boolean; isDismissed: boolean }) => {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === data.id 
            ? { ...n, isRead: data.isRead, isDismissed: data.isDismissed }
            : n
        ),
        unreadCount: data.isRead ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount
      }));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    });

    // Handle dashboard refresh events
    socket.on('dashboard-refresh', (data: any) => {
      console.log('Dashboard refresh event:', data);
      
      // Invalidate dashboard queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      if (showToasts) {
        toast({
          title: 'Dashboard Updated',
          description: `New ${data.type?.replace('-', ' ')} received`,
          variant: 'default',
          duration: 3000
        });
      }
    });

    // Handle bulk notification updates
    socket.on('notifications-marked-read', (data: { count: number; userId?: string }) => {
      if (!userId || data.userId === userId) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
          unreadCount: 0
        }));

        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      }
    });

    return () => {
      socket.emit('leave-tenant', tenantId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enableRealTime, tenantId, userId, showToasts, toast, queryClient]);

  // API methods
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: true }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }

      // Optimistically update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));

      // Refetch to ensure consistency
      refetchNotifications();
      refetchCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive'
      });
    }
  }, [refetchNotifications, refetchCount, toast]);

  const dismiss = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isDismissed: true }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to dismiss notification: ${response.status}`);
      }

      // Optimistically update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notificationId)
      }));

      refetchNotifications();
      refetchCount();
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to dismiss notification',
        variant: 'destructive'
      });
    }
  }, [refetchNotifications, refetchCount, toast]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        body: JSON.stringify({ userId }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.status}`);
      }

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));

      refetchNotifications();
      refetchCount();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive'
      });
    }
  }, [userId, refetchNotifications, refetchCount, toast]);

  const refresh = useCallback(() => {
    refetchNotifications();
    refetchCount();
  }, [refetchNotifications, refetchCount]);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading: isLoadingNotifications || state.isLoading,
    error: state.error,
    markAsRead,
    dismiss,
    markAllAsRead,
    refresh
  };
}
