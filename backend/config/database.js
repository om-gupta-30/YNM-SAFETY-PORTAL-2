const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ynm_safety_portal';
    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('⚠️  MongoDB connection failed. Please ensure MongoDB is running or set MONGODB_URI in .env file.');
    }
    process.exit(1);
  }
};

module.exports = connectDB;

