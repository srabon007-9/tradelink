'use strict';

/**
 * controllers/auth.controller.js — Authentication Controller
 *
 * Handles HTTP layer for auth endpoints.
 * Delegates business logic to auth.service.js.
 */

const authService = require('../services/auth.service');

// Cookie options for the refresh token (httpOnly for security)
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
};

const authController = {
  /**
   * POST /api/auth/register
   */
  register: async (req, res, next) => {
    try {
      const { name, email, password, phone } = req.body;
      const { user, accessToken, refreshToken } = await authService.registerUser({
        name,
        email,
        password,
        phone,
      });

      // Store refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: { user, accessToken },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   */
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.loginUser({
        email,
        password,
      });

      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: { user, accessToken },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   */
  logout: async (req, res, next) => {
    try {
      // req.user is set by the protect middleware
      if (req.user) {
        await authService.logoutUser(req.user.id);
      }

      res.clearCookie('refreshToken');

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/refresh-token
   */
  refreshToken: async (req, res, next) => {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        return res.status(401).json({ success: false, message: 'No refresh token provided' });
      }

      const { accessToken } = await authService.refreshAccessToken(token);

      return res.status(200).json({
        success: true,
        data: { accessToken },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
