import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface TopProductData {
  productName: string;
  revenue: number;
  quantity: number;
  orderCount: number;
}

interface TopProductsChartProps {
  title?: string;
}

export function TopProductsChart({ title = "Top Performing Products" }: TopProductsChartProps) {
  const { formatCurrency } = useCurrencyFormatter();
  const [metric, setMetric] = React.useState<"revenue" | "quantity">("revenue");
  
  const { data: orderItemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['order-items-for-top-products'],
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
    queryKey: ['products-for-top-products'],
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

  const isLoading = itemsLoading || productsLoading;

  // Process data to get top products
  const topProductsData = React.useMemo(() => {
    if (!orderItemsData || !productsData) {
      return [];
    }

    // Create a map of productId to product details
    const productMap = new Map();
    productsData.forEach((product: any) => {
      productMap.set(product._id, product);
    });

    // Group order items by product and calculate metrics
    const productStats: Record<string, { revenue: number; quantity: number; orderCount: Set<string> }> = {};

    orderItemsData.forEach((item: any) => {
      const product = productMap.get(item.productId);
      
      if (product) {
        const productId = product._id;
        
        if (!productStats[productId]) {
          productStats[productId] = {
            revenue: 0,
            quantity: 0,
            orderCount: new Set()
          };
        }
        
        // Calculate metrics for this item
        const itemRevenue = item.quantity * item.price;
        productStats[productId].revenue += itemRevenue;
        productStats[productId].quantity += item.quantity;
        productStats[productId].orderCount.add(item.orderId);
      }
    });

    // Convert to chart data format and sort by selected metric
    const chartData = Object.entries(productStats)
      .map(([productId, stats]) => {
        const product = productMap.get(productId);
        return {
          productName: product?.name || 'Unknown Product',
          revenue: stats.revenue,
          quantity: stats.quantity,
          orderCount: stats.orderCount.size
        };
      })
      .sort((a, b) => {
        if (metric === "revenue") {
          return b.revenue - a.revenue;
        } else {
          return b.quantity - a.quantity;
        }
      })
      .slice(0, 8); // Show top 8 products

    return chartData;
  }, [orderItemsData, productsData, metric]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TopProductData;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm">
          <p className="font-medium">{label}</p>
          <p className="text-blue-300">Revenue: {formatCurrency(data.revenue)}</p>
          <p className="text-green-300">Quantity Sold: {data.quantity}</p>
          <p className="text-yellow-300">Orders: {data.orderCount}</p>
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
            <p className="text-gray-500">Loading top products data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topProductsData || topProductsData.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-center justify-center h-64">
            <p className="font-medium">No top products data available from MongoDB</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Tabs
            value={metric}
            onValueChange={(value) => setMetric(value as "revenue" | "quantity")}
          >
            <TabsList>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="quantity">Quantity</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="ghost" size="sm" className="h-8 text-gray-500">
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topProductsData}
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => 
                  metric === "revenue" ? formatCurrency(value) : value.toString()
                }
              />
              <YAxis 
                type="category"
                dataKey="productName" 
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey={metric}
                fill={metric === "revenue" ? "hsl(var(--primary))" : "#10b981"}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
