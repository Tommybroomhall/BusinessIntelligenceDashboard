export type TrafficDataSource = 'google_analytics';

export interface TrafficAnalyticsOptions {
  tenantId: string | number;
  from?: Date;
  to?: Date;
  source?: TrafficDataSource;
  forceRefresh?: boolean;
}

export interface TrafficSource {
  source: string;
  medium?: string;
  sessions: number;
  percentage: number;
}

export interface TopPage {
  path: string;
  pageViews: number;
  visitors?: number;
  uniquePageViews?: number;
}

export interface DeviceDistribution {
  device: string;
  sessions: number;
  percentage: number;
}

export interface TrafficMetrics {
  pageViews: number;
  visitors: number;
  sessions: number;
  bounceRate?: number;
  errorRate?: number;
}

export interface StandardizedTrafficData {
  source: 'google_analytics';
  dateRange: {
    from: Date;
    to: Date;
  };
  metrics: TrafficMetrics;
  trafficSources: TrafficSource[];
  topPages: TopPage[];
  deviceDistribution: DeviceDistribution[];
  lastUpdated: Date;
  isFromCache: boolean;
}

export interface TrafficDataSourcePreference {
  primary: 'google_analytics';
  fallback: 'google_analytics';
  lastUpdated: Date;
}

export interface AnalyticsSourceConfig {
  enabled: boolean;
  configured: boolean;
  displayName: string;
  description: string;
}

export interface AnalyticsSourcesResponse {
  currentSource: TrafficDataSource;
  preferences: TrafficDataSourcePreference;
  availableSources: {
    google_analytics: AnalyticsSourceConfig;
  };
  recommendations: {
    suggested: 'google_analytics' | null;
    reason: string;
  };
}

export interface TrafficAnalyticsResponse {
  success: boolean;
  data: StandardizedTrafficData;
  meta: {
    source: 'google_analytics';
    isFromCache: boolean;
    lastUpdated: Date;
    dateRange: {
      from: Date;
      to: Date;
    };
  };
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  source?: 'google_analytics';
}

export interface CacheClearResult {
  success: boolean;
  message: string;
  data: {
    deletedCount: number;
    source: string;
  };
} 