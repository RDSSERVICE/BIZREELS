const { AsyncLocalStorage } = require('async_hooks');
const logger = require('../utils/logger');

const performanceLocalStorage = new AsyncLocalStorage();

/**
 * Global Performance Profiling Middleware
 */
const requestPerformanceLogger = (req, res, next) => {
  const start = process.hrtime();
  const memStart = process.memoryUsage().heapUsed;
  
  const context = {
    dbQueryCount: 0,
    dbQueryTime: 0,
    dbCommandTime: 0,
  };

  let responseSize = 0;
  const oldWrite = res.write;
  const oldEnd = res.end;

  res.write = function (chunk, ...args) {
    if (chunk) {
      responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
    }
    return oldWrite.apply(res, [chunk, ...args]);
  };

  res.end = function (chunk, ...args) {
    if (chunk) {
      responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
    }
    return oldEnd.apply(res, [chunk, ...args]);
  };

  performanceLocalStorage.run(context, () => {
    res.on('finish', () => {
      const diff = process.hrtime(start);
      const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6);
      
      const memEnd = process.memoryUsage().heapUsed;
      const heapUsedMB = memEnd / (1024 * 1024);
      const heapDiffMB = (memEnd - memStart) / (1024 * 1024);

      const dbCommandMs = context.dbCommandTime || 0;
      const dbWaitMs = Math.max(0, context.dbQueryTime - dbCommandMs);
      const appTimeMs = Math.max(0, durationMs - context.dbQueryTime);

      const logPayload = {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        totalTimeMs: durationMs,
        dbQueryCount: context.dbQueryCount,
        dbQueryTimeMs: context.dbQueryTime,
        dbCommandTimeMs: dbCommandMs,
        dbWaitTimeMs: dbWaitMs,
        appTimeMs: appTimeMs,
        responseSizeBytes: responseSize,
        heapUsedMB: heapUsedMB,
        heapDiffMB: heapDiffMB,
      };

      const sizeStr = responseSize > 1024 * 1024
        ? `${(responseSize / (1024 * 1024)).toFixed(2)} MB`
        : responseSize > 1024
          ? `${(responseSize / 1024).toFixed(2)} KB`
          : `${responseSize} B`;

      const metricsStr = `[Total: ${durationMs.toFixed(2)}ms | DB Execution: ${dbCommandMs.toFixed(2)}ms | DB Wait/RTT: ${dbWaitMs.toFixed(2)}ms | App: ${appTimeMs.toFixed(2)}ms]`;

      if (durationMs > 500) {
        logger.warn(
          `SLOW API WARNING: ${req.method} ${logPayload.url} took ${durationMs.toFixed(2)}ms | Size: ${sizeStr} | Heap: ${heapUsedMB.toFixed(2)}MB (${heapDiffMB >= 0 ? '+' : ''}${heapDiffMB.toFixed(2)}MB) ${metricsStr} [DB Queries: ${context.dbQueryCount}]`,
          logPayload
        );
      } else {
        logger.info(
          `${req.method} ${logPayload.url} took ${durationMs.toFixed(2)}ms | Size: ${sizeStr} | Heap: ${heapUsedMB.toFixed(2)}MB ${metricsStr}`,
          { durationMs, responseSizeBytes: responseSize, heapUsedMB, ...logPayload }
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
