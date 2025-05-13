import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storageFactory";
import { z } from "zod";
import { IStorage } from "./types";
import * as bcrypt from "bcryptjs";
import { OrderStatus, LeadStatus } from "./types";

// We'll need to define these schemas for validation
const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  passwordHash: z.string(),
  role: z.enum(["admin", "editor", "viewer"]),
  isActive: z.boolean().optional(),
  tenantId: z.number().optional(),
});

const insertTenantSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
});

const insertProductSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  stockLevel: z.enum(["none", "low", "good", "high"]).optional(),
  isActive: z.boolean().optional(),
  tenantId: z.number().optional(),
});

const insertOrderSchema = z.object({
  orderNumber: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
  amount: z.number().positive(),
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "refunded", "canceled"]).optional(),
  tenantId: z.number().optional(),
});

const insertLeadSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["new", "contacted", "won", "lost"]).optional(),
  value: z.number().optional(),
  notes: z.string().optional(),
  tenantId: z.number().optional(),
});

// Define enum values for validation
const orderStatusEnum = {
  enumValues: ["pending", "paid", "processing", "shipped", "delivered", "refunded", "canceled"]
};

const leadStatusEnum = {
  enumValues: ["new", "contacted", "won", "lost"]
};

const stockLevelEnum = {
  enumValues: ["none", "low", "good", "high"]
};

// Authentication middleware
const authenticated = (req: Request, res: Response, next: Function) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Ensure tenant access middleware
const ensureTenantAccess = (storage: IStorage) => async (req: Request, res: Response, next: Function) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // If tenantId is provided in the request, ensure user has access to it
  const tenantId = parseInt(req.params.tenantId) || parseInt(req.body.tenantId);
  if (tenantId && user.tenantId !== tenantId) {
    return res.status(403).json({ message: "Forbidden: You don't have access to this tenant" });
  }

  req.user = user;
  req.tenantId = user.tenantId;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Get storage implementation
  const storage = await getStorage();
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set user session
      req.session.userId = user.id;

      // Get tenant info
      const tenant = await storage.getTenant(user.tenantId);

      // Return user info (excluding sensitive data)
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        tenant
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "An error occurred during login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", authenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get tenant info
      const tenant = await storage.getTenant(user.tenantId);

      // Return user info (excluding sensitive data)
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        tenant
      });
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // User routes
  app.get("/api/users", ensureTenantAccess(storage), async (req, res) => {
    try {
      const users = await storage.listUsers(req.tenantId);
      // Remove passwordHash from users
      const sanitizedUsers = users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error listing users:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  app.post("/api/users", ensureTenantAccess, async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertUserSchema.parse(req.body);

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validatedData.passwordHash, 10);

      // Create user with hashed password
      const newUser = await storage.createUser({
        ...validatedData,
        passwordHash,
        tenantId: req.tenantId,
      });

      // Remove passwordHash from response
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // Tenant routes
  app.get("/api/tenant", ensureTenantAccess, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  app.patch("/api/tenant", ensureTenantAccess, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      // Update only allowed fields
      const allowedFields = ["name", "email", "phone", "address", "website", "logoUrl", "primaryColor"];
      const updateData = Object.keys(req.body)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      const updatedTenant = await storage.updateTenant(req.tenantId, updateData);
      res.json(updatedTenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // API Key routes
  app.post("/api/tenant/apikeys", ensureTenantAccess, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      const { stripeSecretKey, ga4Key } = req.body;

      const updateData: { stripeSecretKey?: string, ga4Key?: string } = {};
      if (stripeSecretKey) updateData.stripeSecretKey = stripeSecretKey;
      if (ga4Key) updateData.ga4Key = ga4Key;

      const updatedTenant = await storage.updateTenant(req.tenantId, updateData);
      res.json({ message: "API keys updated successfully" });
    } catch (error) {
      console.error("Error updating API keys:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard", ensureTenantAccess, async (req, res) => {
    try {
      const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
      const toDate = req.query.to ? new Date(req.query.to as string) : undefined;

      // Get KPI data
      const revenue = await storage.calculateRevenue(req.tenantId, fromDate, toDate);
      const orderCount = await storage.countOrders(req.tenantId, fromDate, toDate);
      const averageOrderValue = await storage.calculateAverageOrderValue(req.tenantId, fromDate, toDate);
      const leadCount = await storage.countLeads(req.tenantId, fromDate, toDate);

      // Get traffic data
      const trafficBySource = await storage.getTrafficBySource(req.tenantId);
      const topPages = await storage.getTopPages(req.tenantId);
      const deviceDistribution = await storage.getDeviceDistribution(req.tenantId);

      // Get recent activity
      const recentActivity = await storage.getRecentActivity(req.tenantId);

      // Get popular products
      const popularProducts = await storage.listProducts(req.tenantId, 5);

      res.json({
        kpi: {
          revenue,
          orderCount,
          averageOrderValue,
          leadCount
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

  // Order routes
  app.get("/api/orders", ensureTenantAccess, async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
      const searchQuery = req.query.search as string;

      const orders = await storage.listOrders(req.tenantId, page, pageSize);

      // Filter orders by search query if provided
      const filteredOrders = searchQuery
        ? orders.filter(order =>
            order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.status.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : orders;

      res.json(filteredOrders);
    } catch (error) {
      console.error("Error listing orders:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // Sales API endpoint
  app.get("/api/sales", ensureTenantAccess, async (req, res) => {
    try {
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

  app.post("/api/orders", ensureTenantAccess, async (req, res) => {
    try {
      // Validate order data
      const validatedOrder = insertOrderSchema.parse({
        ...req.body,
        tenantId: req.tenantId,
      });

      // Validate order items
      const orderItemsSchema = z.array(z.object({
        productId: z.number(),
        quantity: z.number().min(1),
        price: z.number().min(0),
      }));

      const validatedItems = orderItemsSchema.parse(req.body.items);

      // Create order
      const newOrder = await storage.createOrder(validatedOrder, validatedItems);

      // Log activity
      await storage.logActivity({
        tenantId: req.tenantId,
        userId: req.session.userId,
        activityType: "order_created",
        description: `New order ${newOrder.orderNumber} created`,
        entityType: "order",
        entityId: newOrder.id,
        metadata: { orderId: newOrder.id, amount: newOrder.amount },
      });

      res.status(201).json(newOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred" });
    }
  });

  app.patch("/api/orders/:id/status", ensureTenantAccess, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      if (!orderId || !status) {
        return res.status(400).json({ message: "Order ID and status are required" });
      }

      // Validate status
      if (!orderStatusEnum.enumValues.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedOrder = await storage.updateOrderStatus(orderId, req.tenantId, status);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Log activity
      await storage.logActivity({
        tenantId: req.tenantId,
        userId: req.session.userId,
        activityType: "order_status_updated",
        description: `Order ${updatedOrder.orderNumber} status updated to ${status}`,
        entityType: "order",
        entityId: updatedOrder.id,
        metadata: { orderId: updatedOrder.id, status },
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // Lead routes
  app.get("/api/leads", ensureTenantAccess, async (req, res) => {
    try {
      const leads = await storage.listLeads(req.tenantId);
      res.json(leads);
    } catch (error) {
      console.error("Error listing leads:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  app.post("/api/leads", ensureTenantAccess, async (req, res) => {
    try {
      // Validate lead data
      const validatedLead = insertLeadSchema.parse({
        ...req.body,
        tenantId: req.tenantId,
      });

      // Create lead
      const newLead = await storage.createLead(validatedLead);

      // Log activity
      await storage.logActivity({
        tenantId: req.tenantId,
        userId: req.session.userId,
        activityType: "lead_created",
        description: `New lead ${newLead.name} created`,
        entityType: "lead",
        entityId: newLead.id,
        metadata: { leadId: newLead.id, source: newLead.source },
      });

      res.status(201).json(newLead);
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred" });
    }
  });

  app.patch("/api/leads/:id/status", ensureTenantAccess, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const { status } = req.body;

      if (!leadId || !status) {
        return res.status(400).json({ message: "Lead ID and status are required" });
      }

      // Validate status
      if (!leadStatusEnum.enumValues.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedLead = await storage.updateLeadStatus(leadId, req.tenantId, status);
      if (!updatedLead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Log activity
      await storage.logActivity({
        tenantId: req.tenantId,
        userId: req.session.userId,
        activityType: "lead_status_updated",
        description: `Lead ${updatedLead.name} status updated to ${status}`,
        entityType: "lead",
        entityId: updatedLead.id,
        metadata: { leadId: updatedLead.id, status },
      });

      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead status:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // Traffic routes
  app.get("/api/traffic/toppages", ensureTenantAccess, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const topPages = await storage.getTopPages(req.tenantId, limit);
      res.json(topPages);
    } catch (error) {
      console.error("Error fetching top pages:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  app.get("/api/traffic/sources", ensureTenantAccess, async (req, res) => {
    try {
      const trafficBySource = await storage.getTrafficBySource(req.tenantId);
      res.json(trafficBySource);
    } catch (error) {
      console.error("Error fetching traffic sources:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  app.get("/api/traffic/devices", ensureTenantAccess, async (req, res) => {
    try {
      const deviceDistribution = await storage.getDeviceDistribution(req.tenantId);
      res.json(deviceDistribution);
    } catch (error) {
      console.error("Error fetching device distribution:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // Vercel Analytics API route
  app.get("/api/vercel-analytics", ensureTenantAccess, async (req, res) => {
    try {
      const { from, to, projectId, teamId } = req.query;

      // Import the Vercel analytics service
      const { fetchVercelAnalytics } = await import('./services/vercel-analytics');

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

  // Product routes
  app.get("/api/products", ensureTenantAccess, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const products = await storage.listProducts(req.tenantId, limit);
      res.json(products);
    } catch (error) {
      console.error("Error listing products:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  app.post("/api/products", ensureTenantAccess, async (req, res) => {
    try {
      // Validate product data
      const validatedProduct = insertProductSchema.parse({
        ...req.body,
        tenantId: req.tenantId,
      });

      // Create product
      const newProduct = await storage.createProduct(validatedProduct);

      // Log activity
      await storage.logActivity({
        tenantId: req.tenantId,
        userId: req.session.userId,
        activityType: "product_created",
        description: `New product ${newProduct.name} created`,
        entityType: "product",
        entityId: newProduct.id,
        metadata: { productId: newProduct.id, price: newProduct.price },
      });

      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // Stock level routes
  app.get("/api/products/stock-levels", ensureTenantAccess, async (req, res) => {
    try {
      // Return all available stock level options
      res.json(stockLevelEnum.enumValues);
    } catch (error) {
      console.error("Error fetching stock levels:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  app.get("/api/products/by-stock-level/:stockLevel", ensureTenantAccess, async (req, res) => {
    try {
      const { stockLevel } = req.params;

      // Validate stock level is valid
      if (!stockLevelEnum.enumValues.includes(stockLevel as StockLevel)) {
        return res.status(400).json({ message: "Invalid stock level" });
      }

      const products = await storage.getProductsByStockLevel(req.tenantId, stockLevel);
      res.json(products);
    } catch (error) {
      console.error("Error listing products by stock level:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  app.patch("/api/products/:id/stock-level", ensureTenantAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { stockLevel } = req.body;

      // Validate stock level is valid
      if (!stockLevelEnum.enumValues.includes(stockLevel as StockLevel)) {
        return res.status(400).json({ message: "Invalid stock level" });
      }

      const product = await storage.updateProductStockLevel(id, req.tenantId, stockLevel);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Log this activity
      await storage.logActivity({
        tenantId: req.tenantId,
        userId: req.user.id,
        activityType: "product_update",
        description: `Updated stock level of product "${product.name}" to ${stockLevel}`,
        entityType: "product",
        entityId: id,
        metadata: { previous: product.stockLevel, new: stockLevel }
      });

      res.json(product);
    } catch (error) {
      console.error("Error updating product stock level:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // Initialize HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
