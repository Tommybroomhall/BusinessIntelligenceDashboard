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
    // Check if we have a connection string
    if (!process.env.MONGODB_URI) {
      log('No MongoDB connection string. Using in-memory storage.', 'mongodb');
      return false;
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, options);

    log('Connected to MongoDB successfully', 'mongodb');
    return true;
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
