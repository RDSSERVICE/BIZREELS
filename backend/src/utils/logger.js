const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, service, ...meta }) => {
  const svc = service ? `[${service}]` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} ${level} ${svc} ${message}${metaStr}`;
});

// Custom log format for file (structured JSON)
const fileFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  defaultMeta: { service: 'bizreels-api' },
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
    }),

    // File transport: all logs
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true,
    }),

    // File transport: errors only
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
  ],

  // Prevent unhandled exceptions from crashing silently
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/exceptions.log'),
      format: fileFormat,
    }),
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/rejections.log'),
      format: fileFormat,
    }),
  ],
});

module.exports = logger;
