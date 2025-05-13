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

export default function Sales() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch sales data
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['/api/sales', page, pageSize, searchQuery],
    staleTime: 60 * 1000, // 1 minute
  });

  // Revenue gauge data
  const revenueData = salesData?.revenue || {
    current: 0,
    target: 30000,
    percentage: 0,
  };

  // Use real orders data from API
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-3">
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
                      <TableRow key={order._id || order.id}>
                        <TableCell className="font-medium">{order.orderNumber || order.id}</TableCell>
                        <TableCell>{order.customerName || order.customer}</TableCell>
                        <TableCell>${Number(order.amount).toFixed(2)}</TableCell>
                        <TableCell>{new Date(order.createdAt || order.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(order.status)}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
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

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Target</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative h-36 w-36">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#e6e6e6"
                        strokeWidth="12"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="hsl(var(--primary))"
                        strokeWidth="12"
                        strokeDasharray={`${revenueData.percentage * 2.51} 251`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {Math.round(revenueData.percentage)}%
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 text-center">
                <div className="text-sm text-gray-500">Current</div>
                <div className="text-xl font-bold text-gray-900">${revenueData.current.toLocaleString()}</div>
              </div>

              <div className="mt-4 text-center">
                <div className="text-sm text-gray-500">Target</div>
                <div className="text-xl font-bold text-gray-900">${revenueData.target.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
