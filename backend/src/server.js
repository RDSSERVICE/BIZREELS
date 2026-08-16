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

    // Eagerly register all Mongoose models so populate() refs are always available
    require('./models/registerModels');

    const mongoose = require('mongoose');
    const adminPhoneService = require('./services/admin-phone.service');
    const categoryService = require('./services/category.service');

    // Safely execute admin and category seeds when MongoDB connection is active
    const seedMarketplaceIfEmpty = async () => {
      try {
        await adminPhoneService.ensureAdminSeed();
        await categoryService.seedCategories();
        const Listing = require('./models/Listing');
        const count = await Listing.countDocuments();
        if (count === 0) {
          const { seedMarketplaceData } = require('../scripts/seedMarketplace');
          if (seedMarketplaceData) await seedMarketplaceData();
        }
      } catch (seedErr) {
        logger.warn(`Seed skipped: ${seedErr.message}`);
      }
    };

    if (mongoose.connection.readyState === 1) {
      await seedMarketplaceIfEmpty();
    } else {
      logger.warn('MongoDB connection pending. Seeding will run once connected.');
      mongoose.connection.once('connected', seedMarketplaceIfEmpty);
    }

    // Init Socket.io connections
    initSockets(server);

    // Start Offer Activation/Expiration Cron Scheduler
    const { initOfferScheduler } = require('./jobs/offerScheduler');
    initOfferScheduler();

    // Start Subscription cron job
    const { initSubscriptionCron } = require('./jobs/subscription.cron');
    initSubscriptionCron();

    // Start Reel Scheduler
    const { initReelScheduler } = require('./jobs/reelScheduler');
    initReelScheduler();

    // Log Razorpay configuration status
    const razorpayService = require('./services/razorpay.service');
    razorpayService.logConfigStatus();

    let currentPort = config.port;
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const oldPort = currentPort;
        currentPort++;
        logger.warn(`Port ${oldPort} is busy. Retrying on fallback port ${currentPort}...`);
        server.listen(currentPort, '0.0.0.0');
      } else {
        logger.error('Server error:', err.message);
      }
    });

    // Start listening on 0.0.0.0 for universal local interface connectivity
    server.listen(currentPort, '0.0.0.0', () => {
      // Start automatic 30s self-ping to prevent Render server sleep
      const { startKeepAlive } = require('./services/keepalive.service');
      startKeepAlive(30000);

      logger.info(`
  ╔══════════════════════════════════════════════╗
  ║   🎬 BizReels API Server                    ║
  ║   Environment: ${config.env.padEnd(28)}║
  ║   Port:        ${String(currentPort).padEnd(28)}║
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
// Trigger watch reload: 2026-07-28 23:45:00
