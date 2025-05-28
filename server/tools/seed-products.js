// Script to seed products data into MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Define schema
const ProductSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  costPrice: Number,
  category: String,
  imageUrl: String,
  supplierUrl: String,
  stockLevel: { type: String, enum: ['none', 'low', 'good', 'high'], default: 'good' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Register the model
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function seedProducts() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/businessdash');
    console.log('Connected to MongoDB');

    // Get the tenant ID
    const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', new mongoose.Schema({
      name: String
    }));
    
    const tenant = await Tenant.findOne({});
    if (!tenant) {
      console.log('No tenant found. Please create a tenant first.');
      return;
    }
    
    console.log(`Using tenant: ${tenant.name} (${tenant._id})`);
    
    // Sample products
    const products = [
      {
        tenantId: tenant._id,
        name: 'Business Laptop Pro',
        description: 'High performance laptop for business professionals',
        price: 1299.99,
        costPrice: 899.99,
        category: 'Electronics',
        imageUrl: 'https://res.cloudinary.com/dbmj7rhwt/image/upload/v1620000000/products/laptop.jpg',
        stockLevel: 'good',
        isActive: true
      },
      {
        tenantId: tenant._id,
        name: 'Ergonomic Office Chair',
        description: 'Comfortable chair with lumbar support',
        price: 249.99,
        costPrice: 149.99,
        category: 'Furniture',
        imageUrl: 'https://res.cloudinary.com/dbmj7rhwt/image/upload/v1620000000/products/chair.jpg',
        stockLevel: 'high',
        isActive: true
      },
      {
        tenantId: tenant._id,
        name: 'Wireless Noise-Cancelling Headphones',
        description: 'Premium sound quality with active noise cancellation',
        price: 199.99,
        costPrice: 129.99,
        category: 'Electronics',
        imageUrl: 'https://res.cloudinary.com/dbmj7rhwt/image/upload/v1620000000/products/headphones.jpg',
        stockLevel: 'low',
        isActive: true
      },
      {
        tenantId: tenant._id,
        name: 'Adjustable Standing Desk',
        description: 'Electric height-adjustable desk for better ergonomics',
        price: 499.99,
        costPrice: 349.99,
        category: 'Furniture',
        imageUrl: 'https://res.cloudinary.com/dbmj7rhwt/image/upload/v1620000000/products/desk.jpg',
        stockLevel: 'none',
        isActive: true
      },
      {
        tenantId: tenant._id,
        name: 'Wireless Charging Pad',
        description: 'Fast wireless charging for compatible devices',
        price: 39.99,
        costPrice: 19.99,
        category: 'Accessories',
        imageUrl: 'https://res.cloudinary.com/dbmj7rhwt/image/upload/v1620000000/products/charger.jpg',
        stockLevel: 'good',
        isActive: true
      }
    ];

    // Insert products
    console.log('Inserting products...');
    const result = await Product.insertMany(products);
    console.log(`Successfully inserted ${result.length} products`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

// Run the seeding function
seedProducts(); 