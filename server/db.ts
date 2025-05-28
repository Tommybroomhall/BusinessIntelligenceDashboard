import mongoose from 'mongoose';
import { log } from './vite';

// MongoDB connection options
const options = {
  autoIndex: true, // Build indexes
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};

/**
 * Connect to MongoDB database
 * @returns true if connected successfully, false otherwise
 */
export async function connectToDatabase() {
  try {
    // Check if we have MongoDB credentials
    if (process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD && process.env.MONGODB_CLUSTER) {
      // Create MongoDB connection URI
      const database = process.env.MONGODB_DATABASE || 'businessdash';
      const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${database}?retryWrites=true&w=majority`;

      // Connect to MongoDB
      await mongoose.connect(uri, options);

      log('Connected to MongoDB successfully', 'mongodb');
      return true;
    } else if (process.env.MONGODB_URI) {
      // Connect to MongoDB using the connection string
      await mongoose.connect(process.env.MONGODB_URI, options);

      log('Connected to MongoDB successfully', 'mongodb');
      return true;
    } else {
      log('No MongoDB connection string or credentials. Using in-memory storage.', 'mongodb');
      return false;
    }
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongodb');
    return false;
  }
}

/**
 * Disconnect from MongoDB database
 */
export async function disconnectFromDatabase() {
  try {
    await mongoose.disconnect();
    log('Disconnected from MongoDB', 'mongodb');
    return true;
  } catch (error) {
    log(`MongoDB disconnection error: ${error}`, 'mongodb');
    return false;
  }
}

// Export mongoose instance
export { mongoose };
