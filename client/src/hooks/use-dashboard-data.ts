import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardCache, DashboardData, CACHE_KEYS } from '@/lib/dashboard-cache';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Error handling constants
const MAX_RETRY_ATTEMPTS = 5;
const BASE_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const ERROR_TOAST_COOLDOWN = 60000; // 1 minute between error toasts

// Exponential backoff calculation
const calculateRetryDelay = (retryCount: number): number => {
  const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  return Math.floor(delay + jitter);
};

// Network error detection
const isNetworkError = (error: Error): boolean => {
  const networkErrorMessages = [
    'fetch',
    'network',
    'connection',
    'timeout',
    'offline',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'Failed to fetch'
  ];

  return networkErrorMessages.some(msg =>
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
};

// Check if error should trigger exponential backoff
const shouldRetryWithBackoff = (error: Error, retryCount: number): boolean => {
  if (retryCount >= MAX_RETRY_ATTEMPTS) return false;

  // Don't retry on authentication errors
  if (error.message.includes('401') || error.message.includes('403')) return false;

  // Retry on network errors and 5xx server errors
  return isNetworkError(error) ||
         error.message.includes('500') ||
         error.message.includes('502') ||
         error.message.includes('503') ||
         error.message.includes('504');
};

interface UseDashboardDataOptions {
  dateRange?: {
    from: Date;
    to: Date;
  };
  enableBackgroundRefresh?: boolean;
  autoRefreshInterval?: number; // in milliseconds, 0 to disable
  pauseOnUserIdle?: boolean;
}

interface DashboardDataState {
  data: DashboardData | null;
  isLoading: boolean;
  isFromCache: boolean;
  isFresh: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  isAutoRefreshEnabled: boolean;
  isUserIdle: boolean;
  nextRefreshIn: number; // seconds until next auto refresh
  retryCount: number;
  isRetrying: boolean;
  lastErrorTime: Date | null;
  isOnline: boolean;
}

/**
 * Custom hook for dashboard data with advanced caching strategy
 *
 * Features:
 * - Immediate display of cached data if available
 * - Background refresh of stale data
 * - Smooth transitions between cached and fresh data
 * - Loading states that don't block UI when cached data is available
 */
export function useDashboardData(options: UseDashboardDataOptions = {}) {
  const {
    dateRange,
    enableBackgroundRefresh = true,
    autoRefreshInterval = 5 * 60 * 1000, // Default: 5 minutes
    pauseOnUserIdle = true
  } = options;

  // Toast hook for error notifications
  const { toast } = useToast();

  // Convert date range to ISO strings for API calls
  const dateRangeStrings = dateRange ? {
    from: dateRange.from.toISOString(),
    to: dateRange.to.toISOString(),
  } : undefined;

  // Local state for managing cached vs fresh data
  const [state, setState] = useState<DashboardDataState>({
    data: null,
    isLoading: true,
    isFromCache: false,
    isFresh: false,
    error: null,
    lastUpdated: null,
    isAutoRefreshEnabled: true, // Always enabled since we removed manual controls
    isUserIdle: false,
    nextRefreshIn: 0,
    retryCount: 0,
    isRetrying: false,
    lastErrorTime: null,
    isOnline: navigator.onLine,
  });

  // User activity detection
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isUserActive, setIsUserActive] = useState(true);

  // Auto-refresh timer state
  const [autoRefreshTimer, setAutoRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(null);
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true, retryCount: 0 }));
      // If we were offline and auto-refresh is enabled, trigger a refresh
      if (state.isAutoRefreshEnabled && !state.isUserIdle) {
        refresh();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.isAutoRefreshEnabled, state.isUserIdle]);

  // Error toast notification with cooldown
  const showErrorToast = useCallback((error: Error, isRetrying: boolean = false) => {
    const now = Date.now();
    const lastErrorTime = state.lastErrorTime?.getTime() || 0;

    // Only show toast if enough time has passed since last error toast
    if (now - lastErrorTime > ERROR_TOAST_COOLDOWN) {
      const isNetworkIssue = isNetworkError(error);

      toast({
        title: isRetrying ? "Retrying data refresh..." : "Dashboard refresh failed",
        description: isNetworkIssue
          ? "Network connection issue. Will retry automatically when connection is restored."
          : `${error.message}${isRetrying ? ' Retrying...' : ''}`,
        variant: "destructive",
        duration: isRetrying ? 3000 : 5000,
      });

      setState(prev => ({ ...prev, lastErrorTime: new Date() }));
    }
  }, [toast, state.lastErrorTime]);

  // React Query for fetching fresh data with enhanced error handling
  const {
    data: freshData,
    isLoading: isFetchingFresh,
    error: fetchError,
    refetch,
    failureCount,
  } = useQuery({
    queryKey: [CACHE_KEYS.DASHBOARD_DATA, dateRangeStrings?.from, dateRangeStrings?.to],
    queryFn: async () => {
      let url = '/api/dashboard';
      if (dateRangeStrings) {
        url += `?from=${dateRangeStrings.from}&to=${dateRangeStrings.to}`;
      }

      try {
        const response = await apiRequest('GET', url);
        const data = await response.json();

        // Reset retry count on successful fetch
        setState(prev => ({
          ...prev,
          retryCount: 0,
          isRetrying: false,
          error: null
        }));

        // Update cache when fresh data is received
        dashboardCache.updateDashboardCache(data, dateRangeStrings);

        return data;
      } catch (error) {
        const err = error as Error;

        // Update retry count
        setState(prev => ({
          ...prev,
          retryCount: prev.retryCount + 1,
          isRetrying: shouldRetryWithBackoff(err, prev.retryCount),
          error: err
        }));

        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: state.isOnline, // Only fetch when online
    // Custom retry logic with exponential backoff
    retry: (failureCount, error) => {
      const err = error as Error;
      return shouldRetryWithBackoff(err, failureCount);
    },
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
    // Enable auto-refresh with interval (only when online and not retrying)
    refetchInterval: (data, query) => {
      if (!state.isAutoRefreshEnabled || state.isUserIdle || !state.isOnline || state.isRetrying) {
        return false;
      }
      return autoRefreshInterval;
    },
    // Handle query errors
    onError: (error) => {
      const err = error as Error;
      showErrorToast(err, shouldRetryWithBackoff(err, state.retryCount));
    },
    // Handle successful queries
    onSuccess: () => {
      // Show success toast if we were previously in an error state
      if (state.retryCount > 0) {
        toast({
          title: "Dashboard refreshed",
          description: "Connection restored and data updated successfully.",
          variant: "default",
          duration: 3000,
        });
      }
    },
  });

  // User activity detection effect
  useEffect(() => {
    if (!pauseOnUserIdle) return;

    const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes of inactivity = idle

    const handleActivity = () => {
      setLastActivity(Date.now());
      setIsUserActive(true);
    };

    const checkIdleStatus = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const isIdle = timeSinceLastActivity > IDLE_TIMEOUT;

      setIsUserActive(!isIdle);
      setState(prev => ({
        ...prev,
        isUserIdle: isIdle,
      }));
    };

    // Activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check idle status every minute
    const idleCheckInterval = setInterval(checkIdleStatus, 60 * 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(idleCheckInterval);
    };
  }, [lastActivity, pauseOnUserIdle]);

  // Auto-refresh countdown effect
  useEffect(() => {
    if (!state.isAutoRefreshEnabled || state.isUserIdle || autoRefreshInterval <= 0) {
      setState(prev => ({ ...prev, nextRefreshIn: 0 }));
      return;
    }

    const updateCountdown = () => {
      setState(prev => ({
        ...prev,
        nextRefreshIn: Math.max(0, prev.nextRefreshIn - 1),
      }));
    };

    // Reset countdown when fresh data arrives
    if (freshData) {
      setState(prev => ({
        ...prev,
        nextRefreshIn: Math.floor(autoRefreshInterval / 1000),
      }));
    }

    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [state.isAutoRefreshEnabled, state.isUserIdle, autoRefreshInterval, freshData]);

  // Load cached data on mount and when date range changes
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedResult = await dashboardCache.getDashboardData(dateRangeStrings);

        if (cachedResult.data) {
          // We have cached data, show it immediately
          setState(prev => ({
            ...prev,
            data: cachedResult.data,
            isLoading: false, // Don't show loading when we have cached data
            isFromCache: cachedResult.isFromCache,
            isFresh: cachedResult.isFresh,
            error: null,
            lastUpdated: new Date(),
          }));
        } else {
          // No cached data, show loading state
          setState(prev => ({
            ...prev,
            data: null,
            isLoading: true,
            isFromCache: false,
            isFresh: false,
            error: null,
            lastUpdated: null,
          }));
        }
      } catch (error) {
        console.warn('Error loading cached dashboard data:', error);
        setState(prev => ({
          ...prev,
          isLoading: true,
          error: error as Error,
        }));
      }
    };

    loadCachedData();
  }, [dateRangeStrings?.from, dateRangeStrings?.to]);

  // Update state when fresh data arrives
  useEffect(() => {
    if (freshData) {
      setState(prev => ({
        ...prev,
        data: freshData,
        isLoading: false,
        isFromCache: false,
        isFresh: true,
        error: null,
        lastUpdated: new Date(),
      }));
    }
  }, [freshData]);

  // Handle fetch errors
  useEffect(() => {
    if (fetchError) {
      setState(prev => ({
        ...prev,
        error: fetchError as Error,
        isLoading: false, // Stop loading even on error if we have cached data
      }));
    }
  }, [fetchError]);

  // Format time remaining for display
  const formatTimeRemaining = useCallback((seconds: number): string => {
    if (seconds <= 0) return '';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }, []);

  // Background refresh status
  const isRefreshingInBackground = isFetchingFresh && state.data !== null && !state.isLoading;

  return {
    // Data and loading states
    data: state.data,
    isLoading: state.isLoading,
    isFromCache: state.isFromCache,
    isFresh: state.isFresh,
    error: state.error,
    lastUpdated: state.lastUpdated,

    // Background refresh status
    isRefreshingInBackground,

    // Auto-refresh status
    isAutoRefreshEnabled: state.isAutoRefreshEnabled,
    isUserIdle: state.isUserIdle,
    nextRefreshIn: state.nextRefreshIn,
    nextRefreshFormatted: formatTimeRemaining(state.nextRefreshIn),

    // Error handling status
    retryCount: state.retryCount,
    isRetrying: state.isRetrying,
    isOnline: state.isOnline,
    maxRetries: MAX_RETRY_ATTEMPTS,

    // Utility functions
    getCacheStats: () => dashboardCache.getCacheStats(),
    clearCache: () => dashboardCache.clearCache(),
  };
}

/**
 * Hook for individual dashboard components that need specific data
 */
export function useDashboardComponent<T>(
  componentKey: string,
  fetchFn: () => Promise<T>,
  options: {
    staleTime?: number;
    cacheTime?: number;
    enabled?: boolean;
    autoRefreshInterval?: number;
    showErrorToasts?: boolean;
  } = {}
) {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 30 * 60 * 1000, // 30 minutes
    enabled = true,
    autoRefreshInterval = 5 * 60 * 1000, // 5 minutes default
    showErrorToasts = false, // Don't show toasts for component errors by default
  } = options;

  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return useQuery({
    queryKey: [componentKey],
    queryFn: fetchFn,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    enabled: enabled && isOnline,
    // Show cached data immediately while fetching fresh data
    placeholderData: (previousData) => previousData,
    // Enable auto-refresh only when online
    refetchInterval: isOnline ? autoRefreshInterval : false,
    // Custom retry logic
    retry: (failureCount, error) => {
      const err = error as Error;
      return shouldRetryWithBackoff(err, failureCount);
    },
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
    // Handle errors
    onError: (error) => {
      if (showErrorToasts) {
        const err = error as Error;
        const isNetworkIssue = isNetworkError(err);

        toast({
          title: `${componentKey} refresh failed`,
          description: isNetworkIssue
            ? "Network connection issue. Will retry automatically."
            : err.message,
          variant: "destructive",
          duration: 3000,
        });
      }
    },
  });
}
