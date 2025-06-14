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
  Tablet,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Traffic() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const [timePeriod, setTimePeriod] = useState<"week" | "month" | "year">("month");

  // Fetch GA4 analytics data
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: [
      '/api/traffic/analytics',
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString()
    ],
    staleTime: 60 * 1000, // 1 minute
  });

  // Legacy traffic data (for sessions vs conversions chart)
  const { data: legacyData, isLoading } = useQuery({
    queryKey: ['/api/traffic', dateRange.from?.toISOString(), dateRange.to?.toISOString(), timePeriod],
    staleTime: 60 * 1000, // 1 minute
  });

  // Extract data from GA4 analytics response
  const ga4Data = analyticsData?.success ? analyticsData.data : null;
  const topPagesData = ga4Data?.topPages?.map(page => ({
    page: page.path,
    views: page.pageViews
  })) || [];

  // Check if data is available from API
  const isLegacyDataMissing = !legacyData?.sessionsData;
  const isAnalyticsDataMissing = !ga4Data;

  // Sessions vs Conversions data from API - will be null if missing
  const sessionsData = legacyData?.sessionsData;

  // Device distribution data from GA4 Analytics
  const deviceData = ga4Data?.deviceDistribution?.map(device => ({
    name: device.device || 'Unknown',
    value: device.percentage
  })) || [];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Traffic Analytics</h1>
        <div className="flex gap-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={(range) => {
              setDateRange(range);
            }}
          />
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {(analyticsError || isAnalyticsDataMissing || isLegacyDataMissing) && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analytics Data Issue</AlertTitle>
          <AlertDescription>
            {analyticsError ? (
              "Couldn't load analytics data from Google Analytics. Please check your GA4 configuration in settings."
            ) : (
              "Some traffic data could not be loaded. This page will not function correctly until all required data is available."
            )}
          </AlertDescription>
        </Alert>
      )}

      {analyticsLoading && (
        <div className="flex items-center justify-center p-6 border rounded-lg bg-gray-50 mb-6">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-600">Loading Google Analytics data...</span>
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
                  {ga4Data?.metrics?.pageViews ? ga4Data.metrics.pageViews.toLocaleString() : '0'}
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
                  {ga4Data?.metrics?.visitors ? ga4Data.metrics.visitors.toLocaleString() : '0'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bounce Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Bounce Rate</p>
                <h3 className="text-2xl font-bold mt-1">
                  {ga4Data?.metrics?.bounceRate !== undefined ? `${(ga4Data.metrics.bounceRate * 100).toFixed(1)}%` : '0%'}
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
                  {deviceData && deviceData.length > 0
                    ? `${deviceData.find(d => d.name.toLowerCase() === 'mobile')?.value || 0}%`
                    : (isAnalyticsDataMissing ? 'No Data' : '0%')
                  }
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
              {deviceData && deviceData.length > 0 ? (
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
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="font-medium">No device data available from Google Analytics</p>
                </div>
              )}
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
              {sessionsData ? (
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
              ) : (
                <div className="flex items-center justify-center h-full bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="font-medium">No sessions data available from database</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
