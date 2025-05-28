import { Router, Request, Response } from 'express';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';

const router = Router();

// Get top pages
router.get("/toppages", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const topPages = await storage.getTopPages(req.tenantId, limit);
    res.json(topPages);
  } catch (error) {
    console.error("Error fetching top pages:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Get traffic sources
router.get("/sources", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const trafficBySource = await storage.getTrafficBySource(req.tenantId);
    res.json(trafficBySource);
  } catch (error) {
    console.error("Error fetching traffic sources:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Get device distribution
router.get("/devices", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const deviceDistribution = await storage.getDeviceDistribution(req.tenantId);
    res.json(deviceDistribution);
  } catch (error) {
    console.error("Error fetching device distribution:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Vercel Analytics API route
router.get("/vercel-analytics", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const { from, to, projectId, teamId } = req.query;

    // Import the Vercel analytics service
    const { fetchVercelAnalytics } = await import('../../services/vercel-analytics');

    // Get tenant for API keys
    const tenant = await storage.getTenant(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Fetch analytics data from Vercel
    const analyticsData = await fetchVercelAnalytics({
      projectId: projectId as string || tenant.vercelProjectId as string,
      teamId: teamId as string || tenant.vercelTeamId as string,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined
    });

    res.json(analyticsData);
  } catch (error) {
    console.error("Error fetching Vercel analytics:", error);
    res.status(500).json({
      message: "Error fetching analytics data",
      error: error.message
    });
  }
});

export default router;
