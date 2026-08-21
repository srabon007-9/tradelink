'use strict';

/**
 * routes/notification.routes.js — In-App Notification Center Routes
 *
 * GET   /api/notifications/mine       → recent notifications (optional ?category=)
 * GET   /api/notifications/counts     → unread counts per category, for sidebar badges
 * PATCH /api/notifications/:id/read   → mark one notification read
 * PATCH /api/notifications/read-all   → mark a category (or all) read, e.g. on visiting that page
 */

const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');
const { validateNotificationId, validateCategory } = require('../validations/notification.validation');

const router = express.Router();

router.get('/mine', protect, validateCategory, notificationController.getMine);
router.get('/counts', protect, notificationController.getCounts);
router.patch('/:id/read', protect, validateNotificationId, notificationController.markRead);
router.patch('/read-all', protect, validateCategory, notificationController.markCategoryRead);

module.exports = router;
