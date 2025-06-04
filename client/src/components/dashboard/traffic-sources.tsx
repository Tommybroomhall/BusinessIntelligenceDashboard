import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Activity, Globe, Monitor, Smartphone, Tablet, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/queryClient';
import { StandardizedTrafficData, TrafficSource, TopPage, DeviceDistribution } from '../../../../shared/types/traffic-analytics';

interface TrafficSourcesProps {
  className?: string;
}

const TrafficSources: React.FC<TrafficSourcesProps> = ({ className }) => {
  const {
    data: trafficResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['traffic-analytics'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/traffic/analytics');
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Extract the actual traffic data from the API response
  const trafficData: StandardizedTrafficData | undefined = trafficResponse?.success ? trafficResponse.data : undefined;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Traffic Sources
          </CardTitle>
          <CardDescription>Loading traffic data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Traffic Sources
          </CardTitle>
          <CardDescription className="text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Failed to load traffic data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {error instanceof Error ? error.message : 'Unable to fetch traffic analytics data'}
            </p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trafficData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Traffic Sources
          </CardTitle>
          <CardDescription>No traffic data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No traffic analytics data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDeviceIcon = (device: string) => {
    const deviceLower = device.toLowerCase();
    if (deviceLower.includes('mobile') || deviceLower.includes('phone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (deviceLower.includes('tablet')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getSourceIcon = (source: string) => {
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('google')) {
      return '🔍';
    }
    if (sourceLower.includes('facebook')) {
      return '📘';
    }
    if (sourceLower.includes('twitter')) {
      return '🐦';
    }
    if (sourceLower.includes('direct')) {
      return '🔗';
    }
    return <Globe className="h-4 w-4" />;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className={className}>
      {/* Data Source Indicator */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Traffic Sources
        </h3>
        <div className="flex items-center gap-2">
          {trafficData && (
            <>
              <Badge variant={trafficData.isFromCache ? "secondary" : "default"}>
                {trafficData.isFromCache ? "Cached" : "Live"}
              </Badge>
              <Badge variant="outline">
                {trafficData.source === 'vercel_analytics' ? 'Vercel' : 'Google Analytics'}
              </Badge>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Traffic Sources</CardTitle>
            <CardDescription>
              Where your visitors are coming from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trafficData?.trafficSources && trafficData.trafficSources.length > 0 ? (
                trafficData.trafficSources.map((source: TrafficSource, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getSourceIcon(source.source)}</span>
                      <div>
                        <p className="font-medium capitalize">{source.source}</p>
                        {source.medium && (
                          <p className="text-sm text-gray-500 capitalize">{source.medium}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(source.sessions)}</p>
                      <p className="text-sm text-gray-500">{source.percentage}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No traffic source data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Types</CardTitle>
            <CardDescription>
              How visitors access your site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trafficData?.deviceDistribution && trafficData.deviceDistribution.length > 0 ? (
                trafficData.deviceDistribution.map((device: DeviceDistribution, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(device.device)}
                      <p className="font-medium">{device.device}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(device.sessions)}</p>
                      <p className="text-sm text-gray-500">{device.percentage}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No device data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Pages</CardTitle>
            <CardDescription>
              Most visited pages on your site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trafficData?.topPages && trafficData.topPages.length > 0 ? (
                trafficData.topPages.slice(0, 5).map((page: TopPage, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <p className="font-medium font-mono text-sm">{page.path}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(page.pageViews)} views</p>
                      {page.visitors && (
                        <p className="text-sm text-gray-500">{formatNumber(page.visitors)} visitors</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No page data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      {trafficData && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {new Date(trafficData.lastUpdated).toLocaleString()} •
          Data range: {new Date(trafficData.dateRange.from).toLocaleDateString()} - {new Date(trafficData.dateRange.to).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default TrafficSources; 