import { Router, Request, Response } from 'express';
import { ensureTenantAccess } from '../../middleware/tenantAccess';
import { TrafficAnalyticsService } from '../../services/traffic-analytics';

const router = Router();

// Get traffic analytics data from Google Analytics
router.get("/", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const { from, to, forceRefresh } = req.query;

    const options = {
      tenantId: req.tenantId!,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      forceRefresh: forceRefresh === 'true'
    };

    const trafficData = await TrafficAnalyticsService.getTrafficData(options);

    res.json({
      success: true,
      data: trafficData,
      meta: {
        source: trafficData.source,
        isFromCache: trafficData.isFromCache,
        lastUpdated: trafficData.lastUpdated,
        dateRange: trafficData.dateRange
      }
    });
  } catch (error) {
    console.error("Error fetching traffic analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching traffic analytics data",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Test connection to Google Analytics
router.post("/test-connection", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const result = await TrafficAnalyticsService.testConnection(req.tenantId!, 'google_analytics');

    res.json({
      success: result.success,
      message: result.message,
      source: 'google_analytics'
    });
  } catch (error) {
    console.error("Error testing analytics connection:", error);
    res.status(500).json({
      success: false,
      message: "Error testing connection",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get available analytics sources for the tenant
router.get("/sources", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const { getStorage } = await import('../../storageFactory');
    const storage = await getStorage();
    const tenant = await storage.getTenant(req.tenantId!);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    const sources = {
      google_analytics: {
        enabled: !!(tenant.ga4Key && tenant.ga4PropertyId),
        configured: !!(tenant.ga4Key && tenant.ga4PropertyId),
        displayName: 'Google Analytics 4',
        description: 'Comprehensive web analytics from Google'
      }
    };

    const currentSource = tenant.trafficDataSource || 'google_analytics';

    res.json({
      success: true,
      data: {
        currentSource,
        availableSources: sources,
        recommendations: {
          suggested: sources.google_analytics.configured ? 'google_analytics' : null,
          reason: sources.google_analytics.configured ?
                 'Google Analytics provides comprehensive web analytics' :
                 'Google Analytics is not configured'
        }
      }
    });
  } catch (error) {
    console.error("Error fetching analytics sources:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics sources",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Update traffic data source preferences
router.post("/preferences", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const { source } = req.body;

    if (source && source !== 'google_analytics') {
      return res.status(400).json({
        success: false,
        message: "Invalid source. Must be 'google_analytics'"
      });
    }

    const { getStorage } = await import('../../storageFactory');
    const storage = await getStorage();
    const tenant = await storage.getTenant(req.tenantId!);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    // Update tenant preferences
    const updateData: any = {
      trafficDataSource: 'google_analytics'
    };

    await storage.updateTenant(req.tenantId!, updateData);

    res.json({
      success: true,
      message: "Traffic data source preferences updated successfully",
      data: {
        source: 'google_analytics'
      }
    });
  } catch (error) {
    console.error("Error updating traffic data source preferences:", error);
    res.status(500).json({
      success: false,
      message: "Error updating preferences",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Clear cached analytics data
router.delete("/cache", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const { GoogleAnalyticsData } = await import('../../models');

    // Convert tenantId for MongoDB query
    let tenantQuery: any = req.tenantId!;
    if (typeof req.tenantId === 'number') {
      const { getStorage } = await import('../../storageFactory');
      const storage = await getStorage();
      const tenant = await storage.getTenant(req.tenantId);
      if (tenant && tenant._id) {
        tenantQuery = tenant._id;
      }
    }

    // Clear Google Analytics cached data for the tenant
    const result = await GoogleAnalyticsData.deleteMany({ tenantId: tenantQuery });

    res.json({
      success: true,
      message: "Google Analytics cache cleared successfully",
      data: {
        deletedCount: result.deletedCount,
        source: 'google_analytics'
      }
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing cache",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router; 