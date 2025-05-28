/**
 * Script to check Wade Okuneva's orders and verify the discrepancy
 * between the customer summary and actual orders
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoStorage } from '../server/mongoStorage';

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

    // Find Wade Okuneva by name
    console.log('Searching for Wade Okuneva...');
    const CustomerModel = mongoose.model('Customer');
    const customer = await CustomerModel.findOne({ 
      name: { $regex: 'Wade Okuneva', $options: 'i' },
      tenantId: tenant._id 
    });
    
    if (!customer) {
      throw new Error('Wade Okuneva not found in the database');
    }
    
    console.log(`Found customer: ${customer.name} (${customer._id})`);
    console.log('Customer details:');
    console.log(`- Email: ${customer.email}`);
    console.log(`- Total Spent: $${customer.totalSpent.toFixed(2)}`);
    console.log(`- Order Count: ${customer.orderCount}`);
    console.log(`- Avg Order Value: $${(customer.totalSpent / customer.orderCount).toFixed(2)}`);

    // Get orders for this customer
    console.log('\nFetching orders for Wade Okuneva...');
    const orders = await storage.getOrdersByCustomer(customer._id.toString(), tenant._id);
    
    console.log(`Found ${orders.length} orders for customer ${customer.name}`);
    
    // Calculate total from actual orders
    let actualTotalSpent = 0;
    
    if (orders.length > 0) {
      console.log('\nOrder details:');
      orders.forEach((order, index) => {
        console.log(`\nOrder #${index + 1}:`);
        console.log(`- Order Number: ${order.orderNumber}`);
        console.log(`- Amount: $${order.amount.toFixed(2)}`);
        console.log(`- Status: ${order.status}`);
        console.log(`- Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        
        actualTotalSpent += order.amount;
      });
      
      console.log('\nSummary of actual orders:');
      console.log(`- Total Orders: ${orders.length}`);
      console.log(`- Actual Total Spent: $${actualTotalSpent.toFixed(2)}`);
      console.log(`- Actual Avg Order Value: $${(actualTotalSpent / orders.length).toFixed(2)}`);
      
      console.log('\nDiscrepancy:');
      console.log(`- Order Count: ${customer.orderCount} (stored) vs ${orders.length} (actual)`);
      console.log(`- Total Spent: $${customer.totalSpent.toFixed(2)} (stored) vs $${actualTotalSpent.toFixed(2)} (actual)`);
      
      const storedAvg = customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0;
      const actualAvg = orders.length > 0 ? actualTotalSpent / orders.length : 0;
      console.log(`- Avg Order Value: $${storedAvg.toFixed(2)} (stored) vs $${actualAvg.toFixed(2)} (actual)`);
    } else {
      console.log('No orders found for this customer');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
