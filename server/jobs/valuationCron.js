'use strict';

/**
 * jobs/valuationCron.js — Scheduled Valuation Recalculation
 *
 * Runs every 15 minutes as a safety net to ensure no category accumulates
 * stale prices between event-driven recalculations.
 *
 * This is the BACKUP mechanism. The PRIMARY mechanism is event-driven:
 * updateSupply() and updateDemand() in valuation.service.js trigger an
 * immediate recalculation whenever supply or demand changes.
 *
 * Why 15 minutes?
 *   - Short enough that stale prices are corrected quickly
 *   - Long enough to not create an excessive number of snapshots
 *   - At 15-min intervals: ~96 snapshots/day × 10 categories = ~960 docs/day (very manageable)
 */

const cron               = require('node-cron');
const { recalculateAll } = require('../services/valuation.service');
const logger             = require('../utils/logger');

let cronJob = null;

const startValuationCron = () => {
  // Cron expression: */15 * * * * = every 15 minutes
  cronJob = cron.schedule('*/15 * * * *', async () => {
    logger.info('[Cron] Running scheduled valuation recalculation...');
    try {
      await recalculateAll('scheduled');
    } catch (err) {
      logger.error('[Cron] Valuation recalculation failed:', err.message);
    }
  });

  logger.info('[Cron] Valuation cron job scheduled (every 15 minutes).');
};

const stopValuationCron = () => {
  if (cronJob) {
    cronJob.stop();
    logger.info('[Cron] Valuation cron job stopped.');
  }
};

module.exports = { startValuationCron, stopValuationCron };
