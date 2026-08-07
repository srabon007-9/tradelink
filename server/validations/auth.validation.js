/**
 * validations/auth.validation.js — Auth Input Validation
 *
 * Uses express-validator to validate and sanitize request bodies.
 *
 * TODO (Member 1 — Backend):
 *  - validateRegister  → name, email, password, confirmPassword
 *  - validateLogin     → email, password
 *  - validateForgotPassword → email
 *  - validateResetPassword  → password, confirmPassword
 */

'use strict';

// const { body } = require('express-validator');
// const { validateRequest } = require('../middleware/validateRequest');

// export const validateRegister = [
//   body('name').trim().notEmpty().withMessage('Name is required'),
//   body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
//   body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
//   validateRequest,
// ];

module.exports = {};
