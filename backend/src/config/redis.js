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

try {
  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 2,
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Redis connection threshold exceeded. Using in-memory fallback store.');
        return null;
      }
      return Math.min(times * 50, 2000);
    },
    connectTimeout: 2000,
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    logger.info('Connected to Redis server successfully.', { service: 'redis' });
  });

  redisClient.on('error', (err) => {
    if (isRedisConnected) {
      logger.warn('Redis error occurred, falling back to memory store:', err.message);
    }
    isRedisConnected = false;
  });
} catch (err) {
  logger.warn('Redis initialization skipped. Using in-memory store.');
}

const memoryStore = new MemoryOtpStore();

const getStore = () => {
  return (isRedisConnected && redisClient && redisClient.status === 'ready') ? redisClient : memoryStore;
};

module.exports = {
  redisClient,
  getStore,
};
