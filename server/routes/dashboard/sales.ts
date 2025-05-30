import { Router, Request, Response } from 'express';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';

const router = Router();

// Get sales data with time frame filtering
router.get("/", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    
    // Parse query parameters
    const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
    const toDate = req.query.to ? new Date(req.query.to as string) : undefined;
    
    // Default to last 7 days if no dates provided
    let startDate = fromDate;
    let endDate = toDate;
    
    if (!startDate || !endDate) {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
    }

    // Validate dates
    if (startDate > endDate) {
      return res.status(400).json({ 
        message: "Start date must be before end date" 
      });
    }

    // Get sales metrics for the specified period
    const revenue = await storage.calculateRevenue(req.tenantId, startDate, endDate);
    const orderCount = await storage.countOrders(req.tenantId, startDate, endDate);
    const averageOrderValue = await storage.calculateAverageOrderValue(req.tenantId, startDate, endDate);

    // Calculate daily breakdown for the period
    const dailyBreakdown = await storage.getDailySalesBreakdown(req.tenantId, startDate, endDate);

    res.json({
      revenue,
      orderCount,
      averageOrderValue,
      dailyBreakdown,
      period: {
        from: startDate,
        to: endDate,
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ message: "An error occurred while fetching sales data" });
  }
});

// Get sales comparison data
router.get("/compare", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    
    // Parse query parameters for current and previous periods
    const currentFromDate = req.query.currentFrom ? new Date(req.query.currentFrom as string) : undefined;
    const currentToDate = req.query.currentTo ? new Date(req.query.currentTo as string) : undefined;
    const previousFromDate = req.query.previousFrom ? new Date(req.query.previousFrom as string) : undefined;
    const previousToDate = req.query.previousTo ? new Date(req.query.previousTo as string) : undefined;

    if (!currentFromDate || !currentToDate || !previousFromDate || !previousToDate) {
      return res.status(400).json({ 
        message: "All date parameters are required: currentFrom, currentTo, previousFrom, previousTo" 
      });
    }

    // Get metrics for both periods
    const [
      currentRevenue,
      currentOrderCount,
      currentAvgOrderValue,
      previousRevenue,
      previousOrderCount,
      previousAvgOrderValue
    ] = await Promise.all([
      storage.calculateRevenue(req.tenantId, currentFromDate, currentToDate),
      storage.countOrders(req.tenantId, currentFromDate, currentToDate),
      storage.calculateAverageOrderValue(req.tenantId, currentFromDate, currentToDate),
      storage.calculateRevenue(req.tenantId, previousFromDate, previousToDate),
      storage.countOrders(req.tenantId, previousFromDate, previousToDate),
      storage.calculateAverageOrderValue(req.tenantId, previousFromDate, previousToDate)
    ]);

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    res.json({
      current: {
        revenue: currentRevenue,
        orderCount: currentOrderCount,
        averageOrderValue: currentAvgOrderValue,
        period: { from: currentFromDate, to: currentToDate }
      },
      previous: {
        revenue: previousRevenue,
        orderCount: previousOrderCount,
        averageOrderValue: previousAvgOrderValue,
        period: { from: previousFromDate, to: previousToDate }
      },
      changes: {
        revenue: calculatePercentageChange(currentRevenue, previousRevenue),
        orderCount: calculatePercentageChange(currentOrderCount, previousOrderCount),
        averageOrderValue: calculatePercentageChange(currentAvgOrderValue, previousAvgOrderValue)
      }
    });
  } catch (error) {
    console.error("Error fetching sales comparison data:", error);
    res.status(500).json({ message: "An error occurred while fetching sales comparison data" });
  }
});

export default router; 