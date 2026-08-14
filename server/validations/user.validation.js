'use strict';

/**
 * validations/user.validation.js — User Profile Input Validation
 */

const { body, validationResult } = require('express-validator');

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

const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),

  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Phone number cannot exceed 30 characters'),

  body('avatar')
    .optional()
    .trim(),

  validate,
];

module.exports = { validateUpdateProfile };
