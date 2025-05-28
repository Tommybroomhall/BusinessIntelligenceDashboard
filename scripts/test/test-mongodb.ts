import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// MongoDB connection options
const options = {
  autoIndex: true, // Build indexes
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};

/**
 * Test MongoDB connection
 */
async function testMongoDBConnection() {
  console.log('Testing MongoDB connection...');
  
  // Check if MongoDB credentials are available
  if (!process.env.MONGODB_USERNAME || !process.env.MONGODB_PASSWORD || !process.env.MONGODB_CLUSTER) {
    console.error('MongoDB credentials not found in environment variables.');
    console.log('Please set MONGODB_USERNAME, MONGODB_PASSWORD, and MONGODB_CLUSTER in your .env file.');
    process.exit(1);
  }
  
  // Create MongoDB connection URI
  const database = process.env.MONGODB_DATABASE || 'businessdash';
  const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${database}?retryWrites=true&w=majority`;
  
  try {
    // Connect to MongoDB
    console.log(`Attempting to connect to MongoDB database: ${database}`);
    await mongoose.connect(uri, options);
    
    console.log('Connected to MongoDB successfully!');
    
    // Get list of collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    if (collections.length === 0) {
      console.log('No collections found. Database is empty.');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
    return true;
  } catch (error) {
    console.error(`MongoDB connection error: ${error}`);
    return false;
  }
}

// Run the test
testMongoDBConnection()
  .then(success => {
    if (success) {
      console.log('\nMongoDB connection test completed successfully.');
      process.exit(0);
    } else {
      console.error('\nMongoDB connection test failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(`Unexpected error: ${error}`);
    process.exit(1);
  });
