'use strict';

/**
 * validations/tradeProposal.validation.js — Trade Proposal Input Validation
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

const validateCreateProposal = [
  body('listingId').isMongoId().withMessage('A valid listing id is required'),

  body('proposedSessionAt')
    .isISO8601()
    .withMessage('A valid proposed session date/time is required'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must be under 500 characters'),

  body('creditsToRedeem')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Credits to redeem must be a non-negative whole number'),

  validate,
];

const validateProposalId = [
  param('id').isMongoId().withMessage('Invalid proposal id'),
  validate,
];

module.exports = { validateCreateProposal, validateProposalId };
