import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { 
  Download,
  Calendar,
  MousePointerClick,
  Users,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVercelAnalytics } from "@/hooks/use-vercel-analytics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Traffic() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  
  const [timePeriod, setTimePeriod] = useState<"week" | "month" | "year">("month");
  
  // Fetch traffic data from Vercel Analytics
  const { 
    data: vercelData, 
    isLoading: vercelLoading, 
    isError: vercelError,
    dateRange: analyticsDates,
    updateDateRange
  } = useVercelAnalytics({
    from: dateRange.from,
    to: dateRange.to
  });
  
  // Legacy traffic data (until migration is complete)
  const { data: legacyData, isLoading } = useQuery({
    queryKey: ['/api/traffic', dateRange.from?.toISOString(), dateRange.to?.toISOString(), timePeriod],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Use Vercel data if available, otherwise fallback to legacy API data
  const topPagesData = vercelData?.topPages || [];
  
  // Sessions vs Conversions data
  const sessionsData = [
    { date: "Jan", sessions: 1200, conversions: 120 },
    { date: "Feb", sessions: 1400, conversions: 150 },
    { date: "Mar", sessions: 1800, conversions: 200 },
    { date: "Apr", sessions: 2200, conversions: 210 },
    { date: "May", sessions: 2800, conversions: 280 },
    { date: "Jun", sessions: 3000, conversions: 310 },
    { date: "Jul", sessions: 3200, conversions: 340 },
    { date: "Aug", sessions: 3100, conversions: 330 },
    { date: "Sep", sessions: 2800, conversions: 290 },
    { date: "Oct", sessions: 2400, conversions: 250 },
    { date: "Nov", sessions: 2200, conversions: 235 },
    { date: "Dec", sessions: 2000, conversions: 220 },
  ];
  
  // Device distribution data from Vercel Analytics
  const deviceData = vercelData?.deviceDistribution?.map(device => ({
    name: device.device || 'Unknown',
    value: device.percentage
  })) || [
    { name: "Mobile", value: 0 },
    { name: "Desktop", value: 0 },
    { name: "Tablet", value: 0 },
  ];
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Traffic Analytics</h1>
        <div className="flex gap-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={(range) => {
              setDateRange(range);
              // Also update Vercel Analytics date range
              if (updateDateRange) {
                updateDateRange(range);
              }
            }}
          />
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {vercelError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading Vercel Analytics</AlertTitle>
          <AlertDescription>
            Couldn't load analytics data from Vercel. Please check your API credentials in settings.
          </AlertDescription>
        </Alert>
      )}
      
      {vercelLoading && (
        <div className="flex items-center justify-center p-6 border rounded-lg bg-gray-50 mb-6">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-600">Loading analytics data...</span>
        </div>
      )}
      
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Page Views */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Page Views</p>
                <h3 className="text-2xl font-bold mt-1">
                  {vercelData?.pageViews ? vercelData.pageViews.toLocaleString() : '0'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <MousePointerClick className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Unique Visitors */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Unique Visitors</p>
                <h3 className="text-2xl font-bold mt-1">
                  {vercelData?.visitors ? vercelData.visitors.toLocaleString() : '0'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Error Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Error Rate</p>
                <h3 className="text-2xl font-bold mt-1">
                  {vercelData?.errorRate !== undefined ? `${(vercelData.errorRate * 100).toFixed(2)}%` : '0%'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Device Breakdown */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Mobile Devices</p>
                <h3 className="text-2xl font-bold mt-1">
                  {deviceData.find(d => d.name.toLowerCase() === 'mobile')?.value || 0}%
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                <Smartphone className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Top Pages Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Top Pages</CardTitle>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topPagesData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="page" 
                    type="category" 
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} views`, 'Views']}
                    labelFormatter={(value) => `Page: ${value}`}
                  />
                  <Bar dataKey="views" fill="hsl(var(--primary))" barSize={20} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Device Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Device Distribution</CardTitle>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center">
              <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                {deviceData.map((device, i) => (
                  <div key={device.name} className="flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-gray-900">{device.value}%</div>
                    <div className="text-sm text-gray-500">{device.name}</div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{ 
                          width: `${device.value}%`,
                          backgroundColor: i === 0 
                            ? "hsl(var(--primary))" 
                            : i === 1 
                              ? "hsl(var(--accent))" 
                              : "hsl(var(--secondary))"
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Sessions vs Conversions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Sessions vs Conversions</CardTitle>
            <Tabs
              defaultValue="month"
              value={timePeriod}
              onValueChange={(value) => setTimePeriod(value as "week" | "month" | "year")}
            >
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sessionsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="sessions"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversions"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
