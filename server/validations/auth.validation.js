'use strict';

/**
 * validations/auth.validation.js — Auth Input Validation
 */

const { body, validationResult } = require('express-validator');

// ─── Reusable validation runner middleware ────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Register ─────────────────────────────────────────────────────────────────
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be under 100 characters'),

  body('email')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  body('role')
    .optional()
    .isIn(['client', 'operations'])
    .withMessage('Role must be client or operations'),

  validate,
];

// ─── Login ────────────────────────────────────────────────────────────────────
const validateLogin = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

module.exports = { validateRegister, validateLogin };
