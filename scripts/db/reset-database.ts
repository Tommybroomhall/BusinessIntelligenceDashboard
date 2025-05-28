/**
 * Script to reset the MongoDB database and reload mock data
 *
 * This script:
 * 1. Connects to MongoDB
 * 2. Clears all existing data
 * 3. Runs the load-dummy-data.ts script to reload mock data with the correct schema
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Tenant,
  User,
  Customer,
  Product,
  Order,
  OrderItem,
  TrafficData,
  ActivityLog
} from '../../server/models';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * Connect to MongoDB database
 */
async function connectToDatabase() {
  try {
    // Check if we have MongoDB credentials
    if (process.env.MONGODB_URI) {
      // Connect to MongoDB using the connection string
      await mongoose.connect(process.env.MONGODB_URI, options);
      console.log('Connected to MongoDB successfully');
      return true;
    } else if (process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD && process.env.MONGODB_CLUSTER) {
      // Create MongoDB connection URI
      const database = process.env.MONGODB_DATABASE || 'businessdash';
      const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${database}?retryWrites=true&w=majority`;

      console.log(`Connecting to MongoDB database: ${database}`);
      await mongoose.connect(uri, options);

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
  console.log('Clearing existing data...');

  try {
    await ActivityLog.deleteMany({});
    console.log('- Cleared ActivityLog collection');

    await TrafficData.deleteMany({});
    console.log('- Cleared TrafficData collection');

    await OrderItem.deleteMany({});
    console.log('- Cleared OrderItem collection');

    await Order.deleteMany({});
    console.log('- Cleared Order collection');

    await Product.deleteMany({});
    console.log('- Cleared Product collection');

    await Customer.deleteMany({});
    console.log('- Cleared Customer collection');

    await User.deleteMany({});
    console.log('- Cleared User collection');

    await Tenant.deleteMany({});
    console.log('- Cleared Tenant collection');

    console.log('All existing data cleared successfully');
  } catch (error) {
    console.error(`Error clearing data: ${error}`);
    throw error;
  }
}

/**
 * Run the load-dummy-data.ts script
 */
function runLoadDummyDataScript() {
  return new Promise<void>((resolve, reject) => {
    console.log('Running load-dummy-data.ts script...');

    const scriptPath = path.join(__dirname, 'load-dummy-data.ts');
    const command = `npx tsx "${scriptPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing load-dummy-data.ts: ${error.message}`);
        console.error(stderr);
        reject(error);
        return;
      }

      console.log(stdout);
      console.log('Mock data loaded successfully');
      resolve();
    });
  });
}

/**
 * Main function to reset the database and reload mock data
 */
async function resetDatabase() {
  console.log('Starting database reset...');

  try {
    // Connect to MongoDB
    const connected = await connectToDatabase();
    if (!connected) {
      console.error('Failed to connect to MongoDB. Exiting...');
      process.exit(1);
    }

    // Clear existing data
    await clearExistingData();

    // Disconnect from MongoDB (to allow the load-dummy-data script to connect)
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

    // Run the load-dummy-data.ts script
    await runLoadDummyDataScript();

    console.log('\nDatabase reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error resetting database: ${error}`);
    process.exit(1);
  }
}

// Run the script
resetDatabase();
