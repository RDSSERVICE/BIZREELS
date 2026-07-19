const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB Atlas with production-grade options.
 * Includes auto-reconnect, connection pooling, and graceful shutdown.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      socketTimeoutMS: 5000,
      serverSelectionTimeoutMS: 3000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority',
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`, {
      service: 'database',
      dbName: conn.connection.name,
    });

    return conn;
  } catch (error) {
    logger.warn(`MongoDB Atlas connection timed out/failed: ${error.message}. API running in local mode.`);
    return null;
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
