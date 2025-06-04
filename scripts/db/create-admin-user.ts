import { connectToDatabase } from '../../server/db';
import { getStorage } from '../../server/storageFactory';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

async function createAdminUser() {
  console.log('🔧 Creating Database Admin User...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const connected = await connectToDatabase();
    if (!connected) {
      throw new Error('Failed to connect to MongoDB');
    }
    console.log('✅ MongoDB Connected\n');

    // Initialize storage
    const storage = await getStorage();

    // Get the first tenant (BusinessDash Inc.)
    const tenants = await storage.listTenants();
    if (tenants.length === 0) {
      throw new Error('No tenants found in database');
    }
    const tenant = tenants[0];
    console.log(`🏢 Using tenant: ${tenant.name} (${tenant._id})\n`);

    // Admin user details from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@businessdash.com';
    const adminName = process.env.ADMIN_NAME || 'Database Admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin user already exists
    console.log(`🔍 Checking if admin user ${adminEmail} exists...`);
    const existingUsers = await storage.listUsers(tenant._id);
    const existingAdmin = existingUsers.find(user => user.email === adminEmail && user.role === 'admin');
    
    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${existingAdmin.name} (${existingAdmin._id})`);
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      console.log('   Created:', existingAdmin.createdAt);
      return existingAdmin;
    }

    // Hash the password
    console.log('🔐 Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create the admin user
    console.log('👤 Creating new admin user...');
    const adminUser = {
      name: adminName,
      email: adminEmail,
      role: 'admin',
      password: hashedPassword,
      tenantId: tenant._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: [
        'users.read',
        'users.write',
        'users.delete',
        'dashboard.read',
        'dashboard.write',
        'products.read',
        'products.write',
        'orders.read',
        'orders.write',
        'customers.read',
        'customers.write',
        'settings.read',
        'settings.write'
      ]
    };

    const createdUser = await storage.createUser(adminUser);
    
    if (createdUser) {
      console.log('✅ Admin user created successfully!');
      console.log('   ID:', createdUser._id);
      console.log('   Name:', createdUser.name);
      console.log('   Email:', createdUser.email);
      console.log('   Role:', createdUser.role);
      console.log('   Tenant:', tenant.name);
      console.log('\n💡 You can now log in with:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('\n🔄 This user can be used instead of environment admin for profile updates.');
      
      return createdUser;
    } else {
      throw new Error('Failed to create admin user');
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser().then(() => {
  console.log('\n✅ Admin user creation complete!');
  process.exit(0);
});

export { createAdminUser }; 