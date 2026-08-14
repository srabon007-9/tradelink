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

  /**
   * PATCH /api/users/profile
   * Updates authenticated user's profile details (name, bio, company, phone, avatar).
   */
  updateProfile: async (req, res, next) => {
    try {
      const { name, bio, company, phone, avatar } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if ('name' in req.body) user.name = name;
      if ('bio' in req.body) user.bio = bio;
      if ('company' in req.body) user.company = company;
      if ('phone' in req.body) user.phone = phone;
      if ('avatar' in req.body) user.avatar = avatar;

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user.toPublicJSON(),
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
