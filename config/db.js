const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');

// Connects to MongoDB using the connection string stored in .env
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing. Add it to your .env file');
  await mongoose.connect(uri);
  console.log('MongoDB connected: ' + mongoose.connection.name);
}

module.exports = connectDB;
