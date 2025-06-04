import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SalesOverview } from "@/components/dashboard/sales-overview";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TrafficChannelsChart } from "@/components/dashboard/traffic-channels-chart";
import TrafficSources from "@/components/dashboard/traffic-sources";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PopularProducts } from "@/components/dashboard/popular-products";
import { StockLevelWidget } from "@/components/dashboard/stock-level-widget";
import { OrderStatusChart } from "@/components/dashboard/order-status-chart";
import { ProductCategoryChart } from "@/components/dashboard/product-category-chart";
import { CustomerAcquisitionChart } from "@/components/dashboard/customer-acquisition-chart";
import { TopProductsChart } from "@/components/dashboard/top-products-chart";
import { useDashboardData, useDashboardComponent } from "@/hooks/use-dashboard-data";
import { apiRequest } from "@/lib/queryClient";
import { Wifi, WifiOff, Pause, Clock, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { DashboardSkeleton, DashboardRefreshingSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function Dashboard() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  // Use the new dashboard data hook with caching and auto-refresh
  const {
    data,
    isLoading,
    isFromCache,
    isFresh,
    error,
    lastUpdated,
    isRefreshingInBackground,
    isAutoRefreshEnabled,
    isUserIdle,
    nextRefreshIn,
    nextRefreshFormatted,
    retryCount,
    isRetrying,
    isOnline,
    maxRetries,
  } = useDashboardData({
    dateRange,
    autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
    pauseOnUserIdle: true,
  });

  // Fetch orders data for sales chart with caching and auto-refresh
  const { data: ordersData, isLoading: isOrdersLoading } = useDashboardComponent(
    '/api/orders',
    async () => {
      const response = await apiRequest('GET', '/api/orders');
      return response.json();
    },
    {
      autoRefreshInterval: isAutoRefreshEnabled && !isUserIdle ? 5 * 60 * 1000 : false, // 5 minutes
    }
  );

  // Fetch popular products with sales data with caching and auto-refresh
  const { data: popularProductsData, isLoading: isProductsLoading } = useDashboardComponent(
    '/api/dashboard/popular-products',
    async () => {
      const response = await apiRequest('GET', '/api/dashboard/popular-products');
      return response.json();
    },
    {
      autoRefreshInterval: isAutoRefreshEnabled && !isUserIdle ? 5 * 60 * 1000 : false, // 5 minutes
    }
  );

  // Process orders data for sales chart
  const salesChartData = React.useMemo(() => {
    if (!ordersData || ordersData.length === 0) {
      // Return null if no orders to fail loudly
      return null;
    }

    // Group orders by month
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthOrders = ordersData.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() + 1 === month && orderDate.getFullYear() === 2023;
      });

      const value = monthOrders.reduce((sum, order) => sum + Number(order.amount), 0);

      return {
        date: `2023-${String(month).padStart(2, '0')}-01`,
        value
      };
    });

    // Group orders by week (last 4 weeks)
    const now = new Date();
    const weeklyData = Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekOrders = ordersData.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= weekStart && orderDate < weekEnd;
      });

      const value = weekOrders.reduce((sum, order) => sum + Number(order.amount), 0);

      return {
        date: `Week ${4 - i}`,
        value
      };
    }).reverse();

    return {
      monthly: monthlyData,
      weekly: weeklyData
    };
  }, [ordersData]);

  // Process traffic data from API
  const trafficChannelsData = React.useMemo(() => {
    if (!data?.traffic?.bySource || data.traffic.bySource.length === 0) {
      // Return null if no traffic data to fail loudly
      return null;
    }

    // Map API data to chart format
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))"
    ];

    return data.traffic.bySource.map((item, index) => ({
      name: item.source || "Unknown",
      value: item.count,
      color: colors[index % colors.length]
    }));
  }, [data]);

  // Calculate traffic total only if we have data
  const trafficTotal = trafficChannelsData ? trafficChannelsData.reduce((acc, item) => acc + item.value, 0) : 0;

  // Process activity data from API
  const activitiesData = React.useMemo(() => {
    if (!data?.recentActivity || data.recentActivity.length === 0) {
      // Return null if no activity data to fail loudly
      return null;
    }

    // Map API data to activity format
    return data.recentActivity.map((activity) => {
      // Determine activity type based on activityType field
      let type = "order";
      if (activity.activityType?.includes("user")) type = "user";
      if (activity.activityType?.includes("system")) type = "system";

      return {
        id: activity._id || activity.id || Math.random().toString(36).substring(2, 9),
        type,
        title: activity.activityType?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Activity",
        description: activity.description || "",
        details: activity.metadata ? Object.entries(activity.metadata)
          .map(([key, value]) => `${key}: <span class='font-medium'>${value}</span>`)
          .join("<br>") : "",
        status: activity.entityType || "System",
        timestamp: new Date(activity.createdAt)
      };
    });
  }, [data]);

  // Process popular products data from API with sales data
  const processedPopularProducts = React.useMemo(() => {
    if (!popularProductsData || popularProductsData.length === 0) {
      // Return null if no product data to fail loudly
      return null;
    }

    // The new API already returns products with sales data (sold and earnings)
    return popularProductsData.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category || "Uncategorized",
      price: Number(product.price),
      imageUrl: product.imageUrl || "https://placehold.co/80x80?text=No+Image",
      sold: product.sold || 0,
      earnings: product.earnings || 0
    }));
  }, [popularProductsData]);

  // Show skeleton when loading and no cached data available
  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      {/* Background refresh indicator */}
      {isRefreshingInBackground && <DashboardRefreshingSkeleton />}

      <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Cache Status and Auto-refresh Status */}
      <div className="mb-4">
        <div className="flex items-center space-x-3">
          {/* Cache Status Indicator */}
          <div className="flex items-center space-x-2">
            {!isOnline ? (
              <div className="flex items-center space-x-1 text-sm text-red-600">
                <WifiOff className="h-4 w-4" />
                <span>Offline</span>
              </div>
            ) : isFromCache ? (
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <WifiOff className="h-4 w-4" />
                <span>Cached Data</span>
                {!isFresh && (
                  <span className="text-amber-600">(Refreshing...)</span>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <Wifi className="h-4 w-4" />
                <span>Live Data</span>
              </div>
            )}
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}

          {/* Auto-refresh Status */}
          {isAutoRefreshEnabled && !isUserIdle && nextRefreshIn > 0 && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <Clock className="h-3 w-3" />
              <span>Next refresh: {nextRefreshFormatted}</span>
            </div>
          )}

          {/* Retry Status Indicator */}
          {isRetrying && retryCount > 0 && (
            <div className="flex items-center space-x-1 text-xs text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              <span>Retrying... ({retryCount}/{maxRetries})</span>
            </div>
          )}

          {/* Error Recovery Indicator */}
          {retryCount > 0 && !isRetrying && !error && (
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>Connection restored</span>
            </div>
          )}

          {/* User Idle Indicator */}
          {isUserIdle && (
            <div className="flex items-center space-x-1 text-xs text-orange-600">
              <Pause className="h-3 w-3" />
              <span>Auto-refresh paused (idle)</span>
            </div>
          )}

          {/* Background Refresh Indicator */}
          {isRefreshingInBackground && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>


      </div>

      {/* Error Display */}
      {error && !data && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">
                {!isOnline ? "No internet connection" : "Error loading dashboard data"}
              </p>
              <p className="text-sm mt-1">{error.message}</p>
              {retryCount > 0 && (
                <p className="text-sm mt-2">
                  {isRetrying
                    ? `Retrying... (attempt ${retryCount}/${maxRetries})`
                    : `Failed after ${retryCount} attempts. Auto-refresh will continue when connection is restored.`
                  }
                </p>
              )}
              {!isOnline && (
                <p className="text-sm mt-2 text-orange-700">
                  Dashboard will automatically refresh when internet connection is restored.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sales Overview with Time Frame Filtering */}
      <div className="mb-6">
        <SalesOverview />
      </div>

      {/* Charts Row 1 - Sales and Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {salesChartData ? (
          <SalesChart data={salesChartData} />
        ) : (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-center justify-center h-64">
            <p className="font-medium">No sales data available from MongoDB</p>
          </div>
        )}

        <TrafficSources />
      </div>

      {/* Charts Row 2 - Order Status and Product Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <OrderStatusChart />
        <ProductCategoryChart />
      </div>

      {/* Charts Row 3 - Customer Acquisition and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <CustomerAcquisitionChart />
        <TopProductsChart />
      </div>

      {/* Activity, Products, and Stock Levels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-2">
          {activitiesData ? (
            <ActivityFeed activities={activitiesData} />
          ) : (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-center justify-center h-64">
              <p className="font-medium">No activity data available from MongoDB</p>
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          {isProductsLoading ? (
            <PopularProducts products={[]} isLoading={true} />
          ) : processedPopularProducts ? (
            <PopularProducts products={processedPopularProducts} />
          ) : (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-center justify-center h-64">
              <p className="font-medium">No product sales data available from MongoDB</p>
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <StockLevelWidget />
        </div>
      </div>
    </div>
    </>
  );
}
