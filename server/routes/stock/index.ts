import { Router, Request, Response } from 'express';
import { ensureTenantAccess } from '../../middleware/tenantAccess';

const router = Router();

// Mock stock alerts data for now - in a real app this would come from a database
const generateMockStockAlerts = (tenantId: number) => [
  {
    id: `alert-${tenantId}-1`,
    productName: 'Wireless Bluetooth Headphones',
    currentStock: 3,
    threshold: 10,
    category: 'Electronics',
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
  },
  {
    id: `alert-${tenantId}-2`,
    productName: 'Organic Cotton T-Shirt',
    currentStock: 5,
    threshold: 15,
    category: 'Clothing',
    lastUpdated: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
  },
  {
    id: `alert-${tenantId}-3`,
    productName: 'Stainless Steel Water Bottle',
    currentStock: 2,
    threshold: 8,
    category: 'Home & Garden',
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: `alert-${tenantId}-4`,
    productName: 'LED Desk Lamp',
    currentStock: 7,
    threshold: 12,
    category: 'Electronics',
    lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
  },
  {
    id: `alert-${tenantId}-5`,
    productName: 'Yoga Mat Premium',
    currentStock: 4,
    threshold: 10,
    category: 'Sports & Fitness',
    lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
  },
  {
    id: `alert-${tenantId}-6`,
    productName: 'Coffee Beans - Dark Roast',
    currentStock: 1,
    threshold: 20,
    category: 'Food & Beverage',
    lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
  }
];

// GET all stock alerts
router.get('/alerts', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    console.log('Fetching stock alerts for tenant:', req.tenantId);
    
    // Generate mock stock alerts for this tenant
    const stockAlerts = generateMockStockAlerts(req.tenantId);
    
    console.log(`Generated ${stockAlerts.length} mock stock alerts`);
    res.json(stockAlerts);
  } catch (error) {
    console.error("Error fetching stock alerts:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// GET critical stock alerts (stock <= 5)
router.get('/alerts/critical', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const stockAlerts = generateMockStockAlerts(req.tenantId);
    const criticalAlerts = stockAlerts.filter(alert => alert.currentStock <= 5);
    
    console.log(`Found ${criticalAlerts.length} critical stock alerts`);
    res.json(criticalAlerts);
  } catch (error) {
    console.error("Error fetching critical stock alerts:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// GET stock alerts count
router.get('/alerts/count', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const stockAlerts = generateMockStockAlerts(req.tenantId);
    const criticalCount = stockAlerts.filter(alert => alert.currentStock <= 5).length;
    
    res.json({ 
      total: stockAlerts.length,
      critical: criticalCount 
    });
  } catch (error) {
    console.error("Error fetching stock alerts count:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
