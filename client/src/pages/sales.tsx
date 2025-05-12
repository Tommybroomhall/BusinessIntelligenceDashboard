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
  const { data, isLoading } = useQuery({
    queryKey: ['/api/sales', page, pageSize, searchQuery],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Revenue gauge data
  const revenueData = {
    current: 24825,
    target: 30000,
    percentage: 82.75,
  };
  
  // Sample orders data
  const orders = [
    {
      id: "ORD-5789",
      customer: "Sarah Thompson",
      amount: 109.95,
      date: new Date(2023, 5, 15),
      status: "Paid",
    },
    {
      id: "ORD-5788",
      customer: "David Williams",
      amount: 245.30,
      date: new Date(2023, 5, 14),
      status: "Paid",
    },
    {
      id: "ORD-5787",
      customer: "Michael Johnson",
      amount: 89.99,
      date: new Date(2023, 5, 13),
      status: "Processing",
    },
    {
      id: "ORD-5786",
      customer: "Jessica Brown",
      amount: 129.50,
      date: new Date(2023, 5, 12),
      status: "Shipped",
    },
    {
      id: "ORD-5785",
      customer: "Robert Davis",
      amount: 195.75,
      date: new Date(2023, 5, 11),
      status: "Delivered",
    },
    {
      id: "ORD-5784",
      customer: "Jennifer Wilson",
      amount: 42.99,
      date: new Date(2023, 5, 10),
      status: "Paid",
    },
    {
      id: "ORD-5783",
      customer: "William Taylor",
      amount: 57.25,
      date: new Date(2023, 5, 9),
      status: "Refunded",
    },
  ];
  
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
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>${order.amount.toFixed(2)}</TableCell>
                      <TableCell>{order.date.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">3</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" />
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
