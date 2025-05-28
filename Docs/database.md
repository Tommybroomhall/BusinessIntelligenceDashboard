# Business Intelligence Dashboard Database Documentation

## Overview

The Business Intelligence Dashboard uses MongoDB for database operations. The application is designed to support multi-tenancy, allowing different clients to have their own isolated data within their own dedicated databases or within the same database. MongoDB was chosen for its flexibility, scalability, and ease of use with document-based data models.

## Current Implementation Status

The database integration has been implemented with MongoDB:

1. **Schema Definition**: The database schema is defined using Mongoose schemas in `server/models.ts`.
2. **MongoDB Connection**: The application connects to MongoDB using Mongoose in `server/db.ts`, with support for separate databases per client.
3. **Storage Implementation**: The application uses a MongoDB storage implementation (`MongoStorage` class in `server/mongoStorage.ts`) for database operations, with support for client-specific database connections.
4. **Fallback Mechanism**: The application includes a fallback to in-memory storage if a MongoDB connection is not available, making it possible to run the application without a database for demonstration purposes.
5. **Factory Pattern**: A storage factory (`server/storageFactory.ts`) determines which storage implementation to use based on the availability of a MongoDB connection and supports client-specific storage instances.

## Database Architecture

The Business Intelligence Dashboard supports two approaches to multi-tenancy:

1. **Collection-based multi-tenancy**: All clients' data is stored in the same database, with a `tenantId` field to isolate each client's data.
2. **Database-based multi-tenancy**: Each client has their own dedicated database, providing stronger isolation.

The application supports both approaches and can be configured based on the specific requirements of the deployment.

## Database Schema

The database schema is defined in `server/models.ts` using Mongoose schemas:

### Enums

```typescript
export const UserRoles = ['admin', 'editor', 'viewer'] as const;
export const LeadStatuses = ['new', 'contacted', 'won', 'lost'] as const;
export const OrderStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'refunded', 'canceled'] as const;
export const StockLevels = ['none', 'low', 'good', 'high'] as const;
```

### Collections

1. **Tenant**
   - Primary collection for multi-tenant support
   - Stores client-specific information including branding and API integrations
   - Schema includes fields for name, email, phone, address, website, branding, and API keys

2. **User**
   - User accounts associated with tenants
   - Includes authentication and role information
   - Each user document references a tenant via `tenantId`

3. **Product**
   - Product catalog for each tenant
   - Includes pricing, stock levels, and product details
   - Each product document references a tenant via `tenantId`

4. **Order**
   - Customer orders with status tracking
   - Linked to tenants for multi-tenant isolation
   - Each order document references a tenant via `tenantId`

5. **OrderItem**
   - Line items for orders
   - Links products to orders
   - Each order item document references an order via `orderId` and a product via `productId`

6. **TrafficData**
   - Website traffic analytics
   - Stores page views, visitors, and traffic sources
   - Each traffic data document references a tenant via `tenantId`

7. **ActivityLog**
   - System activity logging
   - Tracks user actions and system events
   - Each activity log document references a tenant via `tenantId` and optionally a user via `userId`

## Client-Specific Database Configuration

The application now supports dynamically connecting to different databases for different clients. This is implemented in three main components:

### 1. DB Connection Module (`server/db.ts`)

The `db.ts` module now provides functions to:

- Connect to the default database using the connection string built from environment variables
- Create and manage client-specific database connections
- Generate database connection URIs dynamically based on client IDs

```typescript
// Create a MongoDB connection URI for a specific database
export function createConnectionUri(dbName?: string): string {
  const database = dbName || process.env.MONGODB_DATABASE || 'businessdash';
  
  // Using template variables from .env
  return `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${database}?retryWrites=true&w=majority`;
}

// Get or create a connection to a client-specific database
export async function getClientConnection(clientId: string): Promise<mongoose.Connection> {
  // Create database name from client ID
  const dbName = `client_${clientId}`;
  const uri = createConnectionUri(dbName);
  
  // Create a new connection
  const conn = mongoose.createConnection(uri, options);
  
  return conn;
}
```

### 2. Storage Factory (`server/storageFactory.ts`)

The storage factory now supports client-specific storage instances:

```typescript
// Get storage instance for a specific client
export async function getStorage(clientId?: string): Promise<IStorage> {
  // If clientId is provided, try to get or create client-specific storage
  if (clientId) {
    // Create a new client-specific storage instance
    const mongoStorage = new MongoStorage(clientId);
    await mongoStorage.initializeData();
    return mongoStorage;
  }
  
  // If no clientId, use default storage
  // ...
}
```

### 3. MongoDB Storage Implementation (`server/mongoStorage.ts`)

The `MongoStorage` class now supports client-specific database connections:

```typescript
export class MongoStorage implements IStorage {
  private clientId?: string;
  private connection: mongoose.Connection | null = null;

  constructor(clientId?: string) {
    this.clientId = clientId;
  }

  async initializeData() {
    // Get client-specific connection if clientId is provided
    if (this.clientId) {
      this.connection = await getClientConnection(this.clientId);
    }
    
    // Initialize database with client-specific data
    // ...
  }

  // Use client-specific models for all operations
  private getModel<T>(modelName: string): mongoose.Model<T> {
    if (this.connection) {
      // Use the client-specific connection model
      return this.connection.model<T>(modelName, mongoose.model(modelName).schema);
    }
    // Use the default model
    return mongoose.model<T>(modelName);
  }
}
```

## Setting Up the Database

### Prerequisites

1. MongoDB Atlas account (or a local MongoDB server)
2. Database user with read/write privileges

### Steps to Set Up the Database

1. **Create a MongoDB Atlas Cluster** (if not using a local MongoDB server):
   - Sign up for a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
   - Create a new cluster (the free tier is sufficient for development)
   - Set up network access to allow connections from your IP address
   - Create a database user with read/write privileges

2. **Configure Environment Variables**:
   Create a `.env` file in the project root with:
   ```env
   # MongoDB Configuration
   MONGODB_USERNAME=your_mongodb_username
   MONGODB_PASSWORD=your_mongodb_password
   MONGODB_CLUSTER=your_cluster.mongodb.net
   MONGODB_DATABASE=businessdash
   
   # Session Secret
   SESSION_SECRET=your_session_secret
   ```

3. **Start the Application**:
   ```bash
   npm run dev
   ```
   The application will automatically connect to MongoDB, create the necessary databases (if they don't exist), and initialize the collections.

## Database Creation

MongoDB will automatically create databases and collections when data is first inserted. The application will:

1. Connect to the main database as defined in `MONGODB_DATABASE` environment variable.
2. For client-specific databases, connect to a database named `client_{clientId}`.
3. Create collections and initialize them with sample data if they don't exist.

## Managing Multiple Clients

To set up dashboards for multiple clients:

1. Each client gets a unique ID in the system (typically stored in the Tenant collection).
2. When accessing client-specific data, use `getStorage(clientId)` to get a storage instance connected to the client's database.
3. The application will automatically create client-specific databases as needed.

## Data Migration Considerations

If you need to migrate data from another database or from the in-memory storage to MongoDB, consider the following steps:

1. Extract data from the source system
2. Transform it to match the MongoDB schema
3. Use MongoDB's bulk insert operations for efficient loading
4. Validate data integrity after migration

## Schema Extension Considerations

According to `PROJECT_PLAN.md`, there are plans to extend the tenant schema with additional fields. With MongoDB, this is straightforward:

```typescript
// Example of extending the Tenant schema
const TenantSchema = new Schema<ITenant>({
  // Existing fields
  name: { type: String, required: true },
  email: String,
  // ...

  // New fields
  customDomain: String,
  secondaryColor: String,
  faviconUrl: String,
  emailTemplateId: Schema.Types.ObjectId
});
```

## Recommendations

1. **Set Up MongoDB Atlas**: For production use, consider using MongoDB Atlas for managed database services.
2. **Remove Leads Collection**: As per requirements, the leads functionality should be removed from the system.
3. **Add Database Indexes**: Create indexes on frequently queried fields for better performance.
4. **Implement Connection Pooling**: The current implementation includes connection pooling configuration.
5. **Add Database Backup Strategy**: Set up automated backups for production use.
6. **Implement Data Validation**: Use Mongoose schema validation to ensure data integrity.
7. **Consider Sharding**: For large-scale deployments, consider sharding the database by tenant.

## Conclusion

The Business Intelligence Dashboard now uses MongoDB for database operations, providing a flexible, scalable solution for multi-tenant applications. The implementation includes both MongoDB storage and a fallback to in-memory storage for development and testing purposes.
