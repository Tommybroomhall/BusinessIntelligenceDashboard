import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  TooltipProps
} from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { useCurrencyFormatter } from "@/context/CurrencyContext";

interface CategoryData {
  category: string;
  revenue: number;
  orderCount: number;
  productCount: number;
}

interface ProductCategoryChartProps {
  title?: string;
}

export function ProductCategoryChart({ title = "Revenue by Product Category" }: ProductCategoryChartProps) {
  const { formatCurrency } = useCurrencyFormatter();
  
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders-for-categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders');
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const { data: orderItemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['order-items-for-categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/order-items');
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products-for-categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/products');
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const isLoading = ordersLoading || itemsLoading || productsLoading;

  // Process data to get category performance
  const categoryData = React.useMemo(() => {
    if (!ordersData || !orderItemsData || !productsData) {
      return [];
    }

    // Create a map of productId to product details
    const productMap = new Map();
    productsData.forEach((product: any) => {
      productMap.set(product._id, product);
    });

    // Create a map of orderId to order details
    const orderMap = new Map();
    ordersData.forEach((order: any) => {
      orderMap.set(order._id, order);
    });

    // Group order items by category and calculate revenue
    const categoryStats: Record<string, { revenue: number; orderCount: Set<string>; productCount: Set<string> }> = {};

    orderItemsData.forEach((item: any) => {
      const product = productMap.get(item.productId);
      const order = orderMap.get(item.orderId);
      
      if (product && order) {
        const category = product.category || 'Uncategorized';
        
        if (!categoryStats[category]) {
          categoryStats[category] = {
            revenue: 0,
            orderCount: new Set(),
            productCount: new Set()
          };
        }
        
        // Calculate revenue for this item
        const itemRevenue = item.quantity * item.price;
        categoryStats[category].revenue += itemRevenue;
        categoryStats[category].orderCount.add(order._id);
        categoryStats[category].productCount.add(product._id);
      }
    });

    // Convert to chart data format
    return Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        revenue: stats.revenue,
        orderCount: stats.orderCount.size,
        productCount: stats.productCount.size
      }))
      .sort((a, b) => b.revenue - a.revenue) // Sort by revenue descending
      .slice(0, 8); // Show top 8 categories
  }, [ordersData, orderItemsData, productsData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategoryData;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm">
          <p className="font-medium">{label}</p>
          <p className="text-blue-300">Revenue: {formatCurrency(data.revenue)}</p>
          <p className="text-green-300">Orders: {data.orderCount}</p>
          <p className="text-yellow-300">Products: {data.productCount}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading category data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!categoryData || categoryData.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-center justify-center h-64">
            <p className="font-medium">No category data available from MongoDB</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 text-gray-500">
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="revenue" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
