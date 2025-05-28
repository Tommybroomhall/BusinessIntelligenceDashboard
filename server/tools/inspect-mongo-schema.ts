import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

async function inspectMongoSchema() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/businessdash');
    console.log('Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });

    // Inspect products collection if it exists
    if (collections.some(c => c.name === 'products')) {
      console.log('\nInspecting products collection:');
      const products = await mongoose.connection.db.collection('products').find().limit(1).toArray();
      
      if (products.length > 0) {
        console.log('\nSample product document:');
        console.log(JSON.stringify(products[0], null, 2));
        
        console.log('\nProduct document structure:');
        for (const [key, value] of Object.entries(products[0])) {
          console.log(` - ${key}: ${typeof value} (${value instanceof mongoose.Types.ObjectId ? 'ObjectId' : 
            Array.isArray(value) ? 'Array' : value?.constructor?.name || typeof value})`);
        }
        
        // Count products
        const count = await mongoose.connection.db.collection('products').countDocuments();
        console.log(`\nTotal products in collection: ${count}`);
      } else {
        console.log('No products found in the collection');
      }
    } else {
      console.log('\nProducts collection not found!');
    }

    // Also check customers for comparison (since we know it works)
    if (collections.some(c => c.name === 'customers')) {
      console.log('\nInspecting customers collection for comparison:');
      const customers = await mongoose.connection.db.collection('customers').find().limit(1).toArray();
      
      if (customers.length > 0) {
        console.log('\nSample customer document:');
        console.log(JSON.stringify(customers[0], null, 2));
        
        console.log('\nCustomer document structure:');
        for (const [key, value] of Object.entries(customers[0])) {
          console.log(` - ${key}: ${typeof value} (${value instanceof mongoose.Types.ObjectId ? 'ObjectId' : 
            Array.isArray(value) ? 'Array' : value?.constructor?.name || typeof value})`);
        }
      } else {
        console.log('No customers found in the collection');
      }
    }

  } catch (error) {
    console.error('Error inspecting MongoDB:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the inspection function
inspectMongoSchema(); 