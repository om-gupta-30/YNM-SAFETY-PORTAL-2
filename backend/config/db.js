const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    const conn = await mongoose.connect(mongoURI);

    console.log('MongoDB connected');
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection error:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    if (error.message.includes('authentication failed')) {
      console.error('⚠️  Authentication failed. Please check your MongoDB Atlas username and password.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('⚠️  Connection refused. Please check your network connection and MongoDB Atlas cluster status.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('⚠️  DNS lookup failed. Please check your MongoDB Atlas connection string.');
    }
    process.exit(1);
  }
};

module.exports = connectDB;

