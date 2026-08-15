'use strict';

/**
 * validations/creditWallet.validation.js — Credit Wallet Input Validation
 */

const { query, validationResult } = require('express-validator');

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

const validatePreviewRedemption = [
  query('price').isFloat({ min: 0 }).withMessage('A valid price is required'),
  query('credits').optional().isInt({ min: 0 }).withMessage('Credits must be a non-negative whole number'),
  validate,
];

module.exports = { validatePreviewRedemption };
