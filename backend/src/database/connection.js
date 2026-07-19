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
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority',
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`, {
      service: 'database',
      dbName: conn.connection.name,
    });



    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message, service: 'database' });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnection...', { service: 'database' });
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully.', { service: 'database' });
    });

    return conn;
  } catch (error) {
    logger.error('MongoDB connection failed:', { error: error.message, service: 'database' });
    process.exit(1);
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
