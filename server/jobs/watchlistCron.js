'use strict';

/**
 * jobs/watchlistCron.js — Watchlist Threshold-Checking & Notification Trigger
 *
 * Runs on its own schedule, independent of the valuation engine's cron
 * (jobs/valuationCron.js) — this is the Watchlist feature's own trigger
 * mechanism, a self-contained subsystem. Every run:
 *
 *   1. Reads every *active* watch.
 *   2. Reads the current live priceBDT for each watched category —
 *      never recalculates it. That's the valuation engine's job, not
 *      this subsystem's; Watchlist only ever observes the price.
 *   3. If a watch's condition is met (price <= threshold for 'below',
 *      price >= threshold for 'above'), emails the user and flips the
 *      watch to 'triggered' so it stops re-notifying every cycle.
 */

const cron = require('node-cron');
const Watchlist = require('../models/Watchlist.model');
const SkillCategory = require('../models/SkillCategory.model');
const User = require('../models/User.model');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

let cronJob = null;

/** One check pass over every active watch. Exported for direct/manual invocation (e.g. tests). */
const checkWatchlist = async () => {
  const activeWatches = await Watchlist.find({ status: 'active' });
  if (activeWatches.length === 0) {return { checked: 0, triggered: 0 };}

  const slugs = [...new Set(activeWatches.map(w => w.category))];
  const categories = await SkillCategory.find({ slug: { $in: slugs } })
    .select('slug name priceBDT')
    .lean();
  const categoryBySlug = categories.reduce((acc, c) => {
    acc[c.slug] = c;
    return acc;
  }, {});

  let triggeredCount = 0;

  for (const watch of activeWatches) {
    const category = categoryBySlug[watch.category];
    if (!category) {continue;} // category no longer exists — skip, don't fail the whole run

    const priceBDT = category.priceBDT;
    const conditionMet =
      watch.condition === 'below' ? priceBDT <= watch.thresholdBDT : priceBDT >= watch.thresholdBDT;

    if (!conditionMet) {continue;}

    watch.status = 'triggered';
    watch.triggeredAt = new Date();
    watch.triggeredAtPriceBDT = priceBDT;
    await watch.save();
    triggeredCount += 1;

    try {
      const user = await User.findById(watch.user).select('name email');
      if (user?.email) {
        await emailService.sendWatchlistAlert({
          toEmail: user.email,
          userName: user.name,
          categoryName: category.name,
          condition: watch.condition,
          thresholdBDT: watch.thresholdBDT,
          currentPriceBDT: priceBDT,
        });
      }
    } catch (err) {
      // Notification failure must never block other watches from being checked.
      logger.error(`[Watchlist] Failed to notify user ${watch.user} for watch ${watch._id}: ${err.message}`);
    }
  }

  if (triggeredCount > 0) {
    logger.info(`[Watchlist] Checked ${activeWatches.length} active watch(es) — ${triggeredCount} triggered.`);
  }

  return { checked: activeWatches.length, triggered: triggeredCount };
};

const startWatchlistCron = () => {
  // Every 5 minutes — its own cadence, independent of the valuation
  // engine's 15-minute cron.
  cronJob = cron.schedule('*/5 * * * *', async () => {
    try {
      await checkWatchlist();
    } catch (err) {
      logger.error('[Watchlist] Cron check failed:', err.message);
    }
  });

  logger.info('[Watchlist] Threshold-checking cron scheduled (every 5 minutes).');
};

const stopWatchlistCron = () => {
  if (cronJob) {
    cronJob.stop();
    logger.info('[Watchlist] Cron job stopped.');
  }
};

module.exports = { startWatchlistCron, stopWatchlistCron, checkWatchlist };
