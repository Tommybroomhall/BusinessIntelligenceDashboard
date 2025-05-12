// Service to fetch analytics data from Vercel API

export interface VercelAnalyticsOptions {
  projectId?: string;
  teamId?: string;
  from?: Date;
  to?: Date;
}

export interface AnalyticsResponse {
  pageViews: number;
  visitors: number;
  topPages: { path: string; views: number }[];
  topSources: { source: string; visitors: number }[];
  deviceDistribution: { device: string; percentage: number }[];
  errorRate: number;
}

export async function fetchVercelAnalytics(
  options: VercelAnalyticsOptions = {}
): Promise<AnalyticsResponse> {
  try {
    // Vercel API token from environment variable
    const token = process.env.VERCEL_API_TOKEN;
    
    if (!token) {
      throw new Error('VERCEL_API_TOKEN environment variable is not defined');
    }
    
    const { projectId, teamId, from, to } = options;
    
    // Build the query parameters
    const params = new URLSearchParams();
    
    if (from) {
      params.append('from', from.toISOString());
    }
    
    if (to) {
      params.append('to', to.toISOString());
    }
    
    // Construct the API URL
    let url = `https://api.vercel.com/v2/analytics/`;
    
    if (teamId) {
      url += `teams/${teamId}/`;
    }
    
    url += `sites/${projectId || process.env.VERCEL_PROJECT_ID}/stats?${params.toString()}`;
    
    // Make the API request
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Vercel API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    // Transform the API response to our format
    // Note: This transformation depends on the actual Vercel API response structure
    return {
      pageViews: data.pageViews?.total || 0,
      visitors: data.uniques?.total || 0,
      topPages: (data.topPages || []).map((page: any) => ({
        path: page.path,
        views: page.views,
      })),
      topSources: (data.topSources || []).map((source: any) => ({
        source: source.source,
        visitors: source.uniques,
      })),
      deviceDistribution: calculateDeviceDistribution(data.deviceType),
      errorRate: data.errorRate || 0,
    };
  } catch (error) {
    console.error('Error fetching Vercel analytics:', error);
    
    // If we can't fetch data, return a structured empty response
    return {
      pageViews: 0,
      visitors: 0,
      topPages: [],
      topSources: [],
      deviceDistribution: [],
      errorRate: 0,
    };
  }
}

// Helper function to calculate device distribution percentages
function calculateDeviceDistribution(deviceData: any) {
  if (!deviceData || !Array.isArray(deviceData)) {
    return [];
  }
  
  const total = deviceData.reduce((sum, item) => sum + item.uniques, 0);
  
  if (total === 0) {
    return [];
  }
  
  return deviceData.map((item) => ({
    device: item.deviceType,
    percentage: Math.round((item.uniques / total) * 100),
  }));
}