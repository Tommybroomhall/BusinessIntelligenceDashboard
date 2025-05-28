import { Router, Request, Response } from 'express';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';

const router = Router();

// Get sales data
router.get("/", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
    const searchQuery = req.query.search as string;

    // Get orders for sales data
    const orders = await storage.listOrders(req.tenantId, page, pageSize);

    // Filter orders by search query if provided
    const filteredOrders = searchQuery
      ? orders.filter(order =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.status.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : orders;

    // Get revenue data
    const revenue = await storage.calculateRevenue(req.tenantId);
    const target = 30000; // This could be fetched from settings

    res.json({
      orders: filteredOrders,
      revenue: {
        current: revenue,
        target,
        percentage: (revenue / target) * 100
      },
      pagination: {
        page,
        pageSize,
        total: await storage.countOrders(req.tenantId)
      }
    });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
