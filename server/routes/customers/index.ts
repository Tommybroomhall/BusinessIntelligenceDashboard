import { Router, Request, Response } from 'express';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';

const router = Router();

// Get all customers
router.get("/", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
    const searchQuery = req.query.search as string;
    const statusFilter = req.query.status as string;

    console.log(`Getting customers for tenant: ${req.tenantId}, page: ${page}, pageSize: ${pageSize}`);

    // Get customers from storage
    const customers = await storage.listCustomers(req.tenantId, page, pageSize);
    const total = await storage.countCustomers(req.tenantId);

    console.log(`Found ${customers.length} customers out of ${total} total`);

    // Return formatted response with pagination
    res.json({
      customers,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error("Error listing customers:", error instanceof Error ? error.message : error);
    res.status(500).json({
      message: "An error occurred while fetching customers",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get customer by ID
router.get("/:id", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const customerId = req.params.id;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    console.log(`Getting customer with ID: ${customerId} for tenant: ${req.tenantId}`);

    // Get customer from storage
    const customer = await storage.getCustomer(customerId, req.tenantId);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Return the customer
    res.json(customer);
  } catch (error) {
    console.error("Error getting customer:", error instanceof Error ? error.message : error);
    res.status(500).json({
      message: "An error occurred while fetching the customer",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get orders for a specific customer
router.get("/:id/orders", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const customerId = req.params.id;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    console.log(`Getting orders for customer with ID: ${customerId} for tenant: ${req.tenantId}`);

    // Get orders for this customer
    const orders = await storage.getOrdersByCustomer(customerId, req.tenantId);

    // Return orders with pagination info
    res.json({
      orders,
      pagination: {
        total: orders.length,
        page: 1,
        pageSize: orders.length
      }
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error instanceof Error ? error.message : error);
    res.status(500).json({
      message: "An error occurred while fetching customer orders",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
