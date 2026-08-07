/**
 * utils/ApiResponse.js — Standard API Response Wrapper
 *
 * Ensures all API responses follow a consistent JSON shape.
 *
 * Success:  { success: true,  data: {...}, message: '...', meta: {...} }
 * Error:    handled by errorHandler middleware (not this class)
 *
 * Usage in a controller:
 *   return ApiResponse.success(res, { user }, 'User fetched successfully');
 *   return ApiResponse.created(res, { user }, 'Account created successfully');
 *   return ApiResponse.noContent(res);
 */

'use strict';

const { StatusCodes } = require('http-status-codes');

class ApiResponse {
  /**
   * Send a 200 OK response.
   * @param {import('express').Response} res
   * @param {*} data
   * @param {string} [message='Success']
   * @param {object} [meta={}] - Pagination, totals, etc.
   */
  static success(res, data = null, message = 'Success', meta = {}) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message,
      data,
      ...(Object.keys(meta).length > 0 && { meta }),
    });
  }

  /**
   * Send a 201 Created response.
   */
  static created(res, data = null, message = 'Created successfully') {
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send a 204 No Content response.
   */
  static noContent(res) {
    return res.status(StatusCodes.NO_CONTENT).send();
  }

  /**
   * Send a paginated list response.
   * @param {import('express').Response} res
   * @param {Array} items
   * @param {object} pagination - { total, page, limit, pages }
   * @param {string} [message='Fetched successfully']
   */
  static paginated(res, items, pagination, message = 'Fetched successfully') {
    return res.status(StatusCodes.OK).json({
      success: true,
      message,
      data: items,
      meta: { pagination },
    });
  }
}

module.exports = ApiResponse;
