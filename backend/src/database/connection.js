const mongoose = require('mongoose');
const dns = require('dns');
const config = require('../config');
const logger = require('../utils/logger');

// Set reliable public DNS servers for MongoDB Atlas SRV lookup on Windows networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  logger.warn(`Failed to set custom DNS servers: ${err.message}`);
}

/**
 * Connect to MongoDB Atlas with production-grade options.
 * Includes auto-reconnect, connection pooling, and graceful shutdown.
 */
const connectDB = async () => {
  const options = {
    dbName: process.env.DB_NAME || 'bizreels',
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    serverSelectionTimeoutMS: 10000,
    maxIdleTimeMS: 30000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    w: 'majority',
    family: 4, // Force IPv4 to avoid slow DNS lookups (e.g. IPv6 / AAAA resolution delays on Windows)
  };

  // Connection lifecycle logging
  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`, { service: 'database' });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost. Reconnecting...', { service: 'database' });
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB connection re-established.', { service: 'database' });
  });

  try {
    const conn = await mongoose.connect(config.mongoUri, options);
    logger.info(`MongoDB Connected: ${conn.connection.host}`, {
      service: 'database',
      dbName: conn.connection.name,
    });
    return conn;
  } catch (error) {
    logger.warn(`MongoDB Atlas connection timed out/failed (${error.message}). Attempting local fallback...`);
    
    // Attempt local MongoDB fallback
    try {
      const localUri = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/bizreels';
      const conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
      logger.info(`MongoDB Connected (Local Fallback): ${conn.connection.host}`, {
        service: 'database',
        dbName: conn.connection.name,
      });
      return conn;
    } catch (localErr) {
      logger.error(`Local MongoDB connection failed (${localErr.message}). Starting background reconnect worker...`);
      
      // Auto-retry connection in background every 10s without crashing server
      const retryInterval = setInterval(async () => {
        if (mongoose.connection.readyState === 1) {
          clearInterval(retryInterval);
          return;
        }
        try {
          await mongoose.connect(config.mongoUri, { ...options, serverSelectionTimeoutMS: 5000 });
          logger.info('MongoDB Connected via background reconnect worker!');
          clearInterval(retryInterval);
        } catch (retryErr) {
          // retry silently
        }
      }, 10000);

      return null;
    }
  }
};

/**
 * Graceful shutdown: close Mongoose connection pool.
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully.', { service: 'database' });
  } catch (error) {
    logger.error('Error closing MongoDB connection:', { error: error.message, service: 'database' });
  }
};

module.exports = { connectDB, disconnectDB };
