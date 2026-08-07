/**
 * utils/ApiError.js — Custom Operational Error Class
 *
 * Extend this class to throw known, expected errors throughout the app.
 * The global error handler uses instanceof checks to differentiate these
 * from unexpected programmer errors.
 *
 * Usage:
 *   throw new ApiError(404, 'Project not found');
 *   throw new ApiError(401, 'Unauthorized — please log in');
 */

'use strict';

const { StatusCodes } = require('http-status-codes');

class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {boolean} [isOperational=true] - true = known error, false = programmer bug
   */
  constructor(statusCode, message, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Capture stack trace (excludes constructor from stack)
    Error.captureStackTrace(this, this.constructor);

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // ─── Static Factory Helpers ─────────────────────────────────────────────────

  /** 400 Bad Request */
  static badRequest(message = 'Bad request') {
    return new ApiError(StatusCodes.BAD_REQUEST, message);
  }

  /** 401 Unauthorized */
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(StatusCodes.UNAUTHORIZED, message);
  }

  /** 403 Forbidden */
  static forbidden(message = 'Forbidden') {
    return new ApiError(StatusCodes.FORBIDDEN, message);
  }

  /** 404 Not Found */
  static notFound(message = 'Resource not found') {
    return new ApiError(StatusCodes.NOT_FOUND, message);
  }

  /** 409 Conflict */
  static conflict(message = 'Conflict') {
    return new ApiError(StatusCodes.CONFLICT, message);
  }

  /** 422 Unprocessable Entity */
  static unprocessable(message = 'Validation failed') {
    return new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, message);
  }

  /** 500 Internal Server Error */
  static internal(message = 'Internal server error') {
    return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, message, false);
  }
}

module.exports = ApiError;
