'use strict';

/**
 * validations/transaction.validation.js — Transaction Input Validation
 */

const { body, param, validationResult } = require('express-validator');

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

const validateTransactionId = [
  param('id').isMongoId().withMessage('Invalid transaction id'),
  validate,
];

const validateBkashPayment = [
  param('id').isMongoId().withMessage('Invalid transaction id'),
  body('bkashTransactionId')
    .trim()
    .notEmpty()
    .withMessage('A bKash Transaction ID is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('bKash Transaction ID must be between 3 and 50 characters'),
  validate,
];

module.exports = { validateTransactionId, validateBkashPayment };
