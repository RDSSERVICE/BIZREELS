const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

class MemoryOtpStore {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, mode, durationSeconds) {
    const expiresAt = Date.now() + (durationSeconds || 300) * 1000;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async ttl(key) {
    const item = this.store.get(key);
    if (!item) return -2;
    const remainingMs = item.expiresAt - Date.now();
    return Math.max(0, Math.floor(remainingMs / 1000));
  }
}

let redisClient;
let isRedisConnected = false;
const redisEnabled = process.env.REDIS_ENABLED !== 'false';

if (redisEnabled) {
  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 1) {
          logger.info('Redis server not detected on localhost. Safely fell back to MemoryOtpStore.');
          return null;
        }
        return 100;
      },
      connectTimeout: 1000,
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      logger.info('Connected to Redis server successfully.', { service: 'redis' });
    });

    redisClient.on('error', (err) => {
      if (isRedisConnected) {
        logger.info('Redis connection lost, safely fell back to MemoryOtpStore.');
      }
      isRedisConnected = false;
    });
  } catch (err) {
    logger.info('Redis initialization skipped. Using in-memory store.');
  }
} else {
  logger.info('Redis connection is disabled via .env. Using MemoryOtpStore directly.');
}

const memoryStore = new MemoryOtpStore();

const getStore = () => {
  return (isRedisConnected && redisClient && redisClient.status === 'ready') ? redisClient : memoryStore;
};

module.exports = {
  redisClient,
  getStore,
};
