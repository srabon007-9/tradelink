'use strict';

/**
 * middleware/auth.js — Route Protection
 *
 * Verifies the JWT access token sent in the Authorization header and
 * attaches { id } to req.user. Referenced by auth.controller.js and
 * required by any route that needs to know the current user.
 *
 * Usage:
 *   router.post('/', protect, controller.create);
 */

const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const ApiError = require('../utils/ApiError');

const protect = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(ApiError.unauthorized('Authentication required — please log in'));
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = { id: payload.id };
    next();
  } catch (err) {
    // Let JsonWebTokenError / TokenExpiredError fall through to the global
    // error handler, which already has dedicated branches for both.
    next(err);
  }
};

module.exports = { protect };
