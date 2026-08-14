'use strict';

/**
 * validations/wallet.validation.js — Wallet Input Validation
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

const validatePurchase = [
  body('packageId')
    .trim()
    .notEmpty()
    .withMessage('Package ID is required')
    .isIn(['starter', 'popular', 'pro'])
    .withMessage('Invalid package ID. Must be starter, popular, or pro'),

  body('paymentId')
    .optional()
    .trim(),

  validate,
];

const validateDevAction = [
  body('action')
    .trim()
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['earn', 'spend', 'bonus'])
    .withMessage('Invalid action. Must be earn, spend, or bonus'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),

  body('reason')
    .optional()
    .trim(),

  validate,
];

module.exports = {
  validatePurchase,
  validateDevAction,
};
