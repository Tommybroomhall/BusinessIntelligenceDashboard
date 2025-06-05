import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
} from "recharts";
import { format } from "date-fns";
import { useCurrencyFormatter } from "@/context/CurrencyContext";
import { useTimeFrame } from "@/context/TimeFrameContext";

interface SalesDataPoint {
  date: string;
  value: number;
}

interface SalesChartProps {
  title?: string;
}

export function SalesChart({ title = "Sales Analytics" }: SalesChartProps) {
  const [viewType, setViewType] = useState<"daily" | "weekly">("daily");
  const { formatCurrency } = useCurrencyFormatter();
  const { selectedTimeFrame, currentRange } = useTimeFrame();

  // Fetch sales data based on the current time frame
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-chart-data', selectedTimeFrame, currentRange.from, currentRange.to, viewType],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/sales?from=${currentRange.from}&to=${currentRange.to}&breakdown=${viewType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales chart data');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    placeholderData: (previousData) => previousData,
  });

  // Process the chart data for visualization
  const chartData = useMemo(() => {
    if (!salesData?.dailyBreakdown) return [];

    // For daily view, show each day
    if (viewType === "daily") {
      return salesData.dailyBreakdown.map((item: any) => ({
        date: format(new Date(item.date), "MMM dd"),
        value: item.revenue || 0
      }));
    }

    // For weekly view, group by weeks (only if time frame is 30d)
    if (viewType === "weekly" && selectedTimeFrame === "30d") {
      const weeklyGrouped: { [key: string]: number } = {};
      
      salesData.dailyBreakdown.forEach((item: any) => {
        const date = new Date(item.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Get start of week (Sunday)
        const weekKey = format(weekStart, "MMM dd");
        
        if (!weeklyGrouped[weekKey]) {
          weeklyGrouped[weekKey] = 0;
        }
        weeklyGrouped[weekKey] += item.revenue || 0;
      });

      return Object.entries(weeklyGrouped).map(([date, value]) => ({
        date,
        value
      }));
    }

    return salesData.dailyBreakdown.map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      value: item.revenue || 0
    }));
  }, [salesData, viewType, selectedTimeFrame]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-2 rounded text-xs">
          <p className="font-bold">{formatCurrency(payload[0].value || 0)}</p>
          <p className="text-gray-300">{label}</p>
        </div>
      );
    }
    return null;
  };

  // Show loading state or no data message
  if (isLoading && !chartData.length) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[250px] w-full pt-4 flex items-center justify-center">
            <p className="text-gray-500">Loading chart data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[250px] w-full pt-4 flex items-center justify-center">
            <p className="text-gray-500">No sales data available for the selected period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          {title} - {selectedTimeFrame === "7d" ? "Last 7 Days" : "Last 30 Days"}
        </CardTitle>
        {/* Only show weekly option for 30-day timeframe */}
        {selectedTimeFrame === "30d" && (
          <Tabs
            defaultValue="daily"
            value={viewType}
            onValueChange={(value) => setViewType(value as "daily" | "weekly")}
          >
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[250px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dy={10}
                tickFormatter={(value) => value}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
                dx={-10}
              />
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
