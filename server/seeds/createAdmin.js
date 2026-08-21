'use strict';

/**
 * seeds/createAdmin.js — Bootstrap the First Admin Account
 *
 * Every admin route requires you to already be logged in as an admin
 * (see middleware/admin.middleware.js's requireAdmin) — there's no
 * self-service "make me an admin" button in the UI, on purpose, so a
 * random user can't grant themselves admin rights. That means the very
 * first admin has to be created directly against the database, which is
 * what this script is for. Once you have one admin, you can promote
 * further admins from the Admin > Users screen ("Promote to Admin"),
 * which calls PATCH /api/admin/users/:userId/promote.
 *
 * Usage:
 *   node server/seeds/createAdmin.js <email> [name] [password]
 *
 * Behavior:
 *   - If a user with <email> already exists, it is promoted to 'admin'
 *     (password is left untouched).
 *   - If no such user exists, a new admin user is created with the given
 *     name/password (or sensible defaults) — change the password after
 *     first login.
 *
 * Examples:
 *   node server/seeds/createAdmin.js admin@tradelink.test
 *   node server/seeds/createAdmin.js admin@tradelink.test "Admin User" S3curePass!
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User.model');

const run = async () => {
  const [, , email, name, password] = process.argv;

  if (!email) {
    console.error('Usage: node server/seeds/createAdmin.js <email> [name] [password]');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGO_URI not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected.\n');

  try {
    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      if (user.role === 'admin') {
        console.log(`"${user.email}" is already an admin. Nothing to do.`);
      } else {
        user.role = 'admin';
        await user.save();
        console.log(`Promoted existing user "${user.email}" to admin.`);
      }
    } else {
      user = await User.create({
        name: name || 'Admin',
        email: email.toLowerCase().trim(),
        password: password || 'ChangeMe123!',
        role: 'admin',
        isVerified: true,
      });
      console.log(`Created new admin account:`);
      console.log(`  email:    ${user.email}`);
      console.log(`  password: ${password || 'ChangeMe123!'}`);
      console.log('  → Log in and change this password right away.');
    }
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(err => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});