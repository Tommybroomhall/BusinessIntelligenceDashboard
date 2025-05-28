import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Import models
import {
  Tenant,
  User,
  Customer,
  Product,
  Order,
  OrderItem,
  TrafficData,
  ActivityLog,
  UserRoles,
  OrderStatuses,
  StockLevels,
  CustomerStatuses
} from '../../server/models';

// MongoDB connection options
const options = {
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

// Configuration
const CONFIG = {
  TENANTS: 3,
  USERS_PER_TENANT: 5,
  PRODUCTS_PER_TENANT: 30,
  CUSTOMERS_PER_TENANT: 50,
  ORDERS_PER_TENANT: 100,
  TRAFFIC_DATA_DAYS: 30,
  ACTIVITY_LOGS_PER_TENANT: 100,
  CLEAR_EXISTING_DATA: true
};

// Product categories
const PRODUCT_CATEGORIES = [
  'Electronics', 'Clothing', 'Home & Kitchen', 'Beauty', 'Sports',
  'Books', 'Toys', 'Jewelry', 'Automotive', 'Health'
];

// Traffic sources
const TRAFFIC_SOURCES = [
  'google', 'facebook', 'instagram', 'twitter', 'direct',
  'email', 'referral', 'bing', 'youtube', 'tiktok'
];

// Traffic mediums
const TRAFFIC_MEDIUMS = [
  'organic', 'cpc', 'social', 'email', 'referral', 'none', 'display'
];

// Device types
const DEVICE_TYPES = ['desktop', 'mobile', 'tablet'];

// Activity types
const ACTIVITY_TYPES = [
  'login', 'logout', 'create_product', 'update_product', 'delete_product',
  'create_order', 'update_order', 'create_customer', 'update_customer'
];

// Pages for traffic data
const PAGES = [
  '/', '/dashboard', '/products', '/orders', '/customers',
  '/settings', '/analytics', '/login', '/profile', '/product/details'
];

/**
 * Connect to MongoDB database
 */
async function connectToDatabase() {
  try {
    // Check if we have MongoDB credentials
    if (process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD && process.env.MONGODB_CLUSTER) {
      // Create MongoDB connection URI
      const database = process.env.MONGODB_DATABASE || 'businessdash';
      const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${database}?retryWrites=true&w=majority`;

      console.log(`Connecting to MongoDB database: ${database}`);
      await mongoose.connect(uri, options);

      console.log('Connected to MongoDB successfully');
      return true;
    } else if (process.env.MONGODB_URI) {
      // Connect to MongoDB using the connection string
      await mongoose.connect(process.env.MONGODB_URI, options);

      console.log('Connected to MongoDB successfully');
      return true;
    } else {
      console.error('No MongoDB connection string or credentials found in environment variables.');
      return false;
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error}`);
    return false;
  }
}

/**
 * Clear all existing data from the database
 */
async function clearExistingData() {
  if (!CONFIG.CLEAR_EXISTING_DATA) {
    console.log('Skipping data clearing as per configuration');
    return;
  }

  console.log('Clearing existing data...');

  try {
    await ActivityLog.deleteMany({});
    await TrafficData.deleteMany({});
    await OrderItem.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await User.deleteMany({});
    await Tenant.deleteMany({});

    console.log('All existing data cleared successfully');
  } catch (error) {
    console.error(`Error clearing data: ${error}`);
    throw error;
  }
}

/**
 * Create tenants
 */
async function createTenants() {
  console.log(`Creating ${CONFIG.TENANTS} tenants...`);

  const tenants = [];

  // Create one tenant with fixed data for easy login
  const mainTenant = new Tenant({
    name: "BusinessDash Inc.",
    email: "info@businessdash.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, Suite 200, San Francisco, CA 94105",
    website: "https://www.businessdash.com",
    logoUrl: "https://res.cloudinary.com/dbmj7rhwt/image/upload/v1620000000/logos/businessdash.png",
    primaryColor: "#0ea5e9",
  });

  const savedMainTenant = await mainTenant.save();
  tenants.push(savedMainTenant);

  // Create additional random tenants
  for (let i = 1; i < CONFIG.TENANTS; i++) {
    const companyName = faker.company.name();
    const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';

    const tenant = new Tenant({
      name: companyName,
      email: `info@${domain}`,
      phone: faker.phone.number(),
      address: faker.location.streetAddress() + ', ' + faker.location.city() + ', ' + faker.location.state() + ' ' + faker.location.zipCode(),
      website: `https://www.${domain}`,
      logoUrl: `https://res.cloudinary.com/dbmj7rhwt/image/upload/v1620000000/logos/tenant${i}.png`,
      primaryColor: faker.color.rgb(),
    });

    const savedTenant = await tenant.save();
    tenants.push(savedTenant);
  }

  console.log(`Created ${tenants.length} tenants successfully`);
  return tenants;
}

/**
 * Create users for each tenant
 */
async function createUsers(tenants) {
  console.log(`Creating users for ${tenants.length} tenants...`);

  const users = [];

  for (const tenant of tenants) {
    // Create admin user for the main tenant
    if (tenant.name === "BusinessDash Inc.") {
      const hash = await bcrypt.hash("password123", 10);
      const adminUser = new User({
        tenantId: tenant._id,
        email: "admin@businessdash.com",
        name: "Jane Smith",
        passwordHash: hash,
        role: "admin",
        isActive: true,
      });

      const savedAdminUser = await adminUser.save();
      users.push(savedAdminUser);
    }

    // Create random users for each tenant
    for (let i = 0; i < CONFIG.USERS_PER_TENANT; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName, provider: tenant.website.replace('https://www.', '') });
      const hash = await bcrypt.hash("password123", 10);
      const role = UserRoles[Math.floor(Math.random() * UserRoles.length)];

      const user = new User({
        tenantId: tenant._id,
        email,
        name: `${firstName} ${lastName}`,
        passwordHash: hash,
        role,
        isActive: Math.random() > 0.1, // 90% of users are active
      });

      const savedUser = await user.save();
      users.push(savedUser);
    }
  }

  console.log(`Created ${users.length} users successfully`);
  return users;
}

/**
 * Create products for each tenant
 */
async function createProducts(tenants) {
  console.log(`Creating products for ${tenants.length} tenants...`);

  const products = [];

  for (const tenant of tenants) {
    for (let i = 0; i < CONFIG.PRODUCTS_PER_TENANT; i++) {
      const name = faker.commerce.productName();
      const price = parseFloat(faker.commerce.price({ min: 10, max: 1000 }));
      const costPrice = price * (0.4 + Math.random() * 0.3); // 40-70% of selling price
      const category = PRODUCT_CATEGORIES[Math.floor(Math.random() * PRODUCT_CATEGORIES.length)];
      const stockLevel = StockLevels[Math.floor(Math.random() * StockLevels.length)];

      const product = new Product({
        tenantId: tenant._id,
        name,
        description: faker.commerce.productDescription(),
        price,
        costPrice,
        category,
        imageUrl: `https://res.cloudinary.com/dbmj7rhwt/image/upload/v1620000000/products/product${i % 30 + 1}.jpg`,
        supplierUrl: faker.internet.url(),
        stockLevel,
        isActive: Math.random() > 0.1, // 90% of products are active
      });

      const savedProduct = await product.save();
      products.push(savedProduct);
    }
  }

  console.log(`Created ${products.length} products successfully`);
  return products;
}

/**
 * Create customers for each tenant
 */
async function createCustomers(tenants) {
  console.log(`Creating customers for ${tenants.length} tenants...`);

  const customers = [];

  for (const tenant of tenants) {
    for (let i = 0; i < CONFIG.CUSTOMERS_PER_TENANT; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      const customer = new Customer({
        tenantId: tenant._id,
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }),
        phone: faker.phone.number(),
        location: `${faker.location.city()}, ${faker.location.state()}`,
        status: CustomerStatuses[Math.floor(Math.random() * CustomerStatuses.length)],
      });

      const savedCustomer = await customer.save();
      customers.push(savedCustomer);
    }
  }

  console.log(`Created ${customers.length} customers successfully`);
  return customers;
}

/**
 * Create orders and order items for each tenant
 */
async function createOrders(tenants, products, customers) {
  console.log(`Creating orders for ${tenants.length} tenants...`);

  const orders = [];
  const orderItems = [];

  for (const tenant of tenants) {
    // Get tenant-specific products and customers
    const tenantProducts = products.filter(p => p.tenantId.toString() === tenant._id.toString());
    const tenantCustomers = customers.filter(c => c.tenantId.toString() === tenant._id.toString());

    if (tenantProducts.length === 0 || tenantCustomers.length === 0) {
      console.log(`Skipping orders for tenant ${tenant.name} due to missing products or customers`);
      continue;
    }

    for (let i = 0; i < CONFIG.ORDERS_PER_TENANT; i++) {
      // Select a random customer
      const customer = tenantCustomers[Math.floor(Math.random() * tenantCustomers.length)];

      // Generate order number
      const orderNumber = `ORD-${tenant._id.toString().substring(0, 4)}-${Date.now().toString().substring(9)}-${i}`;

      // Select random status
      const status = OrderStatuses[Math.floor(Math.random() * OrderStatuses.length)];

      // Create between 1 and 5 order items
      const numItems = 1 + Math.floor(Math.random() * 5);
      let totalAmount = 0;
      const items = [];

      // Select random products for this order
      const orderProductIndices = new Set();
      while (orderProductIndices.size < numItems) {
        orderProductIndices.add(Math.floor(Math.random() * tenantProducts.length));
      }

      // Create order items
      for (const index of orderProductIndices) {
        const product = tenantProducts[index];
        const quantity = 1 + Math.floor(Math.random() * 5);
        const price = product.price;

        totalAmount += price * quantity;
        items.push({
          productId: product._id,
          quantity,
          price
        });
      }

      // Create the order
      const order = new Order({
        tenantId: tenant._id,
        orderNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        amount: parseFloat(totalAmount.toFixed(2)),
        status,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 })
      });

      const savedOrder = await order.save();
      orders.push(savedOrder);

      // Create order items
      for (const item of items) {
        const orderItem = new OrderItem({
          orderId: savedOrder._id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        });

        const savedOrderItem = await orderItem.save();
        orderItems.push(savedOrderItem);
      }
    }
  }

  console.log(`Created ${orders.length} orders with ${orderItems.length} order items successfully`);
  return { orders, orderItems };
}

/**
 * Create traffic data for each tenant
 */
async function createTrafficData(tenants) {
  console.log(`Creating traffic data for ${tenants.length} tenants...`);

  const trafficData = [];

  for (const tenant of tenants) {
    // Generate data for the past X days
    for (let day = 0; day < CONFIG.TRAFFIC_DATA_DAYS; day++) {
      // Generate data for each page
      for (const page of PAGES) {
        // Base traffic with some randomness
        const baseViews = 50 + Math.floor(Math.random() * 200);
        const baseVisitors = Math.floor(baseViews * (0.6 + Math.random() * 0.3)); // 60-90% of views are unique

        // Add some weekly patterns (weekends have less traffic)
        const date = new Date();
        date.setDate(date.getDate() - day);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1;

        // Add some page-specific patterns
        const pageMultiplier = page === '/' ? 2 : page === '/dashboard' ? 1.5 : 1;

        const views = Math.floor(baseViews * weekendMultiplier * pageMultiplier);
        const uniqueVisitors = Math.floor(baseVisitors * weekendMultiplier * pageMultiplier);

        // Random source, medium, and device type
        const source = TRAFFIC_SOURCES[Math.floor(Math.random() * TRAFFIC_SOURCES.length)];
        const medium = TRAFFIC_MEDIUMS[Math.floor(Math.random() * TRAFFIC_MEDIUMS.length)];
        const deviceType = DEVICE_TYPES[Math.floor(Math.random() * DEVICE_TYPES.length)];

        // Calculate bounce rate (higher for less engaging pages)
        const baseBounceRate = page === '/' ? 65 : page === '/login' ? 40 : 30;
        const bounceRate = baseBounceRate + Math.floor(Math.random() * 20);

        const traffic = new TrafficData({
          tenantId: tenant._id,
          date,
          page,
          views,
          uniqueVisitors,
          bounceRate,
          source,
          medium,
          campaign: Math.random() > 0.7 ? `campaign-${Math.floor(Math.random() * 5) + 1}` : null,
          deviceType
        });

        const savedTraffic = await traffic.save();
        trafficData.push(savedTraffic);
      }
    }
  }

  console.log(`Created ${trafficData.length} traffic data records successfully`);
  return trafficData;
}

/**
 * Create activity logs for each tenant
 */
async function createActivityLogs(tenants, users) {
  console.log(`Creating activity logs for ${tenants.length} tenants...`);

  const activityLogs = [];

  for (const tenant of tenants) {
    // Get tenant-specific users
    const tenantUsers = users.filter(u => u.tenantId.toString() === tenant._id.toString());

    if (tenantUsers.length === 0) {
      console.log(`Skipping activity logs for tenant ${tenant.name} due to missing users`);
      continue;
    }

    for (let i = 0; i < CONFIG.ACTIVITY_LOGS_PER_TENANT; i++) {
      // Select a random user
      const user = tenantUsers[Math.floor(Math.random() * tenantUsers.length)];

      // Select random activity type
      const activityType = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)];

      // Generate description based on activity type
      let description = '';
      let entityType = null;
      let entityId = null;
      let metadata = {};

      switch (activityType) {
        case 'login':
          description = `User ${user.name} logged in`;
          metadata = { ip: faker.internet.ipv4(), userAgent: faker.internet.userAgent() };
          break;
        case 'logout':
          description = `User ${user.name} logged out`;
          break;
        case 'create_product':
          description = `User ${user.name} created a new product`;
          entityType = 'product';
          entityId = new mongoose.Types.ObjectId();
          metadata = { productName: faker.commerce.productName() };
          break;
        case 'update_product':
          description = `User ${user.name} updated a product`;
          entityType = 'product';
          entityId = new mongoose.Types.ObjectId();
          metadata = {
            productName: faker.commerce.productName(),
            changes: { price: { old: faker.commerce.price(), new: faker.commerce.price() } }
          };
          break;
        case 'delete_product':
          description = `User ${user.name} deleted a product`;
          entityType = 'product';
          entityId = new mongoose.Types.ObjectId();
          metadata = { productName: faker.commerce.productName() };
          break;
        case 'create_order':
          description = `User ${user.name} created a new order`;
          entityType = 'order';
          entityId = new mongoose.Types.ObjectId();
          metadata = {
            orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
            amount: faker.commerce.price()
          };
          break;
        case 'update_order':
          description = `User ${user.name} updated an order status`;
          entityType = 'order';
          entityId = new mongoose.Types.ObjectId();
          metadata = {
            orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
            status: {
              old: OrderStatuses[Math.floor(Math.random() * OrderStatuses.length)],
              new: OrderStatuses[Math.floor(Math.random() * OrderStatuses.length)]
            }
          };
          break;
        case 'create_customer':
          description = `User ${user.name} added a new customer`;
          entityType = 'customer';
          entityId = new mongoose.Types.ObjectId();
          metadata = { customerName: faker.person.fullName() };
          break;
        case 'update_customer':
          description = `User ${user.name} updated customer information`;
          entityType = 'customer';
          entityId = new mongoose.Types.ObjectId();
          metadata = {
            customerName: faker.person.fullName(),
            changes: { email: { old: faker.internet.email(), new: faker.internet.email() } }
          };
          break;
      }

      const activityLog = new ActivityLog({
        tenantId: tenant._id,
        userId: user._id,
        activityType,
        description,
        entityType,
        entityId,
        metadata,
        createdAt: faker.date.recent({ days: 30 })
      });

      const savedActivityLog = await activityLog.save();
      activityLogs.push(savedActivityLog);
    }
  }

  console.log(`Created ${activityLogs.length} activity logs successfully`);
  return activityLogs;
}

/**
 * Main function to load all dummy data
 */
async function loadDummyData() {
  console.log('Starting to load dummy data...');

  try {
    // Connect to MongoDB
    const connected = await connectToDatabase();
    if (!connected) {
      console.error('Failed to connect to MongoDB. Exiting...');
      process.exit(1);
    }

    // Clear existing data
    await clearExistingData();

    // Create tenants
    const tenants = await createTenants();

    // Create users
    const users = await createUsers(tenants);

    // Create products
    const products = await createProducts(tenants);

    // Create customers
    const customers = await createCustomers(tenants);

    // Create orders and order items
    const { orders, orderItems } = await createOrders(tenants, products, customers);

    // Create traffic data
    const trafficData = await createTrafficData(tenants);

    // Create activity logs
    const activityLogs = await createActivityLogs(tenants, users);

    console.log('\nDummy data loading completed successfully!');
    console.log('Summary:');
    console.log(`- Tenants: ${tenants.length}`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Orders: ${orders.length}`);
    console.log(`- Order Items: ${orderItems.length}`);
    console.log(`- Traffic Data Records: ${trafficData.length}`);
    console.log(`- Activity Logs: ${activityLogs.length}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

    process.exit(0);
  } catch (error) {
    console.error(`Error loading dummy data: ${error}`);
    process.exit(1);
  }
}

// Run the script
loadDummyData();
