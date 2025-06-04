import { getStorage } from '../server/storageFactory';
import mongoose from 'mongoose';
import { connectToDatabase } from '../server/db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testUserSystem() {
  console.log('🔍 Testing User System and MongoDB Data...\n');

  try {
    // Connect to MongoDB first
    console.log('📡 Connecting to MongoDB...');
    const connected = await connectToDatabase();
    console.log(`MongoDB Connection Status: ${connected ? '✅ Connected' : '❌ Failed'}`);

    // Initialize storage
    const storage = await getStorage();
    console.log('✅ Storage initialized successfully');

    // Test 1: List all tenants
    console.log('\n📋 TENANTS:');
    const tenants = await storage.listTenants();
    console.log(`Found ${tenants.length} tenants:`);
    tenants.forEach((tenant, index) => {
      console.log(`  ${index + 1}. ${tenant.name} (ID: ${tenant._id})`);
    });

    if (tenants.length === 0) {
      console.log('❌ No tenants found in database');
      return;
    }

    const firstTenant = tenants[0];
    console.log(`\n🏢 Using tenant: ${firstTenant.name} (${firstTenant._id})`);

    // Test 2: List all users for the first tenant
    console.log('\n👥 USERS:');
    const users = await storage.listUsers(firstTenant._id);
    console.log(`Found ${users.length} users for tenant ${firstTenant.name}:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user._id || user.id}`);
    });

    // Test 3: Test environment admin detection
    console.log('\n🔐 ENVIRONMENT ADMIN CHECK:');
    const envAdminEmail = process.env.ADMIN_DEV_EMAIL;
    const envAdminPassword = process.env.ADMIN_DEV_PASSWORD;
    const envAdminName = process.env.ADMIN_DEV_NAME;
    
    console.log(`Environment Admin Email: ${envAdminEmail || 'NOT SET'}`);
    console.log(`Environment Admin Name: ${envAdminName || 'NOT SET'}`);
    console.log(`Environment Admin Password: ${envAdminPassword ? '***SET***' : 'NOT SET'}`);

    // Test 4: Test user lookup by different ID formats
    console.log('\n🔍 USER LOOKUP TESTS:');
    
    // Test with environment admin ID
    console.log('Testing environment admin ID lookup:');
    const envAdminUser = await storage.getUser('env_dev_admin');
    console.log(`  env_dev_admin: ${envAdminUser ? 'FOUND' : 'NOT FOUND'}`);

    // Test with MongoDB users
    if (users.length > 0) {
      const firstUser = users[0];
      const userId = firstUser._id || firstUser.id;
      console.log(`Testing MongoDB user ID lookup (${userId}):`);
      const mongoUser = await storage.getUser(userId);
      console.log(`  ${userId}: ${mongoUser ? 'FOUND' : 'NOT FOUND'}`);
      
      if (mongoUser) {
        console.log(`    Name: ${mongoUser.name}`);
        console.log(`    Email: ${mongoUser.email}`);
        console.log(`    Role: ${mongoUser.role}`);
      }
    }

    // Test 5: Test user update functionality
    console.log('\n✏️ USER UPDATE TESTS:');
    
    // Test updating environment admin (should fail)
    console.log('Testing environment admin update:');
    try {
      const result = await storage.updateUser('env_dev_admin', { name: 'Test Update' });
      console.log(`  Result: ${result ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }

    // Test updating MongoDB user (should work)
    if (users.length > 0) {
      const firstUser = users[0];
      const userId = firstUser._id || firstUser.id;
      console.log(`Testing MongoDB user update (${userId}):`);
      try {
        const result = await storage.updateUser(userId, { name: 'Test Update MongoDB User' });
        console.log(`  Result: ${result ? 'SUCCESS' : 'FAILED'}`);
        if (result) {
          console.log(`    Updated name: ${result.name}`);
          
          // Revert the change
          await storage.updateUser(userId, { name: firstUser.name });
          console.log(`    Reverted name back to: ${firstUser.name}`);
        }
      } catch (error) {
        console.log(`  Error: ${error.message}`);
      }
    }

    // Test 6: Check authentication flow
    console.log('\n🔑 AUTHENTICATION FLOW:');
    console.log('Current authentication supports:');
    console.log('  1. Environment Admin Users (from .env variables)');
    console.log('  2. MongoDB Database Users');
    console.log('  3. Session-based fallback');

    // Test 7: Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('For profile updates to work properly:');
    console.log('  1. Environment admins need special handling (cannot be updated in DB)');
    console.log('  2. MongoDB users can be updated normally');
    console.log('  3. Consider creating MongoDB admin users instead of relying on env admins');
    console.log('  4. Profile page should detect user type and handle accordingly');

  } catch (error) {
    console.error('❌ Error testing user system:', error);
  } finally {
    // Close MongoDB connection if it was opened
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// Run the test
testUserSystem().catch(console.error);
