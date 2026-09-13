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
    let ttlSec = 300;
    if (typeof mode === 'number') {
      ttlSec = mode;
    } else if (durationSeconds && typeof durationSeconds === 'number') {
      ttlSec = durationSeconds;
    }
    const expiresAt = Date.now() + ttlSec * 1000;
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

  async incr(key) {
    const item = this.store.get(key);
    let val = 0;
    let expiresAt = Date.now() + 86400 * 30 * 1000;
    if (item && Date.now() <= item.expiresAt) {
      val = parseInt(item.value, 10) || 0;
      expiresAt = item.expiresAt;
    }
    val += 1;
    this.store.set(key, { value: String(val), expiresAt });
    return val;
  }
}

let redisClient;
let isRedisConnected = false;
let isQuotaExceeded = false;

if (config.redis.enabled && process.env.NODE_ENV !== 'test') {
  try {
    const redisOptions = {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 1 || isQuotaExceeded) {
          return null;
        }
        return 100;
      },
      connectTimeout: 2000,
    };

    // Configure SSL/TLS if config.redis.tls is true or if the REDIS_URL starts with rediss://
    const isSecure = config.redis.tls || (config.redis.url && config.redis.url.startsWith('rediss://'));
    if (isSecure) {
      redisOptions.tls = {
        rejectUnauthorized: false,
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
      if (err.message && err.message.includes('max requests limit exceeded')) {
        isQuotaExceeded = true;
        isRedisConnected = false;
        logger.warn('[Redis] Upstash Redis request limit exceeded (500k quota reached). Permanently routing to MemoryOtpStore.', { service: 'redis' });
      } else {
        if (isRedisConnected) {
          logger.info(`Redis connection lost (${err.message}). Safely falling back to MemoryOtpStore.`, { service: 'redis' });
        }
        isRedisConnected = false;
      }
    });
  } catch (err) {
    logger.info(`Redis initialization failed: ${err.message}. Using in-memory store.`, { service: 'redis' });
  }
} else {
  logger.info('Redis connection is disabled via .env. Using MemoryOtpStore directly.', { service: 'redis' });
}

const memoryStore = new MemoryOtpStore();

/**
 * Resilient Store Wrapper:
 * Intercepts calls to Redis; if Redis throws any error (such as Upstash request quota exceeded),
 * it immediately catches the error, trips the circuit breaker, and delegates to MemoryOtpStore without failing the HTTP request.
 */
const resilientStore = {
  async get(key) {
    if (isQuotaExceeded || !isRedisConnected || !redisClient || redisClient.status !== 'ready') {
      return memoryStore.get(key);
    }
    try {
      return await redisClient.get(key);
    } catch (err) {
      if (err.message && err.message.includes('max requests limit exceeded')) {
        isQuotaExceeded = true;
        isRedisConnected = false;
        logger.warn('[Redis] Upstash quota exceeded during GET command. Switched to MemoryOtpStore.', { service: 'redis' });
      }
      return memoryStore.get(key);
    }
  },

  async set(key, value, mode, durationSeconds) {
    if (isQuotaExceeded || !isRedisConnected || !redisClient || redisClient.status !== 'ready') {
      return memoryStore.set(key, value, mode, durationSeconds);
    }
    try {
      if (mode && durationSeconds) {
        return await redisClient.set(key, value, mode, durationSeconds);
      }
      return await redisClient.set(key, value);
    } catch (err) {
      if (err.message && err.message.includes('max requests limit exceeded')) {
        isQuotaExceeded = true;
        isRedisConnected = false;
        logger.warn('[Redis] Upstash quota exceeded during SET command. Switched to MemoryOtpStore.', { service: 'redis' });
      }
      return memoryStore.set(key, value, mode, durationSeconds);
    }
  },

  async del(key) {
    if (isQuotaExceeded || !isRedisConnected || !redisClient || redisClient.status !== 'ready') {
      return memoryStore.del(key);
    }
    try {
      return await redisClient.del(key);
    } catch (err) {
      if (err.message && err.message.includes('max requests limit exceeded')) {
        isQuotaExceeded = true;
        isRedisConnected = false;
      }
      return memoryStore.del(key);
    }
  },

  async ttl(key) {
    if (isQuotaExceeded || !isRedisConnected || !redisClient || redisClient.status !== 'ready') {
      return memoryStore.ttl(key);
    }
    try {
      return await redisClient.ttl(key);
    } catch (err) {
      if (err.message && err.message.includes('max requests limit exceeded')) {
        isQuotaExceeded = true;
        isRedisConnected = false;
      }
      return memoryStore.ttl(key);
    }
  },

  async incr(key) {
    if (isQuotaExceeded || !isRedisConnected || !redisClient || redisClient.status !== 'ready') {
      return memoryStore.incr(key);
    }
    try {
      return await redisClient.incr(key);
    } catch (err) {
      if (err.message && err.message.includes('max requests limit exceeded')) {
        isQuotaExceeded = true;
        isRedisConnected = false;
      }
      return memoryStore.incr(key);
    }
  },
};

const getStore = () => {
  return resilientStore;
};

module.exports = {
  redisClient,
  getStore,
  MemoryOtpStore,
};
