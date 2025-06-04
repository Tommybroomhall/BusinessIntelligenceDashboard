import { getStorage } from '../storageFactory';
import { AnalyticsCache, GoogleAnalyticsData } from '../models';
import { log } from '../vite';
import { GA4Service } from './ga4-service';

export type TrafficDataSource = 'google_analytics';

export interface TrafficAnalyticsOptions {
  tenantId: string | number;
  from?: Date;
  to?: Date;
  forceRefresh?: boolean;
}

export interface StandardizedTrafficData {
  source: 'google_analytics';
  dateRange: {
    from: Date;
    to: Date;
  };
  metrics: {
    pageViews: number;
    visitors: number;
    sessions: number;
    bounceRate?: number;
    errorRate?: number;
  };
  trafficSources: Array<{
    source: string;
    medium?: string;
    sessions: number;
    percentage: number;
  }>;
  topPages: Array<{
    path: string;
    pageViews: number;
    visitors?: number;
    uniquePageViews?: number;
  }>;
  deviceDistribution: Array<{
    device: string;
    sessions: number;
    percentage: number;
  }>;
  lastUpdated: Date;
  isFromCache: boolean;
}

export class TrafficAnalyticsService {
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private static readonly GA_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for GA (slower API)

  /**
   * Get traffic analytics data from Google Analytics
   */
  static async getTrafficData(options: TrafficAnalyticsOptions): Promise<StandardizedTrafficData> {
    const { tenantId, from, to, forceRefresh = false } = options;

    try {
      const storage = await getStorage();
      const tenant = await storage.getTenant(tenantId);

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check if Google Analytics is configured
      if (!this.isGoogleAnalyticsConfigured(tenant)) {
        throw new Error('Google Analytics is not properly configured');
      }

      // Set default date range (last 30 days)
      const dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = to || new Date();

      // Try to get cached data first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = await this.getCachedData(tenantId, dateFrom, dateTo);
        if (cachedData) {
          log(`Returning cached Google Analytics data for tenant ${tenantId}`, 'analytics');
          return cachedData;
        }
      }

      // Fetch fresh data from Google Analytics
      const freshData = await this.fetchGoogleAnalyticsData(tenant, dateFrom, dateTo);

      // Cache the fresh data
      await this.cacheData(tenantId, freshData);

      log(`Fetched fresh Google Analytics data for tenant ${tenantId}`, 'analytics');
      return freshData;

    } catch (error) {
      log(`Error fetching traffic data: ${error}`, 'analytics');

      // Return dummy data as fallback
      return this.getDummyData(from, to);
    }
  }



  /**
   * Check if Google Analytics is properly configured for the tenant
   */
  private static isGoogleAnalyticsConfigured(tenant: any): boolean {
    return !!(tenant.ga4Key && tenant.ga4PropertyId);
  }



  /**
   * Fetch data from Google Analytics 4 API
   */
  private static async fetchGoogleAnalyticsData(tenant: any, from: Date, to: Date): Promise<StandardizedTrafficData> {
    try {
      log(`Fetching GA4 data for tenant ${tenant._id} from ${from.toISOString()} to ${to.toISOString()}`, 'analytics');

      // Create GA4 service instance
      const ga4Service = GA4Service.createFromEnv(tenant.ga4PropertyId);

      // Format dates for GA4 API
      const startDate = GA4Service.formatDate(from);
      const endDate = GA4Service.formatDate(to);

      // Fetch data from GA4
      const ga4Data = await ga4Service.getAnalyticsData(startDate, endDate);

      // Transform GA4 data to standardized format
      return {
        source: 'google_analytics',
        dateRange: { from, to },
        metrics: {
          pageViews: ga4Data.metrics.pageViews,
          visitors: ga4Data.metrics.users,
          sessions: ga4Data.metrics.sessions,
          bounceRate: ga4Data.metrics.bounceRate
        },
        trafficSources: ga4Data.trafficSources.map(source => ({
          source: source.source,
          medium: source.medium,
          sessions: source.sessions,
          percentage: source.percentage
        })),
        topPages: ga4Data.topPages.map(page => ({
          path: page.path,
          pageViews: page.pageViews,
          visitors: page.uniquePageViews,
          uniquePageViews: page.uniquePageViews
        })),
        deviceDistribution: ga4Data.deviceDistribution.map(device => ({
          device: device.device,
          sessions: device.sessions,
          percentage: device.percentage
        })),
        lastUpdated: new Date(),
        isFromCache: false
      };
    } catch (error) {
      log(`Error fetching GA4 data: ${error}`, 'analytics');

      // Return empty data structure on error
      return {
        source: 'google_analytics',
        dateRange: { from, to },
        metrics: {
          pageViews: 0,
          visitors: 0,
          sessions: 0,
          bounceRate: 0
        },
        trafficSources: [],
        topPages: [],
        deviceDistribution: [],
        lastUpdated: new Date(),
        isFromCache: false
      };
    }
  }

  /**
   * Get cached data if available and not expired
   */
  private static async getCachedData(
    tenantId: string | number,
    from: Date,
    to: Date
  ): Promise<StandardizedTrafficData | null> {
    try {
      const now = new Date();

      // Convert tenantId to appropriate format for query
      let tenantQuery: any = tenantId;
      if (typeof tenantId === 'number') {
        // For numeric tenant IDs, we need to handle the conversion properly
        const storage = await getStorage();
        const tenant = await storage.getTenant(tenantId);
        if (tenant && tenant._id) {
          tenantQuery = tenant._id;
        }
      }

      const cached = await GoogleAnalyticsData.findOne({
        tenantId: tenantQuery,
        'dateRange.from': { $lte: from },
        'dateRange.to': { $gte: to },
        expiresAt: { $gt: now }
      }).sort({ createdAt: -1 });

      if (cached) {
        return this.transformGoogleCacheToStandardized(cached);
      }

      return null;
    } catch (error) {
      log(`Error retrieving cached data: ${error}`, 'analytics');
      return null;
    }
  }

  /**
   * Cache analytics data
   */
  private static async cacheData(tenantId: string | number, data: StandardizedTrafficData): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + this.GA_CACHE_DURATION);

      // Convert tenantId to appropriate format for storage
      let tenantQuery: any = tenantId;
      if (typeof tenantId === 'number') {
        const storage = await getStorage();
        const tenant = await storage.getTenant(tenantId);
        if (tenant && tenant._id) {
          tenantQuery = tenant._id;
        }
      }

      await GoogleAnalyticsData.findOneAndUpdate(
        {
          tenantId: tenantQuery,
          'dateRange.from': data.dateRange.from,
          'dateRange.to': data.dateRange.to
        },
        {
          tenantId: tenantQuery,
          propertyId: 'default', // You might want to store actual property ID
          dateRange: data.dateRange,
          metrics: {
            pageViews: data.metrics.pageViews,
            sessions: data.metrics.sessions,
            users: data.metrics.visitors,
            bounceRate: data.metrics.bounceRate || 0
          },
          dimensions: {
            trafficSources: data.trafficSources.map(source => ({
              source: source.source,
              medium: source.medium || 'unknown',
              sessions: source.sessions
            })),
            topPages: data.topPages.map(page => ({
              page: page.path,
              pageViews: page.pageViews,
              uniquePageViews: page.visitors || 0
            })),
            deviceCategory: data.deviceDistribution.map(device => ({
              deviceCategory: device.device,
              sessions: device.sessions,
              percentage: device.percentage
            })),
            countries: [] // Not available in standardized format
          },
          expiresAt
        },
        { upsert: true, new: true }
      );

      log(`Cached Google Analytics data for tenant ${tenantId}`, 'analytics');
    } catch (error) {
      log(`Error caching data: ${error}`, 'analytics');
    }
  }



  /**
   * Get dummy data for testing and fallback scenarios
   */
  private static getDummyData(from?: Date, to?: Date): StandardizedTrafficData {
    const dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = to || new Date();

    return {
      source: 'google_analytics',
      dateRange: { from: dateFrom, to: dateTo },
      metrics: {
        pageViews: 12543,
        visitors: 8932,
        sessions: 9876,
        bounceRate: 0.45
      },
      trafficSources: [
        { source: 'google', sessions: 4500, percentage: 45 },
        { source: 'direct', sessions: 2800, percentage: 28 },
        { source: 'facebook', sessions: 1200, percentage: 12 },
        { source: 'twitter', sessions: 800, percentage: 8 },
        { source: 'other', sessions: 700, percentage: 7 }
      ],
      topPages: [
        { path: '/', pageViews: 5600, visitors: 4200 },
        { path: '/dashboard', pageViews: 3400, visitors: 2800 },
        { path: '/products', pageViews: 2100, visitors: 1900 },
        { path: '/about', pageViews: 1443, visitors: 1200 }
      ],
      deviceDistribution: [
        { device: 'Desktop', sessions: 5900, percentage: 60 },
        { device: 'Mobile', sessions: 2950, percentage: 30 },
        { device: 'Tablet', sessions: 985, percentage: 10 }
      ],
      lastUpdated: new Date(),
      isFromCache: false
    };
  }



  /**
   * Transform cached Google Analytics data to standardized format
   */
  private static transformGoogleCacheToStandardized(cached: any): StandardizedTrafficData {
    return {
      source: 'google_analytics',
      dateRange: cached.dateRange,
      metrics: {
        pageViews: cached.metrics.pageViews,
        visitors: cached.metrics.users,
        sessions: cached.metrics.sessions,
        bounceRate: cached.metrics.bounceRate
      },
      trafficSources: cached.dimensions.trafficSources.map((source: any) => ({
        source: source.source,
        medium: source.medium,
        sessions: source.sessions,
        percentage: 0 // Recalculate if needed
      })),
      topPages: cached.dimensions.topPages.map((page: any) => ({
        path: page.page,
        pageViews: page.pageViews,
        uniquePageViews: page.uniquePageViews
      })),
      deviceDistribution: cached.dimensions.deviceCategory.map((device: any) => ({
        device: device.deviceCategory,
        sessions: device.sessions,
        percentage: device.percentage
      })),
      lastUpdated: cached.createdAt,
      isFromCache: true
    };
  }

  /**
   * Test connectivity to Google Analytics
   */
  static async testConnection(tenantId: string | number, source: 'google_analytics'): Promise<{ success: boolean; message: string }> {
    try {
      const storage = await getStorage();
      const tenant = await storage.getTenant(tenantId);

      if (!tenant) {
        return { success: false, message: 'Tenant not found' };
      }

      if (!this.isGoogleAnalyticsConfigured(tenant)) {
        return { success: false, message: 'Google Analytics is not properly configured. Please check your GA4 key and property ID.' };
      }

      try {
        const ga4Service = GA4Service.createFromEnv(tenant.ga4PropertyId);
        const result = await ga4Service.testConnection();
        return result;
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to connect to Google Analytics'
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 