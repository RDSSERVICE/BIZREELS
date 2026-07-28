const { getStore } = require('../config/redis');

/**
 * Get a value from the cache
 * @param {string} key 
 * @returns {Promise<any|null>}
 */
const getCache = async (key) => {
  try {
    const store = getStore();
    const val = await store.get(key);
    if (!val) return null;
    return JSON.parse(val);
  } catch (err) {
    return null;
  }
};

/**
 * Set a value in the cache with a TTL
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 
 * @returns {Promise<boolean>}
 */
const setCache = async (key, value, ttlSeconds = 300) => {
  try {
    const store = getStore();
    const serialized = JSON.stringify(value);
    await store.set(key, serialized, 'EX', ttlSeconds);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Delete a value from the cache
 * @param {string} key 
 * @returns {Promise<boolean>}
 */
const deleteCache = async (key) => {
  try {
    const store = getStore();
    await store.del(key);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Increment a value in the cache (useful for version-based invalidation)
 * @param {string} key 
 * @returns {Promise<number>}
 */
const incrCache = async (key) => {
  try {
    const store = getStore();
    if (typeof store.incr === 'function') {
      return await store.incr(key);
    } else {
      // Memory store fallback
      const val = await store.get(key);
      const num = val ? parseInt(val, 10) : 0;
      const nextNum = num + 1;
      await store.set(key, String(nextNum), 'EX', 86400 * 30); // 30 days
      return nextNum;
    }
  } catch (err) {
    return 1;
  }
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  incrCache,
};
