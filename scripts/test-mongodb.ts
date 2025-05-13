import mongoose from 'mongoose';
import { log } from '../server/vite';
import {
  Tenant,
  User,
  Product,
  Order,
  OrderItem,
  TrafficData,
  ActivityLog
} from '../server/models';
import * as bcrypt from 'bcryptjs';

async function testMongoDBConnection() {
  console.log('Testing MongoDB connection...');

  try {
    // Connect to MongoDB directly
    const uri = 'mongodb+srv://tbroomhall2:ZuX6oGPb5rPJ1OKb@maincluster.ag7ox.mongodb.net/businessdash?retryWrites=true&w=majority';
    console.log('Connecting to MongoDB with URI:', uri);

    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB!');

    // List all collections
    console.log('Checking existing collections...');
    const collections = await listCollections();
    console.log('Existing collections:', collections);

    // Create sample data
    console.log('Creating sample data...');
    await createSampleData();

    console.log('Sample data created successfully!');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');

  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
  }
}

async function listCollections() {
  const mongoose = (await import('mongoose')).default;
  const collections = await mongoose.connection.db.listCollections().toArray();
  return collections.map(collection => collection.name);
}

async function createSampleData() {
  // Clear existing data
  await Tenant.deleteMany({});
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await OrderItem.deleteMany({});
  await TrafficData.deleteMany({});
  await ActivityLog.deleteMany({});

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

  const savedTenant = await tenant.save();
  console.log('Created tenant:', savedTenant.name);

  // Create a user
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = new User({
    tenantId: savedTenant._id,
    email: "admin@businessdash.com",
    name: "Jane Smith",
    passwordHash: passwordHash,
    role: "admin",
    isActive: true,
  });

  const savedUser = await user.save();
  console.log('Created user:', savedUser.name);

  // Create a product
  const product = new Product({
    tenantId: savedTenant._id,
    name: "Business Intelligence Dashboard",
    description: "A comprehensive dashboard for business analytics",
    price: 99.99,
    category: "Software",
    imageUrl: "",
    stockLevel: "good",
    isActive: true,
  });

  const savedProduct = await product.save();
  console.log('Created product:', savedProduct.name);

  // Create an order
  const order = new Order({
    tenantId: savedTenant._id,
    orderNumber: "ORD-" + Date.now(),
    customerName: "John Doe",
    customerEmail: "john@example.com",
    amount: 99.99,
    status: "paid",
  });

  const savedOrder = await order.save();
  console.log('Created order:', savedOrder.orderNumber);

  // Create an order item
  const orderItem = new OrderItem({
    orderId: savedOrder._id,
    productId: savedProduct._id,
    quantity: 1,
    price: 99.99,
  });

  const savedOrderItem = await orderItem.save();
  console.log('Created order item for product:', savedProduct.name);

  // Create traffic data
  const trafficData = new TrafficData({
    tenantId: savedTenant._id,
    date: new Date(),
    page: "/dashboard",
    views: 100,
    uniqueVisitors: 50,
    bounceRate: 25.5,
    source: "google",
    medium: "organic",
    campaign: "none",
    deviceType: "desktop",
  });

  const savedTrafficData = await trafficData.save();
  console.log('Created traffic data for page:', savedTrafficData.page);

  // Create activity log
  const activityLog = new ActivityLog({
    tenantId: savedTenant._id,
    userId: savedUser._id,
    activityType: "login",
    description: "User logged in",
    entityType: "user",
    entityId: savedUser._id,
    metadata: { ip: "127.0.0.1" },
  });

  const savedActivityLog = await activityLog.save();
  console.log('Created activity log:', savedActivityLog.description);
}

// Run the test
testMongoDBConnection();
