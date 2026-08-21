/**
 * config/db.js — MongoDB Connection
 *
 * Establishes and manages the Mongoose connection to MongoDB.
 * Caches connection instances for serverless reuse on Vercel.
 */

'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGODB_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Global cache variable across serverless invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB with connection caching for serverless environments.
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables.');
  }

  // 1. Return cached connection if ready
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  // 2. Attach listeners once
  if (!cached.promise) {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', err => {
      logger.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // 3. Initiate connection and store the promise
    cached.promise = mongoose.connect(uri, MONGODB_OPTIONS).then(m => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // Reset promise on failure so next request retries
    throw err;
  }

  return cached.conn;
};

module.exports = connectDB;