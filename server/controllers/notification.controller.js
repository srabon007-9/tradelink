'use strict';

/**
 * controllers/notification.controller.js — In-App Notification Center
 */

const notificationService = require('../services/notification.service');

const notificationController = {
  // ─── GET /api/notifications/mine ─────────────────────────────────────────────
  getMine: async (req, res, next) => {
    try {
      const notifications = await notificationService.getMyNotifications(req.user.id, req.query);
      return res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /api/notifications/counts ───────────────────────────────────────────
  getCounts: async (req, res, next) => {
    try {
      const counts = await notificationService.getUnreadCounts(req.user.id);
      return res.status(200).json({ success: true, data: counts });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
  markRead: async (req, res, next) => {
    try {
      await notificationService.markRead(req.user.id, req.params.id);
      return res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  // ─── PATCH /api/notifications/read-all ───────────────────────────────────────
  markCategoryRead: async (req, res, next) => {
    try {
      await notificationService.markCategoryRead(req.user.id, req.query.category);
      return res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = notificationController;
