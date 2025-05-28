# MongoDB Documentation Summary

This document provides an overview of the MongoDB documentation available for the Business Intelligence Dashboard.

## Available Documentation

1. **[MONGODB_STRUCTURE.md](MONGODB_STRUCTURE.md)**
   - Detailed overview of the MongoDB database structure
   - Collection schemas and field descriptions
   - Relationships between collections
   - Dummy data available in each collection

2. **[MONGODB_QUERY_REFERENCE.md](MONGODB_QUERY_REFERENCE.md)**
   - Useful MongoDB queries for debugging
   - Examples for finding, filtering, and aggregating data
   - Relationship queries to navigate between collections
   - Troubleshooting queries for identifying data issues

3. **[MONGODB_SCHEMA_DIAGRAM.md](MONGODB_SCHEMA_DIAGRAM.md)**
   - Visual representation of the database schema
   - Entity relationship diagrams
   - Data flow diagrams
   - Multi-tenancy implementation

4. **[DUMMY_DATA.md](DUMMY_DATA.md)**
   - Information about the dummy data generator script
   - Configuration options for generating data
   - Instructions for running the script
   - Description of the generated data

## Quick Reference

### Database Name
- `businessdash` (configurable via environment variables)

### Collections
1. `tenants` - Client companies using the dashboard
2. `users` - User accounts for accessing the dashboard
3. `products` - Products sold by each tenant
4. `customers` - Customers of each tenant
5. `orders` - Orders placed by customers
6. `orderitems` - Individual items within orders
7. `trafficdatas` - Website traffic analytics
8. `activitylogs` - User activity tracking

### Admin Login Credentials
- Email: admin@businessdash.com
- Password: password123

### Dummy Data Statistics
- Tenants: 3
- Users: ~16 (5-6 per tenant)
- Products: ~90 (30 per tenant)
- Customers: ~150 (50 per tenant)
- Orders: ~300 (100 per tenant)
- Order Items: ~900 (3 per order on average)
- Traffic Data: ~900 (30 days × 10 pages × 3 tenants)
- Activity Logs: ~300 (100 per tenant)

### Common Issues and Solutions

#### Issue: Dashboard shows no data
**Possible causes:**
1. MongoDB connection issue
2. No data in the database
3. Tenant ID mismatch

**Solutions:**
1. Check MongoDB connection in `.env` file
2. Run `npm run db:load-dummy-data` to generate dummy data
3. Verify tenant ID in session matches data in database

#### Issue: Incorrect totals or statistics
**Possible causes:**
1. Data inconsistency between collections
2. Calculation error in aggregation
3. Missing or incomplete data

**Solutions:**
1. Use the troubleshooting queries in MONGODB_QUERY_REFERENCE.md
2. Check for orphaned records or inconsistent amounts
3. Verify that all required fields have values

#### Issue: Missing relationships
**Possible causes:**
1. Foreign key references incorrect ID
2. Referenced document doesn't exist
3. Query doesn't include proper lookup

**Solutions:**
1. Check that IDs match between collections
2. Verify that referenced documents exist
3. Use proper aggregation with $lookup to join collections

## Generating Fresh Dummy Data

If you need to reset the database or generate fresh dummy data:

```bash
# Run the dummy data generator script
npm run db:load-dummy-data
```

This will:
1. Clear all existing data (optional, controlled by CONFIG.CLEAR_EXISTING_DATA)
2. Create new tenants, users, products, customers, orders, etc.
3. Generate realistic relationships between all entities

## Modifying the Data Model

If you need to modify the data model:

1. Update the schema in `server/models.ts`
2. Update the dummy data generator in `scripts/load-dummy-data.ts`
3. Run the dummy data generator to create data with the new schema

## Accessing MongoDB Directly

For direct access to the MongoDB database:

1. **MongoDB Compass**: Use the connection string from your `.env` file
2. **MongoDB Shell**: 
   ```
   mongosh "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/businessdash"
   ```
3. **Programmatic Access**:
   ```javascript
   import mongoose from 'mongoose';
   
   mongoose.connect('mongodb+srv://<username>:<password>@<cluster>.mongodb.net/businessdash');
   ```

## Best Practices for Working with the Data

1. **Always filter by tenant**: Include `tenantId` in all queries to maintain data isolation
2. **Use proper indexes**: Create indexes for frequently queried fields
3. **Validate data**: Ensure data consistency between related collections
4. **Handle errors**: Implement proper error handling for database operations
5. **Use aggregation**: Use MongoDB's aggregation framework for complex queries
6. **Limit results**: Use pagination to limit the number of results returned
7. **Update timestamps**: Always update the `updatedAt` field when modifying documents

## Conclusion

This documentation provides a comprehensive overview of the MongoDB database structure, available dummy data, and useful queries for debugging the Business Intelligence Dashboard. Use these resources to understand the data model, troubleshoot issues, and develop new features.
