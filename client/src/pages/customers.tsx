import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Search,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CustomerDetailsDialog } from "@/components/customers/customer-details-dialog";

// Customer type definition based on MongoDB schema
interface Customer {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  tenantId?: number;

  // These fields are calculated from orders and not stored in the database
  totalSpent?: number;
  orderCount?: number;
  lastOrderDate?: string; // ISO date string from API
}

interface CustomersResponse {
  customers: Customer[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export default function Customers() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch customers data from MongoDB through API
  const { data, isLoading, isError, error } = useQuery<CustomersResponse>({
    queryKey: ['/api/customers', page, pageSize, searchQuery, statusFilter],
    queryFn: async () => {
      // Build URL with query parameters
      let url = `/api/customers?page=${page}&pageSize=${pageSize}`;

      // Add optional filters if they're set
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      const response = await apiRequest('GET', url);
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });

  // Function to handle opening the customer details dialog
  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  // Filter function for client-side filtering
  const filterCustomers = (customers: Customer[]) => {
    if (!customers) return [];

    return customers.filter(customer => {
      const matchesSearch = searchQuery === "" ||
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.id && customer.id.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "all" || customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  // Get customers to display (either from API or filtered locally)
  const customers = data?.customers || [];
  const filteredCustomers = filterCustomers(customers);

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "inactive":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Format date from ISO string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <DownloadCloud className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Status: {statusFilter === "all" ? "All" : statusFilter === "active" ? "Active" : "Inactive"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("active")}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
              Inactive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading customers...</span>
            </div>
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 my-4">
              <p className="font-medium">Error loading customers</p>
              <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No customers found matching your filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer._id || customer.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleCustomerClick(customer)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer._id || customer.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm">
                          <Mail className="mr-1 h-3 w-3 text-gray-500" />
                          {customer.email}
                        </div>
                        <div className="flex items-center text-sm mt-1">
                          <Phone className="mr-1 h-3 w-3 text-gray-500" />
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3 text-gray-500" />
                        {customer.location}
                      </div>
                    </TableCell>
                    <TableCell>${customer.totalSpent !== undefined ? customer.totalSpent.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>{customer.orderCount !== undefined ? customer.orderCount : 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3 text-gray-500" />
                        {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(customer.status)}
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleCustomerClick(customer);
                          }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            Edit Customer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {data?.pagination && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => page > 1 && setPage(page - 1)}
                      className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: data.pagination.totalPages || 1 }, (_, i) => (
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
                      onClick={() => page < (data.pagination.totalPages || 1) && setPage(page + 1)}
                      className={page >= (data.pagination.totalPages || 1) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <CustomerDetailsDialog
        customer={selectedCustomer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
