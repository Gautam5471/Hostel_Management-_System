const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // 1. If real MONGODB_URI is provided and not placeholder, attempt connection
  if (uri && !uri.includes('<username>') && !uri.includes('username:password') && !uri.includes('<password>')) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host} [DB: ${conn.connection.name}]`);
      return conn;
    } catch (error) {
      console.warn(`⚠️ Primary MongoDB Atlas connection failed (${error.message}). Attempting local/in-memory fallback...`);
    }
  }

  // 2. Try local MongoDB instance
  try {
    const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/hostel_db', {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`✅ Local MongoDB Connected: ${localConn.connection.host}`);
    return localConn;
  } catch (localErr) {
    // 3. Fallback to MongoDB Memory Server for standalone instant runtime
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      const memConn = await mongoose.connect(memoryUri);
      console.log(`🚀 Standalone In-Memory Database initialized: ${memConn.connection.host}`);
      console.log(`💡 Note: To connect to MongoDB Atlas, add your Atlas URI to .env as MONGODB_URI=...`);
      return memConn;
    } catch (memErr) {
      console.error('❌ Could not initialize MongoDB instance:', memErr.message);
      return null;
    }
  }
};

module.exports = connectDB;
