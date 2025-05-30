import { Router, Request, Response } from 'express';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';
import salesRoutes from './sales';

const router = Router();

// Register sales sub-routes
router.use('/sales', salesRoutes);

// Get popular products with real sales data
router.get("/popular-products", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const limit = parseInt(req.query.limit as string) || 5;
    const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
    const toDate = req.query.to ? new Date(req.query.to as string) : undefined;

    // Get popular products with sales data
    const popularProducts = await storage.getPopularProductsWithSales(req.tenantId, limit, fromDate, toDate);

    res.json(popularProducts);
  } catch (error) {
    console.error("Error fetching popular products:", error);
    res.status(500).json({ message: "An error occurred while fetching popular products" });
  }
});

// Get dashboard data
router.get("/", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
    const toDate = req.query.to ? new Date(req.query.to as string) : undefined;

    // Get KPI data
    const revenue = await storage.calculateRevenue(req.tenantId, fromDate, toDate);
    const orderCount = await storage.countOrders(req.tenantId, fromDate, toDate);
    const averageOrderValue = await storage.calculateAverageOrderValue(req.tenantId, fromDate, toDate);

    // Get traffic data
    const trafficBySource = await storage.getTrafficBySource(req.tenantId);
    const topPages = await storage.getTopPages(req.tenantId);
    const deviceDistribution = await storage.getDeviceDistribution(req.tenantId);

    // Get recent activity
    const recentActivity = await storage.getRecentActivity(req.tenantId);

    // Get popular products with sales data
    const popularProducts = await storage.getPopularProductsWithSales(req.tenantId, 5);

    res.json({
      kpi: {
        revenue,
        orderCount,
        averageOrderValue
      },
      traffic: {
        bySource: trafficBySource,
        topPages,
        deviceDistribution
      },
      recentActivity,
      popularProducts
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
