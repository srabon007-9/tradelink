'use strict';

/**
 * server/seeds/cleanDemoStudents.js — Cleanup 100 Demo Student Users & Associated Data
 *
 * Usage: node server/seeds/cleanDemoStudents.js
 * Removes all demo students (user1@gmail.com - user100@gmail.com), their skill listings,
 * trade proposals, and credit wallets.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User.model');
const SkillListing = require('../models/SkillListing.model');
const TradeProposal = require('../models/TradeProposal.model');
const CreditWallet = require('../models/CreditWallet.model');
const { recalculateAll } = require('../services/valuation.service');

async function cleanDemoStudents() {
  console.log('🚀 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  console.log('🧹 Searching for demo users (user1@gmail.com - user100@gmail.com)...');
  const demoEmailRegex = /^user([1-9][0-9]?|100)@gmail\.com$/i;
  
  const existingDemoUsers = await User.find({ email: { $regex: demoEmailRegex } });
  const demoUserIds = existingDemoUsers.map(u => u._id);

  if (demoUserIds.length === 0) {
    console.log('✨ No demo users found to remove.');
  } else {
    console.log(`Found ${demoUserIds.length} demo user accounts. Cleaning up...`);

    const deletedListings = await SkillListing.deleteMany({ user: { $in: demoUserIds } });
    const deletedProposals = await TradeProposal.deleteMany({
      $or: [{ requester: { $in: demoUserIds } }, { provider: { $in: demoUserIds } }]
    });
    const deletedWallets = await CreditWallet.deleteMany({ user: { $in: demoUserIds } });
    const deletedUsers = await User.deleteMany({ _id: { $in: demoUserIds } });

    console.log(`🗑️ Deleted ${deletedUsers.deletedCount} demo user accounts.`);
    console.log(`🗑️ Deleted ${deletedListings.deletedCount} skill listings.`);
    console.log(`🗑️ Deleted ${deletedProposals.deletedCount} trade proposals.`);
    console.log(`🗑️ Deleted ${deletedWallets.deletedCount} credit wallets.`);

    console.log('⚡ Recalculating category dynamic prices after cleanup...');
    await recalculateAll('seed');
  }

  console.log('\n======================================================');
  console.log('✅ DEMO STUDENTS & DATA REMOVED CLEANLY!');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

cleanDemoStudents().catch(err => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
