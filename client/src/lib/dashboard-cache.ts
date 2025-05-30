import { queryClient } from "./queryClient";

// Cache keys for dashboard data
export const CACHE_KEYS = {
  DASHBOARD_DATA: '/api/dashboard',
  ORDERS_DATA: '/api/orders',
  POPULAR_PRODUCTS: '/api/dashboard/popular-products',
  PRODUCTS: '/api/products',
  SALES_DATA: 'sales-data',
} as const;

// Cache duration constants (in milliseconds)
export const CACHE_DURATION = {
  FRESH: 2 * 60 * 1000,      // 2 minutes - data is considered fresh
  STALE: 10 * 60 * 1000,     // 10 minutes - data is stale but usable
  EXPIRED: 30 * 60 * 1000,   // 30 minutes - data should be removed
} as const;

// Dashboard data types
export interface DashboardData {
  kpi: {
    revenue: number;
    orderCount: number;
    averageOrderValue: number;
  };
  traffic: {
    bySource: Array<{ name: string; value: number; color: string }>;
    topPages: Array<{ page: string; views: number }>;
    deviceDistribution: Array<{ device: string; percentage: number }>;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: Date;
  }>;
  popularProducts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    imageUrl: string;
    sold: number;
    earnings: number;
  }>;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  version: string;
}

/**
 * Dashboard Cache Manager
 * Handles caching strategy for dashboard data with background refresh
 */
export class DashboardCacheManager {
  private static instance: DashboardCacheManager;
  private readonly STORAGE_PREFIX = 'dashboard_cache_';
  private readonly CACHE_VERSION = 'v1.0.0';

  static getInstance(): DashboardCacheManager {
    if (!DashboardCacheManager.instance) {
      DashboardCacheManager.instance = new DashboardCacheManager();
    }
    return DashboardCacheManager.instance;
  }

  /**
   * Get cached data from localStorage
   */
  private getCachedData<T>(key: string): CachedData<T> | null {
    try {
      const cached = localStorage.getItem(this.STORAGE_PREFIX + key);
      if (!cached) return null;

      const parsedData: CachedData<T> = JSON.parse(cached);
      
      // Check if cache version matches
      if (parsedData.version !== this.CACHE_VERSION) {
        this.removeCachedData(key);
        return null;
      }

      // Check if data is expired
      const now = Date.now();
      if (now - parsedData.timestamp > CACHE_DURATION.EXPIRED) {
        this.removeCachedData(key);
        return null;
      }

      return parsedData;
    } catch (error) {
      console.warn('Error reading cached data:', error);
      return null;
    }
  }

  /**
   * Store data in localStorage cache
   */
  private setCachedData<T>(key: string, data: T): void {
    try {
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
      };
      localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(cachedData));
    } catch (error) {
      console.warn('Error storing cached data:', error);
    }
  }

  /**
   * Remove cached data
   */
  private removeCachedData(key: string): void {
    try {
      localStorage.removeItem(this.STORAGE_PREFIX + key);
    } catch (error) {
      console.warn('Error removing cached data:', error);
    }
  }

  /**
   * Check if cached data is fresh (within fresh duration)
   */
  private isFresh(cachedData: CachedData<any>): boolean {
    const now = Date.now();
    return now - cachedData.timestamp < CACHE_DURATION.FRESH;
  }

  /**
   * Check if cached data is stale but usable
   */
  private isStale(cachedData: CachedData<any>): boolean {
    const now = Date.now();
    return now - cachedData.timestamp < CACHE_DURATION.STALE;
  }

  /**
   * Get dashboard data with caching strategy
   * Returns cached data immediately if available, then fetches fresh data in background
   */
  async getDashboardData(dateRange?: { from: string; to: string }): Promise<{
    data: DashboardData | null;
    isFromCache: boolean;
    isFresh: boolean;
  }> {
    const cacheKey = dateRange 
      ? `${CACHE_KEYS.DASHBOARD_DATA}_${dateRange.from}_${dateRange.to}`
      : CACHE_KEYS.DASHBOARD_DATA;

    // Try to get cached data first
    const cachedData = this.getCachedData<DashboardData>(cacheKey);
    
    if (cachedData) {
      const isFresh = this.isFresh(cachedData);
      const isUsable = this.isStale(cachedData);

      if (isUsable) {
        // Return cached data immediately
        const result = {
          data: cachedData.data,
          isFromCache: true,
          isFresh,
        };

        // If data is stale, trigger background refresh
        if (!isFresh) {
          this.refreshDashboardDataInBackground(dateRange);
        }

        return result;
      }
    }

    // No usable cached data, fetch fresh data
    return {
      data: null,
      isFromCache: false,
      isFresh: false,
    };
  }

  /**
   * Refresh dashboard data in background and update cache
   */
  private async refreshDashboardDataInBackground(dateRange?: { from: string; to: string }): Promise<void> {
    try {
      const cacheKey = dateRange 
        ? `${CACHE_KEYS.DASHBOARD_DATA}_${dateRange.from}_${dateRange.to}`
        : CACHE_KEYS.DASHBOARD_DATA;

      // Invalidate React Query cache to force fresh fetch
      await queryClient.invalidateQueries({ 
        queryKey: [CACHE_KEYS.DASHBOARD_DATA, dateRange?.from, dateRange?.to] 
      });

      // The React Query will handle the actual fetching
      // We'll update our localStorage cache when the query succeeds
    } catch (error) {
      console.warn('Error refreshing dashboard data in background:', error);
    }
  }

  /**
   * Update cache when fresh data is received
   */
  updateDashboardCache(data: DashboardData, dateRange?: { from: string; to: string }): void {
    const cacheKey = dateRange 
      ? `${CACHE_KEYS.DASHBOARD_DATA}_${dateRange.from}_${dateRange.to}`
      : CACHE_KEYS.DASHBOARD_DATA;
    
    this.setCachedData(cacheKey, data);
  }

  /**
   * Clear all dashboard cache
   */
  clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      
      // Also clear React Query cache
      queryClient.clear();
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    totalCachedItems: number;
    cacheSize: number;
    oldestItem: number | null;
    newestItem: number | null;
  } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));
      
      let totalSize = 0;
      let oldestTimestamp: number | null = null;
      let newestTimestamp: number | null = null;

      cacheKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          try {
            const parsed: CachedData<any> = JSON.parse(value);
            if (oldestTimestamp === null || parsed.timestamp < oldestTimestamp) {
              oldestTimestamp = parsed.timestamp;
            }
            if (newestTimestamp === null || parsed.timestamp > newestTimestamp) {
              newestTimestamp = parsed.timestamp;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });

      return {
        totalCachedItems: cacheKeys.length,
        cacheSize: totalSize,
        oldestItem: oldestTimestamp,
        newestItem: newestTimestamp,
      };
    } catch (error) {
      console.warn('Error getting cache stats:', error);
      return {
        totalCachedItems: 0,
        cacheSize: 0,
        oldestItem: null,
        newestItem: null,
      };
    }
  }
}

// Export singleton instance
export const dashboardCache = DashboardCacheManager.getInstance();
