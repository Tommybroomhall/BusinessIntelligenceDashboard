# MongoDB Query Reference Guide

This document provides useful MongoDB queries for debugging the Business Intelligence Dashboard. You can run these queries using MongoDB Compass, MongoDB Shell, or directly in your code.

## Connection String

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/businessdash
```

Replace `<username>`, `<password>`, and `<cluster>` with your MongoDB Atlas credentials from the `.env` file.

## Basic Collection Operations

### List All Collections

```javascript
db.getCollectionNames()
```

### Count Documents in a Collection

```javascript
db.tenants.countDocuments()
db.users.countDocuments()
db.products.countDocuments()
db.customers.countDocuments()
db.orders.countDocuments()
db.orderitems.countDocuments()
db.trafficdatas.countDocuments()
db.activitylogs.countDocuments()
```

### View Collection Schema

```javascript
db.tenants.findOne()
```

## Tenant Queries

### Find All Tenants

```javascript
db.tenants.find()
```

### Find Tenant by Name

```javascript
db.tenants.find({ name: "BusinessDash Inc." })
```

### Find Tenant by ID

```javascript
db.tenants.find({ _id: ObjectId("tenant_id_here") })
```

## User Queries

### Find All Users

```javascript
db.users.find()
```

### Find Admin User

```javascript
db.users.find({ email: "admin@businessdash.com" })
```

### Find Users by Tenant

```javascript
db.users.find({ tenantId: ObjectId("tenant_id_here") })
```

### Find Users by Role

```javascript
db.users.find({ role: "admin" })
```

### Find Inactive Users

```javascript
db.users.find({ isActive: false })
```

## Product Queries

### Find All Products

```javascript
db.products.find()
```

### Find Products by Tenant

```javascript
db.products.find({ tenantId: ObjectId("tenant_id_here") })
```

### Find Products by Category

```javascript
db.products.find({ category: "Electronics" })
```

### Find Products by Price Range

```javascript
db.products.find({ price: { $gte: 100, $lte: 500 } })
```

### Find Products with Low Stock

```javascript
db.products.find({ stockLevel: "low" })
```

### Find Inactive Products

```javascript
db.products.find({ isActive: false })
```

## Customer Queries

### Find All Customers

```javascript
db.customers.find()
```

### Find Customers by Tenant

```javascript
db.customers.find({ tenantId: ObjectId("tenant_id_here") })
```

### Find Customers by Status

```javascript
db.customers.find({ status: "active" })
```

### Find Top Spending Customers

```javascript
db.customers.find().sort({ totalSpent: -1 }).limit(10)
```

### Find Customers with Recent Orders

```javascript
db.customers.find({ 
  lastOrderDate: { 
    $gte: new Date(new Date().setDate(new Date().getDate() - 30)) 
  } 
})
```

## Order Queries

### Find All Orders

```javascript
db.orders.find()
```

### Find Orders by Tenant

```javascript
db.orders.find({ tenantId: ObjectId("tenant_id_here") })
```

### Find Orders by Status

```javascript
db.orders.find({ status: "pending" })
```

### Find Recent Orders

```javascript
db.orders.find().sort({ createdAt: -1 }).limit(10)
```

### Find Orders by Date Range

```javascript
db.orders.find({ 
  createdAt: { 
    $gte: new Date("2023-01-01"), 
    $lte: new Date("2023-12-31") 
  } 
})
```

### Find Orders by Amount Range

```javascript
db.orders.find({ amount: { $gte: 100, $lte: 500 } })
```

## Order Item Queries

### Find All Order Items

```javascript
db.orderitems.find()
```

### Find Order Items by Order

```javascript
db.orderitems.find({ orderId: ObjectId("order_id_here") })
```

### Find Order Items by Product

```javascript
db.orderitems.find({ productId: ObjectId("product_id_here") })
```

## Traffic Data Queries

### Find All Traffic Data

```javascript
db.trafficdatas.find()
```

### Find Traffic Data by Tenant

```javascript
db.trafficdatas.find({ tenantId: ObjectId("tenant_id_here") })
```

### Find Traffic Data by Date Range

```javascript
db.trafficdatas.find({ 
  date: { 
    $gte: new Date("2023-01-01"), 
    $lte: new Date("2023-12-31") 
  } 
})
```

### Find Traffic Data by Page

```javascript
db.trafficdatas.find({ page: "/dashboard" })
```

### Find Traffic Data by Source

```javascript
db.trafficdatas.find({ source: "google" })
```

### Find Traffic Data by Device Type

```javascript
db.trafficdatas.find({ deviceType: "mobile" })
```

## Activity Log Queries

### Find All Activity Logs

```javascript
db.activitylogs.find()
```

### Find Activity Logs by Tenant

```javascript
db.activitylogs.find({ tenantId: ObjectId("tenant_id_here") })
```

### Find Activity Logs by User

```javascript
db.activitylogs.find({ userId: ObjectId("user_id_here") })
```

### Find Activity Logs by Type

```javascript
db.activitylogs.find({ activityType: "login" })
```

### Find Recent Activity Logs

```javascript
db.activitylogs.find().sort({ createdAt: -1 }).limit(10)
```

## Aggregation Queries

### Total Sales by Day

```javascript
db.orders.aggregate([
  { $match: { tenantId: ObjectId("tenant_id_here") } },
  { $group: { 
    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
    totalSales: { $sum: "$amount" },
    orderCount: { $sum: 1 }
  }},
  { $sort: { _id: 1 } }
])
```

### Sales by Product Category

```javascript
db.orderitems.aggregate([
  { $lookup: {
    from: "products",
    localField: "productId",
    foreignField: "_id",
    as: "product"
  }},
  { $unwind: "$product" },
  { $match: { "product.tenantId": ObjectId("tenant_id_here") } },
  { $group: {
    _id: "$product.category",
    totalSales: { $sum: { $multiply: ["$price", "$quantity"] } },
    itemCount: { $sum: 1 }
  }},
  { $sort: { totalSales: -1 } }
])
```

### Traffic by Source

```javascript
db.trafficdatas.aggregate([
  { $match: { tenantId: ObjectId("tenant_id_here") } },
  { $group: {
    _id: "$source",
    totalViews: { $sum: "$views" },
    totalVisitors: { $sum: "$uniqueVisitors" }
  }},
  { $sort: { totalViews: -1 } }
])
```

### User Activity Summary

```javascript
db.activitylogs.aggregate([
  { $match: { tenantId: ObjectId("tenant_id_here") } },
  { $group: {
    _id: "$userId",
    activityCount: { $sum: 1 },
    lastActivity: { $max: "$createdAt" }
  }},
  { $lookup: {
    from: "users",
    localField: "_id",
    foreignField: "_id",
    as: "user"
  }},
  { $unwind: "$user" },
  { $project: {
    _id: 1,
    userName: "$user.name",
    userEmail: "$user.email",
    activityCount: 1,
    lastActivity: 1
  }},
  { $sort: { activityCount: -1 } }
])
```

## Updating Data

### Update Product Price

```javascript
db.products.updateOne(
  { _id: ObjectId("product_id_here") },
  { $set: { price: 99.99, updatedAt: new Date() } }
)
```

### Update Order Status

```javascript
db.orders.updateOne(
  { _id: ObjectId("order_id_here") },
  { $set: { status: "shipped", updatedAt: new Date() } }
)
```

### Update Customer Status

```javascript
db.customers.updateOne(
  { _id: ObjectId("customer_id_here") },
  { $set: { status: "inactive", updatedAt: new Date() } }
)
```

## Relationship Queries

### Find Orders for a Customer

```javascript
// First find the customer
const customer = db.customers.findOne({ email: "customer@example.com" });

// Then find their orders
db.orders.find({ customerEmail: customer.email });
```

### Find Order Items with Product Details

```javascript
db.orderitems.aggregate([
  { $match: { orderId: ObjectId("order_id_here") } },
  { $lookup: {
    from: "products",
    localField: "productId",
    foreignField: "_id",
    as: "product"
  }},
  { $unwind: "$product" },
  { $project: {
    _id: 1,
    quantity: 1,
    price: 1,
    productName: "$product.name",
    productCategory: "$product.category"
  }}
])
```

### Find User Activity

```javascript
db.activitylogs.aggregate([
  { $match: { userId: ObjectId("user_id_here") } },
  { $sort: { createdAt: -1 } },
  { $limit: 20 }
])
```

## Troubleshooting Queries

### Find Orphaned Order Items (No Parent Order)

```javascript
db.orderitems.aggregate([
  { $lookup: {
    from: "orders",
    localField: "orderId",
    foreignField: "_id",
    as: "order"
  }},
  { $match: { order: { $size: 0 } } }
])
```

### Find Inconsistent Order Amounts

```javascript
db.orders.aggregate([
  { $lookup: {
    from: "orderitems",
    localField: "_id",
    foreignField: "orderId",
    as: "items"
  }},
  { $addFields: {
    calculatedAmount: { $sum: { $map: {
      input: "$items",
      as: "item",
      in: { $multiply: ["$$item.price", "$$item.quantity"] }
    }}}
  }},
  { $match: {
    $expr: { $ne: ["$amount", "$calculatedAmount"] }
  }}
])
```
