import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TrafficChannelsChart } from "@/components/dashboard/traffic-channels-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PopularProducts } from "@/components/dashboard/popular-products";
import { StockLevelWidget } from "@/components/dashboard/stock-level-widget";
import {
  DollarSign,
  ShoppingCart,
  BarChart2
} from "lucide-react";

export default function Dashboard() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  // Fetch dashboard data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/dashboard', dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch orders data for sales chart
  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['/api/orders'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Process orders data for sales chart
  const salesChartData = React.useMemo(() => {
    if (!ordersData || ordersData.length === 0) {
      // Return default data if no orders
      return {
        monthly: Array.from({ length: 12 }, (_, i) => ({
          date: `2023-${String(i + 1).padStart(2, '0')}-01`,
          value: 0
        })),
        weekly: Array.from({ length: 4 }, (_, i) => ({
          date: `Week ${i + 1}`,
          value: 0
        }))
      };
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
      // Return default data if no traffic data
      return [
        { name: "Organic Search", value: 0, color: "hsl(var(--chart-1))" },
        { name: "Direct", value: 0, color: "hsl(var(--chart-2))" },
        { name: "Social Media", value: 0, color: "hsl(var(--chart-3))" },
        { name: "Email", value: 0, color: "hsl(var(--chart-4))" },
      ];
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

  const trafficTotal = trafficChannelsData.reduce((acc, item) => acc + item.value, 0);

  // Process activity data from API
  const activitiesData = React.useMemo(() => {
    if (!data?.recentActivity || data.recentActivity.length === 0) {
      // Return default data if no activity data
      return [
        {
          id: "1",
          type: "order",
          title: "New order received",
          description: "Order #5789 for $109.95",
          details: "Customer: <span class='font-medium'>Sarah Thompson</span>",
          status: "Paid",
          timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
        },
        {
          id: "3",
          type: "order",
          title: "New order received",
          description: "Order #5788 for $245.30",
          details: "Customer: <span class='font-medium'>David Williams</span>",
          status: "Paid",
          timestamp: new Date(Date.now() - 47 * 60000), // 47 minutes ago
        },
        {
          id: "4",
          type: "system",
          title: "System update completed",
          description: "Analytics module v2.3.0",
          details: "All systems operating normally",
          status: "System",
          timestamp: new Date(Date.now() - 60 * 60000), // 1 hour ago
        },
      ];
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

  // Process popular products data from API
  const popularProductsData = React.useMemo(() => {
    if (!data?.popularProducts || data.popularProducts.length === 0) {
      // Return default data if no product data
      return [
        {
          id: "1",
          name: "No products found",
          category: "N/A",
          price: 0,
          imageUrl: "https://placehold.co/80x80?text=No+Image",
          sold: 0,
          earnings: 0,
        }
      ];
    }

    // Map API data to product format
    return data.popularProducts.map(product => ({
      id: product._id || product.id || Math.random().toString(36).substring(2, 9),
      name: product.name,
      category: product.category || "Uncategorized",
      price: Number(product.price),
      imageUrl: product.imageUrl || "https://placehold.co/80x80?text=No+Image",
      sold: 0, // This data might not be available in the API
      earnings: 0 // This data might not be available in the API
    }));
  }, [data]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard
          title="Total Revenue"
          value={`$${isLoading ? '0.00' : (data?.kpi?.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign className="h-5 w-5 text-primary-600" />}
          trendValue={8.2} // This could be calculated if we have historical data
          trendDirection="up"
          iconBgClass="bg-primary-100"
        />

        <KpiCard
          title="Total Orders"
          value={isLoading ? '0' : (data?.kpi?.orderCount || 0).toString()}
          icon={<ShoppingCart className="h-5 w-5 text-secondary-600" />}
          trendValue={4.5} // This could be calculated if we have historical data
          trendDirection="up"
          iconBgClass="bg-secondary-100"
          iconColor="text-secondary-600"
        />

        <KpiCard
          title="Avg Order Value"
          value={`$${isLoading ? '0.00' : (data?.kpi?.averageOrderValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<BarChart2 className="h-5 w-5 text-accent-600" />}
          trendValue={1.8} // This could be calculated if we have historical data
          trendDirection="down"
          iconBgClass="bg-accent-100"
          iconColor="text-accent-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SalesChart data={salesChartData} />
        <TrafficChannelsChart
          data={trafficChannelsData}
          total={trafficTotal}
        />
      </div>

      {/* Activity, Products, and Stock Levels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-2">
          <ActivityFeed activities={activitiesData} />
        </div>
        <div className="lg:col-span-2">
          <PopularProducts products={popularProductsData} />
        </div>
        <div className="lg:col-span-1">
          <StockLevelWidget />
        </div>
      </div>
    </div>
  );
}
