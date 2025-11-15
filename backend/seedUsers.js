const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const users = [
      { username: 'Admin', password: 'Admin@123', role: 'admin' },
      { username: 'Om1', password: 'Om1@123', role: 'employee' },
      { username: 'Om2', password: 'Om2@123', role: 'employee' },
      { username: 'Om3', password: 'Om3@123', role: 'employee' }
    ];

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await User.findOne({ username: userData.username });
      
      if (!existingUser) {
        // Create user - password will be hashed by pre-save hook
        await User.create({
          username: userData.username,
          password: userData.password, // Pre-save hook will hash this
          role: userData.role
        });
        
        console.log(`✅ Created user: ${userData.username}`);
      } else {
        console.log(`⏭️  User already exists: ${userData.username}`);
      }
    }

    console.log('Seed complete');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();

