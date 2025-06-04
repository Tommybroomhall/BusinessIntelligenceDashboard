import { Router, Request, Response } from 'express';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';
import analyticsRoutes from './analytics';

const router = Router();

// Register analytics sub-routes
router.use('/analytics', analyticsRoutes);

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



export default router;
