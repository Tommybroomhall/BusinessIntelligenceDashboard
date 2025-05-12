import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface VercelAnalyticsOptions {
  projectId?: string;
  teamId?: string;
  from?: Date;
  to?: Date;
}

interface AnalyticsResponse {
  pageViews: number;
  visitors: number;
  topPages: { path: string; views: number }[];
  topSources: { source: string; visitors: number }[];
  deviceDistribution: { device: string; percentage: number }[];
  errorRate: number;
}

export function useVercelAnalytics(options: VercelAnalyticsOptions = {}) {
  // Format dates for query string
  const formatDate = (date?: Date) => (
    date ? date.toISOString() : undefined
  );
  
  // Build the query params
  const getQueryString = () => {
    const params = new URLSearchParams();
    
    if (options.from) {
      params.append('from', formatDate(options.from)!);
    }
    
    if (options.to) {
      params.append('to', formatDate(options.to)!);
    }
    
    if (options.projectId) {
      params.append('projectId', options.projectId);
    }
    
    if (options.teamId) {
      params.append('teamId', options.teamId);
    }
    
    return params.toString();
  };
  
  // Create the query key
  const queryKey = ['api/vercel-analytics', options];
  
  // Date range state for UI
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: options.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to 30 days ago
    to: options.to || new Date()
  });
  
  // Query function
  const query = useQuery<AnalyticsResponse>({
    queryKey,
    queryFn: async () => {
      const queryString = getQueryString();
      const url = `/api/vercel-analytics${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch Vercel analytics data');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Function to update date range
  const updateDateRange = (newRange: { from?: Date; to?: Date }) => {
    setDateRange({
      ...dateRange,
      ...newRange
    });
    
    // Update the query options
    options = {
      ...options,
      ...newRange
    };
  };
  
  return {
    ...query,
    dateRange,
    updateDateRange,
  };
}