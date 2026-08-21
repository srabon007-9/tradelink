'use strict';

/**
 * validations/tradeProposal.validation.js — Trade Proposal Input Validation
 */

const { body, param, query, validationResult } = require('express-validator');

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

  body('isUrgent')
    .optional()
    .isBoolean()
    .withMessage('isUrgent must be true or false'),

  validate,
];

const validateProposalId = [
  param('id').isMongoId().withMessage('Invalid proposal id'),
  validate,
];

const validateRushPreview = [
  query('priceBDT').isFloat({ min: 0 }).withMessage('A valid price is required'),
  query('deadline').isISO8601().withMessage('A valid deadline date/time is required'),
  validate,
];

const validateDispute = [
  param('id').isMongoId().withMessage('Invalid proposal id'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('A reason for the dispute is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  validate,
];

const validateDisputeMessage = [
  param('id').isMongoId().withMessage('Invalid proposal id'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('A message is required')
    .isLength({ max: 1000 })
    .withMessage('Message must be under 1000 characters'),
  validate,
];

module.exports = {
  validateCreateProposal,
  validateProposalId,
  validateRushPreview,
  validateDispute,
  validateDisputeMessage,
};
