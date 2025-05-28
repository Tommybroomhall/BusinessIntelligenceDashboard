/**
 * Test script to verify the customer orders API endpoint
 * 
 * This script tests the MongoDB connection and the customer orders API endpoint
 * by fetching a customer and then retrieving their orders.
 * 
 * Usage:
 * npm run ts-node -- scripts/test-customer-orders.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoStorage } from '../../server/mongoStorage';

// Load environment variables
dotenv.config();

// MongoDB connection options
const options = {
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

async function main() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(mongoUri, options);
    console.log('Connected to MongoDB successfully');

    // Create a MongoStorage instance
    const storage = new MongoStorage();
    await storage.initializeData();

    // Get the first tenant
    console.log('Fetching tenants...');
    const tenants = await mongoose.model('Tenant').find().limit(1);
    
    if (tenants.length === 0) {
      throw new Error('No tenants found in the database');
    }
    
    const tenant = tenants[0];
    console.log(`Using tenant: ${tenant.name} (${tenant._id})`);

    // Get the first customer for this tenant
    console.log('Fetching customers...');
    const customers = await mongoose.model('Customer').find({ tenantId: tenant._id }).limit(1);
    
    if (customers.length === 0) {
      throw new Error('No customers found for this tenant');
    }
    
    const customer = customers[0];
    console.log(`Found customer: ${customer.name} (${customer._id})`);

    // Get orders for this customer
    console.log('Fetching orders for customer...');
    const orders = await storage.getOrdersByCustomer(customer._id.toString(), tenant._id);
    
    console.log(`Found ${orders.length} orders for customer ${customer.name}`);
    
    if (orders.length > 0) {
      console.log('Sample order:');
      console.log(JSON.stringify(orders[0], null, 2));
    } else {
      console.log('No orders found for this customer');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
