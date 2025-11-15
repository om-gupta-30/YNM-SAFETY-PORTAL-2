const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
const User = require('./models/User');
const Product = require('./models/Product');
const Manufacturer = require('./models/Manufacturer');
const Order = require('./models/Order');
const Task = require('./models/Task');
const Location = require('./models/Location');

// Import database connection
const connectDB = require('./config/db');

const resetDatabase = async () => {
  try {
    console.log('🔄 Starting database reset...\n');

    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Delete all data from all collections
    console.log('🗑️  Deleting all existing data...');
    
    const userResult = await User.deleteMany({});
    console.log(`   - Deleted ${userResult.deletedCount} user(s)`);
    
    const productResult = await Product.deleteMany({});
    console.log(`   - Deleted ${productResult.deletedCount} product(s)`);
    
    const manufacturerResult = await Manufacturer.deleteMany({});
    console.log(`   - Deleted ${manufacturerResult.deletedCount} manufacturer(s)`);
    
    const orderResult = await Order.deleteMany({});
    console.log(`   - Deleted ${orderResult.deletedCount} order(s)`);
    
    const taskResult = await Task.deleteMany({});
    console.log(`   - Deleted ${taskResult.deletedCount} task(s)`);
    
    const locationResult = await Location.deleteMany({});
    console.log(`   - Deleted ${locationResult.deletedCount} location(s)`);
    
    console.log('\n✅ All data deleted\n');

    // Create the two users
    console.log('👤 Creating users...\n');
    
    const users = [
      { 
        username: 'Admin', 
        password: 'Admin@RishuuNJain', 
        role: 'admin' 
      },
      { 
        username: 'Harikanth', 
        password: 'Employee@Harikanth', 
        role: 'employee' 
      }
    ];

    for (const userData of users) {
      // Create user - password will be hashed by pre-save hook
      const user = await User.create({
        username: userData.username,
        password: userData.password, // Pre-save hook will hash this
        role: userData.role
      });
      
      console.log(`✅ Created user: ${userData.username} (${userData.role})`);
    }

    console.log('\n✅ Database reset complete!');
    console.log('\n📋 Summary:');
    console.log('   - All collections cleared');
    console.log('   - 2 users created:');
    console.log('     1. Admin (admin role)');
    console.log('     2. Harikanth (employee role)');
    console.log('\n🎉 Ready for deployment!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

// Run the reset
resetDatabase();

