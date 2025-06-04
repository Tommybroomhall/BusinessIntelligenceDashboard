import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, type Order, type OrderItem, type OrderStatus } from '@/lib/api/order';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  User,
  DollarSign,
  TruckIcon,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { sanitizeImageUrl } from '@/lib/security';
import { useCurrencyFormatter } from "@/context/CurrencyContext";

export default function OrderDetail() {
  const { id: orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'items'>('details');
  const { formatCurrency } = useCurrencyFormatter();

  // Fetch order data
  const {
    data: order,
    isLoading: isLoadingOrder,
    isError: isOrderError,
    error: orderError
  } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    queryFn: () => (orderId ? orderApi.getById(orderId) : Promise.resolve(undefined as unknown as Order)),
    enabled: !!orderId,
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch order items
  const {
    data: orderItems = [],
    isLoading: isLoadingItems,
    isError: isItemsError,
    error: itemsError
  } = useQuery<OrderItem[]>({
    queryKey: ['/api/orders', orderId, 'items'],
    queryFn: () => (orderId ? orderApi.getOrderItems(orderId) : Promise.resolve([])),
    enabled: !!orderId,
    staleTime: 60 * 1000, // 1 minute
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async (newStatus: OrderStatus) => {
      if (!orderId) throw new Error('Order ID is required');
      return orderApi.updateStatus(orderId, newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
      toast({
        title: "Order updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFulfillOrder = () => {
    updateOrderStatus.mutate('shipped');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'refunded':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const calculateOrderTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (isLoadingOrder) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading order details...</span>
      </div>
    );
  }

  if (isOrderError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-red-500">
        <AlertCircle className="h-8 w-8" />
        <p className="mt-2">Error loading order details</p>
        <p className="text-sm">{orderError instanceof Error ? orderError.message : 'Unknown error'}</p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/')} 
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <Package className="h-12 w-12 text-gray-400" />
        <p className="mt-2">Order not found</p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/')} 
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">
              {order.createdAt ? formatDate(order.createdAt) :
               order.date ? formatDate(order.date) : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusColor(order.status)}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
          {order.status === 'paid' && (
            <Button
              onClick={handleFulfillOrder}
              disabled={updateOrderStatus.isPending}
              className="gap-2"
            >
              {updateOrderStatus.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TruckIcon className="h-4 w-4" />
              )}
              Fulfill Order
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Order Details</TabsTrigger>
          <TabsTrigger value="items">Order Items ({orderItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{order.customerName}</span>
                </div>
                {order.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{order.customerEmail}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Order Total:</span>
                  <span className="font-medium">{formatCurrency(order.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Items Total:</span>
                  <span className="font-medium">{formatCurrency(calculateOrderTotal())}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  <Badge variant="outline" className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          {isLoadingItems ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading order items...</span>
            </div>
          ) : isItemsError ? (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto" />
              <p className="mt-2">Error loading order items</p>
              <p className="text-sm">{itemsError instanceof Error ? itemsError.message : 'Unknown error'}</p>
            </div>
          ) : orderItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-2">No items found for this order</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>
                  {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} in this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow key={item._id || item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {item.productImageUrl && (
                              <img
                                src={sanitizeImageUrl(item.productImageUrl)}
                                alt={item.productName || 'Product'}
                                className="h-10 w-10 rounded object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.productName || 'Unknown Product'}</p>
                              <p className="text-sm text-gray-500">ID: {item.productId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
