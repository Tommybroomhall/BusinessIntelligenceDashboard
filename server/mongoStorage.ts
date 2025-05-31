import * as bcrypt from "bcryptjs";
import {
  Tenant,
  User,
  Product,
  Order,
  OrderItem,
  TrafficData,
  ActivityLog,
  Notification,
  ITenant,
  IUser,
  IProduct,
  IOrder,
  IOrderItem,
  ITrafficData,
  IActivityLog,
  INotification
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
   * Initialize the database connection
   */
  async initializeData() {
    if (this.initialized) return;

    try {
      // Check if we have any tenants
      const tenantCount = await Tenant.countDocuments();

      if (tenantCount === 0) {
        log("No tenants found in the database. Use the load-dummy-data.ts script to populate the database with test data.", "mongodb");
        log("Example: npm run ts-node -- scripts/load-dummy-data.ts", "mongodb");
      } else {
        log(`Found ${tenantCount} tenants in the database.`, "mongodb");
      }

      this.initialized = true;
    } catch (error) {
      log(`Error initializing database connection: ${error}`, "mongodb");
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
  async getTenant(id: string | number): Promise<any> {
    try {
      const TenantModel = this.getModel<ITenant>('Tenant');
      
      // Handle both ObjectId strings and numeric IDs for backward compatibility
      let query: any;
      if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
        // Use _id for ObjectId strings
        query = { _id: id };
      } else if (typeof id === 'number') {
        // Use numeric id field for legacy numeric IDs
        query = { id: id };
      } else {
        // Try as string ID first, then ObjectId
        query = { _id: id };
      }
      
      return await TenantModel.findOne(query);
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

  async updateTenant(id: string | number, tenantData: any): Promise<any> {
    try {
      const TenantModel = this.getModel<ITenant>('Tenant');
      
      // Handle both ObjectId strings and numeric IDs for backward compatibility
      let query: any;
      if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
        // Use _id for ObjectId strings
        query = { _id: id };
      } else if (typeof id === 'number') {
        // Use numeric id field for legacy numeric IDs
        query = { id: id };
      } else {
        // Try as string ID first, then ObjectId
        query = { _id: id };
      }
      
      console.log(`[mongodb] Updating tenant with query:`, query);
      console.log(`[mongodb] Update data:`, tenantData);
      
      const result = await TenantModel.findOneAndUpdate(
        query,
        { ...tenantData, updatedAt: new Date() },
        { new: true }
      );
      
      console.log(`[mongodb] Update result:`, result);
      return result;
    } catch (error) {
      log(`Error updating tenant: ${error}`, "mongodb");
      console.error('Full updateTenant error:', error);
      return undefined;
    }
  }

  async listTenants(): Promise<any[]> {
    try {
      const TenantModel = this.getModel<ITenant>('Tenant');
      return await TenantModel.find().exec();
    } catch (error) {
      log(`Error listing tenants: ${error}`, "mongodb");
      return [];
    }
  }

  // Product methods
  async getProduct(id: string | number, tenantId: string | number): Promise<any> {
    try {
      console.log(`[mongodb] Getting product with id: ${id} for tenant: ${tenantId}`);
      const ProductModel = this.getModel<IProduct>('Product');

      let query: any = { _id: id };

      // Convert tenantId to ObjectId if needed
      let tenantIdObj;
      try {
        if (typeof tenantId === 'string' && mongoose.Types.ObjectId.isValid(tenantId)) {
          tenantIdObj = new mongoose.Types.ObjectId(tenantId);
        } else if (typeof tenantId === 'number') {
          // For numeric IDs, we need to find the corresponding tenant first
          const tenant = await this.getModel<ITenant>('Tenant').findOne({ id: tenantId });
          if (tenant) {
            tenantIdObj = tenant._id;
          } else {
            tenantIdObj = tenantId;
          }
        } else {
          tenantIdObj = tenantId;
        }
      } catch (err) {
        console.error(`[mongodb] Failed to convert tenantId: ${tenantId} - ${err}`);
        tenantIdObj = tenantId;
      }

      query.tenantId = tenantIdObj;
      console.log(`[mongodb] Using query with tenantId filter:`, query);

      const product = await ProductModel.findOne(query);

      if (!product) {
        console.log(`[mongodb] No product found with id ${id} and tenantId ${tenantId}`);
        return null;
      }

      // Transform the product to match frontend expectations
      const productObj = product.toObject();
      const transformedProduct = {
        id: productObj._id.toString(),
        _id: productObj._id.toString(),
        tenantId: productObj.tenantId.toString(),
        name: productObj.name,
        description: productObj.description || '',
        price: productObj.price,
        costPrice: productObj.costPrice || 0,
        category: productObj.category || '',
        imageUrl: productObj.imageUrl || '',
        supplierUrl: productObj.supplierUrl || '',
        stockLevel: productObj.stockLevel,
        isActive: productObj.isActive,
        createdAt: productObj.createdAt.toISOString(),
        updatedAt: productObj.updatedAt.toISOString()
      };

      return transformedProduct;
    } catch (error) {
      log(`Error getting product: ${error}`, "mongodb");
      console.error('Full error:', error);
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

  async updateProduct(id: string | number, tenantId: string | number, productData: Partial<Product>): Promise<any> {
    try {
      console.log(`[mongodb] Updating product ${id} for tenant ${tenantId}`);
      const ProductModel = this.getModel<IProduct>('Product');

      // Convert tenantId to ObjectId if needed
      let tenantIdObj;
      try {
        if (typeof tenantId === 'string' && mongoose.Types.ObjectId.isValid(tenantId)) {
          tenantIdObj = new mongoose.Types.ObjectId(tenantId);
        } else if (typeof tenantId === 'number') {
          // For numeric IDs, we need to find the corresponding tenant first
          const tenant = await this.getModel<ITenant>('Tenant').findOne({ id: tenantId });
          if (tenant) {
            tenantIdObj = tenant._id;
          } else {
            tenantIdObj = tenantId;
          }
        } else {
          tenantIdObj = tenantId;
        }
      } catch (err) {
        console.error(`[mongodb] Failed to convert tenantId: ${tenantId} - ${err}`);
        tenantIdObj = tenantId;
      }

      // Find and update the product
      const product = await ProductModel.findOneAndUpdate(
        { _id: id, tenantId: tenantIdObj },
        { ...productData, updatedAt: new Date() },
        { new: true }
      );

      if (!product) {
        console.log(`[mongodb] No product found with id ${id} and tenantId ${tenantId}`);
        return null;
      }

      // Transform the product to match frontend expectations
      const productObj = product.toObject();
      const transformedProduct = {
        id: productObj._id.toString(),
        _id: productObj._id.toString(),
        tenantId: productObj.tenantId.toString(),
        name: productObj.name,
        description: productObj.description || '',
        price: productObj.price,
        costPrice: productObj.costPrice || 0,
        category: productObj.category || '',
        imageUrl: productObj.imageUrl || '',
        supplierUrl: productObj.supplierUrl || '',
        stockLevel: productObj.stockLevel,
        isActive: productObj.isActive,
        createdAt: productObj.createdAt.toISOString(),
        updatedAt: productObj.updatedAt.toISOString()
      };

      return transformedProduct;
    } catch (error) {
      log(`Error updating product: ${error}`, "mongodb");
      console.error('Full error:', error);
      return undefined;
    }
  }

  async getProductsByStockLevel(tenantId: number, stockLevel: string): Promise<any[]> {
    try {
      console.log(`[mongodb] Getting products with stock level ${stockLevel} for tenant ${tenantId}`);
      const ProductModel = this.getModel<IProduct>('Product');

      // Convert tenantId to ObjectId if needed
      let tenantIdObj;
      try {
        if (typeof tenantId === 'string' && mongoose.Types.ObjectId.isValid(tenantId)) {
          tenantIdObj = new mongoose.Types.ObjectId(tenantId);
        } else if (typeof tenantId === 'number') {
          // For numeric IDs, we need to find the corresponding tenant first
          const tenant = await this.getModel<ITenant>('Tenant').findOne({ id: tenantId });
          if (tenant) {
            tenantIdObj = tenant._id;
          } else {
            tenantIdObj = tenantId;
          }
        } else {
          tenantIdObj = tenantId;
        }
      } catch (err) {
        console.error(`[mongodb] Failed to convert tenantId: ${tenantId} - ${err}`);
        tenantIdObj = tenantId;
      }

      // Find products with the specified stock level
      const products = await ProductModel.find({
        tenantId: tenantIdObj,
        stockLevel: stockLevel
      }).exec();

      // Transform the products to match frontend expectations
      const transformedProducts = products.map(product => {
        const productObj = product.toObject();
        return {
          id: productObj._id.toString(),
          _id: productObj._id.toString(),
          tenantId: productObj.tenantId.toString(),
          name: productObj.name,
          description: productObj.description || '',
          price: productObj.price,
          costPrice: productObj.costPrice || 0,
          category: productObj.category || '',
          imageUrl: productObj.imageUrl || '',
          supplierUrl: productObj.supplierUrl || '',
          stockLevel: productObj.stockLevel,
          isActive: productObj.isActive,
          createdAt: productObj.createdAt.toISOString(),
          updatedAt: productObj.updatedAt.toISOString()
        };
      });

      return transformedProducts;
    } catch (error) {
      log(`Error getting products by stock level: ${error}`, "mongodb");
      console.error('Full error:', error);
      return [];
    }
  }

  async updateProductStockLevel(id: string | number, tenantId: number, stockLevel: string): Promise<any> {
    try {
      console.log(`[mongodb] Updating stock level for product ${id} to ${stockLevel}`);
      const ProductModel = this.getModel<IProduct>('Product');

      // Convert tenantId to ObjectId if needed
      let tenantIdObj;
      try {
        if (typeof tenantId === 'string' && mongoose.Types.ObjectId.isValid(tenantId)) {
          tenantIdObj = new mongoose.Types.ObjectId(tenantId);
        } else if (typeof tenantId === 'number') {
          // For numeric IDs, we need to find the corresponding tenant first
          const tenant = await this.getModel<ITenant>('Tenant').findOne({ id: tenantId });
          if (tenant) {
            tenantIdObj = tenant._id;
          } else {
            tenantIdObj = tenantId;
          }
        } else {
          tenantIdObj = tenantId;
        }
      } catch (err) {
        console.error(`[mongodb] Failed to convert tenantId: ${tenantId} - ${err}`);
        tenantIdObj = tenantId;
      }

      // Find and update the product
      const product = await ProductModel.findOneAndUpdate(
        { _id: id, tenantId: tenantIdObj },
        { stockLevel, updatedAt: new Date() },
        { new: true }
      );

      if (!product) {
        console.log(`[mongodb] No product found with id ${id} and tenantId ${tenantId}`);
        return null;
      }

      // Transform the product to match frontend expectations
      const productObj = product.toObject();
      const transformedProduct = {
        id: productObj._id.toString(),
        _id: productObj._id.toString(),
        tenantId: productObj.tenantId.toString(),
        name: productObj.name,
        description: productObj.description || '',
        price: productObj.price,
        costPrice: productObj.costPrice || 0,
        category: productObj.category || '',
        imageUrl: productObj.imageUrl || '',
        supplierUrl: productObj.supplierUrl || '',
        stockLevel: productObj.stockLevel,
        isActive: productObj.isActive,
        createdAt: productObj.createdAt.toISOString(),
        updatedAt: productObj.updatedAt.toISOString()
      };

      return transformedProduct;
    } catch (error) {
      log(`Error updating product stock level: ${error}`, "mongodb");
      console.error('Full error:', error);
      return undefined;
    }
  }

  async listProducts(tenantId: any, limit?: number): Promise<any[]> {
    try {
      console.log(`[mongodb] Listing products for tenant: ${tenantId}`);
      const ProductModel = this.getModel<IProduct>('Product');

      // Handle different types of tenantId
      let tenantIdObj = tenantId;

      // If tenantId is already a MongoDB ObjectId, use it directly
      if (tenantId instanceof mongoose.Types.ObjectId) {
        console.log(`[mongodb] Using ObjectId directly: ${tenantId}`);
      }
      // If tenantId is a string that looks like an ObjectId, convert it
      else if (typeof tenantId === 'string' && mongoose.Types.ObjectId.isValid(tenantId)) {
        try {
          tenantIdObj = new mongoose.Types.ObjectId(tenantId);
          console.log(`[mongodb] Converted string to ObjectId: ${tenantIdObj}`);
        } catch (err) {
          console.error(`[mongodb] Failed to convert string to ObjectId: ${tenantId} - ${err}`);
        }
      }
      // If tenantId is a number, try to find the tenant with that ID
      else if (typeof tenantId === 'number') {
        try {
          const TenantModel = this.getModel<ITenant>('Tenant');
          const tenant = await TenantModel.findOne({ id: tenantId });
          if (tenant) {
            tenantIdObj = tenant._id;
            console.log(`[mongodb] Found tenant with numeric ID ${tenantId}, using ObjectId: ${tenantIdObj}`);
          } else {
            console.log(`[mongodb] No tenant found with numeric ID ${tenantId}, using as is`);
          }
        } catch (err) {
          console.error(`[mongodb] Error finding tenant with ID ${tenantId}: ${err}`);
        }
      }

      console.log(`[mongodb] Final tenantId for query: ${tenantIdObj}`);

      // Transform MongoDB documents to the format expected by the frontend
      let results = [];
      try {
        // Get the query results
        let query = ProductModel.find({ tenantId: tenantIdObj });

        if (limit) {
          query = query.limit(limit);
        }

        results = await query.exec();
        console.log(`[mongodb] Products query returned ${results.length} results`);

        if (results.length > 0) {
          console.log(`[mongodb] Sample product: ${JSON.stringify(results[0])}`);
        } else {
          console.log(`[mongodb] No products found for tenant: ${tenantId}`);

          // Debug: try fetching without tenant filter to see if any products exist
          const allProducts = await ProductModel.find({}).limit(5).exec();
          console.log(`[mongodb] Total products in collection (any tenant): ${allProducts.length}`);
          if (allProducts.length > 0) {
            console.log(`[mongodb] Sample product from any tenant: ${JSON.stringify(allProducts[0])}`);
            console.log(`[mongodb] This product has tenantId: ${allProducts[0].tenantId}`);

            // Try to find products with this tenant ID as a string
            if (typeof tenantId === 'string' || typeof tenantId === 'number') {
              const tenantIdStr = tenantId.toString();
              console.log(`[mongodb] Trying to find products with tenantId as string: ${tenantIdStr}`);
              const productsByString = await ProductModel.find({ tenantId: tenantIdStr }).limit(5).exec();
              console.log(`[mongodb] Found ${productsByString.length} products with tenantId as string`);

              if (productsByString.length > 0) {
                // Use these results instead
                results = productsByString;
                console.log(`[mongodb] Using string-matched products instead`);
              }
            }
          }
        }
      } catch (queryErr) {
        console.error(`[mongodb] Error querying products: ${queryErr}`);
      }

      // Transform MongoDB documents to the format expected by the frontend
      const transformedResults = results.map(product => {
        // Convert Mongoose document to plain object
        const productObj = product.toObject ? product.toObject() : product;

        return {
          id: productObj._id.toString(), // Convert ObjectId to string for the id field
          _id: productObj._id.toString(), // Keep _id as string for compatibility
          tenantId: productObj.tenantId.toString(), // Convert ObjectId to string
          name: productObj.name,
          description: productObj.description || '',
          price: productObj.price,
          costPrice: productObj.costPrice || 0,
          category: productObj.category || '',
          imageUrl: productObj.imageUrl || '',
          supplierUrl: productObj.supplierUrl || '',
          stockLevel: productObj.stockLevel,
          isActive: productObj.isActive,
          createdAt: productObj.createdAt.toISOString(),
          updatedAt: productObj.updatedAt.toISOString()
        };
      });

      console.log(`[mongodb] Transformed ${transformedResults.length} products for frontend`);
      if (transformedResults.length > 0) {
        console.log(`[mongodb] Sample transformed product: ${JSON.stringify(transformedResults[0])}`);
      }

      return transformedResults;
    } catch (error) {
      log(`Error listing products: ${error}`, "mongodb");
      console.error('Full error:', error);
      return [];
    }
  }

  // Order methods
  async getOrder(id: string | number, tenantId: number | string): Promise<any> {
    try {
      const OrderModel = this.getModel<IOrder>('Order');

      // Convert tenantId to ObjectId if it's a string and valid ObjectId
      const tenantIdObj = mongoose.isValidObjectId(tenantId) ?
                          mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) :
                          tenantId;

      console.log(`[mongodb] Getting order: ID=${id}, tenantId=${tenantIdObj}`);

      // Check if the ID is a valid MongoDB ObjectId
      if (!mongoose.isValidObjectId(id)) {
        console.log(`[mongodb] Invalid ObjectId: ${id}`);
        return null;
      }

      // Find the order
      const order = await OrderModel.findOne({ _id: id, tenantId: tenantIdObj });

      if (!order) {
        console.log(`[mongodb] No order found with id ${id} and tenantId ${tenantIdObj}`);
        return null;
      }

      // Transform the order for the frontend
      const orderObj = order.toObject();
      const transformedOrder = {
        _id: orderObj._id.toString(),
        id: orderObj._id.toString(),
        orderNumber: orderObj.orderNumber,
        customerName: orderObj.customerName,
        customerEmail: orderObj.customerEmail,
        amount: orderObj.amount,
        status: orderObj.status,
        createdAt: orderObj.createdAt.toISOString(),
        updatedAt: orderObj.updatedAt.toISOString()
      };

      console.log(`[mongodb] Successfully retrieved order: ${JSON.stringify(transformedOrder)}`);
      return transformedOrder;
    } catch (error) {
      log(`Error getting order: ${error}`, "mongodb");
      console.error('Full error:', error);
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

  async getOrdersNeedingDispatch(tenantId: number): Promise<any[]> {
    try {
      const OrderModel = this.getModel<IOrder>('Order');

      // Convert tenantId to ObjectId if it's a string
      const tenantIdObj = mongoose.isValidObjectId(tenantId) ?
                          mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) :
                          tenantId;

      // Find orders that are paid or processing (need to be shipped)
      return await OrderModel.find({
        tenantId: tenantIdObj,
        status: { $in: ['paid', 'processing'] }
      })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      log(`Error getting orders needing dispatch: ${error}`, "mongodb");
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

  async updateOrderStatus(id: string | number, tenantId: number | string, status: string): Promise<any> {
    try {
      const OrderModel = this.getModel<IOrder>('Order');

      // Convert tenantId to ObjectId if it's a string and valid ObjectId
      const tenantIdObj = mongoose.isValidObjectId(tenantId) ?
                          mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) :
                          tenantId;

      console.log(`[mongodb] Updating order status: ID=${id}, tenantId=${tenantIdObj}, status=${status}`);

      // Check if the ID is a valid MongoDB ObjectId
      if (!mongoose.isValidObjectId(id)) {
        console.log(`[mongodb] Invalid ObjectId: ${id}`);
        return null;
      }

      // Find and update the order
      const updatedOrder = await OrderModel.findOneAndUpdate(
        { _id: id, tenantId: tenantIdObj },
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (!updatedOrder) {
        console.log(`[mongodb] No order found with id ${id} and tenantId ${tenantIdObj}`);
        return null;
      }

      // Transform the order for the frontend
      const orderObj = updatedOrder.toObject();
      const transformedOrder = {
        _id: orderObj._id.toString(),
        id: orderObj._id.toString(),
        orderNumber: orderObj.orderNumber,
        customerName: orderObj.customerName,
        customerEmail: orderObj.customerEmail,
        amount: orderObj.amount,
        status: orderObj.status,
        createdAt: orderObj.createdAt.toISOString(),
        updatedAt: orderObj.updatedAt.toISOString()
      };

      console.log(`[mongodb] Successfully updated order status: ${JSON.stringify(transformedOrder)}`);
      return transformedOrder;
    } catch (error) {
      log(`Error updating order status: ${error}`, "mongodb");
      console.error('Full error:', error);
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

  async getDailySalesBreakdown(tenantId: number, fromDate: Date, toDate: Date): Promise<Array<{ date: string; revenue: number; orderCount: number }>> {
    try {
      const OrderModel = this.getModel<IOrder>('Order');
      const query: any = {
        tenantId,
        status: { $nin: ['canceled', 'refunded'] },
        createdAt: {
          $gte: fromDate,
          $lte: toDate
        }
      };

      const result = await OrderModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            revenue: { $sum: "$amount" },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: "$_id",
            revenue: 1,
            orderCount: 1,
            _id: 0
          }
        }
      ]);

      return result;
    } catch (error) {
      log(`Error getting daily sales breakdown: ${error}`, "mongodb");
      return [];
    }
  }

  async getPopularProductsWithSales(tenantId: number, limit?: number, fromDate?: Date, toDate?: Date): Promise<Array<{ id: string; name: string; category: string; price: number; imageUrl: string; sold: number; earnings: number }>> {
    try {
      const OrderModel = this.getModel<IOrder>('Order');
      const OrderItemModel = this.getModel<IOrderItem>('OrderItem');
      const ProductModel = this.getModel<IProduct>('Product');

      const actualLimit = limit ?? 5;

      // Build the date filter for orders
      const orderQuery: any = {
        tenantId,
        status: { $nin: ['canceled', 'refunded'] }
      };

      if (fromDate || toDate) {
        orderQuery.createdAt = {};
        if (fromDate) orderQuery.createdAt.$gte = fromDate;
        if (toDate) orderQuery.createdAt.$lte = toDate;
      }

      // Get all orders in the date range
      const orders = await OrderModel.find(orderQuery).select('_id').exec();
      const orderIds = orders.map(order => order._id);

      if (orderIds.length === 0) {
        log(`No orders found for tenant ${tenantId} in the specified date range`, "mongodb");
        return [];
      }

      // Aggregate order items to get sales data per product
      const salesAggregation = await OrderItemModel.aggregate([
        {
          $match: {
            orderId: { $in: orderIds }
          }
        },
        {
          $group: {
            _id: "$productId",
            totalQuantity: { $sum: "$quantity" },
            totalEarnings: { $sum: { $multiply: ["$quantity", "$price"] } }
          }
        },
        {
          $sort: { totalQuantity: -1 }
        },
        {
          $limit: actualLimit
        }
      ]);

      if (salesAggregation.length === 0) {
        log(`No order items found for orders in the specified date range`, "mongodb");
        return [];
      }

      // Get product details for the top selling products
      const productIds = salesAggregation.map(item => item._id);
      const products = await ProductModel.find({
        _id: { $in: productIds },
        tenantId,
        isActive: true
      }).exec();

      // Create a map of product sales data
      const salesMap = new Map();
      salesAggregation.forEach(item => {
        salesMap.set(item._id.toString(), {
          sold: item.totalQuantity,
          earnings: Math.round(item.totalEarnings * 100) / 100
        });
      });

      // Transform products to the expected format
      const result = products.map(product => {
        const productObj = product.toObject();
        const salesData = salesMap.get(productObj._id.toString()) || { sold: 0, earnings: 0 };

        return {
          id: productObj._id.toString(),
          name: productObj.name,
          category: productObj.category || 'Uncategorized',
          price: productObj.price,
          imageUrl: productObj.imageUrl || 'https://placehold.co/80x80?text=No+Image',
          sold: salesData.sold,
          earnings: salesData.earnings
        };
      })
      // Sort by sales volume (sold quantity) in descending order
      .sort((a, b) => b.sold - a.sold);

      console.log(`[mongodb] Found ${result.length} popular products with sales data`);
      return result;

    } catch (error) {
      log(`Error getting popular products with sales: ${error}`, "mongodb");
      console.error('Full error:', error);
      return [];
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

  // Customer methods
  async listCustomers(tenantId: number, page: number = 1, pageSize: number = 10): Promise<any[]> {
    try {
      // Get Customer model safely
      const Customer = this.getModel('Customer');
      // Convert tenantId to ObjectId if it's a string
      const query = { tenantId: mongoose.isValidObjectId(tenantId) ?
                              mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) :
                              tenantId };

      return await Customer.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec();
    } catch (error) {
      log(`Error listing customers: ${error}`, "mongodb");
      return [];
    }
  }

  async countCustomers(tenantId: number): Promise<number> {
    try {
      // Get Customer model safely
      const Customer = this.getModel('Customer');
      // Convert tenantId to ObjectId if it's a string
      const query = { tenantId: mongoose.isValidObjectId(tenantId) ?
                              mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) :
                              tenantId };

      return await Customer.countDocuments(query);
    } catch (error) {
      log(`Error counting customers: ${error}`, "mongodb");
      return 0;
    }
  }

  async getCustomer(id: string, tenantId?: number): Promise<any> {
    try {
      // Get Customer model safely
      const Customer = this.getModel('Customer');

      // Create query - if tenantId is provided, include it in the query
      const query: any = { _id: id };
      if (tenantId !== undefined) {
        query.tenantId = mongoose.isValidObjectId(tenantId) ?
                        mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) :
                        tenantId;
      }

      const customer = await Customer.findOne(query);

      if (!customer) {
        log(`No customer found with id ${id}`, "mongodb");
        return null;
      }

      return customer;
    } catch (error) {
      log(`Error getting customer: ${error}`, "mongodb");
      return null;
    }
  }

  /**
   * Get orders for a specific customer by customer ID
   * @param customerId The MongoDB ID of the customer
   * @param tenantId The tenant ID
   * @returns Array of orders for the customer
   */
  async getOrdersByCustomer(customerId: string, tenantId: number): Promise<any[]> {
    try {
      console.log(`[mongodb] Getting orders for customer with ID: ${customerId} for tenant: ${tenantId}`);

      // First get the customer to get their name and email
      const customer = await this.getCustomer(customerId, tenantId);

      if (!customer) {
        console.log(`[mongodb] No customer found with id ${customerId}`);
        return [];
      }

      // Then find orders by customer name and email
      const OrderModel = this.getModel<IOrder>('Order');

      // Convert tenantId to ObjectId if it's a string
      const tenantIdObj = mongoose.isValidObjectId(tenantId) ?
                          mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) :
                          tenantId;

      // Create query to find orders by customer name or email
      const query: any = {
        tenantId: tenantIdObj,
        $or: [
          { customerName: customer.name },
          { customerEmail: customer.email }
        ]
      };

      console.log(`[mongodb] Searching for orders with query:`, query);

      // Find orders and sort by creation date (newest first)
      const orders = await OrderModel.find(query)
        .sort({ createdAt: -1 })
        .exec();

      console.log(`[mongodb] Found ${orders.length} orders for customer ${customer.name}`);

      // Transform orders to match frontend expectations
      const transformedOrders = orders.map(order => {
        const orderObj = order.toObject();
        return {
          _id: orderObj._id.toString(),
          id: orderObj._id.toString(),
          orderNumber: orderObj.orderNumber,
          customerName: orderObj.customerName,
          customerEmail: orderObj.customerEmail,
          amount: orderObj.amount,
          status: orderObj.status,
          createdAt: orderObj.createdAt.toISOString(),
          date: orderObj.createdAt.toISOString()
        };
      });

      return transformedOrders;
    } catch (error) {
      log(`Error getting orders by customer: ${error}`, "mongodb");
      console.error('Full error:', error);
      return [];
    }
  }

  // Notification methods
  async createNotification(notificationData: any): Promise<any> {
    try {
      const NotificationModel = this.getModel<INotification>('Notification');
      const notification = new NotificationModel(notificationData);
      return await notification.save();
    } catch (error) {
      log(`Error creating notification: ${error}`, "mongodb");
      throw error;
    }
  }

  async getNotifications(tenantId: number, userId?: string, limit: number = 50): Promise<any[]> {
    try {
      const NotificationModel = this.getModel<INotification>('Notification');

      // Convert tenantId to ObjectId if it's a string
      const tenantIdObj = mongoose.isValidObjectId(tenantId) ?
                          mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) :
                          tenantId;

      const query: any = { tenantId: tenantIdObj };

      // If userId is provided, filter by user or global notifications
      if (userId) {
        const userIdObj = mongoose.isValidObjectId(userId) ?
                          mongoose.Types.ObjectId.createFromHexString(userId) :
                          userId;
        query.$or = [
          { userId: userIdObj },
          { userId: { $exists: false } } // Global notifications
        ];
      }

      // Only return non-expired notifications
      query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ];

      return await NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      log(`Error getting notifications: ${error}`, "mongodb");
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string, tenantId: number): Promise<any> {
    try {
      const NotificationModel = this.getModel<INotification>('Notification');

      const tenantIdObj = mongoose.isValidObjectId(tenantId) ?
                          mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) :
                          tenantId;

      return await NotificationModel.findOneAndUpdate(
        { _id: notificationId, tenantId: tenantIdObj },
        { isRead: true, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      log(`Error marking notification as read: ${error}`, "mongodb");
      throw error;
    }
  }

  async dismissNotification(notificationId: string, tenantId: number): Promise<any> {
    try {
      const NotificationModel = this.getModel<INotification>('Notification');

      const tenantIdObj = mongoose.isValidObjectId(tenantId) ?
                          mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) :
                          tenantId;

      return await NotificationModel.findOneAndUpdate(
        { _id: notificationId, tenantId: tenantIdObj },
        { isDismissed: true, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      log(`Error dismissing notification: ${error}`, "mongodb");
      throw error;
    }
  }

  async getUnreadNotificationCount(tenantId: number, userId?: string): Promise<number> {
    try {
      const NotificationModel = this.getModel<INotification>('Notification');

      const tenantIdObj = mongoose.isValidObjectId(tenantId) ?
                          mongoose.Types.ObjectId.createFromHexString(tenantId.toString()) :
                          tenantId;

      const query: any = {
        tenantId: tenantIdObj,
        isRead: false,
        isDismissed: false
      };

      if (userId) {
        const userIdObj = mongoose.isValidObjectId(userId) ?
                          mongoose.Types.ObjectId.createFromHexString(userId) :
                          userId;
        query.$or = [
          { userId: userIdObj },
          { userId: { $exists: false } }
        ];
      }

      // Only count non-expired notifications
      query.$and = [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
          ]
        }
      ];

      return await NotificationModel.countDocuments(query);
    } catch (error) {
      log(`Error getting unread notification count: ${error}`, "mongodb");
      return 0;
    }
  }

  // Helper method to get the appropriate model
  private getModel<T>(modelName: string): mongoose.Model<T> {
    return mongoose.model(modelName) as mongoose.Model<T>;
  }
}
