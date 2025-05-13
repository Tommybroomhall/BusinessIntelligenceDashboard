import * as bcrypt from "bcryptjs";
import {
  Tenant,
  User,
  Product,
  Order,
  OrderItem,
  TrafficData,
  ActivityLog,
  ITenant,
  IUser,
  IProduct,
  IOrder,
  IOrderItem,
  ITrafficData,
  IActivityLog
} from "./models";
import { IStorage } from "./types";
import { log } from "./vite";
import mongoose from "mongoose";

/**
 * MongoDB implementation of the storage interface
 */
export class MongoStorage implements IStorage {
  private initialized: boolean = false;

  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the database with sample data if it's empty
   */
  async initializeData() {
    if (this.initialized) return;

    try {
      // Check if we have any tenants
      const tenantCount = await Tenant.countDocuments();

      if (tenantCount === 0) {
        log("Initializing database with sample data", "mongodb");

        // Create a tenant
        const tenant = new Tenant({
          name: "BusinessDash Inc.",
          email: "info@businessdash.com",
          phone: "+1 (555) 123-4567",
          address: "123 Main St, Suite 200, San Francisco, CA 94105",
          website: "https://www.businessdash.com",
          logoUrl: "",
          primaryColor: "#0ea5e9",
        });

        const createdTenant = await tenant.save();

        // Create a user
        const hash = await bcrypt.hash("password123", 10);
        const user = new User({
          tenantId: createdTenant._id,
          email: "admin@businessdash.com",
          name: "Jane Smith",
          passwordHash: hash,
          role: "admin",
          isActive: true,
        });

        await user.save();
        log("Sample data initialized successfully", "mongodb");
      }

      this.initialized = true;
    } catch (error) {
      log(`Error initializing data: ${error}`, "mongodb");
    }
  }

  // User methods
  async getUser(id: number): Promise<any> {
    try {
      const UserModel = this.getModel<IUser>('User');
      return await UserModel.findById(id);
    } catch (error) {
      log(`Error getting user: ${error}`, "mongodb");
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<any> {
    try {
      const UserModel = this.getModel<IUser>('User');
      return await UserModel.findOne({ email });
    } catch (error) {
      log(`Error getting user by email: ${error}`, "mongodb");
      return undefined;
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      const UserModel = this.getModel<IUser>('User');
      const user = new UserModel(userData);
      return await user.save();
    } catch (error) {
      log(`Error creating user: ${error}`, "mongodb");
      throw error;
    }
  }

  async updateUser(id: number, userData: any): Promise<any> {
    try {
      const UserModel = this.getModel<IUser>('User');
      return await UserModel.findByIdAndUpdate(
        id,
        { ...userData, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      log(`Error updating user: ${error}`, "mongodb");
      return undefined;
    }
  }

  async listUsers(tenantId: number, limit?: number): Promise<any[]> {
    try {
      const UserModel = this.getModel<IUser>('User');
      let query = UserModel.find({ tenantId });
      if (limit) {
        query = query.limit(limit);
      }
      return await query.exec();
    } catch (error) {
      log(`Error listing users: ${error}`, "mongodb");
      return [];
    }
  }

  // Tenant methods
  async getTenant(id: number): Promise<any> {
    try {
      const TenantModel = this.getModel<ITenant>('Tenant');
      return await TenantModel.findById(id);
    } catch (error) {
      log(`Error getting tenant: ${error}`, "mongodb");
      return undefined;
    }
  }

  async createTenant(tenantData: any): Promise<any> {
    try {
      const TenantModel = this.getModel<ITenant>('Tenant');
      const tenant = new TenantModel(tenantData);
      return await tenant.save();
    } catch (error) {
      log(`Error creating tenant: ${error}`, "mongodb");
      throw error;
    }
  }

  async updateTenant(id: number, tenantData: any): Promise<any> {
    try {
      const TenantModel = this.getModel<ITenant>('Tenant');
      return await TenantModel.findByIdAndUpdate(
        id,
        { ...tenantData, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      log(`Error updating tenant: ${error}`, "mongodb");
      return undefined;
    }
  }

  // Product methods
  async getProduct(id: number): Promise<any> {
    try {
      const ProductModel = this.getModel<IProduct>('Product');
      return await ProductModel.findById(id);
    } catch (error) {
      log(`Error getting product: ${error}`, "mongodb");
      return undefined;
    }
  }

  async createProduct(productData: any): Promise<any> {
    try {
      const ProductModel = this.getModel<IProduct>('Product');
      const product = new ProductModel(productData);
      return await product.save();
    } catch (error) {
      log(`Error creating product: ${error}`, "mongodb");
      throw error;
    }
  }

  async updateProduct(id: number, productData: any): Promise<any> {
    try {
      const ProductModel = this.getModel<IProduct>('Product');
      return await ProductModel.findByIdAndUpdate(
        id,
        { ...productData, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      log(`Error updating product: ${error}`, "mongodb");
      return undefined;
    }
  }

  async listProducts(tenantId: number, limit?: number): Promise<any[]> {
    try {
      const ProductModel = this.getModel<IProduct>('Product');
      let query = ProductModel.find({ tenantId });
      if (limit) {
        query = query.limit(limit);
      }
      return await query.exec();
    } catch (error) {
      log(`Error listing products: ${error}`, "mongodb");
      return [];
    }
  }

  // Order methods
  async getOrder(id: number, tenantId: number): Promise<any> {
    try {
      const OrderModel = this.getModel<IOrder>('Order');
      return await OrderModel.findOne({ _id: id, tenantId });
    } catch (error) {
      log(`Error getting order: ${error}`, "mongodb");
      return undefined;
    }
  }

  async listOrders(tenantId: number, page: number = 1, pageSize: number = 10): Promise<any[]> {
    try {
      const OrderModel = this.getModel<IOrder>('Order');
      const skip = (page - 1) * pageSize;
      return await OrderModel.find({ tenantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec();
    } catch (error) {
      log(`Error listing orders: ${error}`, "mongodb");
      return [];
    }
  }

  async countOrders(tenantId: number, fromDate?: Date, toDate?: Date): Promise<number> {
    try {
      const OrderModel = this.getModel<IOrder>('Order');
      const query: any = { tenantId };

      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = fromDate;
        if (toDate) query.createdAt.$lte = toDate;
      }

      return await OrderModel.countDocuments(query);
    } catch (error) {
      log(`Error counting orders: ${error}`, "mongodb");
      return 0;
    }
  }

  async createOrder(orderData: any, items: any[]): Promise<any> {
    try {
      const OrderModel = this.getModel<IOrder>('Order');
      const OrderItemModel = this.getModel<IOrderItem>('OrderItem');

      // Create the order
      const order = new OrderModel(orderData);
      const savedOrder = await order.save();

      // Create order items
      const orderItems = items.map(item => ({
        ...item,
        orderId: savedOrder._id
      }));

      await OrderItemModel.insertMany(orderItems);

      return savedOrder;
    } catch (error) {
      log(`Error creating order: ${error}`, "mongodb");
      throw error;
    }
  }

  async updateOrderStatus(id: number, tenantId: number, status: string): Promise<any> {
    try {
      const OrderModel = this.getModel<IOrder>('Order');
      return await OrderModel.findOneAndUpdate(
        { _id: id, tenantId },
        { status, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      log(`Error updating order status: ${error}`, "mongodb");
      return undefined;
    }
  }

  async calculateRevenue(tenantId: number, fromDate?: Date, toDate?: Date): Promise<number> {
    try {
      const OrderModel = this.getModel<IOrder>('Order');
      const query: any = {
        tenantId,
        status: { $nin: ['canceled', 'refunded'] }
      };

      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = fromDate;
        if (toDate) query.createdAt.$lte = toDate;
      }

      const result = await OrderModel.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      log(`Error calculating revenue: ${error}`, "mongodb");
      return 0;
    }
  }

  async calculateAverageOrderValue(tenantId: number, fromDate?: Date, toDate?: Date): Promise<number> {
    try {
      const OrderModel = this.getModel<IOrder>('Order');
      const query: any = {
        tenantId,
        status: { $nin: ['canceled', 'refunded'] }
      };

      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = fromDate;
        if (toDate) query.createdAt.$lte = toDate;
      }

      const result = await OrderModel.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
      ]);

      return result.length > 0 ? result[0].total / result[0].count : 0;
    } catch (error) {
      log(`Error calculating average order value: ${error}`, "mongodb");
      return 0;
    }
  }

  // Traffic data methods
  async listTrafficData(tenantId: number, fromDate?: Date, toDate?: Date): Promise<any[]> {
    try {
      const TrafficDataModel = this.getModel<ITrafficData>('TrafficData');
      const query: any = { tenantId };

      if (fromDate || toDate) {
        query.date = {};
        if (fromDate) query.date.$gte = fromDate;
        if (toDate) query.date.$lte = toDate;
      }

      return await TrafficDataModel.find(query).sort({ date: -1 }).exec();
    } catch (error) {
      log(`Error listing traffic data: ${error}`, "mongodb");
      return [];
    }
  }

  async getTopPages(tenantId: number, limit: number = 5): Promise<any[]> {
    try {
      const TrafficDataModel = this.getModel<ITrafficData>('TrafficData');
      const result = await TrafficDataModel.aggregate([
        { $match: { tenantId: mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) } },
        { $group: { _id: "$page", views: { $sum: "$views" } } },
        { $sort: { views: -1 } },
        { $limit: limit },
        { $project: { page: "$_id", views: 1, _id: 0 } }
      ]);

      return result;
    } catch (error) {
      log(`Error getting top pages: ${error}`, "mongodb");
      return [];
    }
  }

  async getTrafficBySource(tenantId: number): Promise<any[]> {
    try {
      const TrafficDataModel = this.getModel<ITrafficData>('TrafficData');
      const result = await TrafficDataModel.aggregate([
        { $match: { tenantId: mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) } },
        { $group: { _id: "$source", count: { $sum: "$uniqueVisitors" } } },
        { $sort: { count: -1 } },
        { $project: { source: "$_id", count: 1, _id: 0 } }
      ]);

      return result;
    } catch (error) {
      log(`Error getting traffic by source: ${error}`, "mongodb");
      return [];
    }
  }

  async getDeviceDistribution(tenantId: number): Promise<any[]> {
    try {
      const TrafficDataModel = this.getModel<ITrafficData>('TrafficData');
      const result = await TrafficDataModel.aggregate([
        { $match: { tenantId: mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) } },
        { $group: { _id: "$deviceType", count: { $sum: "$uniqueVisitors" } } },
        { $sort: { count: -1 } }
      ]);

      // Calculate percentages
      const total = result.reduce((sum, item) => sum + item.count, 0);
      return result.map(item => ({
        deviceType: item._id,
        percentage: total > 0 ? (item.count / total) * 100 : 0
      }));
    } catch (error) {
      log(`Error getting device distribution: ${error}`, "mongodb");
      return [];
    }
  }

  // Activity logs
  async logActivity(activityData: any): Promise<any> {
    try {
      const ActivityLogModel = this.getModel<IActivityLog>('ActivityLog');
      const activity = new ActivityLogModel(activityData);
      return await activity.save();
    } catch (error) {
      log(`Error logging activity: ${error}`, "mongodb");
      throw error;
    }
  }

  async getRecentActivity(tenantId: number, limit: number = 10): Promise<any[]> {
    try {
      const ActivityLogModel = this.getModel<IActivityLog>('ActivityLog');
      return await ActivityLogModel.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      log(`Error getting recent activity: ${error}`, "mongodb");
      return [];
    }
  }
}
