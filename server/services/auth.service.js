'use strict';

/**
 * services/auth.service.js — Authentication Business Logic
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { config } = require('../config/env');

// ─── Token Helpers ────────────────────────────────────────────────────────────

const generateAccessToken = userId =>
  jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

const generateRefreshToken = userId =>
  jwt.sign({ id: userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

const generateTokens = userId => ({
  accessToken: generateAccessToken(userId),
  refreshToken: generateRefreshToken(userId),
});

// ─── Auth Service ─────────────────────────────────────────────────────────────

const authService = {
  /**
   * Register a new user.
   * @param {{ name, email, password, phone }} data
   * @returns {{ user, accessToken, refreshToken }}
   */
  registerUser: async ({ name, email, password, phone }) => {
    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error('Email is already registered');
      err.statusCode = 409;
      throw err;
    }

    // Create user (password is hashed by the pre-save hook). role isn't
    // taken from input — it defaults to 'client' on the schema.
    const user = await User.create({ name, email, password, phone });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Persist refresh token on the user document
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user: user.toPublicJSON(), accessToken, refreshToken };
  },

  /**
   * Login an existing user.
   * @param {{ email, password }} credentials
   * @returns {{ user, accessToken, refreshToken }}
   */
  loginUser: async ({ email, password }) => {
    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    if (user.isSuspended) {
      const err = new Error('Your account has been suspended. Please contact platform support.');
      err.statusCode = 403;
      throw err;
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user: user.toPublicJSON(), accessToken, refreshToken };
  },

  /**
   * Issue a new access token using a valid refresh token.
   * @param {string} token
   * @returns {{ accessToken }}
   */
  refreshAccessToken: async token => {
    let payload;
    try {
      payload = jwt.verify(token, config.jwt.refreshSecret);
    } catch {
      const err = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      throw err;
    }

    const user = await User.findById(payload.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      const err = new Error('Refresh token mismatch');
      err.statusCode = 401;
      throw err;
    }

    const accessToken = generateAccessToken(user._id);
    return { accessToken };
  },

  /**
   * Logout — clear refresh token from DB.
   * @param {string} userId
   */
  logoutUser: async userId => {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  },
};

module.exports = authService;
