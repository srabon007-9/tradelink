/**
 * config/env.js — Environment Variable Validation
 *
 * Validates that all required environment variables are present at startup.
 * Fails fast with a clear error message if anything is missing.
 */

'use strict';

require('dotenv').config();

/**
 * Required variables for the server to start.
 * Note: Do NOT list PORT here, as Vercel serverless environments do not define PORT.
 */
const REQUIRED_VARS = ['MONGO_URI', 'JWT_SECRET'];

/**
 * Validates required environment variables.
 * Throws if any are missing.
 */
const validateEnv = () => {
  const missing = REQUIRED_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[ENV] Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file or Vercel Environment Variables.`
    );
  }
};

/**
 * Centralised config object — import this instead of process.env directly.
 * Provides type clarity and a single source of truth.
 */
const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Optional — Trade Proposal session scheduling degrades gracefully
  // (calendarSynced: false) when these aren't set. See
  // services/googleCalendar.service.js.
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@tradelink.com.bd',
  },
};

module.exports = { validateEnv, config };