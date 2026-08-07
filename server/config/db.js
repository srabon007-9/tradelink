/**
 * config/db.js — MongoDB Connection
 *
 * Establishes and manages the Mongoose connection to MongoDB.
 * Called once at server startup from server.js.
 */

'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGODB_OPTIONS = {
  // Connection pool
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Connect to MongoDB using the MONGO_URI environment variable.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables.');
  }

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected successfully');
  });

  mongoose.connection.on('error', err => {
    logger.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(uri, MONGODB_OPTIONS);
};

module.exports = connectDB;
