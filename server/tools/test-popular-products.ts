import mongoose from 'mongoose';
import { Order, OrderItem, Product } from '../models';
import { connectToDatabase } from '../db';

async function testPopularProducts() {
  try {
    // Connect to MongoDB using the same logic as the main app
    console.log('Connecting to MongoDB...');
    const connected = await connectToDatabase();
    if (!connected) {
      console.log('Failed to connect to MongoDB');
      return;
    }
    console.log('Connected to MongoDB');

    // Get a tenant ID from the database
    const sampleOrder = await Order.findOne().exec();
    if (!sampleOrder) {
      console.log('No orders found in database');
      return;
    }
    
    const tenantId = sampleOrder.tenantId;
    console.log(`Using tenant ID: ${tenantId}`);

    // Test the aggregation logic
    console.log('\n--- Testing Popular Products Aggregation ---');
    
    // Get all orders for this tenant
    const orders = await Order.find({
      tenantId,
      status: { $nin: ['canceled', 'refunded'] }
    }).select('_id').exec();
    
    console.log(`Found ${orders.length} orders for tenant`);
    
    if (orders.length === 0) {
      console.log('No valid orders found');
      return;
    }
    
    const orderIds = orders.map(order => order._id);
    console.log(`Order IDs: ${orderIds.slice(0, 5).join(', ')}...`);
    
    // Aggregate order items to get sales data per product
    const salesAggregation = await OrderItem.aggregate([
      {
        $match: {
          orderId: { $in: orderIds }
        }
      },
      {
        $group: {
          _id: "$productId",
          totalQuantity: { $sum: "$quantity" },
          totalEarnings: { $sum: { $multiply: ["$quantity", "$price"] } }
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    console.log(`\nSales aggregation found ${salesAggregation.length} products with sales`);
    
    if (salesAggregation.length > 0) {
      console.log('\nTop selling products by quantity:');
      salesAggregation.forEach((item, index) => {
        console.log(`${index + 1}. Product ID: ${item._id}, Sold: ${item.totalQuantity}, Earnings: $${item.totalEarnings.toFixed(2)}`);
      });
      
      // Get product details for the top selling products
      const productIds = salesAggregation.map(item => item._id);
      const products = await Product.find({
        _id: { $in: productIds },
        tenantId,
        isActive: true
      }).exec();
      
      console.log(`\nFound ${products.length} active products with details`);
      
      // Create a map of product sales data
      const salesMap = new Map();
      salesAggregation.forEach(item => {
        salesMap.set(item._id.toString(), {
          sold: item.totalQuantity,
          earnings: Math.round(item.totalEarnings * 100) / 100
        });
      });
      
      // Transform products to the expected format
      const result = products.map(product => {
        const productObj = product.toObject();
        const salesData = salesMap.get(productObj._id.toString()) || { sold: 0, earnings: 0 };
        
        return {
          id: productObj._id.toString(),
          name: productObj.name,
          category: productObj.category || 'Uncategorized',
          price: productObj.price,
          imageUrl: productObj.imageUrl || 'https://placehold.co/80x80?text=No+Image',
          sold: salesData.sold,
          earnings: salesData.earnings
        };
      })
      // Sort by sales volume (sold quantity) in descending order
      .sort((a, b) => b.sold - a.sold);
      
      console.log(`\nFinal popular products result (${result.length} items):`);
      result.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - Sold: ${product.sold}, Earnings: $${product.earnings}`);
      });
      
    } else {
      console.log('No sales data found');
    }

  } catch (error) {
    console.error('Error testing popular products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testPopularProducts(); 