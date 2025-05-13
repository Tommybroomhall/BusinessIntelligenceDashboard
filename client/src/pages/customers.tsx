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
  Search,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal
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

// Customer type definition
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: Date;
  status: "active" | "inactive";
}

export default function Customers() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  // Fetch customers data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/customers', page, pageSize, searchQuery, statusFilter],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Sample customers data (mock data)
  const customers: Customer[] = [
    {
      id: "CUST-1001",
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "(555) 123-4567",
      location: "New York, NY",
      totalSpent: 1245.80,
      orderCount: 8,
      lastOrderDate: new Date(2023, 5, 15),
      status: "active",
    },
    {
      id: "CUST-1002",
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "(555) 234-5678",
      location: "Los Angeles, CA",
      totalSpent: 879.50,
      orderCount: 5,
      lastOrderDate: new Date(2023, 5, 10),
      status: "active",
    },
    {
      id: "CUST-1003",
      name: "Michael Brown",
      email: "michael.b@example.com",
      phone: "(555) 345-6789",
      location: "Chicago, IL",
      totalSpent: 2340.25,
      orderCount: 12,
      lastOrderDate: new Date(2023, 5, 18),
      status: "active",
    },
    {
      id: "CUST-1004",
      name: "Emily Davis",
      email: "emily.d@example.com",
      phone: "(555) 456-7890",
      location: "Houston, TX",
      totalSpent: 567.30,
      orderCount: 3,
      lastOrderDate: new Date(2023, 4, 25),
      status: "inactive",
    },
    {
      id: "CUST-1005",
      name: "David Wilson",
      email: "david.w@example.com",
      phone: "(555) 567-8901",
      location: "Phoenix, AZ",
      totalSpent: 1890.75,
      orderCount: 9,
      lastOrderDate: new Date(2023, 5, 12),
      status: "active",
    },
    {
      id: "CUST-1006",
      name: "Jennifer Taylor",
      email: "jennifer.t@example.com",
      phone: "(555) 678-9012",
      location: "Philadelphia, PA",
      totalSpent: 432.60,
      orderCount: 2,
      lastOrderDate: new Date(2023, 3, 15),
      status: "inactive",
    },
    {
      id: "CUST-1007",
      name: "Robert Anderson",
      email: "robert.a@example.com",
      phone: "(555) 789-0123",
      location: "San Antonio, TX",
      totalSpent: 3210.45,
      orderCount: 15,
      lastOrderDate: new Date(2023, 5, 20),
      status: "active",
    },
  ];
  
  // Filter customers based on search query and status filter
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchQuery === "" || 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
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
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-gray-500">{customer.id}</div>
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
                  <TableCell>${customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>{customer.orderCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3 text-gray-500" />
                      {customer.lastOrderDate.toLocaleDateString()}
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
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Customer</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete Customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
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
  );
}
