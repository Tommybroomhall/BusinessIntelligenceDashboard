import mongoose, { Schema, Document, Model } from 'mongoose';

// Define enum values
export const UserRoles = ['admin', 'editor', 'viewer'] as const;
export const LeadStatuses = ['new', 'contacted', 'won', 'lost'] as const;
export const OrderStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'refunded', 'canceled'] as const;
export const StockLevels = ['none', 'low', 'good', 'high'] as const;

// Define interfaces for our documents
export interface ITenant extends Document {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
  logoUrl?: string;
  primaryColor: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSecretKey?: string;
  ga4Key?: string;
  vercelApiToken?: string;
  vercelProjectId?: string;
  vercelTeamId?: string;
}

export interface IUser extends Document {
  tenantId: mongoose.Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: typeof UserRoles[number];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface IProduct extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  stockLevel: typeof StockLevels[number];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface IOrder extends Document {
  tenantId: mongoose.Types.ObjectId;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  status: typeof OrderStatuses[number];
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem extends Document {
  orderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ITrafficData extends Document {
  tenantId: mongoose.Types.ObjectId;
  date: Date;
  page: string;
  views: number;
  uniqueVisitors: number;
  bounceRate?: number;
  source?: string;
  medium?: string;
  campaign?: string;
  deviceType?: string;
}

export interface IActivityLog extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  activityType: string;
  description: string;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Define schemas
const TenantSchema = new Schema<ITenant>({
  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  website: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  logoUrl: String,
  primaryColor: { type: String, default: '#0ea5e9' },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  stripeSecretKey: String,
  ga4Key: String,
  vercelApiToken: String,
  vercelProjectId: String,
  vercelTeamId: String
});

const UserSchema = new Schema<IUser>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: UserRoles, default: 'viewer' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

const ProductSchema = new Schema<IProduct>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  imageUrl: String,
  stockLevel: { type: String, enum: StockLevels, default: 'good' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

const OrderSchema = new Schema<IOrder>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerEmail: String,
  amount: { type: Number, required: true },
  status: { type: String, enum: OrderStatuses, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const OrderItemSchema = new Schema<IOrderItem>({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
});

const TrafficDataSchema = new Schema<ITrafficData>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  date: { type: Date, required: true },
  page: { type: String, required: true },
  views: { type: Number, required: true },
  uniqueVisitors: { type: Number, required: true },
  bounceRate: Number,
  source: String,
  medium: String,
  campaign: String,
  deviceType: String
});

const ActivityLogSchema = new Schema<IActivityLog>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  activityType: { type: String, required: true },
  description: { type: String, required: true },
  entityType: String,
  entityId: Schema.Types.ObjectId,
  metadata: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

// Create and export models
export const Tenant: Model<ITenant> = mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export const OrderItem: Model<IOrderItem> = mongoose.models.OrderItem || mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);
export const TrafficData: Model<ITrafficData> = mongoose.models.TrafficData || mongoose.model<ITrafficData>('TrafficData', TrafficDataSchema);
export const ActivityLog: Model<IActivityLog> = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
