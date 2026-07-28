const { AsyncLocalStorage } = require('async_hooks');
const logger = require('../utils/logger');

const performanceLocalStorage = new AsyncLocalStorage();

/**
 * Global Performance Profiling Middleware
 */
const requestPerformanceLogger = (req, res, next) => {
  const start = process.hrtime();
  
  const context = {
    dbQueryCount: 0,
    dbQueryTime: 0,
  };

  performanceLocalStorage.run(context, () => {
    res.on('finish', () => {
      const diff = process.hrtime(start);
      const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6);
      
      const logPayload = {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        totalTimeMs: durationMs,
        dbQueryCount: context.dbQueryCount,
        dbQueryTimeMs: context.dbQueryTime,
      };

      if (durationMs > 500) {
        logger.warn(
          `SLOW API WARNING: ${req.method} ${logPayload.url} took ${durationMs.toFixed(2)}ms [DB Queries: ${context.dbQueryCount}, DB Query Time: ${context.dbQueryTime.toFixed(2)}ms]`,
          logPayload
        );
      } else {
        logger.info(
          `${req.method} ${logPayload.url} took ${durationMs.toFixed(2)}ms`,
          { durationMs }
        );
      }
    });
    next();
  });
};

module.exports = {
  requestPerformanceLogger,
  performanceLocalStorage,
};
