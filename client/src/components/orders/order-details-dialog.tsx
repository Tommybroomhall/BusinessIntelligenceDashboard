// OrderDetailsDialog
// -------------------
// A modal dialog for viewing order details and updating order status.
// - Loads live order data from MongoDB using orderApi.getById and orderApi.getOrderItems.
// - Shows customer information, order details, and ordered items.
// - Allows updating order status (e.g., fulfilling an order).
// - UI/UX matches other dialogs for consistency.
// - No mock data; all data is live from MongoDB.
// - All errors are surfaced to the user via toast or visible error UI.

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, type Order, type OrderItem, type OrderStatus } from '@/lib/api/order';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

interface OrderDetailsDialogProps {
  orderId: string | number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({ orderId, open, onOpenChange }: OrderDetailsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');

  // Fetch order data
  const {
    data: order,
    isLoading: isLoadingOrder,
    isError: isOrderError,
    error: orderError
  } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    queryFn: () => (orderId ? orderApi.getById(orderId) : Promise.resolve(undefined as unknown as Order)),
    enabled: !!orderId && open,
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
    enabled: !!orderId && open,
    staleTime: 60 * 1000, // 1 minute
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: ({ id, status }: { id: string | number, status: OrderStatus }) =>
      orderApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
      toast({
        title: 'Order updated',
        description: 'The order status has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update order status. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle fulfill button click
  const handleFulfillOrder = () => {
    if (!order || !orderId) return;

    // Ensure we're using the full MongoDB ObjectId string
    const orderIdToUse = order._id || orderId;
    console.log('Updating order status for ID:', orderIdToUse);

    updateOrderStatus.mutate({
      id: orderIdToUse,
      status: 'shipped'
    });
  };

  // Get status color based on order status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'paid':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'processing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'delivered':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'refunded':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'canceled':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Calculate total items and total quantity
  const totalItems = orderItems.length;
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Order Details</DialogTitle>
          <DialogDescription>
            View detailed information about this order.
          </DialogDescription>
        </DialogHeader>

        {isLoadingOrder ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading order details...</span>
          </div>
        ) : isOrderError ? (
          <div className="flex flex-col items-center justify-center py-8 text-red-500">
            <AlertCircle className="h-8 w-8" />
            <p className="mt-2">Error loading order details</p>
            <p className="text-sm">{orderError instanceof Error ? orderError.message : 'Unknown error'}</p>
          </div>
        ) : !order ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Package className="h-12 w-12 text-gray-400" />
            <p className="mt-2">Order not found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Status and Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-medium">Order #{order.orderNumber}</h3>
                <p className="text-sm text-gray-500">
                  {order.createdAt ? formatDate(order.createdAt) :
                   order.date ? formatDate(order.date) : 'N/A'}
                </p>
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

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="items">Order Items</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
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
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Order Number:</span>
                      <span className="font-medium">{order.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span>
                        {order.createdAt ? formatDate(order.createdAt) :
                         order.date ? formatDate(order.date) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Amount:</span>
                      <span className="font-medium">${order.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Items:</span>
                      <span>{isLoadingItems ? 'Loading...' : `${totalItems} (${totalQuantity} units)`}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="items">
                <Card>
                  <CardHeader>
                    <CardTitle>Ordered Items</CardTitle>
                    <CardDescription>
                      Items included in this order
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingItems ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Loading items...</span>
                      </div>
                    ) : isItemsError ? (
                      <div className="flex flex-col items-center justify-center py-8 text-red-500">
                        <AlertCircle className="h-8 w-8" />
                        <p className="mt-2">Error loading order items</p>
                        <p className="text-sm">{itemsError instanceof Error ? itemsError.message : 'Unknown error'}</p>
                      </div>
                    ) : orderItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2">No items found for this order.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map((item) => (
                            <TableRow key={item._id || item.id}>
                              <TableCell className="font-medium">{item.productName || 'Unknown Product'}</TableCell>
                              <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                            <TableCell className="text-right font-bold">${order.amount.toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
