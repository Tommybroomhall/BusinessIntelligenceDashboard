import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { OrderStatus, LeadStatus, StockLevel } from "./types";

// Import route modules
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import tenantsRoutes from './routes/tenants';
import productsRoutes from './routes/products';
import customersRoutes from './routes/customers';
import leadsRoutes from './routes/leads';
import trafficRoutes from './routes/traffic';
import dashboardRoutes from './routes/dashboard';
import salesRoutes from './routes/sales';
import ordersRoutes from './routes/orders/index';

// Define enum values for validation (kept for backward compatibility)
export const orderStatusEnum = {
  enumValues: ["pending", "paid", "processing", "shipped", "delivered", "refunded", "canceled"]
};

export const leadStatusEnum = {
  enumValues: ["new", "contacted", "won", "lost"]
};

export const stockLevelEnum = {
  enumValues: ["none", "low", "good", "high"]
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Register API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/tenant', tenantsRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/customers', customersRoutes);
  app.use('/api/leads', leadsRoutes);
  app.use('/api/traffic', trafficRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/orders', ordersRoutes);

  // Initialize HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
