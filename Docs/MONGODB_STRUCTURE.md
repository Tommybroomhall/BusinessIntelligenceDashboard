# MongoDB Database Structure

This document provides a detailed overview of the MongoDB database structure for the Business Intelligence Dashboard, including collections, schemas, relationships, and available dummy data.

## Database Overview

The application uses MongoDB with Mongoose as the ODM (Object Document Mapper). The database is designed to support multi-tenancy, where each client (tenant) has their own isolated data.

**Database Name**: `businessdash` (configurable via environment variables)

## Collections

### 1. Tenants

The `tenants` collection stores information about each client using the dashboard.

#### Schema

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  name: String,                     // Required: Company name
  email: String,                    // Optional: Contact email
  phone: String,                    // Optional: Contact phone
  address: String,                  // Optional: Physical address
  website: String,                  // Optional: Company website
  createdAt: Date,                  // Auto: Creation timestamp
  updatedAt: Date,                  // Auto: Last update timestamp
  logoUrl: String,                  // Optional: URL to company logo
  primaryColor: String,             // Default: "#0ea5e9" (blue)
  stripeCustomerId: String,         // Optional: Stripe customer ID
  stripeSubscriptionId: String,     // Optional: Stripe subscription ID
  stripeSecretKey: String,          // Optional: Stripe secret key
  ga4Key: String,                   // Optional: Google Analytics key
  vercelApiToken: String,           // Optional: Vercel API token
  vercelProjectId: String,          // Optional: Vercel project ID
  vercelTeamId: String              // Optional: Vercel team ID
}
```

#### Dummy Data

- **Main Tenant**: BusinessDash Inc.
  - Email: info@businessdash.com
  - Phone: +1 (555) 123-4567
  - Address: 123 Main St, Suite 200, San Francisco, CA 94105
  - Website: https://www.businessdash.com
  - Primary Color: #0ea5e9

- **Additional Tenants**: 2 randomly generated companies with realistic data

### 2. Users

The `users` collection stores user accounts that can access the dashboard.

#### Schema

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  tenantId: ObjectId,               // Required: Reference to tenant
  email: String,                    // Required: Unique email address
  name: String,                     // Required: Full name
  passwordHash: String,             // Required: Bcrypt hashed password
  role: String,                     // Enum: "admin", "editor", "viewer"
  createdAt: Date,                  // Auto: Creation timestamp
  updatedAt: Date,                  // Auto: Last update timestamp
  isActive: Boolean                 // Default: true
}
```

#### Dummy Data

- **Admin User** (for main tenant):
  - Email: admin@businessdash.com
  - Password: password123 (hashed in DB)
  - Name: Jane Smith
  - Role: admin

- **Additional Users**: ~5 per tenant with various roles (admin, editor, viewer)

### 3. Products

The `products` collection stores product information for each tenant.

#### Schema

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  tenantId: ObjectId,               // Required: Reference to tenant
  name: String,                     // Required: Product name
  description: String,              // Optional: Product description
  price: Number,                    // Required: Selling price
  costPrice: Number,                // Optional: Cost price
  category: String,                 // Optional: Product category
  imageUrl: String,                 // Optional: Product image URL
  supplierUrl: String,              // Optional: Supplier website
  stockLevel: String,               // Enum: "none", "low", "good", "high"
  createdAt: Date,                  // Auto: Creation timestamp
  updatedAt: Date,                  // Auto: Last update timestamp
  isActive: Boolean                 // Default: true
}
```

#### Dummy Data

- **30 products per tenant** with:
  - Realistic product names and descriptions
  - Prices ranging from $10 to $1000
  - Cost prices at 40-70% of selling price
  - Categories from: Electronics, Clothing, Home & Kitchen, Beauty, Sports, Books, Toys, Jewelry, Automotive, Health
  - Stock levels randomly distributed
  - Placeholder image URLs
  - 90% active, 10% inactive

### 4. Customers

The `customers` collection stores customer information for each tenant.

#### Schema

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  tenantId: ObjectId,               // Required: Reference to tenant
  name: String,                     // Required: Customer name
  email: String,                    // Required: Customer email
  phone: String,                    // Required: Customer phone
  location: String,                 // Required: Customer location
  totalSpent: Number,               // Default: 0
  orderCount: Number,               // Default: 0
  lastOrderDate: Date,              // Default: Current date
  status: String,                   // Enum: "active", "inactive"
  createdAt: Date,                  // Auto: Creation timestamp
  updatedAt: Date                   // Auto: Last update timestamp
}
```

#### Dummy Data

- **50 customers per tenant** with:
  - Realistic names, emails, and phone numbers
  - Locations based on real cities and states
  - Total spent ranging from $0 to $10,000
  - Order counts between 0 and 20
  - Last order dates within the past year
  - Mostly active status (80% active, 20% inactive)

### 5. Orders

The `orders` collection stores order information for each tenant.

#### Schema

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  tenantId: ObjectId,               // Required: Reference to tenant
  orderNumber: String,              // Required: Unique order number
  customerName: String,             // Required: Customer name
  customerEmail: String,            // Optional: Customer email
  amount: Number,                   // Required: Total order amount
  status: String,                   // Enum: "pending", "paid", "processing", 
                                    // "shipped", "delivered", "refunded", "canceled"
  createdAt: Date,                  // Auto: Creation timestamp
  updatedAt: Date                   // Auto: Last update timestamp
}
```

#### Dummy Data

- **100 orders per tenant** with:
  - Unique order numbers in format: ORD-{tenant-id}-{timestamp}-{index}
  - Customer information from the customers collection
  - Order amounts calculated from order items
  - Statuses randomly distributed across all possible values
  - Creation dates within the past year
  - Update dates within the past month

### 6. Order Items

The `orderitems` collection stores the individual items within each order.

#### Schema

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  orderId: ObjectId,                // Required: Reference to order
  productId: ObjectId,              // Required: Reference to product
  quantity: Number,                 // Required: Quantity ordered
  price: Number                     // Required: Price at time of order
}
```

#### Dummy Data

- **~3 items per order on average** (1-5 items per order)
- Each item references a real product from the products collection
- Quantities between 1 and 5 units
- Prices match the referenced product's price

### 7. Traffic Data

The `trafficdatas` collection stores website traffic analytics.

#### Schema

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  tenantId: ObjectId,               // Required: Reference to tenant
  date: Date,                       // Required: Date of traffic
  page: String,                     // Required: Page URL/path
  views: Number,                    // Required: Page views
  uniqueVisitors: Number,           // Required: Unique visitors
  bounceRate: Number,               // Optional: Bounce rate percentage
  source: String,                   // Optional: Traffic source
  medium: String,                   // Optional: Traffic medium
  campaign: String,                 // Optional: Campaign name
  deviceType: String                // Optional: Device type
}
```

#### Dummy Data

- **30 days of traffic data** for each tenant
- Data for 10 different pages including homepage, dashboard, products, orders, etc.
- Realistic traffic patterns (weekends have less traffic)
- Traffic sources include: google, facebook, instagram, twitter, direct, email, referral, bing, youtube, tiktok
- Traffic mediums include: organic, cpc, social, email, referral, none, display
- Device types include: desktop, mobile, tablet
- Bounce rates vary by page type (higher for homepage, lower for dashboard)

### 8. Activity Logs

The `activitylogs` collection tracks user activities within the dashboard.

#### Schema

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  tenantId: ObjectId,               // Required: Reference to tenant
  userId: ObjectId,                 // Optional: Reference to user
  activityType: String,             // Required: Type of activity
  description: String,              // Required: Description of activity
  entityType: String,               // Optional: Type of entity affected
  entityId: ObjectId,               // Optional: ID of entity affected
  metadata: Object,                 // Optional: Additional data
  createdAt: Date                   // Auto: Creation timestamp
}
```

#### Dummy Data

- **100 activity logs per tenant**
- Activity types include: login, logout, create_product, update_product, delete_product, create_order, update_order, create_customer, update_customer
- Each log references a real user from the users collection
- Creation dates within the past month
- Metadata includes relevant information based on activity type

## Relationships

The database uses references to establish relationships between collections:

1. **One-to-Many: Tenant to Users**
   - A tenant has many users
   - Users belong to one tenant (via `tenantId`)

2. **One-to-Many: Tenant to Products**
   - A tenant has many products
   - Products belong to one tenant (via `tenantId`)

3. **One-to-Many: Tenant to Customers**
   - A tenant has many customers
   - Customers belong to one tenant (via `tenantId`)

4. **One-to-Many: Tenant to Orders**
   - A tenant has many orders
   - Orders belong to one tenant (via `tenantId`)

5. **One-to-Many: Order to Order Items**
   - An order has many order items
   - Order items belong to one order (via `orderId`)

6. **One-to-Many: Product to Order Items**
   - A product can be in many order items
   - Order items reference one product (via `productId`)

7. **One-to-Many: Tenant to Traffic Data**
   - A tenant has many traffic data records
   - Traffic data belongs to one tenant (via `tenantId`)

8. **One-to-Many: Tenant to Activity Logs**
   - A tenant has many activity logs
   - Activity logs belong to one tenant (via `tenantId`)

9. **One-to-Many: User to Activity Logs**
   - A user can have many activity logs
   - Activity logs can reference one user (via `userId`)

## Indexes

The following indexes are automatically created by Mongoose:

1. `tenants`: `_id` (primary key)
2. `users`: `_id` (primary key), `email` (unique)
3. `products`: `_id` (primary key)
4. `customers`: `_id` (primary key)
5. `orders`: `_id` (primary key), `orderNumber` (unique)
6. `orderitems`: `_id` (primary key)
7. `trafficdatas`: `_id` (primary key)
8. `activitylogs`: `_id` (primary key)

## Querying Examples

### Finding a User by Email

```javascript
const user = await User.findOne({ email: 'admin@businessdash.com' });
```

### Finding Products for a Specific Tenant

```javascript
const tenantProducts = await Product.find({ tenantId: tenantId });
```

### Finding Orders with Status "pending"

```javascript
const pendingOrders = await Order.find({ 
  tenantId: tenantId,
  status: 'pending'
});
```

### Finding Order Items for a Specific Order

```javascript
const orderItems = await OrderItem.find({ orderId: orderId });
```

### Aggregating Sales Data by Day

```javascript
const salesByDay = await Order.aggregate([
  { $match: { tenantId: mongoose.Types.ObjectId(tenantId) } },
  { $group: { 
    _id: { 
      $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
    },
    totalSales: { $sum: "$amount" },
    orderCount: { $sum: 1 }
  }},
  { $sort: { _id: 1 } }
]);
```

## Multi-Tenancy Implementation

The application implements multi-tenancy through data segregation:

1. Every document contains a `tenantId` field that links it to a specific tenant
2. All queries include the `tenantId` to ensure data isolation
3. The application uses middleware to automatically filter data by the current tenant

This approach ensures that each client only sees their own data, even though they share the same database.

## Accessing the Dummy Data

To access the dummy data for testing and development:

1. Run the application in development mode: `npm run dev`
2. Log in with the admin credentials:
   - Email: admin@businessdash.com
   - Password: password123
3. You'll have access to all the dummy data for the main tenant

To regenerate the dummy data:

```bash
npm run db:load-dummy-data
```

This will clear the existing data and create fresh dummy data based on the configuration in the script.
