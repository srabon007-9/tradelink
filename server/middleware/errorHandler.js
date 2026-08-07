/**
 * middleware/errorHandler.js — Global Error Handler
 *
 * Must be the LAST middleware registered in app.js (after all routes).
 * Handles both operational errors (ApiError) and unexpected programmer errors.
 */

'use strict';

const { StatusCodes } = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Global error handling middleware.
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
const errorHandler = (err, req, res, _next) => {
  // Log every error (with stack in development)
  if (process.env.NODE_ENV === 'development') {
    logger.error(`[${req.method}] ${req.path} — ${err.message}`, err.stack);
  } else {
    logger.error(`[${req.method}] ${req.path} — ${err.message}`);
  }

  // Known operational error (thrown via ApiError)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: `Invalid value for field: ${err.path}`,
    });
  }

  // JWT errors (for when auth is implemented)
  if (err.name === 'JsonWebTokenError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Token expired. Please log in again.',
    });
  }

  // Fallback — unexpected / programmer error
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
