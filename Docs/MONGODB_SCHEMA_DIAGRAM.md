# MongoDB Schema Diagram

This document provides a visual representation of the MongoDB schema and relationships for the Business Intelligence Dashboard.

## Entity Relationship Diagram

```
+----------------+       +----------------+       +----------------+
|    Tenants     |       |     Users      |       |    Products    |
+----------------+       +----------------+       +----------------+
| _id            |<---+  | _id            |       | _id            |
| name           |    |  | tenantId       |----+  | tenantId       |----+
| email          |    |  | email          |    |  | name           |    |
| phone          |    |  | name           |    |  | description    |    |
| address        |    |  | passwordHash   |    |  | price          |    |
| website        |    |  | role           |    |  | costPrice      |    |
| createdAt      |    |  | createdAt      |    |  | category       |    |
| updatedAt      |    |  | updatedAt      |    |  | imageUrl       |    |
| logoUrl        |    |  | isActive       |    |  | supplierUrl    |    |
| primaryColor   |    |  +----------------+    |  | stockLevel     |    |
| stripeCustomerId|    |                       |  | createdAt      |    |
| stripeSubId    |    +--+                    |  | updatedAt      |    |
| stripeSecretKey|       |                    |  | isActive       |    |
| ga4Key         |       |                    |  +----------------+    |
| vercelApiToken |       |                    |                        |
| vercelProjectId|       |                    |                        |
| vercelTeamId   |       |                    |                        |
+----------------+       |                    |                        |
                         |                    |                        |
+----------------+       |  +----------------+|       +----------------+
|   Customers    |       |  |     Orders     ||       |  Order Items   |
+----------------+       |  +----------------+|       +----------------+
| _id            |       |  | _id            ||       | _id            |
| tenantId       |----+  |  | tenantId       |----+  | orderId         |<--+
| name           |    |  |  | orderNumber    |    |  | productId       |<----+
| email          |    |  |  | customerName   |    |  | quantity        |     |
| phone          |    |  |  | customerEmail  |    |  | price           |     |
| location       |    |  |  | amount         |    |  +----------------+     |
| totalSpent     |    |  |  | status         |    |                         |
| orderCount     |    |  |  | createdAt      |    |                         |
| lastOrderDate  |    |  |  | updatedAt      |    |                         |
| status         |    |  |  +----------------+    |                         |
| createdAt      |    |  |                        |                         |
| updatedAt      |    |  |                        |                         |
+----------------+    |  |                        |                         |
                      |  |                        |                         |
+----------------+    |  |  +----------------+    |                         |
| Traffic Data   |    |  |  | Activity Logs  |    |                         |
+----------------+    |  |  +----------------+    |                         |
| _id            |    |  |  | _id            |    |                         |
| tenantId       |----+  |  | tenantId       |----+                         |
| date           |       |  | userId         |<---+                         |
| page           |       |  | activityType   |                              |
| views          |       |  | description    |                              |
| uniqueVisitors |       |  | entityType     |                              |
| bounceRate     |       |  | entityId       |                              |
| source         |       |  | metadata       |                              |
| medium         |       |  | createdAt      |                              |
| campaign       |       |  +----------------+                              |
| deviceType     |       |                                                  |
+----------------+       +--------------------------------------------------+
```

## Collection Relationships

1. **Tenant → Users**: One-to-Many
   - A tenant has many users
   - Each user belongs to one tenant

2. **Tenant → Products**: One-to-Many
   - A tenant has many products
   - Each product belongs to one tenant

3. **Tenant → Customers**: One-to-Many
   - A tenant has many customers
   - Each customer belongs to one tenant

4. **Tenant → Orders**: One-to-Many
   - A tenant has many orders
   - Each order belongs to one tenant

5. **Order → Order Items**: One-to-Many
   - An order has many order items
   - Each order item belongs to one order

6. **Product → Order Items**: One-to-Many
   - A product can be in many order items
   - Each order item references one product

7. **Tenant → Traffic Data**: One-to-Many
   - A tenant has many traffic data records
   - Each traffic data record belongs to one tenant

8. **Tenant → Activity Logs**: One-to-Many
   - A tenant has many activity logs
   - Each activity log belongs to one tenant

9. **User → Activity Logs**: One-to-Many
   - A user can have many activity logs
   - Each activity log can reference one user

## Data Flow Diagram

```
                                +----------------+
                                |     Tenant     |
                                +----------------+
                                        |
                                        |
                +---------------------------------------------+
                |                       |                     |
                |                       |                     |
        +----------------+     +----------------+     +----------------+
        |      User      |     |    Customer    |     |     Product    |
        +----------------+     +----------------+     +----------------+
                |                       |                     |
                |                       |                     |
        +----------------+     +----------------+             |
        | Activity Log   |     |      Order     |-------------+
        +----------------+     +----------------+             |
                                        |                     |
                                        |                     |
                                +----------------+            |
                                |   Order Item   |------------+
                                +----------------+
```

## Multi-Tenancy Implementation

The application implements multi-tenancy through data segregation:

```
                    +----------------+
                    |   Tenant A     |
                    +----------------+
                            |
                            v
    +-----------------------------------------------+
    |                                               |
    |   +----------+  +----------+  +----------+   |
    |   | Users A  |  | Orders A |  |Products A|   |
    |   +----------+  +----------+  +----------+   |
    |                                               |
    +-----------------------------------------------+

                    +----------------+
                    |   Tenant B     |
                    +----------------+
                            |
                            v
    +-----------------------------------------------+
    |                                               |
    |   +----------+  +----------+  +----------+   |
    |   | Users B  |  | Orders B |  |Products B|   |
    |   +----------+  +----------+  +----------+   |
    |                                               |
    +-----------------------------------------------+
```

Each tenant's data is isolated by the `tenantId` field in every collection, ensuring that queries only return data relevant to the current tenant.

## Data Access Patterns

### Dashboard Overview

```
+----------------+     +----------------+     +----------------+
| Recent Orders  |     | Sales Summary  |     | Traffic Stats  |
+----------------+     +----------------+     +----------------+
       ^                      ^                      ^
       |                      |                      |
+------+------+        +------+------+        +------+------+
|   Orders    |        |   Orders    |        | Traffic Data |
+-------------+        +-------------+        +-------------+
```

### Product Management

```
+----------------+     +----------------+     +----------------+
| Product List   |     | Product Detail |     |  Add Product   |
+----------------+     +----------------+     +----------------+
       ^                      ^                      |
       |                      |                      v
+------+------+        +------+------+        +------+------+
|   Products   |        |   Products   |        |   Products   |
+-------------+        +-------------+        +-------------+
```

### Order Processing

```
+----------------+     +----------------+     +----------------+
|  Order List    |     |  Order Detail  |     | Update Status  |
+----------------+     +----------------+     +----------------+
       ^                      ^                      |
       |                      |                      v
+------+------+        +------+------+        +------+------+
|    Orders    |        |    Orders    |        |    Orders    |
+-------------+        +-------------+        +-------------+
                              ^
                              |
                       +------+------+
                       |  Order Items  |
                       +-------------+
```

### Customer Management

```
+----------------+     +----------------+     +----------------+
| Customer List  |     |Customer Detail |     |Customer Orders |
+----------------+     +----------------+     +----------------+
       ^                      ^                      ^
       |                      |                      |
+------+------+        +------+------+        +------+------+
|  Customers   |        |  Customers   |        |    Orders    |
+-------------+        +-------------+        +-------------+
```

### User Activity Tracking

```
+----------------+     +----------------+     +----------------+
| Activity Feed  |     |  User Actions  |     |  Audit Trail   |
+----------------+     +----------------+     +----------------+
       ^                      ^                      ^
       |                      |                      |
+------+------+        +------+------+        +------+------+
| Activity Logs |        | Activity Logs |        | Activity Logs |
+-------------+        +-------------+        +-------------+
```

## Query Optimization

The application uses the following indexes to optimize queries:

1. Primary keys (`_id`) on all collections
2. Unique index on `users.email`
3. Unique index on `orders.orderNumber`
4. Compound index on `tenantId` and `createdAt` for time-series queries
5. Compound index on `tenantId` and `status` for filtered queries

These indexes ensure that common queries perform efficiently, even as the data grows.
