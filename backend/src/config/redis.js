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

if (config.redis.enabled) {
  try {
    const redisOptions = {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 1) {
          logger.info('Redis connection could not be established. Safely falling back to MemoryOtpStore.');
          return null;
        }
        return 100;
      },
      connectTimeout: 10000,
    };

    // Configure SSL/TLS if config.redis.tls is true or if the REDIS_URL starts with rediss://
    const isSecure = config.redis.tls || (config.redis.url && config.redis.url.startsWith('rediss://'));
    if (isSecure) {
      redisOptions.tls = {
        rejectUnauthorized: false
      };
    }

    if (config.redis.url) {
      logger.info(`Initializing Redis via URL: ${config.redis.url.replace(/:[^:@\n]+@/, ':****@')}`, { service: 'redis' });
      redisClient = new Redis(config.redis.url, redisOptions);
    } else {
      logger.info(`Initializing Redis via Host/Port: ${config.redis.host}:${config.redis.port}`, { service: 'redis' });
      const connectionOptions = {
        ...redisOptions,
        host: config.redis.host,
        port: config.redis.port,
      };
      if (config.redis.password) {
        connectionOptions.password = config.redis.password;
      }
      redisClient = new Redis(connectionOptions);
    }

    redisClient.on('connect', () => {
      isRedisConnected = true;
      logger.info('Connected to Redis server successfully.', { service: 'redis' });
    });

    redisClient.on('error', (err) => {
      if (isRedisConnected) {
        logger.info(`Redis connection lost (${err.message}). Safely falling back to MemoryOtpStore.`, { service: 'redis' });
      }
      isRedisConnected = false;
    });
  } catch (err) {
    logger.info(`Redis initialization failed: ${err.message}. Using in-memory store.`, { service: 'redis' });
  }
} else {
  logger.info('Redis connection is disabled via .env. Using MemoryOtpStore directly.', { service: 'redis' });
}

const memoryStore = new MemoryOtpStore();

const getStore = () => {
  return (isRedisConnected && redisClient && redisClient.status === 'ready') ? redisClient : memoryStore;
};

module.exports = {
  redisClient,
  getStore,
};
