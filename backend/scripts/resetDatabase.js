// Reset Database - Clear all data and seed only core users
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Order = require('../models/Order');
const Task = require('../models/Task');
const Location = require('../models/Location');

const connectDB = require('../config/database');
connectDB();

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');

    // Drop all collections to ensure clean slate
    await User.collection.drop().catch(() => console.log('User collection does not exist'));
    await Product.collection.drop().catch(() => console.log('Product collection does not exist'));
    await Manufacturer.collection.drop().catch(() => console.log('Manufacturer collection does not exist'));
    await Order.collection.drop().catch(() => console.log('Order collection does not exist'));
    await Task.collection.drop().catch(() => console.log('Task collection does not exist'));
    await Location.collection.drop().catch(() => console.log('Location collection does not exist'));

    console.log('✅ All collections dropped');

    // Recreate collections by creating indexes (MongoDB will create collections)
    await User.createIndexes();
    await Product.createIndexes();
    await Manufacturer.createIndexes();
    await Order.createIndexes();
    await Task.createIndexes();
    await Location.createIndexes();

    console.log('✅ Collections recreated');

    // Insert ONLY the 4 core users (passwords will be hashed by User model pre-save hook)
    const coreUsers = [
      { name: 'Admin', password: 'Admin@123', role: 'admin' },
      { name: 'Om1', password: 'Om1@123', role: 'employee' },
      { name: 'Om2', password: 'Om2@123', role: 'employee' },
      { name: 'Om3', password: 'Om3@123', role: 'employee' }
    ];

    // Create users (pre-save hook will hash passwords automatically)
    for (const userData of coreUsers) {
      await User.create(userData);
    }
    console.log('✅ Core users created:');
    coreUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.role})`);
    });

    // Verify collections are empty (except users)
    const productCount = await Product.countDocuments();
    const manufacturerCount = await Manufacturer.countDocuments();
    const orderCount = await Order.countDocuments();
    const taskCount = await Task.countDocuments();
    const locationCount = await Location.countDocuments();
    const userCount = await User.countDocuments();

    console.log('\n📊 Database Status:');
    console.log(`   Users: ${userCount} (should be 4)`);
    console.log(`   Products: ${productCount} (should be 0)`);
    console.log(`   Manufacturers: ${manufacturerCount} (should be 0)`);
    console.log(`   Orders: ${orderCount} (should be 0)`);
    console.log(`   Tasks: ${taskCount} (should be 0)`);
    console.log(`   Locations: ${locationCount} (should be 0)`);

    console.log('\n✅ Database reset complete!');
    console.log('✅ Only Admin + Om1/Om2/Om3 exist. App is now fresh and empty.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();

