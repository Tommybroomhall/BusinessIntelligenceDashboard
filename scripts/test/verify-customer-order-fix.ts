/**
 * Script to verify the fix for customer order summary calculation
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Finds a customer with orders
 * 3. Calculates the correct order summary values
 * 4. Compares them with the stored values
 * 5. Reports any discrepancies
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

    // Get customers with orders
    console.log('Fetching customers...');
    const CustomerModel = mongoose.model('Customer');
    const customers = await CustomerModel.find({ tenantId: tenant._id }).limit(5);
    
    if (customers.length === 0) {
      throw new Error('No customers found for this tenant');
    }

    console.log(`Found ${customers.length} customers to check`);
    
    // Check each customer
    for (const customer of customers) {
      console.log(`\n----- Checking customer: ${customer.name} (${customer._id}) -----`);
      console.log('Stored values:');
      console.log(`- Total Spent: $${customer.totalSpent.toFixed(2)}`);
      console.log(`- Order Count: ${customer.orderCount}`);
      const storedAvg = customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0;
      console.log(`- Avg Order Value: $${storedAvg.toFixed(2)}`);

      // Get orders for this customer
      console.log('\nFetching orders...');
      const orders = await storage.getOrdersByCustomer(customer._id.toString(), tenant._id);
      console.log(`Found ${orders.length} orders`);

      // Calculate actual values
      const validOrders = orders.filter(order => 
        order.status !== 'canceled' && order.status !== 'refunded'
      );
      
      const actualTotalSpent = validOrders.reduce((sum, order) => sum + order.amount, 0);
      const actualOrderCount = validOrders.length;
      const actualAvg = actualOrderCount > 0 ? actualTotalSpent / actualOrderCount : 0;

      console.log('\nCalculated values:');
      console.log(`- Total Spent: $${actualTotalSpent.toFixed(2)}`);
      console.log(`- Order Count: ${actualOrderCount}`);
      console.log(`- Avg Order Value: $${actualAvg.toFixed(2)}`);

      // Check for discrepancies
      const totalSpentDiff = Math.abs(customer.totalSpent - actualTotalSpent) > 0.01;
      const orderCountDiff = customer.orderCount !== orders.length;
      const avgDiff = Math.abs(storedAvg - actualAvg) > 0.01;

      if (totalSpentDiff || orderCountDiff || avgDiff) {
        console.log('\n⚠️ DISCREPANCY DETECTED ⚠️');
        if (totalSpentDiff) {
          console.log(`- Total Spent: $${customer.totalSpent.toFixed(2)} (stored) vs $${actualTotalSpent.toFixed(2)} (actual)`);
        }
        if (orderCountDiff) {
          console.log(`- Order Count: ${customer.orderCount} (stored) vs ${orders.length} (actual)`);
        }
        if (avgDiff) {
          console.log(`- Avg Order Value: $${storedAvg.toFixed(2)} (stored) vs $${actualAvg.toFixed(2)} (actual)`);
        }
      } else {
        console.log('\n✅ No discrepancies found');
      }
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
    console.log('\nVerification complete. The fix should now calculate order summary values correctly in real-time.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
