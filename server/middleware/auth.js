'use strict';

/**
 * middleware/auth.js — Route Protection
 *
 * Verifies the JWT access token sent in the Authorization header and
 * attaches { id, role } to req.user. Referenced by auth.controller.js and
 * required by any route that needs to know the current user — including
 * middleware/admin.middleware.js's requireAdmin, which reads req.user.role.
 *
 * role is looked up fresh from the DB rather than trusted from the JWT
 * payload (which only ever embeds `id`), so a role change takes effect
 * immediately rather than waiting for the token to be reissued.
 *
 * Usage:
 *   router.post('/', protect, controller.create);
 */

const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');

const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(ApiError.unauthorized('Authentication required — please log in'));
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.id).select('role');
    if (!user) {
      return next(ApiError.unauthorized('This account no longer exists'));
    }

    req.user = { id: payload.id, role: user.role };
    next();
  } catch (err) {
    // Let JsonWebTokenError / TokenExpiredError fall through to the global
    // error handler, which already has dedicated branches for both.
    next(err);
  }
};

module.exports = { protect };
