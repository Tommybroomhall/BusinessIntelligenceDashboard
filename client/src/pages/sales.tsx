import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DownloadCloud,
  ChevronDown,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OrderDetailsDialog } from "@/components/orders/order-details-dialog";
import { useCurrencyFormatter } from "@/context/CurrencyContext";

// Define types for API responses
interface Order {
  _id?: string;
  id?: string;
  orderNumber?: string;
  customerName?: string;
  customer?: string;
  amount: number;
  createdAt?: string;
  date?: string;
  status: string;
}

interface SalesData {
  orders?: Order[];
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export default function Sales() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const { formatCurrency } = useCurrencyFormatter();

  // State for order details dialog
  const [selectedOrderId, setSelectedOrderId] = useState<string | number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Handle order click
  const handleOrderClick = (order: Order) => {
    // Ensure we're using the full MongoDB ObjectId string
    const orderId = order._id || order.id || null;
    console.log('Selected order ID:', orderId);
    setSelectedOrderId(orderId);
    setDialogOpen(true);
  };

  // Fetch sales data (includes orders and pagination)
  const { data: salesData, isLoading: isOrdersLoading } = useQuery<SalesData>({
    queryKey: ['/api/sales', page, pageSize, searchQuery],
    staleTime: 60 * 1000, // 1 minute
  });

  // Use orders data from sales API
  const orders = salesData?.orders || [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-indigo-100 text-indigo-800";
      case "refunded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Sales</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <DownloadCloud className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            New Order
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <CardTitle>Recent Orders</CardTitle>
              <div className="flex w-full sm:w-auto max-w-sm items-center space-x-2">
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" size="sm" className="h-9">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isOrdersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">Loading orders...</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">No orders found</TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow
                      key={order._id || order.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleOrderClick(order)}
                    >
                      <TableCell className="font-medium">{order.orderNumber || order.id}</TableCell>
                      <TableCell>{order.customerName || order.customer}</TableCell>
                      <TableCell>{formatCurrency(Number(order.amount))}</TableCell>
                      <TableCell>{new Date(order.createdAt || order.date || Date.now()).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(order.status)}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => page > 1 && setPage(page - 1)}
                      className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {/* Generate page numbers */}
                  {salesData?.pagination && Array.from({ length: Math.ceil(salesData.pagination.total / pageSize) || 1 }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setPage(i + 1)}
                        isActive={page === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => salesData?.pagination && page < Math.ceil(salesData.pagination.total / pageSize) && setPage(page + 1)}
                      className={salesData?.pagination && page >= Math.ceil(salesData.pagination.total / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        orderId={selectedOrderId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
