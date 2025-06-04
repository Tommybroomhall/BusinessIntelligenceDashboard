import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { 
  PieChart, 
  Pie, 
  ResponsiveContainer, 
  Cell, 
  Tooltip, 
  TooltipProps,
  Legend
} from "recharts";
import { apiRequest } from "@/lib/queryClient";

interface OrderStatusData {
  status: string;
  count: number;
  color: string;
}

interface OrderStatusChartProps {
  title?: string;
}

// Define colors for different order statuses
const STATUS_COLORS = {
  pending: "#f59e0b",
  paid: "#10b981", 
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#059669",
  refunded: "#ef4444",
  canceled: "#6b7280"
};

export function OrderStatusChart({ title = "Order Status Distribution" }: OrderStatusChartProps) {
  
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['orders-status-distribution'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders');
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    placeholderData: (previousData) => previousData,
    refetchOnMount: 'always',
  });

  // Process orders data to get status distribution
  const statusDistribution = React.useMemo(() => {
    if (!ordersData || ordersData.length === 0) {
      return [];
    }

    // Count orders by status
    const statusCounts = ordersData.reduce((acc: Record<string, number>, order: any) => {
      const status = order.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Convert to chart data format
    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: count as number,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "#6b7280"
    }));
  }, [ordersData]);

  const totalOrders = statusDistribution.reduce((sum, item) => sum + item.count, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as OrderStatusData;
      const percentage = totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(1) : '0';
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm">
          <p className="font-medium">{item.status}</p>
          <p>{item.count} orders</p>
          <p>{percentage}% of total</p>
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
            <p className="text-gray-500">Loading order status data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !ordersData || statusDistribution.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-center justify-center h-64">
            <p className="font-medium">No order status data available from MongoDB</p>
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
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Donut chart */}
          <div className="w-48 h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center text showing total */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
                <div className="text-sm text-gray-500">Total Orders</div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-6 md:mt-0 space-y-3 flex-1 max-w-xs">
            {statusDistribution.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{item.status}</span>
                    <span className="text-sm text-gray-500">{item.count}</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full" 
                      style={{ 
                        width: `${totalOrders > 0 ? (item.count / totalOrders) * 100 : 0}%`,
                        backgroundColor: item.color
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
