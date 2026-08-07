/**
 * middleware/notFound.js — 404 Catch-All
 *
 * Catches any request that didn't match a registered route.
 * Must be registered BEFORE the errorHandler in app.js.
 */

'use strict';

const { StatusCodes } = require('http-status-codes');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const notFound = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route not found: [${req.method}] ${req.originalUrl}`,
  });
};

module.exports = notFound;
