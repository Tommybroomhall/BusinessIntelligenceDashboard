import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/context/CurrencyContext";
import {
  ShoppingCart,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Truck,
} from "lucide-react";

type TimeFrame = "7d" | "30d";

interface SalesKPIProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    period: string;
  };
  isLoading?: boolean;
}

interface SalesData {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
    orderCount: number;
  }>;
  period: {
    from: string;
    to: string;
    days: number;
  };
}

function SalesKPI({ title, value, icon, trend, isLoading }: SalesKPIProps) {
  const getTrendColor = () => {
    if (trend?.direction === "up") return "text-green-600";
    if (trend?.direction === "down") return "text-red-600";
    return "text-gray-500";
  };

  const getTrendIcon = () => {
    if (trend?.direction === "up") return <TrendingUp className="h-3 w-3" />;
    if (trend?.direction === "down") return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          <div className="text-gray-400">{icon}</div>
        </div>
        <div className="flex flex-col space-y-1">
          <div className="text-2xl font-bold text-gray-900">
            {isLoading ? "Loading..." : value}
          </div>
          {trend && (
            <div className={cn("flex items-center text-xs", getTrendColor())}>
              {getTrendIcon()}
              <span className="ml-1">
                {trend.value > 0 ? "+" : ""}{trend.value.toFixed(1)}% from {trend.period}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SalesOverview() {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>("7d");
  const { formatCurrency, getCurrencyIcon } = useCurrencyFormatter();

  // Calculate stable date ranges only when timeframe changes
  const { currentRange, previousRange } = useMemo(() => {
    // Get current date as YYYY-MM-DD string to ensure stability
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today in local time

    const days = selectedTimeFrame === "7d" ? 7 : 30;

    // Current period
    const currentStartDate = new Date(today);
    currentStartDate.setDate(today.getDate() - days + 1);

    const currentEndDate = new Date(today);
    currentEndDate.setHours(23, 59, 59, 999);

    // Previous period
    const previousEndDate = new Date(currentStartDate);
    previousEndDate.setDate(currentStartDate.getDate() - 1);
    previousEndDate.setHours(23, 59, 59, 999);

    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousEndDate.getDate() - days + 1);
    previousStartDate.setHours(0, 0, 0, 0);

    return {
      currentRange: {
        from: currentStartDate.toISOString(),
        to: currentEndDate.toISOString(),
      },
      previousRange: {
        from: previousStartDate.toISOString(),
        to: previousEndDate.toISOString(),
      }
    };
  }, [selectedTimeFrame]);

  // Create a custom fetch function for sales data
  const fetchSalesData = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch sales data');
    }
    return response.json();
  };

  // Fetch current period data with enhanced caching and auto-refresh
  const { data: currentData, isLoading: isCurrentLoading } = useQuery({
    queryKey: ['sales-data', selectedTimeFrame, 'current', currentRange.from, currentRange.to],
    queryFn: () => fetchSalesData(`/api/dashboard/sales?from=${currentRange.from}&to=${currentRange.to}`),
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    // Show cached data immediately while fetching fresh data
    placeholderData: (previousData) => previousData,
    refetchOnMount: 'always',
  });

  // Fetch previous period data for comparison with enhanced caching and auto-refresh
  const { data: previousData, isLoading: isPreviousLoading } = useQuery({
    queryKey: ['sales-data', selectedTimeFrame, 'previous', previousRange.from, previousRange.to],
    queryFn: () => fetchSalesData(`/api/dashboard/sales?from=${previousRange.from}&to=${previousRange.to}`),
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    // Show cached data immediately while fetching fresh data
    placeholderData: (previousData) => previousData,
    refetchOnMount: 'always',
  });

  // Fetch orders needing dispatch data
  const { data: ordersNeedingDispatch, isLoading: isOrdersDispatchLoading } = useQuery({
    queryKey: ['orders-needing-dispatch'],
    queryFn: () => fetchSalesData('/api/orders/pending-dispatch'),
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    placeholderData: (previousData) => previousData,
    refetchOnMount: 'always',
  });

  const isLoading = isCurrentLoading || isPreviousLoading;

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return { value: 0, direction: "neutral" as const };
    const percentChange = ((current - previous) / previous) * 100;
    return {
      value: percentChange,
      direction: percentChange > 0 ? "up" as const : percentChange < 0 ? "down" as const : "neutral" as const,
    };
  };

  const revenueTrend = calculateTrend(
    currentData?.revenue || 0,
    previousData?.revenue || 0
  );

  const ordersTrend = calculateTrend(
    currentData?.orderCount || 0,
    previousData?.orderCount || 0
  );

  const avgOrderValueTrend = calculateTrend(
    currentData?.averageOrderValue || 0,
    previousData?.averageOrderValue || 0
  );

  const timeFrameLabel = selectedTimeFrame === "7d" ? "last 7 days" : "last 30 days";
  const previousPeriodLabel = selectedTimeFrame === "7d" ? "previous 7 days" : "previous 30 days";

  return (
    <div className="space-y-4">
      {/* Header with time frame selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
          <p className="text-sm text-gray-500">
            Performance metrics for the {timeFrameLabel}
          </p>
        </div>
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={selectedTimeFrame === "7d" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTimeFrame("7d")}
            className={cn(
              "text-xs font-medium px-3 py-1.5",
              selectedTimeFrame === "7d"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Last 7 days
          </Button>
          <Button
            variant={selectedTimeFrame === "30d" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTimeFrame("30d")}
            className={cn(
              "text-xs font-medium px-3 py-1.5",
              selectedTimeFrame === "30d"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Last 30 days
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SalesKPI
          title="Total Revenue"
          value={isLoading ? formatCurrency(0) : formatCurrency(currentData?.revenue || 0)}
          icon={getCurrencyIcon("h-5 w-5")}
          trend={{
            ...revenueTrend,
            period: previousPeriodLabel,
          }}
          isLoading={isLoading}
        />

        <SalesKPI
          title="Total Orders"
          value={isLoading ? '0' : (currentData?.orderCount || 0).toLocaleString()}
          icon={<ShoppingCart className="h-5 w-5" />}
          trend={{
            ...ordersTrend,
            period: previousPeriodLabel,
          }}
          isLoading={isLoading}
        />

        <SalesKPI
          title="Avg Order Value"
          value={isLoading ? formatCurrency(0) : formatCurrency(currentData?.averageOrderValue || 0)}
          icon={getCurrencyIcon("h-5 w-5")}
          trend={{
            ...avgOrderValueTrend,
            period: previousPeriodLabel,
          }}
          isLoading={isLoading}
        />

        <SalesKPI
          title="Orders to Dispatch"
          value={isOrdersDispatchLoading ? '0' : (ordersNeedingDispatch?.length || 0).toLocaleString()}
          icon={<Truck className="h-5 w-5" />}
          isLoading={isOrdersDispatchLoading}
        />
      </div>
    </div>
  );
}