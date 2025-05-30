/**
 * Shared types for the Business Intelligence Dashboard
 * 
 * This file contains type definitions that are shared between the client and server.
 * It replaces the previous Drizzle ORM schema definitions with pure TypeScript types
 * that match the Mongoose models.
 */

// Enum types
export const UserRoles = ['admin', 'editor', 'viewer'] as const;
export type UserRole = typeof UserRoles[number];

export const LeadStatuses = ['new', 'contacted', 'won', 'lost'] as const;
export type LeadStatus = typeof LeadStatuses[number];

export const OrderStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'refunded', 'canceled'] as const;
export type OrderStatus = typeof OrderStatuses[number];

export const StockLevels = ['none', 'low', 'good', 'high'] as const;
export type StockLevel = typeof StockLevels[number];

export const CustomerStatuses = ['active', 'inactive'] as const;
export type CustomerStatus = typeof CustomerStatuses[number];

// Define supported currencies
export const SupportedCurrencies = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'KRW',
  'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB',
  'TRY', 'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'ZAR', 'EGP',
  'MAD', 'NGN', 'KES', 'GHS', 'ILS', 'SAR', 'AED', 'QAR', 'KWD', 'BHD',
  'THB', 'SGD', 'MYR', 'IDR', 'PHP', 'VND', 'HKD', 'TWD', 'NZD'
] as const;
export type SupportedCurrency = typeof SupportedCurrencies[number];

// Base interface for all entities
export interface BaseEntity {
  _id?: string;
  id?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Tenant interface
export interface Tenant extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
  primaryColor: string;
  currencyCode: SupportedCurrency;
  currencySymbol: string;
  currencyLocale: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSecretKey?: string;
  ga4Key?: string;
  vercelApiToken?: string;
  vercelProjectId?: string;
  vercelTeamId?: string;
}

// User interface
export interface User extends BaseEntity {
  tenantId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

// Customer interface
export interface Customer extends BaseEntity {
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: CustomerStatus;
}

// Product interface
export interface Product extends BaseEntity {
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  category?: string;
  imageUrl?: string;
  supplierUrl?: string;
  stockLevel: StockLevel;
  isActive: boolean;
}

// Order interface
export interface Order extends BaseEntity {
  tenantId: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  status: OrderStatus;
}

// OrderItem interface
export interface OrderItem extends BaseEntity {
  orderId: string;
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
}

// Lead interface
export interface Lead extends BaseEntity {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: LeadStatus;
  value?: number;
  notes?: string;
}

// TrafficData interface
export interface TrafficData extends BaseEntity {
  tenantId: string;
  date: string | Date;
  page: string;
  views: number;
  uniqueVisitors: number;
  bounceRate?: number;
  source?: string;
  medium?: string;
  campaign?: string;
  deviceType?: string;
}

// ActivityLog interface
export interface ActivityLog extends BaseEntity {
  tenantId: string;
  userId?: string;
  activityType: string;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}
