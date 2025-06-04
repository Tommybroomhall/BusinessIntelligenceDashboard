import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Package,
  ShoppingCart,
  AlertTriangle,
  Mail,
  CheckCircle,
  Clock,
  Filter,
  MessageSquare,
  Info,
  XCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  EyeOff
} from "lucide-react";
import { OrderDetailsDialog } from "@/components/orders/order-details-dialog";
import { UpdatesFilter } from "@/components/updates/UpdatesFilter";
import { ViewAllModal } from "@/components/updates/ViewAllModal";
import { useCurrencyFormatter } from "@/context/CurrencyContext";
import { useToast } from "@/hooks/use-toast";

// Define types for our data
interface Message {
  id: string;
  title: string;
  content: string;
  sender: string;
  date: string;
  read: boolean;
}

interface StockAlert {
  id: string;
  productName: string;
  currentStock: number;
  threshold: number;
  category: string;
  lastUpdated: string;
}

interface Order {
  _id: string;
  tenantId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'order' | 'payment' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  isDismissed: boolean;
  actionUrl?: string;
  actionText?: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export default function Updates() {
  const [activeTab, setActiveTab] = useState("all");

  // State for order details dialog
  const [selectedOrderId, setSelectedOrderId] = useState<string | number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { formatCurrency } = useCurrencyFormatter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter state
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'messages' | 'stock' | 'orders' | 'notifications',
    status: 'all' as 'all' | 'unread' | 'read' | 'active' | 'dismissed',
    priority: 'all' as 'all' | 'low' | 'medium' | 'high' | 'urgent',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month'
  });

  // View All Modal state
  const [viewAllModal, setViewAllModal] = useState({
    open: false,
    type: null as 'messages' | 'stock' | 'orders' | 'notifications' | null,
    title: '',
    data: [] as any[]
  });

  // Handle order click
  const handleOrderClick = (order: Order) => {
    // Use the MongoDB ObjectId string
    const orderId = order._id;
    console.log('Selected order ID:', orderId);
    setSelectedOrderId(orderId);
    setDialogOpen(true);
  };

  // Handle individual message mark as read
  const handleMarkMessageRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }
      
      // Refresh messages data
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      
      toast({
        title: "Success",
        description: "Message marked as read",
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark message as read",
        variant: "destructive",
      });
    }
  };

  // Handle View All modal
  const handleViewAll = (type: 'messages' | 'stock' | 'orders' | 'notifications', title: string, data: any[]) => {
    setViewAllModal({
      open: true,
      type,
      title,
      data
    });
  };

  const closeViewAllModal = () => {
    setViewAllModal({
      open: false,
      type: null,
      title: '',
      data: []
    });
  };

  // Handle notification dismiss
  const handleDismissNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDismissed: true }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to dismiss notification');
      }
      
      // Refresh notifications data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Success",
        description: "Notification dismissed",
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss notification",
        variant: "destructive",
      });
    }
  };

  // Handle Mark All Read
  const handleMarkAllRead = async () => {
    try {
      // Mark all notifications as read
      const notificationsPromise = fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      // Mark all messages as read
      const messagesPromise = fetch('/api/messages/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const [notificationsResponse, messagesResponse] = await Promise.all([
        notificationsPromise,
        messagesPromise
      ]);
      
      if (!notificationsResponse.ok || !messagesResponse.ok) {
        throw new Error('Failed to mark all items as read');
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Success",
        description: "All items marked as read",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all items as read",
        variant: "destructive",
      });
    }
  };

  // Filter helper functions
  const isInDateRange = (dateString: string, range: string): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    
    switch (range) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= monthAgo;
      default:
        return true;
    }
  };

  // Fetch messages data
  const { data: messagesData, isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch stock alerts data
  const { data: stockAlertsData, isLoading: isStockAlertsLoading } = useQuery<StockAlert[]>({
    queryKey: ['/api/stock/alerts'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch orders needing dispatch data
  const { data: ordersNeedingDispatchData, isLoading: isOrdersDispatchLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/pending-dispatch'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch system notifications data
  const { data: notificationsResponse, isLoading: isNotificationsLoading } = useQuery<{notifications: SystemNotification[], total: number}>({
    queryKey: ['/api/notifications'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Check if data is available from API
  const isDataMissing = !messagesData || !stockAlertsData || !ordersNeedingDispatchData || !notificationsResponse;

  // If any data is missing, we'll show error messages instead of empty arrays
  const messages = messagesData;
  const stockAlerts = stockAlertsData;
  const ordersNeedingDispatch = ordersNeedingDispatchData;
  const notifications = notificationsResponse?.notifications;

  // Apply filters to data
  const filteredData = useMemo(() => {
    let filteredMessages = messages || [];
    let filteredStockAlerts = stockAlerts || [];
    let filteredOrders = ordersNeedingDispatch || [];
    let filteredNotifications = notifications || [];

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      filteredMessages = filteredMessages.filter(item => isInDateRange(item.date, filters.dateRange));
      filteredStockAlerts = filteredStockAlerts.filter(item => isInDateRange(item.lastUpdated, filters.dateRange));
      filteredOrders = filteredOrders.filter(item => isInDateRange(item.createdAt, filters.dateRange));
      filteredNotifications = filteredNotifications.filter(item => isInDateRange(item.createdAt, filters.dateRange));
    }

    // Apply status filter
    if (filters.status !== 'all') {
      if (filters.status === 'unread') {
        filteredMessages = filteredMessages.filter(item => !item.read);
        filteredNotifications = filteredNotifications.filter(item => !item.isRead && !item.isDismissed);
      } else if (filters.status === 'read') {
        filteredMessages = filteredMessages.filter(item => item.read);
        filteredNotifications = filteredNotifications.filter(item => item.isRead || item.isDismissed);
      }
    }

    // Apply priority filter (only for notifications)
    if (filters.priority !== 'all') {
      filteredNotifications = filteredNotifications.filter(item => item.priority === filters.priority);
    }

    return {
      messages: filteredMessages,
      stockAlerts: filteredStockAlerts,
      orders: filteredOrders,
      notifications: filteredNotifications
    };
  }, [filters, messages, stockAlerts, ordersNeedingDispatch, notifications]);

  // Count unread items in each category (use filtered data if filters are active, otherwise use original data)
  const dataToCount = filters.type !== 'all' || filters.status !== 'all' || filters.priority !== 'all' || filters.dateRange !== 'all' 
    ? filteredData 
    : { messages, stockAlerts, orders: ordersNeedingDispatch, notifications };

  const unreadMessages = dataToCount.messages ? dataToCount.messages.filter(message => !message.read).length : 0;
  const criticalStockAlerts = dataToCount.stockAlerts ? dataToCount.stockAlerts.filter(alert => alert.currentStock <= 5).length : 0;
  const dispatchableOrders = dataToCount.orders ? dataToCount.orders.length : 0; // Already filtered by backend to only include orders needing dispatch
  const activeNotifications = dataToCount.notifications ? dataToCount.notifications.filter(notification => !notification.isDismissed).length : 0;

  const totalUpdates = unreadMessages + criticalStockAlerts + dispatchableOrders + activeNotifications;

  // Helper for notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Helper for date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {isDataMissing && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="font-medium">Missing Data from MongoDB</h3>
              <p className="text-sm">Some data could not be loaded from the database. This page will not function correctly until all required data is available.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Updates</h1>
        <div className="flex gap-2">
          <UpdatesFilter 
            filters={filters} 
            onFiltersChange={setFilters} 
          />
          <Button 
            onClick={handleMarkAllRead}
            disabled={totalUpdates === 0}
          >
            Mark All Read
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={unreadMessages > 0 ? "border-l-4 border-l-blue-500" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <CardDescription>Messages requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Mail className="h-8 w-8 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">{unreadMessages}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleViewAll('messages', 'All Messages', filteredData.messages || [])}
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={criticalStockAlerts > 0 ? "border-l-4 border-l-red-500" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
              <CardDescription>Products with low stock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-red-500 mr-2" />
                  <span className="text-2xl font-bold">{criticalStockAlerts}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleViewAll('stock', 'All Stock Alerts', filteredData.stockAlerts || [])}
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={dispatchableOrders > 0 ? "border-l-4 border-l-green-500" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Orders to Dispatch</CardTitle>
              <CardDescription>Ready for shipping</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ShoppingCart className="h-8 w-8 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{dispatchableOrders}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleViewAll('orders', 'All Orders to Dispatch', filteredData.orders || [])}
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={activeNotifications > 0 ? "border-l-4 border-l-amber-500" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">System Notifications</CardTitle>
              <CardDescription>Important alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Bell className="h-8 w-8 text-amber-500 mr-2" />
                  <span className="text-2xl font-bold">{activeNotifications}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleViewAll('notifications', 'All System Notifications', filteredData.notifications || [])}
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="all" className="relative">
            All Updates
            {totalUpdates > 0 && (
              <Badge variant="secondary" className="ml-1 bg-primary text-white absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs">
                {totalUpdates}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages">
            Messages
            {unreadMessages > 0 && (
              <Badge variant="secondary" className="ml-1 bg-primary text-white absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs">
                {unreadMessages}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stock">
            Stock Alerts
            {criticalStockAlerts > 0 && (
              <Badge variant="secondary" className="ml-1 bg-primary text-white absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs">
                {criticalStockAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders">
            Orders
            {dispatchableOrders > 0 && (
              <Badge variant="secondary" className="ml-1 bg-primary text-white absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs">
                {dispatchableOrders}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Messages Section */}
            {unreadMessages > 0 && (filters.type === 'all' || filters.type === 'messages') && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Mail className="mr-2 h-5 w-5 text-blue-500" />
                    Recent Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredData.messages?.filter(message => !message.read).slice(0, 2).map(message => (
                      <div key={message.id} className="flex items-start p-3 rounded-lg border border-gray-200 bg-white">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{message.title}</p>
                          <p className="text-sm text-gray-500 truncate">{message.content}</p>
                          <div className="mt-1 flex items-center">
                            <p className="text-xs text-gray-400">From: {message.sender} • {formatDate(message.date)}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    ))}
                    {unreadMessages > 2 && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleViewAll('messages', 'All Messages', filteredData.messages || [])}
                      >
                        View All {unreadMessages} Messages
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stock Alerts Section */}
            {criticalStockAlerts > 0 && (filters.type === 'all' || filters.type === 'stock') && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5 text-red-500" />
                    Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Threshold</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.stockAlerts?.filter(alert => alert.currentStock <= 5).slice(0, 3).map(alert => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium">{alert.productName}</TableCell>
                          <TableCell>{alert.category}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              {alert.currentStock} left
                            </Badge>
                          </TableCell>
                          <TableCell>{alert.threshold}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">Order</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {criticalStockAlerts > 3 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => handleViewAll('stock', 'All Stock Alerts', filteredData.stockAlerts || [])}
                    >
                      View All {criticalStockAlerts} Stock Alerts
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Orders Section */}
            {dispatchableOrders > 0 && (filters.type === 'all' || filters.type === 'orders') && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5 text-green-500" />
                    Orders to Dispatch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.orders?.slice(0, 3).map(order => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{formatCurrency(order.amount)}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOrderClick(order);
                              }}
                            >
                              Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // This would be replaced with actual dispatch logic
                                handleOrderClick(order);
                              }}
                            >
                              Dispatch
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {dispatchableOrders > 3 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => handleViewAll('orders', 'All Orders to Dispatch', filteredData.orders || [])}
                    >
                      View All {dispatchableOrders} Orders
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* System Notifications */}
            {activeNotifications > 0 && (filters.type === 'all' || filters.type === 'notifications') && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5 text-amber-500" />
                    System Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredData.notifications?.filter(notification => !notification.isDismissed).slice(0, 2).map(notification => (
                      <div key={notification.id} className="flex items-start p-3 rounded-lg border border-gray-200 bg-white">
                        <div className="mr-3 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-500">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDismissNotification(notification.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    ))}
                    {activeNotifications > 2 && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleViewAll('notifications', 'All System Notifications', filteredData.notifications || [])}
                      >
                        View All {activeNotifications} Notifications
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {totalUpdates === 0 && (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">All caught up!</h3>
                <p className="mt-2 text-sm text-gray-500">There are no pending updates at the moment.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Manage your incoming messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData.messages?.map(message => (
                  <div key={message.id} className={`flex items-start p-4 rounded-lg border ${!message.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{message.title}</p>
                        {!message.read && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">New</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{message.content}</p>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span className="font-medium">{message.sender}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(message.date)}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleMarkMessageRead(message.id)}
                        disabled={message.read}
                      >
                        {message.read ? 'Read' : 'Mark Read'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Feature Coming Soon",
                            description: "Reply functionality will be available in the next update",
                          });
                        }}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
              <CardDescription>Products that need to be restocked</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.stockAlerts?.map(alert => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.productName}</TableCell>
                      <TableCell>{alert.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={alert.currentStock <= 5 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
                          {alert.currentStock} left
                        </Badge>
                      </TableCell>
                      <TableCell>{alert.threshold}</TableCell>
                      <TableCell>{formatDate(alert.lastUpdated)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2">View</Button>
                        <Button size="sm">Order</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders Pending Dispatch</CardTitle>
              <CardDescription>Orders that are ready to be shipped</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.orders?.map(order => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{formatCurrency(order.amount)}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          order.status === "paid" ? "bg-green-100 text-green-800" :
                          order.status === "processing" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                        >
                          Details
                        </Button>
                        {order.status === "paid" && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // This would be replaced with actual dispatch logic
                              handleOrderClick(order);
                            }}
                          >
                            Dispatch
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        orderId={selectedOrderId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* View All Modal */}
      <ViewAllModal
        open={viewAllModal.open}
        type={viewAllModal.type}
        title={viewAllModal.title}
        data={viewAllModal.data}
        onClose={closeViewAllModal}
        onMarkMessageRead={handleMarkMessageRead}
        onDismissNotification={handleDismissNotification}
        onOrderClick={handleOrderClick}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
    </div>
  );
}