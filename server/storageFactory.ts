import { IStorage } from "./types";
import { MemStorage } from "./storage";
import { MongoStorage } from "./mongoStorage";
import { log } from "./vite";

// Map to cache storage instances by client ID
const clientStorageInstances = new Map<string, IStorage>();

// Default storage instance (used when no client ID is provided)
let defaultStorageInstance: IStorage | null = null;

/**
 * Factory function to get the appropriate storage implementation
 * If MongoDB connection is available, use MongoStorage, otherwise use MemStorage
 * @param clientId Optional client ID for client-specific storage
 * @returns Storage implementation
 */
export async function getStorage(clientId?: string): Promise<IStorage> {
  // If clientId is provided, try to get or create client-specific storage
  if (clientId) {
    // Check if we already have a storage instance for this client
    if (clientStorageInstances.has(clientId)) {
      return clientStorageInstances.get(clientId)!;
    }
    
    // Create a new client-specific storage instance
    try {
      log(`Creating MongoDB storage for client '${clientId}'`, "storage");
      const mongoStorage = new MongoStorage(clientId);
      await mongoStorage.initializeData();
      clientStorageInstances.set(clientId, mongoStorage);
      return mongoStorage;
    } catch (error) {
      log(`Error initializing MongoDB storage for client '${clientId}': ${error}. Falling back to in-memory storage.`, "storage");
    }
  }
  
  // If no clientId or failed to create client-specific storage, use default storage
  if (defaultStorageInstance) {
    return defaultStorageInstance;
  }

  // Check if MongoDB is available (either via credentials or URI, or already connected)
  const hasMongoCredentials = process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD && process.env.MONGODB_CLUSTER;
  const hasMongoUri = process.env.MONGODB_URI;
  
  // Also check if mongoose is already connected
  const mongoose = require('mongoose');
  const isMongooseConnected = mongoose.connection.readyState === 1;
  
  if (hasMongoCredentials || hasMongoUri || isMongooseConnected) {
    try {
      log("Using MongoDB storage implementation", "storage");
      const mongoStorage = new MongoStorage();
      await mongoStorage.initializeData();
      defaultStorageInstance = mongoStorage;
      return mongoStorage;
    } catch (error) {
      log(`Error initializing MongoDB storage: ${error}. Falling back to in-memory storage.`, "storage");
    }
  }

  // Fallback to in-memory storage
  log("Using in-memory storage implementation", "storage");
  const memStorage = new MemStorage();
  defaultStorageInstance = memStorage;
  return memStorage;
}

/**
 * Clear storage instances cache
 * Useful for testing and when application needs to reset connections
 */
export function clearStorageInstances() {
  clientStorageInstances.clear();
  defaultStorageInstance = null;
  log("Cleared all storage instances", "storage");
}
