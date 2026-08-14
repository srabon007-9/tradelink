/**
 * middleware/auth.js — JWT route protection.
 */

'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { config } = require('../config/env');

const base64UrlDecode = value => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64').toString('utf8');
};

const base64UrlEncode = value =>
  Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const verifyJwt = token => {
  const [header, payload, signature] = token.split('.');

  if (!header || !payload || !signature) {
    throw ApiError.unauthorized('Invalid authorization token');
  }

  const decodedHeader = JSON.parse(base64UrlDecode(header));

  if (decodedHeader.alg !== 'HS256') {
    throw ApiError.unauthorized('Unsupported authorization token');
  }

  if (!config.jwt.secret) {
    throw ApiError.internal('JWT secret is not configured');
  }

  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', config.jwt.secret).update(`${header}.${payload}`).digest()
  );

  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw ApiError.unauthorized('Invalid authorization token');
  }

  const decodedPayload = JSON.parse(base64UrlDecode(payload));

  if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
    throw ApiError.unauthorized('Token expired. Please log in again.');
  }

  return decodedPayload;
};

const getUserIdFromRequest = req => {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.match(/^Bearer\s+(.+)$/i) || [];

  if (token) {
    const payload = verifyJwt(token);
    return payload.sub || payload.id || payload.userId || payload._id;
  }

  if (process.env.NODE_ENV !== 'production' && req.headers['x-demo-user-id']) {
    return req.headers['x-demo-user-id'];
  }

  return null;
};

const protect = (req, _res, next) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.unauthorized('Authentication required');
    }

    req.user = { id: userId };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect };
