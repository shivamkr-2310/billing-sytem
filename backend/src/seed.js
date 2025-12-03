import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import Sale from './models/Sale.js';
import connectDB from './config/db.js';

dotenv.config();

const sampleProducts = [
  {
    name: 'Samsung Galaxy S23',
    description: 'Latest Samsung flagship smartphone',
    price: 65000,
    category: 'Electronics',
    stock: 25,
    sku: 'SAM-S23-001',
    barcode: '1234567890123'
  },
  {
    name: 'iPhone 14 Pro',
    description: 'Apple iPhone 14 Pro 128GB',
    price: 120000,
    category: 'Electronics',
    stock: 15,
    sku: 'APL-14P-001',
    barcode: '1234567890124'
  },
  {
    name: 'Dell XPS 13',
    description: 'Dell XPS 13 Laptop i7 16GB RAM',
    price: 95000,
    category: 'Computers',
    stock: 8,
    sku: 'DEL-XPS-001',
    barcode: '1234567890125'
  },
  {
    name: 'MacBook Air M2',
    description: 'Apple MacBook Air with M2 chip',
    price: 115000,
    category: 'Computers',
    stock: 5,
    sku: 'APL-MBA-001',
    barcode: '1234567890126'
  },
  {
    name: 'Sony WH-1000XM4',
    description: 'Noise cancelling wireless headphones',
    price: 25000,
    category: 'Audio',
    stock: 30,
    sku: 'SON-WH4-001',
    barcode: '1234567890127'
  },
  {
    name: 'iPad Air 5th Gen',
    description: 'Apple iPad Air with M1 chip',
    price: 55000,
    category: 'Tablets',
    stock: 12,
    sku: 'APL-IPA-001',
    barcode: '1234567890128'
  },
  {
    name: 'Canon EOS R6',
    description: 'Professional mirrorless camera',
    price: 180000,
    category: 'Cameras',
    stock: 3,
    sku: 'CAN-R6-001',
    barcode: '1234567890129'
  },
  {
    name: 'Nintendo Switch OLED',
    description: 'Nintendo Switch OLED gaming console',
    price: 35000,
    category: 'Gaming',
    stock: 18,
    sku: 'NIN-SWO-001',
    barcode: '1234567890130'
  },
  {
    name: 'AirPods Pro 2nd Gen',
    description: 'Apple AirPods Pro with spatial audio',
    price: 22000,
    category: 'Audio',
    stock: 40,
    sku: 'APL-APP-001',
    barcode: '1234567890131'
  },
  {
    name: 'Samsung 55" QLED TV',
    description: '55 inch 4K QLED Smart TV',
    price: 85000,
    category: 'Electronics',
    stock: 6,
    sku: 'SAM-Q55-001',
    barcode: '1234567890132'
  },
  {
    name: 'Logitech MX Master 3S',
    description: 'Advanced wireless mouse',
    price: 8500,
    category: 'Accessories',
    stock: 50,
    sku: 'LOG-MX3-001',
    barcode: '1234567890133'
  },
  {
    name: 'Mechanical Keyboard RGB',
    description: 'RGB backlit mechanical gaming keyboard',
    price: 12000,
    category: 'Accessories',
    stock: 35,
    sku: 'KEY-RGB-001',
    barcode: '1234567890134'
  },
  {
    name: 'Portable SSD 1TB',
    description: 'High-speed portable SSD storage',
    price: 15000,
    category: 'Storage',
    stock: 20,
    sku: 'SSD-1TB-001',
    barcode: '1234567890135'
  },
  {
    name: 'Wireless Charger 15W',
    description: 'Fast wireless charging pad',
    price: 3500,
    category: 'Accessories',
    stock: 60,
    sku: 'CHR-15W-001',
    barcode: '1234567890136'
  },
  {
    name: 'Bluetooth Speaker',
    description: 'Waterproof bluetooth speaker',
    price: 8000,
    category: 'Audio',
    stock: 25,
    sku: 'SPK-BT-001',
    barcode: '1234567890137'
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Product.deleteMany({});
    await Sale.deleteMany({});
    
    // Insert sample products
    console.log('📦 Inserting sample products...');
    const insertedProducts = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${insertedProducts.length} products`);
    
    // Create some sample sales
    console.log('💰 Creating sample sales...');
    
    const sampleSales = [
      {
        items: [
          {
            product: insertedProducts[0]._id, // Samsung Galaxy S23
            quantity: 2,
            unitPrice: insertedProducts[0].price,
            totalPrice: insertedProducts[0].price * 2
          },
          {
            product: insertedProducts[4]._id, // Sony headphones
            quantity: 1,
            unitPrice: insertedProducts[4].price,
            totalPrice: insertedProducts[4].price * 1
          }
        ],
        subtotal: (insertedProducts[0].price * 2) + (insertedProducts[4].price * 1),
        tax: 0,
        discount: 5000,
        total: (insertedProducts[0].price * 2) + (insertedProducts[4].price * 1) - 5000,
        paymentMethod: 'card',
        customerName: 'John Doe',
        customerPhone: '9876543210',
        status: 'completed',
        notes: 'Customer requested express delivery'
      },
      {
        items: [
          {
            product: insertedProducts[1]._id, // iPhone 14 Pro
            quantity: 1,
            unitPrice: insertedProducts[1].price,
            totalPrice: insertedProducts[1].price * 1
          },
          {
            product: insertedProducts[8]._id, // AirPods Pro
            quantity: 1,
            unitPrice: insertedProducts[8].price,
            totalPrice: insertedProducts[8].price * 1
          }
        ],
        subtotal: insertedProducts[1].price + insertedProducts[8].price,
        tax: 0,
        discount: 0,
        total: insertedProducts[1].price + insertedProducts[8].price,
        paymentMethod: 'upi',
        customerName: 'Jane Smith',
        customerPhone: '9876543211',
        status: 'completed'
      },
      {
        items: [
          {
            product: insertedProducts[2]._id, // Dell XPS 13
            quantity: 1,
            unitPrice: insertedProducts[2].price,
            totalPrice: insertedProducts[2].price * 1
          }
        ],
        subtotal: insertedProducts[2].price,
        tax: 0,
        discount: 2000,
        total: insertedProducts[2].price - 2000,
        paymentMethod: 'cash',
        customerName: 'Bob Johnson',
        customerPhone: '9876543212',
        status: 'completed',
        notes: 'Corporate purchase'
      }
    ];
    
    const insertedSales = await Sale.insertMany(sampleSales);
    console.log(`✅ Inserted ${insertedSales.length} sales`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Products: ${insertedProducts.length}`);
    console.log(`   Sales: ${insertedSales.length}`);
    console.log(`   Categories: ${[...new Set(sampleProducts.map(p => p.category))].length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();