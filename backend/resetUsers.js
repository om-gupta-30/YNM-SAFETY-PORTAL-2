const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const resetUsers = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Delete existing users
    await User.deleteMany({ username: { $in: ['Admin', 'Om1', 'Om2', 'Om3'] } });
    console.log('✅ Deleted existing users');

    const users = [
      { username: 'Admin', password: 'Admin@123', role: 'admin' },
      { username: 'Om1', password: 'Om1@123', role: 'employee' },
      { username: 'Om2', password: 'Om2@123', role: 'employee' },
      { username: 'Om3', password: 'Om3@123', role: 'employee' }
    ];

    for (const userData of users) {
      // Create user - password will be hashed by pre-save hook
      await User.create({
        username: userData.username,
        password: userData.password, // Pre-save hook will hash this
        role: userData.role
      });
      
      console.log(`✅ Created user: ${userData.username}`);
    }

    console.log('Reset complete - All users recreated with correct password hashing');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting users:', error);
    process.exit(1);
  }
};

resetUsers();

