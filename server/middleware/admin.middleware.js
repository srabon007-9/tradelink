'use strict';

/**
 * middleware/admin.middleware.js — Admin Authorization Middleware
 */

const ApiError = require('../utils/ApiError');

/**
 * Ensures the authenticated user has the 'admin' role.
 * Must be placed after the auth `protect` middleware.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Access denied. Administrator privileges required.'));
  }
  next();
};

module.exports = { requireAdmin };
