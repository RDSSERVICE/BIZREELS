const http = require('http');
const app = require('./app');
const config = require('./config');
const { connectDB, disconnectDB } = require('./database/connection');
const logger = require('./utils/logger');
const { initSockets } = require('./sockets');

const server = http.createServer(app);

/**
 * Bootstrap the application:
 * 1. Connect to MongoDB
 * 2. Initialize Sockets
 * 3. Start HTTP server
 * 4. Register graceful shutdown handlers
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const mongoose = require('mongoose');
    const adminPhoneService = require('./services/admin-phone.service');

    // Safely execute admin seed when MongoDB connection is active
    if (mongoose.connection.readyState === 1) {
      try {
        await adminPhoneService.ensureAdminSeed();
      } catch (seedErr) {
        logger.warn(`Admin seed skipped: ${seedErr.message}`);
      }
    } else {
      logger.warn('MongoDB connection pending. Admin seed will run once connected.');
      mongoose.connection.once('connected', async () => {
        try {
          await adminPhoneService.ensureAdminSeed();
        } catch (seedErr) {
          logger.warn(`Admin seed skipped on reconnect: ${seedErr.message}`);
        }
      });
    }

    // Init Socket.io connections
    initSockets(server);

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const fallbackPort = config.port + 1;
        logger.warn(`Port ${config.port} is busy. Retrying on fallback port ${fallbackPort}...`);
        server.listen(fallbackPort);
      } else {
        logger.error('Server error:', err.message);
      }
    });

    // Start listening
    server.listen(config.port, () => {
      logger.info(`
  ╔══════════════════════════════════════════════╗
  ║   🎬 BizReels API Server                    ║
  ║   Environment: ${config.env.padEnd(28)}║
  ║   Port:        ${String(config.port).padEnd(28)}║
  ║   Status:      Running ✅                   ║
  ╚══════════════════════════════════════════════╝
      `, { service: 'server' });
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message, service: 'server' });
    process.exit(1);
  }
};

// ══════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ══════════════════════════════════════════════════════════════

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`, { service: 'server' });

  server.close(async () => {
    logger.info('HTTP server closed.', { service: 'server' });

    await disconnectDB();

    // Close Redis connection if exists
    // await redis.quit();

    logger.info('All connections closed. Process exiting.', { service: 'server' });
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.', { service: 'server' });
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', { error: err.message, stack: err.stack, service: 'process' });
  shutdown('unhandledRejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { error: err.message, stack: err.stack, service: 'process' });
  process.exit(1);
});

// Start the server
startServer();

module.exports = server;
