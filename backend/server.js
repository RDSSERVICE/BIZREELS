require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/services/socket.service');
const logger = require('./src/utils/logger');

// Seeding/Initialization Services
const settingsService = require('./src/services/settings.service');
const authService = require('./src/services/auth.service');
const categoryService = require('./src/services/category.service');
const seedService = require('./src/services/seed.service');
const walletService = require('./src/services/wallet.service');

// Background Task Loops
const dealService = require('./src/services/deal.service');
const boostService = require('./src/services/boost.service');
const nudgeService = require('./src/services/nudge.service');

const PORT = process.env.PORT || 8001;

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Initialize HTTP & Socket.IO server
    const server = http.createServer(app);
    initSocket(server);

    // 3. Start Listening
    server.listen(PORT, () => {
      logger.info(`BizReels backend server listening on port ${PORT} (Phase 0-6)`);
    });

    // 4. Run Startup Seeding and initialization tasks (non-blocking)
    setImmediate(async () => {
      try {
        await settingsService.initializeDefaultsOnStartup();
        await authService.seedAdminUser();
        await categoryService.seedCategories();
        await seedService.seedReels();
        await walletService.backfillAll();

        // Optional auto-seed demo data if enabled
        try {
          const demoSeedService = require('./src/services/demo-seed.service');
          await demoSeedService.maybeAutoSeedOnStartup();
        } catch (err) {
          logger.warn(`Auto-seed skipped: ${err.message}`);
        }
      } catch (err) {
        logger.error(`Startup initialization failed: ${err.message}`);
      }
    });

    // 5. Start Background Loops (Intervals)
    // - Expire deals every 5 mins (300 seconds)
    setInterval(async () => {
      await dealService.checkAndExpireDeals();
    }, 300 * 1000);

    // - Deal completion follow-ups every 15 mins (900 seconds)
    setInterval(async () => {
      await dealService.runDealFollowups();
    }, 900 * 1000);

    // - Expire active boosts every 15 mins (900 seconds)
    setInterval(async () => {
      await boostService.expireBoostsLoop();
    }, 900 * 1000);

    // - Nudge scanning loop every 24 hours
    setInterval(async () => {
      await nudgeService.nudgeLoop();
    }, 24 * 60 * 60 * 1000);

  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
