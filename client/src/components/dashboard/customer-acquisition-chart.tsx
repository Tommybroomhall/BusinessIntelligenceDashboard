import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  TooltipProps
} from "recharts";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface CustomerAcquisitionData {
  month: string;
  newCustomers: number;
  cumulativeCustomers: number;
}

interface CustomerAcquisitionChartProps {
  title?: string;
}

export function CustomerAcquisitionChart({ title = "Customer Acquisition Over Time" }: CustomerAcquisitionChartProps) {
  
  const { data: customersResponse, isLoading, error } = useQuery({
    queryKey: ['customers-acquisition'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/customers?pageSize=1000'); // Get all customers for chart
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

  // Extract customers array from response
  const customersData = customersResponse?.customers || [];

  // Process customer data to get acquisition over time
  const acquisitionData = React.useMemo(() => {
    if (!customersData || customersData.length === 0) {
      return [];
    }

    // Get the last 12 months
    const endDate = new Date();
    const startDate = subMonths(endDate, 11);
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    // Group customers by month of creation
    const customersByMonth: Record<string, number> = {};
    
    customersData.forEach((customer: any) => {
      const createdDate = new Date(customer.createdAt);
      const monthKey = format(createdDate, 'yyyy-MM');
      customersByMonth[monthKey] = (customersByMonth[monthKey] || 0) + 1;
    });

    // Create chart data with cumulative count
    let cumulativeCount = 0;
    return months.map(month => {
      const monthKey = format(month, 'yyyy-MM');
      const newCustomers = customersByMonth[monthKey] || 0;
      cumulativeCount += newCustomers;
      
      return {
        month: format(month, 'MMM yyyy'),
        newCustomers,
        cumulativeCustomers: cumulativeCount
      };
    });
  }, [customersData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CustomerAcquisitionData;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm">
          <p className="font-medium">{label}</p>
          <p className="text-blue-300">New Customers: {data.newCustomers}</p>
          <p className="text-green-300">Total Customers: {data.cumulativeCustomers}</p>
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
            <p className="text-gray-500">Loading customer acquisition data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !customersResponse || !customersData || acquisitionData.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-center justify-center h-64">
            <p className="font-medium">No customer acquisition data available from MongoDB</p>
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
            <LineChart
              data={acquisitionData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="newCustomersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#10b981"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#10b981"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="newCustomers"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                name="New Customers"
              />
              <Line
                type="monotone"
                dataKey="cumulativeCustomers"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                name="Total Customers"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4 pb-4">
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-primary mr-2"></div>
            <span className="text-sm text-gray-600">New Customers</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-green-500 mr-2" style={{ borderTop: "2px dashed #10b981" }}></div>
            <span className="text-sm text-gray-600">Total Customers</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
