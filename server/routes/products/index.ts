import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';
import { StockLevel } from '../../types';

const router = Router();

// Validation schema
const insertProductSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  costPrice: z.number().nonnegative().optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  supplierUrl: z.string().url().optional(),
  stockLevel: z.enum(["none", "low", "good", "high"]).optional(),
  isActive: z.boolean().optional(),
  tenantId: z.number().optional(),
});

// Stock level enum
const stockLevelEnum = {
  enumValues: ["none", "low", "good", "high"]
};

// Get all products
router.get("/", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    console.log(`[API] Fetching products for tenant: ${req.tenantId}`);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    // Get products from storage
    const products = await storage.listProducts(req.tenantId, limit);

    console.log(`[API] Retrieved ${products.length} products from storage`);

    // Ensure we're returning an array
    if (!Array.isArray(products)) {
      console.error("[API] Products is not an array:", typeof products);
      return res.json([]);
    }

    res.json(products);
  } catch (error) {
    console.error("Error listing products:", error);
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
});

// Get all stock levels (specific path - must come before /:id)
router.get("/stock-levels", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    // Return all available stock level options
    res.json(stockLevelEnum.enumValues);
  } catch (error) {
    console.error("Error fetching stock levels:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Get products by stock level (specific path - must come before /:id)
router.get("/by-stock-level/:stockLevel", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
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

// Get product by ID
router.get("/:id", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const productId = req.params.id;
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    // Log for debugging
    console.log(`Getting product with ID: ${productId} for tenant: ${req.tenantId}`);
    // Get product from storage
    const product = await storage.getProduct(productId, req.tenantId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error getting product:", error instanceof Error ? error.message : error);
    res.status(500).json({
      message: "An error occurred while fetching the product",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Create a new product
router.post("/", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();

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
      userId: req.user?._id || req.user?.id, // Use the authenticated user's ObjectId
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

// Update product stock level (specific route - must come before general /:id route)
router.patch("/:id/stock-level", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const id = req.params.id;
    const { stockLevel } = req.body;

    console.log(`[API] Updating stock level for product ${id} to ${stockLevel}`);

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
      userId: req.user?._id || req.user?.id, // Use the authenticated user's ObjectId
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

// Update product by ID (general update)
router.patch("/:id", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const productId = req.params.id;
    
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    console.log(`[API] Updating product ${productId} for tenant: ${req.tenantId}`);
    console.log(`[API] Update data:`, req.body);

    // Get existing product first
    const existingProduct = await storage.getProduct(productId, req.tenantId);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate the update data (allow partial updates)
    const updateSchema = insertProductSchema.partial().omit({ tenantId: true });
    const validatedUpdate = updateSchema.parse(req.body);

    // Update the product
    const updatedProduct = await storage.updateProduct(productId, req.tenantId, validatedUpdate);

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Log activity
    await storage.logActivity({
      tenantId: req.tenantId,
      userId: req.user?._id || req.user?.id,
      activityType: "product_update",
      description: `Updated product "${updatedProduct.name}"`,
      entityType: "product",
      entityId: productId,
      metadata: { 
        updated: Object.keys(validatedUpdate),
        productId: productId
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ 
      message: "An error occurred while updating the product",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
