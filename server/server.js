'use strict';

const { validateEnv }        = require('./config/env');
const connectDB              = require('./config/db');
const logger                 = require('./utils/logger');
const { seedCategories }     = require('./services/valuation.service');
const { startValuationCron } = require('./jobs/valuationCron');

validateEnv();

const app = require('./app');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Local Development Startup ───────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const startServer = async () => {
    try {
      await connectDB();
      await seedCategories();
      startValuationCron();

      const server = app.listen(PORT, () => {
        logger.info(`TradeLink server running in ${NODE_ENV} mode on port ${PORT}`);
        logger.info(`API available at http://localhost:${PORT}/api`);
      });

      const gracefulShutdown = signal => {
        logger.info(`\n${signal} received — shutting down gracefully...`);
        server.close(() => {
          logger.info('HTTP server closed.');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

      process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        server.close(() => process.exit(1));
      });

      process.on('uncaughtException', err => {
        logger.error('Uncaught Exception:', err.message);
        process.exit(1);
      });
    } catch (error) {
      logger.error('Failed to start server:', error.message);
      process.exit(1);
    }
  };

  startServer();
}

// ─── Export for Vercel Serverless Function ──────────────────────────────────
module.exports = app;