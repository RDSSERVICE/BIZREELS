const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');


let isConnecting = false;
let reconnectInterval = null;
const commandContextMap = new Map();
let dbOptions = null;

// Periodic cleanup of command context map to prevent any potential memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [reqId, entry] of commandContextMap.entries()) {
    if (now - entry.timestamp > 60000) {
      commandContextMap.delete(reqId);
    }
  }
}, 60000).unref();

/**
 * Starts a safe background reconnect process if disconnected.
 * Prevents multiple overlapping connection attempts.
 */
const startBackgroundReconnect = (options) => {
  if (reconnectInterval) return;

  logger.info('Initializing background reconnect worker...', { service: 'database' });

  reconnectInterval = setInterval(async () => {
    // Stop retrying if already connected
    if (mongoose.connection.readyState === 1) {
      logger.info('Mongoose is already connected. Clearing reconnect worker.', { service: 'database' });
      clearInterval(reconnectInterval);
      reconnectInterval = null;
      return;
    }

    // Skip if already in the process of connecting
    if (mongoose.connection.readyState === 2 || isConnecting) {
      return;
    }

    try {
      isConnecting = true;
      logger.info('Background reconnect worker: Attempting connection to MongoDB Atlas...', { service: 'database' });
      await mongoose.connect(config.mongoUri, { ...options, serverSelectionTimeoutMS: 5000 });
      logger.info('MongoDB Connected via background reconnect worker!', { service: 'database' });
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    } catch (err) {
      logger.warn(`Background reconnect worker: Attempt failed (${err.message}). Will retry in 10s.`, { service: 'database' });
    } finally {
      isConnecting = false;
    }
  }, 10000);
};

// Register connection lifecycle listeners globally at module load time
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`, { service: 'database' });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost. Reconnecting...', { service: 'database' });
  if (dbOptions) {
    startBackgroundReconnect(dbOptions);
  }
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB connection re-established.', { service: 'database' });
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
});

mongoose.connection.on('connected', () => {
  try {
    const client = mongoose.connection.getClient();
    if (client && client.listenerCount('commandStarted') === 0) {
      const { performanceLocalStorage } = require('../middleware/performance');

      client.on('commandStarted', (event) => {
        const context = performanceLocalStorage.getStore();
        if (context) {
          context.timestamp = Date.now();
          commandContextMap.set(event.requestId, context);
        }
      });

      client.on('commandSucceeded', (event) => {
        const context = commandContextMap.get(event.requestId);
        if (context) {
          if (event.duration !== undefined) {
            context.dbCommandTime = (context.dbCommandTime || 0) + event.duration;
          }
          commandContextMap.delete(event.requestId);
        }
      });

      client.on('commandFailed', (event) => {
        const context = commandContextMap.get(event.requestId);
        if (context) {
          if (event.duration !== undefined) {
            context.dbCommandTime = (context.dbCommandTime || 0) + event.duration;
          }
          commandContextMap.delete(event.requestId);
        }
      });
    }
  } catch (err) {
    logger.error(`Failed to register telemetry on connection: ${err.message}`, { service: 'database' });
  }
});

/**
 * Connect to MongoDB Atlas with production-grade options.
 * Includes auto-reconnect, connection pooling, and graceful shutdown.
 */
const connectDB = async () => {
  dbOptions = {
    dbName: process.env.DB_NAME || 'bizreels',
    maxPoolSize: 100,
    minPoolSize: 10,
    family: 4, // Force IPv4 to prevent Windows / ISP IPv6 resolution delays
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    maxIdleTimeMS: 30000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    w: 'majority',
    monitorCommands: true,
  };

  // Enable query buffering globally to smooth out transient database reconnects
  mongoose.set('bufferCommands', true);

  // Initial connection retry loop (up to 5 attempts)
  const maxRetries = 5;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      logger.info(`Connecting to MongoDB Atlas (Attempt ${retryCount + 1}/${maxRetries})...`, { service: 'database' });
      const conn = await mongoose.connect(config.mongoUri, dbOptions);
      logger.info(`MongoDB Connected: ${conn.connection.host}`, {
        service: 'database',
        dbName: conn.connection.name,
      });

      return conn;
    } catch (error) {
      retryCount++;
      logger.warn(`MongoDB Atlas connection attempt ${retryCount}/${maxRetries} failed: ${error.message}`, { service: 'database' });
      if (retryCount < maxRetries) {
        logger.info('Waiting 5 seconds before retrying...', { service: 'database' });
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  // Attempt local MongoDB fallback if Atlas fails completely
  logger.warn('MongoDB Atlas connection failed completely. Attempting local fallback...', { service: 'database' });
  try {
    const localUri = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/bizreels';
    const conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000 });
    logger.info(`MongoDB Connected (Local Fallback): ${conn.connection.host}`, {
      service: 'database',
      dbName: conn.connection.name,
    });
    return conn;
  } catch (localErr) {
    logger.error(`Local MongoDB connection failed (${localErr.message}). Starting background reconnect worker...`, { service: 'database' });
    startBackgroundReconnect(dbOptions);
    return null;
  }
};

/**
 * Graceful shutdown: close Mongoose connection pool.
 */
const disconnectDB = async () => {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully.', { service: 'database' });
  } catch (error) {
    logger.error('Error closing MongoDB connection:', { error: error.message, service: 'database' });
  }
};

module.exports = { connectDB, disconnectDB };

