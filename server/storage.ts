import {
  users, 
  tenants, 
  products, 
  orders,
  orderItems,
  leads,
  trafficData,
  activityLogs,
  type User, 
  type InsertUser,
  type Tenant,
  type InsertTenant,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Lead,
  type InsertLead,
  type TrafficData,
  type InsertTrafficData,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { eq, and, gte, lte, like, desc, between, sql } from "drizzle-orm";
import { type LeadStatus, type OrderStatus } from "./types";
import * as bcrypt from "bcryptjs";

// Interface definitions
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  listUsers(tenantId: number): Promise<User[]>;

  // Tenant methods
  getTenant(id: number): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenantData: Partial<Tenant>): Promise<Tenant | undefined>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { customerId: string, subscriptionId: string }): Promise<User>;

  // Product methods
  getProduct(id: number, tenantId: number): Promise<Product | undefined>;
  listProducts(tenantId: number, limit?: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, tenantId: number, productData: Partial<Product>): Promise<Product | undefined>;
  updateProductStockLevel(id: number, tenantId: number, stockLevel: string): Promise<Product | undefined>;
  getProductsByStockLevel(tenantId: number, stockLevel: string): Promise<Product[]>;

  // Order methods
  getOrder(id: number, tenantId: number): Promise<Order | undefined>;
  listOrders(tenantId: number, page?: number, pageSize?: number): Promise<Order[]>;
  countOrders(tenantId: number, fromDate?: Date, toDate?: Date): Promise<number>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, tenantId: number, status: OrderStatus): Promise<Order | undefined>;
  calculateRevenue(tenantId: number, fromDate?: Date, toDate?: Date): Promise<number>;
  calculateAverageOrderValue(tenantId: number, fromDate?: Date, toDate?: Date): Promise<number>;

  // Lead methods
  getLead(id: number, tenantId: number): Promise<Lead | undefined>;
  listLeads(tenantId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLeadStatus(id: number, tenantId: number, status: LeadStatus): Promise<Lead | undefined>;
  countLeads(tenantId: number, fromDate?: Date, toDate?: Date): Promise<number>;

  // Traffic data methods
  listTrafficData(tenantId: number, fromDate?: Date, toDate?: Date): Promise<TrafficData[]>;
  getTopPages(tenantId: number, limit?: number): Promise<{ page: string, views: number }[]>;
  getTrafficBySource(tenantId: number): Promise<{ source: string, count: number }[]>;
  getDeviceDistribution(tenantId: number): Promise<{ deviceType: string, percentage: number }[]>;

  // Activity logs
  logActivity(activityLog: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivity(tenantId: number, limit?: number): Promise<ActivityLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tenants: Map<number, Tenant>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem[]>;
  private leads: Map<number, Lead>;
  private traffic: Map<number, TrafficData>;
  private activities: Map<number, ActivityLog>;
  private currentUserId: number;
  private currentTenantId: number;
  private currentProductId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;
  private currentLeadId: number;
  private currentTrafficId: number;
  private currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.tenants = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.leads = new Map();
    this.traffic = new Map();
    this.activities = new Map();
    this.currentUserId = 1;
    this.currentTenantId = 1;
    this.currentProductId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.currentLeadId = 1;
    this.currentTrafficId = 1;
    this.currentActivityId = 1;

    // Initialize with sample data
    this.initializeData();
  }

  // Initialize with sample data for demo purposes
  private async initializeData() {
    // Create a tenant
    const tenant: InsertTenant = {
      name: "BusinessDash Inc.",
      email: "info@businessdash.com",
      phone: "+1 (555) 123-4567",
      address: "123 Main St, Suite 200, San Francisco, CA 94105",
      website: "https://www.businessdash.com",
      logoUrl: "",
      primaryColor: "#0ea5e9",
    };
    const createdTenant = await this.createTenant(tenant);

    // Create a user
    const hash = await bcrypt.hash("password123", 10);
    const user: InsertUser = {
      tenantId: createdTenant.id,
      email: "admin@businessdash.com",
      name: "Jane Smith",
      passwordHash: hash,
      role: "admin",
      isActive: true,
    };
    await this.createUser(user);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...userData, id, createdAt: new Date(), updatedAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(tenantId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.tenantId === tenantId,
    );
  }

  // Tenant methods
  async getTenant(id: number): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const id = this.currentTenantId++;
    const tenant: Tenant = { ...tenantData, id, createdAt: new Date(), updatedAt: new Date() };
    this.tenants.set(id, tenant);
    return tenant;
  }

  async updateTenant(id: number, tenantData: Partial<Tenant>): Promise<Tenant | undefined> {
    const tenant = await this.getTenant(id);
    if (!tenant) return undefined;

    const updatedTenant = { ...tenant, ...tenantData, updatedAt: new Date() };
    this.tenants.set(id, updatedTenant);
    return updatedTenant;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, updatedAt: new Date() };
    this.users.set(userId, updatedUser);
    
    // In a real app, this would update the tenant's stripe customer ID
    const tenant = await this.getTenant(user.tenantId);
    if (tenant) {
      const updatedTenant = { ...tenant, stripeCustomerId: customerId, updatedAt: new Date() };
      this.tenants.set(tenant.id, updatedTenant);
    }
    
    return updatedUser;
  }

  async updateUserStripeInfo(userId: number, stripeInfo: { customerId: string, subscriptionId: string }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, updatedAt: new Date() };
    this.users.set(userId, updatedUser);
    
    // In a real app, this would update the tenant's stripe information
    const tenant = await this.getTenant(user.tenantId);
    if (tenant) {
      const updatedTenant = { 
        ...tenant, 
        stripeCustomerId: stripeInfo.customerId,
        stripeSubscriptionId: stripeInfo.subscriptionId,
        updatedAt: new Date() 
      };
      this.tenants.set(tenant.id, updatedTenant);
    }
    
    return updatedUser;
  }

  // Product methods
  async getProduct(id: number, tenantId: number): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (product && product.tenantId === tenantId) {
      return product;
    }
    return undefined;
  }

  async listProducts(tenantId: number, limit: number = 10): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter((product) => product.tenantId === tenantId)
      .slice(0, limit);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { ...productData, id, createdAt: new Date(), updatedAt: new Date() };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, tenantId: number, productData: Partial<Product>): Promise<Product | undefined> {
    const product = await this.getProduct(id, tenantId);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...productData, updatedAt: new Date() };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async updateProductStockLevel(id: number, tenantId: number, stockLevel: string): Promise<Product | undefined> {
    const product = await this.getProduct(id, tenantId);
    if (!product) return undefined;

    const updatedProduct = { ...product, stockLevel, updatedAt: new Date() };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async getProductsByStockLevel(tenantId: number, stockLevel: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter((product) => product.tenantId === tenantId && product.stockLevel === stockLevel);
  }

  // Order methods
  async getOrder(id: number, tenantId: number): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (order && order.tenantId === tenantId) {
      return order;
    }
    return undefined;
  }

  async listOrders(tenantId: number, page: number = 1, pageSize: number = 10): Promise<Order[]> {
    const start = (page - 1) * pageSize;
    return Array.from(this.orders.values())
      .filter((order) => order.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + pageSize);
  }

  async countOrders(tenantId: number, fromDate?: Date, toDate?: Date): Promise<number> {
    return Array.from(this.orders.values())
      .filter((order) => {
        let match = order.tenantId === tenantId;
        if (fromDate) match = match && order.createdAt >= fromDate;
        if (toDate) match = match && order.createdAt <= toDate;
        return match;
      })
      .length;
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = { ...orderData, id, createdAt: new Date(), updatedAt: new Date() };
    this.orders.set(id, order);

    // Create order items
    const orderItems: OrderItem[] = items.map(item => {
      const itemId = this.currentOrderItemId++;
      return { ...item, id: itemId, orderId: id };
    });
    this.orderItems.set(id, orderItems);

    return order;
  }

  async updateOrderStatus(id: number, tenantId: number, status: OrderStatus): Promise<Order | undefined> {
    const order = await this.getOrder(id, tenantId);
    if (!order) return undefined;

    const updatedOrder = { ...order, status, updatedAt: new Date() };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async calculateRevenue(tenantId: number, fromDate?: Date, toDate?: Date): Promise<number> {
    return Array.from(this.orders.values())
      .filter((order) => {
        let match = order.tenantId === tenantId && order.status !== 'canceled' && order.status !== 'refunded';
        if (fromDate) match = match && order.createdAt >= fromDate;
        if (toDate) match = match && order.createdAt <= toDate;
        return match;
      })
      .reduce((sum, order) => sum + Number(order.amount), 0);
  }

  async calculateAverageOrderValue(tenantId: number, fromDate?: Date, toDate?: Date): Promise<number> {
    const orders = Array.from(this.orders.values())
      .filter((order) => {
        let match = order.tenantId === tenantId && order.status !== 'canceled' && order.status !== 'refunded';
        if (fromDate) match = match && order.createdAt >= fromDate;
        if (toDate) match = match && order.createdAt <= toDate;
        return match;
      });
    
    if (orders.length === 0) return 0;
    
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.amount), 0);
    return totalRevenue / orders.length;
  }

  // Lead methods
  async getLead(id: number, tenantId: number): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (lead && lead.tenantId === tenantId) {
      return lead;
    }
    return undefined;
  }

  async listLeads(tenantId: number): Promise<Lead[]> {
    return Array.from(this.leads.values())
      .filter((lead) => lead.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createLead(leadData: InsertLead): Promise<Lead> {
    const id = this.currentLeadId++;
    const lead: Lead = { ...leadData, id, createdAt: new Date(), updatedAt: new Date() };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLeadStatus(id: number, tenantId: number, status: LeadStatus): Promise<Lead | undefined> {
    const lead = await this.getLead(id, tenantId);
    if (!lead) return undefined;

    const updatedLead = { ...lead, status, updatedAt: new Date() };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async countLeads(tenantId: number, fromDate?: Date, toDate?: Date): Promise<number> {
    return Array.from(this.leads.values())
      .filter((lead) => {
        let match = lead.tenantId === tenantId;
        if (fromDate) match = match && lead.createdAt >= fromDate;
        if (toDate) match = match && lead.createdAt <= toDate;
        return match;
      })
      .length;
  }

  // Traffic data methods
  async listTrafficData(tenantId: number, fromDate?: Date, toDate?: Date): Promise<TrafficData[]> {
    return Array.from(this.traffic.values())
      .filter((data) => {
        let match = data.tenantId === tenantId;
        if (fromDate) match = match && data.date >= fromDate;
        if (toDate) match = match && data.date <= toDate;
        return match;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getTopPages(tenantId: number, limit: number = 5): Promise<{ page: string, views: number }[]> {
    const pageViews = new Map<string, number>();
    
    Array.from(this.traffic.values())
      .filter((data) => data.tenantId === tenantId)
      .forEach((data) => {
        const currentViews = pageViews.get(data.page) || 0;
        pageViews.set(data.page, currentViews + data.views);
      });
    
    return Array.from(pageViews.entries())
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  async getTrafficBySource(tenantId: number): Promise<{ source: string, count: number }[]> {
    const sourceCount = new Map<string, number>();
    
    Array.from(this.traffic.values())
      .filter((data) => data.tenantId === tenantId && data.source)
      .forEach((data) => {
        const source = data.source || 'unknown';
        const currentCount = sourceCount.get(source) || 0;
        sourceCount.set(source, currentCount + data.uniqueVisitors);
      });
    
    return Array.from(sourceCount.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getDeviceDistribution(tenantId: number): Promise<{ deviceType: string, percentage: number }[]> {
    const deviceCount = new Map<string, number>();
    let totalVisits = 0;
    
    Array.from(this.traffic.values())
      .filter((data) => data.tenantId === tenantId && data.deviceType)
      .forEach((data) => {
        const deviceType = data.deviceType || 'unknown';
        const currentCount = deviceCount.get(deviceType) || 0;
        const newCount = currentCount + data.uniqueVisitors;
        deviceCount.set(deviceType, newCount);
        totalVisits += data.uniqueVisitors;
      });
    
    if (totalVisits === 0) return [];
    
    return Array.from(deviceCount.entries())
      .map(([deviceType, count]) => ({ 
        deviceType, 
        percentage: Math.round((count / totalVisits) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  // Activity logs
  async logActivity(activityData: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentActivityId++;
    const activity: ActivityLog = { ...activityData, id, createdAt: new Date() };
    this.activities.set(id, activity);
    return activity;
  }

  async getRecentActivity(tenantId: number, limit: number = 10): Promise<ActivityLog[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
