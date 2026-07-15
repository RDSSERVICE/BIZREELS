const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const uri = config.mongoUri;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    await mongoose.connect(uri, {
      dbName: config.dbName,
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${config.dbName}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err.message);
});

module.exports = connectDB;
