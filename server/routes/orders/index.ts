import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';
import { Order, OrderItem } from '../../models';
import mongoose from 'mongoose';
import { OrderStatus } from '../../types';

const router = Router();

// Validation schema
const insertOrderSchema = z.object({
  orderNumber: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
  amount: z.number().positive(),
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "refunded", "canceled"]).optional(),
  tenantId: z.number().optional(),
});

// Order status enum for validation
const orderStatusEnum = {
  enumValues: ["pending", "paid", "processing", "shipped", "delivered", "refunded", "canceled"]
};

// GET all orders
router.get('/', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
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

// GET order by ID
router.get('/:id', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    console.log(`Getting order with ID: ${orderId} for tenant: ${req.tenantId}`);

    // Get order from storage
    const order = await storage.getOrder(orderId, req.tenantId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error getting order:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// GET order items for a specific order
router.get('/:id/items', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    console.log(`Getting order items for order ID: ${orderId} for tenant: ${req.tenantId}`);

    // Get order items from storage
    const OrderItemModel = mongoose.model('OrderItem');
    const orderItems = await OrderItemModel.find({ orderId }).exec();

    // If we need product details, we can populate them
    const populatedItems = [];
    for (const item of orderItems) {
      const ProductModel = mongoose.model('Product');
      const product = await ProductModel.findById(item.productId).exec();
      populatedItems.push({
        ...item.toObject(),
        productName: product ? product.name : 'Unknown Product',
        productImageUrl: product ? product.imageUrl : null
      });
    }

    res.json(populatedItems);
  } catch (error) {
    console.error("Error getting order items:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// CREATE a new order
router.post('/', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();

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
      userId: req.user?._id || req.user?.id, // Use the authenticated user's ObjectId
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

// UPDATE order status
router.patch('/:id/status', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const orderId = req.params.id; // Use the ID as a string, don't parse as integer
    const { status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ message: "Order ID and status are required" });
    }

    // Validate status
    if (!orderStatusEnum.enumValues.includes(status as OrderStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    console.log(`Updating order status: ID=${orderId}, tenantId=${req.tenantId}, status=${status}`);

    const updatedOrder = await storage.updateOrderStatus(orderId, req.tenantId, status);
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Log activity
    await storage.logActivity({
      tenantId: req.tenantId,
      userId: req.user?._id || req.user?.id, // Use the authenticated user's ObjectId
      activityType: "order_status_updated",
      description: `Order ${updatedOrder.orderNumber} status updated to ${status}`,
      entityType: "order",
      entityId: updatedOrder._id || updatedOrder.id, // Support both MongoDB _id and numeric id
      metadata: { orderId: updatedOrder._id || updatedOrder.id, status },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
