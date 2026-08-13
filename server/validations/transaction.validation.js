'use strict';

/**
 * validations/transaction.validation.js — Transaction Input Validation
 */

const { param, validationResult } = require('express-validator');

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

module.exports = { validateTransactionId };
