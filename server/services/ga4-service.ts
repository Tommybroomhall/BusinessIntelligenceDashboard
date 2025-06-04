import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { log } from '../vite';

export interface GA4Credentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export interface GA4Config {
  propertyId: string;
  credentials: GA4Credentials;
}

export interface GA4Metrics {
  pageViews: number;
  sessions: number;
  users: number;
  bounceRate: number;
}

export interface GA4TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  percentage: number;
}

export interface GA4TopPage {
  path: string;
  pageViews: number;
  uniquePageViews: number;
}

export interface GA4DeviceCategory {
  device: string;
  sessions: number;
  percentage: number;
}

export interface GA4Data {
  metrics: GA4Metrics;
  trafficSources: GA4TrafficSource[];
  topPages: GA4TopPage[];
  deviceDistribution: GA4DeviceCategory[];
}

export class GA4Service {
  private client: BetaAnalyticsDataClient;
  private propertyId: string;

  constructor(config: GA4Config) {
    this.propertyId = config.propertyId;
    
    // Initialize the GA4 client with service account credentials
    this.client = new BetaAnalyticsDataClient({
      projectId: config.credentials.projectId,
      credentials: {
        client_email: config.credentials.clientEmail,
        private_key: config.credentials.privateKey.replace(/\\n/g, '\n'),
      },
    });
  }

  /**
   * Test connection to GA4 API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Simple test request to verify credentials and property access
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: '7daysAgo',
            endDate: 'today',
          },
        ],
        metrics: [
          {
            name: 'sessions',
          },
        ],
        limit: 1,
      });

      if (response && response.rows !== undefined) {
        return {
          success: true,
          message: 'Successfully connected to Google Analytics 4',
        };
      } else {
        return {
          success: false,
          message: 'Unable to retrieve data from Google Analytics 4',
        };
      }
    } catch (error) {
      log(`GA4 connection test failed: ${error}`, 'analytics');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetch comprehensive analytics data from GA4
   */
  async getAnalyticsData(startDate: string, endDate: string): Promise<GA4Data> {
    try {
      // Fetch main metrics
      const metricsData = await this.getMetrics(startDate, endDate);
      
      // Fetch traffic sources
      const trafficSources = await this.getTrafficSources(startDate, endDate);
      
      // Fetch top pages
      const topPages = await this.getTopPages(startDate, endDate);
      
      // Fetch device distribution
      const deviceDistribution = await this.getDeviceDistribution(startDate, endDate);

      return {
        metrics: metricsData,
        trafficSources,
        topPages,
        deviceDistribution,
      };
    } catch (error) {
      log(`Error fetching GA4 analytics data: ${error}`, 'analytics');
      throw error;
    }
  }

  /**
   * Get main metrics (sessions, users, page views, bounce rate)
   */
  private async getMetrics(startDate: string, endDate: string): Promise<GA4Metrics> {
    const [response] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
      ],
    });

    const row = response.rows?.[0];
    if (!row || !row.metricValues) {
      throw new Error('No metrics data received from GA4');
    }

    return {
      sessions: parseInt(row.metricValues[0]?.value || '0'),
      users: parseInt(row.metricValues[1]?.value || '0'),
      pageViews: parseInt(row.metricValues[2]?.value || '0'),
      bounceRate: parseFloat(row.metricValues[3]?.value || '0'),
    };
  }

  /**
   * Get traffic sources with session counts
   */
  private async getTrafficSources(startDate: string, endDate: string): Promise<GA4TrafficSource[]> {
    const [response] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics: [{ name: 'sessions' }],
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true,
        },
      ],
      limit: 10,
    });

    const totalSessions = response.rows?.reduce((sum, row) => {
      return sum + parseInt(row.metricValues?.[0]?.value || '0');
    }, 0) || 1;

    return response.rows?.map(row => ({
      source: row.dimensionValues?.[0]?.value || 'unknown',
      medium: row.dimensionValues?.[1]?.value || 'unknown',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      percentage: Math.round((parseInt(row.metricValues?.[0]?.value || '0') / totalSessions) * 100),
    })) || [];
  }

  /**
   * Get top pages by page views
   */
  private async getTopPages(startDate: string, endDate: string): Promise<GA4TopPage[]> {
    const [response] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
      ],
      orderBys: [
        {
          metric: { metricName: 'screenPageViews' },
          desc: true,
        },
      ],
      limit: 10,
    });

    return response.rows?.map(row => ({
      path: row.dimensionValues?.[0]?.value || '/',
      pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
      uniquePageViews: parseInt(row.metricValues?.[1]?.value || '0'),
    })) || [];
  }

  /**
   * Get device distribution
   */
  private async getDeviceDistribution(startDate: string, endDate: string): Promise<GA4DeviceCategory[]> {
    const [response] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true,
        },
      ],
    });

    const totalSessions = response.rows?.reduce((sum, row) => {
      return sum + parseInt(row.metricValues?.[0]?.value || '0');
    }, 0) || 1;

    return response.rows?.map(row => ({
      device: row.dimensionValues?.[0]?.value || 'unknown',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      percentage: Math.round((parseInt(row.metricValues?.[0]?.value || '0') / totalSessions) * 100),
    })) || [];
  }

  /**
   * Format date for GA4 API (YYYY-MM-DD)
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Create GA4 service instance from environment variables
   */
  static createFromEnv(propertyId: string): GA4Service {
    const projectId = process.env.GA4_SERVICE_ACCOUNT_PROJECT_ID;
    const clientEmail = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing required GA4 environment variables');
    }

    return new GA4Service({
      propertyId,
      credentials: {
        projectId,
        clientEmail,
        privateKey,
      },
    });
  }
}
