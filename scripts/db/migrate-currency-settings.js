#!/usr/bin/env node

/**
 * Migration script to add currency settings to existing tenants
 * This script adds default GBP currency settings to any tenants that don't have them
 */

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Define the tenant schema (simplified for migration)
const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  website: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  logoUrl: String,
  primaryColor: { type: String, default: '#0ea5e9' },
  currencyCode: { type: String, default: 'GBP' },
  currencySymbol: { type: String, default: '£' },
  currencyLocale: { type: String, default: 'en-GB' },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  stripeSecretKey: String,
  ga4Key: String,
  vercelApiToken: String,
  vercelProjectId: String,
  vercelTeamId: String
});

const Tenant = mongoose.model('Tenant', TenantSchema);

async function migrateCurrencySettings() {
  try {
    // Connect to MongoDB
    const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!dbUrl) {
      throw new Error('DATABASE_URL or MONGODB_URI environment variable not set');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbUrl);
    console.log('Connected successfully');

    // Find tenants without currency settings
    const tenantsWithoutCurrency = await Tenant.find({
      $or: [
        { currencyCode: { $exists: false } },
        { currencySymbol: { $exists: false } },
        { currencyLocale: { $exists: false } },
        { currencyCode: null },
        { currencySymbol: null },
        { currencyLocale: null }
      ]
    });

    console.log(`Found ${tenantsWithoutCurrency.length} tenants without currency settings`);

    if (tenantsWithoutCurrency.length === 0) {
      console.log('All tenants already have currency settings. Migration not needed.');
      return;
    }

    // Update each tenant with default currency settings
    const updateResult = await Tenant.updateMany(
      {
        $or: [
          { currencyCode: { $exists: false } },
          { currencySymbol: { $exists: false } },
          { currencyLocale: { $exists: false } },
          { currencyCode: null },
          { currencySymbol: null },
          { currencyLocale: null }
        ]
      },
      {
        $set: {
          currencyCode: 'GBP',
          currencySymbol: '£',
          currencyLocale: 'en-GB',
          updatedAt: new Date()
        }
      }
    );

    console.log(`Migration completed. Updated ${updateResult.modifiedCount} tenants with default currency settings (GBP).`);

    // Show the updated tenants
    const updatedTenants = await Tenant.find({}).select('name currencyCode currencySymbol currencyLocale');
    console.log('\nCurrent tenant currency settings:');
    updatedTenants.forEach(tenant => {
      console.log(`- ${tenant.name}: ${tenant.currencySymbol} ${tenant.currencyCode} (${tenant.currencyLocale})`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  migrateCurrencySettings().then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateCurrencySettings }; 