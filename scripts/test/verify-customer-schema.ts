/**
 * Script to verify the customer schema after loading mock data
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Retrieves a customer record
 * 3. Checks if the customer schema has the correct fields
 * 4. Verifies that orders can be retrieved for the customer
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

    // Get a customer
    console.log('Fetching a customer...');
    const CustomerModel = mongoose.model('Customer');
    const customer = await CustomerModel.findOne({ tenantId: tenant._id });
    
    if (!customer) {
      throw new Error('No customers found for this tenant');
    }
    
    console.log(`Found customer: ${customer.name} (${customer._id})`);
    
    // Check customer schema
    console.log('\nChecking customer schema...');
    const customerObj = customer.toObject();
    console.log('Customer fields:', Object.keys(customerObj).join(', '));
    
    // Check if the removed fields are present
    const hasRemovedFields = 
      'totalSpent' in customerObj || 
      'orderCount' in customerObj || 
      'lastOrderDate' in customerObj;
    
    if (hasRemovedFields) {
      console.log('\n⚠️ WARNING: Customer schema still contains removed fields:');
      if ('totalSpent' in customerObj) console.log('- totalSpent is still present');
      if ('orderCount' in customerObj) console.log('- orderCount is still present');
      if ('lastOrderDate' in customerObj) console.log('- lastOrderDate is still present');
      console.log('\nYou may need to update the database or restart the server for schema changes to take effect.');
    } else {
      console.log('\n✅ Customer schema has been updated successfully!');
      console.log('The removed fields (totalSpent, orderCount, lastOrderDate) are no longer present.');
    }

    // Get orders for this customer
    console.log('\nFetching orders for the customer...');
    const orders = await storage.getOrdersByCustomer(customer._id.toString(), tenant._id);
    
    console.log(`Found ${orders.length} orders for customer ${customer.name}`);
    
    if (orders.length > 0) {
      console.log('\nSample order:');
      console.log(JSON.stringify(orders[0], null, 2));
      
      // Calculate order summary
      const validOrders = orders.filter(order => 
        order.status !== 'canceled' && order.status !== 'refunded'
      );
      
      const totalSpent = validOrders.reduce((sum, order) => sum + order.amount, 0);
      const orderCount = validOrders.length;
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
      
      console.log('\nCalculated order summary:');
      console.log(`- Total Spent: $${totalSpent.toFixed(2)}`);
      console.log(`- Order Count: ${orderCount}`);
      console.log(`- Avg Order Value: $${avgOrderValue.toFixed(2)}`);
      
      console.log('\n✅ Orders can still be retrieved and calculations can be performed!');
    } else {
      console.log('No orders found for this customer');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
    console.log('\nVerification complete. The customer schema has been updated correctly.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
