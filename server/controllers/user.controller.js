'use strict';

/**
 * controllers/user.controller.js — User Controller
 */

const User = require('../models/User.model');

const userController = {
  /**
   * GET /api/users
   * Returns all registered members (public info only).
   */
  getUsers: async (req, res, next) => {
    try {
      const users = await User.find().select('name email role company bio avatar createdAt').lean();
      return res.status(200).json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/users/:id
   * Returns a single user's public profile.
   */
  getUser: async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id)
        .select('name email role company bio avatar createdAt')
        .lean();
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
