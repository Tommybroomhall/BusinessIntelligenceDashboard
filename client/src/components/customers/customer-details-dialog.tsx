import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, Mail, Phone, MapPin, Calendar, Package } from 'lucide-react';
import { customerApi, type Customer, type Order } from '@/lib/api/customer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDate } from "@/lib/utils";
import { useCurrencyFormatter } from "@/context/CurrencyContext";
import { useToast } from "@/components/ui/use-toast";

interface CustomerDetailsDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsDialog({
  customer,
  open,
  onOpenChange,
}: CustomerDetailsDialogProps) {
  const { toast } = useToast();
  const { formatCurrency } = useCurrencyFormatter();

  // Format date from ISO string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'paid':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'processing':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100';
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

  // Fetch orders for the customer using our API
  const {
    data: customerOrders,
    isLoading: isLoadingOrders,
    error: ordersError
  } = useQuery<Order[]>({
    queryKey: ['/api/customer/orders', customer?._id],
    queryFn: () => customer?._id ? customerApi.getOrders(customer._id) : Promise.resolve([]),
    enabled: !!customer?._id && open,
    staleTime: 60 * 1000, // 1 minute
  });

  // Calculate order summary metrics from actual orders
  const orderSummary = useMemo(() => {
    if (!customerOrders) {
      return {
        totalSpent: 0,
        orderCount: 0,
        avgOrderValue: 0,
        hasOrders: false
      };
    }

    // Filter out canceled and refunded orders for financial calculations
    const validOrders = customerOrders.filter(order =>
      order.status !== 'canceled' && order.status !== 'refunded'
    );

    const totalSpent = validOrders.reduce((sum, order) => sum + order.amount, 0);
    const orderCount = validOrders.length;
    const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

    return {
      totalSpent,
      orderCount,
      avgOrderValue,
      hasOrders: customerOrders.length > 0,
      totalOrderCount: customerOrders.length // Total including canceled/refunded
    };
  }, [customerOrders]);

  // Check for discrepancy between stored and calculated values
  const hasDiscrepancy = useMemo(() => {
    if (!customer || !orderSummary.hasOrders) return false;

    // If customer doesn't have these fields, there's no discrepancy to check
    if (customer.totalSpent === undefined || customer.orderCount === undefined) {
      return false;
    }

    // Allow for small floating point differences (less than 1 cent)
    const totalSpentDiff = Math.abs(customer.totalSpent - orderSummary.totalSpent) > 0.01;
    const orderCountDiff = customer.orderCount !== orderSummary.totalOrderCount;

    return totalSpentDiff || orderCountDiff;
  }, [customer, orderSummary]);

  if (!customer) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Customer Details</DialogTitle>
          <DialogDescription>
            View detailed information about this customer.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{customer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{customer.name}</h2>
              <div className="flex items-center mt-1">
                <Badge variant="outline" className={getStatusColor(customer.status)}>
                  {customer.status}
                </Badge>
                <span className="ml-2 text-sm text-gray-500">
                  Customer since {customer.createdAt ? formatDate(customer.createdAt) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Customer Info</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email</div>
                      <div className="flex items-center mt-1">
                        <Mail className="mr-2 h-4 w-4 text-gray-500" />
                        <span>{customer.email}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Phone</div>
                      <div className="flex items-center mt-1">
                        <Phone className="mr-2 h-4 w-4 text-gray-500" />
                        <span>{customer.phone}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Location</div>
                      <div className="flex items-center mt-1">
                        <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                        <span>{customer.location}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Last Order</div>
                      <div className="flex items-center mt-1">
                        <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                        <span>
                          {customer.lastOrderDate
                            ? formatDate(customer.lastOrderDate)
                            : customerOrders && customerOrders.length > 0 && customerOrders[0].createdAt
                              ? formatDate(customerOrders[0].createdAt)
                              : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Purchase Summary</CardTitle>
                  {isLoadingOrders && (
                    <CardDescription>
                      <span className="flex items-center text-yellow-600">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Calculating from orders...
                      </span>
                    </CardDescription>
                  )}
                  {ordersError && (
                    <CardDescription className="text-red-500">
                      Error loading orders. Using stored values.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasDiscrepancy && !isLoadingOrders && (
                    <Alert variant="warning" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Data Discrepancy Detected</AlertTitle>
                      <AlertDescription>
                        The summary below is calculated from actual orders and may differ from stored customer data.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Total Spent</div>
                      <div className="text-2xl font-bold mt-1">
                        {isLoadingOrders
                          ? (customer.totalSpent !== undefined ? formatCurrency(customer.totalSpent) : formatCurrency(0))
                          : formatCurrency(orderSummary.totalSpent)}
                      </div>
                      {hasDiscrepancy && !isLoadingOrders && customer.totalSpent !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          Stored: {formatCurrency(customer.totalSpent)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Order Count</div>
                      <div className="text-2xl font-bold mt-1">
                        {isLoadingOrders
                          ? (customer.orderCount !== undefined ? customer.orderCount : 0)
                          : orderSummary.orderCount}
                      </div>
                      {hasDiscrepancy && !isLoadingOrders && customer.orderCount !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          Stored: {customer.orderCount}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Avg. Order Value</div>
                      <div className="text-2xl font-bold mt-1">
                        {isLoadingOrders
                          ? (customer.orderCount !== undefined && customer.totalSpent !== undefined && customer.orderCount > 0
                              ? formatCurrency(customer.totalSpent / customer.orderCount)
                              : formatCurrency(0))
                          : (orderSummary.orderCount > 0
                              ? formatCurrency(orderSummary.avgOrderValue)
                              : formatCurrency(0))}
                      </div>
                    </div>
                  </div>

                  {!isLoadingOrders && customerOrders && customerOrders.length > 0 && (
                    <div className="text-xs text-gray-500 mt-2">
                      * Financial calculations exclude canceled and refunded orders
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
                    Showing all orders placed by this customer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingOrders ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading orders...</span>
                    </div>
                  ) : !customerOrders || customerOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2">No orders found for this customer.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerOrders.map((order) => (
                          <TableRow key={order._id || order.id}>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>
                              {order.createdAt ? formatDate(order.createdAt) :
                               order.date ? formatDate(order.date) : 'N/A'}
                            </TableCell>
                            <TableCell>${order.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusColor(order.status)}
                              >
                                {order.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
