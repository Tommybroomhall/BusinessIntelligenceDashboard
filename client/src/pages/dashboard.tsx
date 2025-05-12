import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TrafficChannelsChart } from "@/components/dashboard/traffic-channels-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PopularProducts } from "@/components/dashboard/popular-products";
import { 
  DollarSign, 
  ShoppingCart, 
  BarChart2, 
  UserPlus 
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
  
  const salesChartData = {
    monthly: [
      { date: "2023-01-01", value: 4500 },
      { date: "2023-02-01", value: 5200 },
      { date: "2023-03-01", value: 4800 },
      { date: "2023-04-01", value: 6800 },
      { date: "2023-05-01", value: 8459 },
      { date: "2023-06-01", value: 7800 },
      { date: "2023-07-01", value: 9200 },
      { date: "2023-08-01", value: 8500 },
      { date: "2023-09-01", value: 7900 },
      { date: "2023-10-01", value: 10500 },
      { date: "2023-11-01", value: 11200 },
      { date: "2023-12-01", value: 12300 },
    ],
    weekly: [
      { date: "Week 1", value: 2300 },
      { date: "Week 2", value: 2500 },
      { date: "Week 3", value: 1900 },
      { date: "Week 4", value: 3200 },
    ],
  };
  
  const trafficChannelsData = [
    { name: "Organic Search", value: 18425, color: "hsl(var(--chart-1))" },
    { name: "Direct", value: 11235, color: "hsl(var(--chart-2))" },
    { name: "Social Media", value: 9372, color: "hsl(var(--chart-3))" },
    { name: "Email", value: 6789, color: "hsl(var(--chart-4))" },
  ];
  
  const trafficTotal = trafficChannelsData.reduce((acc, item) => acc + item.value, 0);
  
  const activitiesData = [
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
      id: "2",
      type: "lead",
      title: "New lead captured",
      description: "From website contact form",
      details: "Name: <span class='font-medium'>Michael Rodriguez</span><br>Email: m.rodriguez@example.com<br>Message: Interested in your enterprise plan...",
      status: "New",
      timestamp: new Date(Date.now() - 22 * 60000), // 22 minutes ago
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
  
  const popularProductsData = [
    {
      id: "1",
      name: "Ray-Ban RB3025",
      category: "Eye Wear",
      price: 150,
      imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=80&h=80",
      sold: 20,
      earnings: 3000,
    },
    {
      id: "2",
      name: "Woman Shoulder Bag",
      category: "Accessories",
      price: 84.99,
      imageUrl: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=80&h=80",
      sold: 15,
      earnings: 1274.85,
    },
    {
      id: "3",
      name: "Water Bottle 32oz",
      category: "Lifestyle",
      price: 10.88,
      imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=80&h=80",
      sold: 32,
      earnings: 348.16,
    },
    {
      id: "4",
      name: "Skullcandy Earbuds",
      category: "Electronics",
      price: 29.99,
      imageUrl: "https://images.unsplash.com/photo-1505751171710-1f6d0ace5a85?auto=format&fit=crop&w=80&h=80",
      sold: 24,
      earnings: 719.76,
    },
    {
      id: "5",
      name: "AG Care Balance",
      category: "Skin Care",
      price: 9.99,
      imageUrl: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=80&h=80",
      sold: 18,
      earnings: 179.82,
    },
  ];
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Total Revenue"
          value="$24,825"
          icon={<DollarSign className="h-5 w-5 text-primary-600" />}
          trendValue={8.2}
          trendDirection="up"
          iconBgClass="bg-primary-100"
        />
        
        <KpiCard
          title="Total Orders"
          value="589"
          icon={<ShoppingCart className="h-5 w-5 text-secondary-600" />}
          trendValue={4.5}
          trendDirection="up"
          iconBgClass="bg-secondary-100"
          iconColor="text-secondary-600"
        />
        
        <KpiCard
          title="Avg Order Value"
          value="$42.15"
          icon={<BarChart2 className="h-5 w-5 text-accent-600" />}
          trendValue={1.8}
          trendDirection="down"
          iconBgClass="bg-accent-100"
          iconColor="text-accent-600"
        />
        
        <KpiCard
          title="New Leads"
          value="127"
          icon={<UserPlus className="h-5 w-5 text-green-600" />}
          trendValue={12.4}
          trendDirection="up"
          iconBgClass="bg-green-100"
          iconColor="text-green-600"
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
      
      {/* Activity and Products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <ActivityFeed activities={activitiesData} />
        </div>
        <div className="lg:col-span-2">
          <PopularProducts products={popularProductsData} />
        </div>
      </div>
    </div>
  );
}
