'use strict';

/**
 * seeds/seedReviews.js — Seed Demo Review Data
 *
 * Creates sample reviews for existing accepted trade proposals so that
 * reputation scores are non-zero during the viva demonstration.
 *
 * Usage:
 *   node server/seeds/seedReviews.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TradeProposal = require('../models/TradeProposal.model');
const Review        = require('../models/Review.model');
const User          = require('../models/User.model');

const SAMPLE_COMMENTS = [
  'Excellent session! Very knowledgeable and professional.',
  'Great experience overall. Would trade again.',
  'Good work, delivered on time. Recommended.',
  'Very helpful and patient. Explained concepts clearly.',
  'Solid skills, met all expectations.',
  'Outstanding quality of work. Truly an expert!',
  'Decent session. Could improve communication a bit.',
  'Amazing mentor, learned a lot from this trade.',
  'Professional and reliable. Five stars!',
  'Good collaboration, smooth process throughout.',
];

const seedReviews = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('ERROR: MONGO_URI not set in .env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.\n');

    // Find all accepted trade proposals
    const acceptedProposals = await TradeProposal.find({ status: 'accepted' })
      .select('_id requester provider')
      .lean();

    if (acceptedProposals.length === 0) {
      console.log('No accepted trade proposals found.');
      console.log('Creating fallback reviews using existing users...\n');

      // Fallback: create some proposals and reviews with existing users
      const users = await User.find().select('_id name').limit(5).lean();

      if (users.length < 2) {
        console.log('Not enough users to create reviews. Need at least 2 users.');
        await mongoose.disconnect();
        return;
      }

      console.log(`Found ${users.length} users. Creating sample proposals and reviews...\n`);

      let created = 0;
      for (let i = 0; i < users.length; i++) {
        for (let j = 0; j < users.length; j++) {
          if (i === j) {continue;}
          if (created >= 10) {break;}

          const rating  = Math.floor(Math.random() * 3) + 3; // 3-5 stars
          const comment = SAMPLE_COMMENTS[created % SAMPLE_COMMENTS.length];

          // First, check if we already have a proposal between these users
          let proposal = await TradeProposal.findOne({
            requester: users[i]._id,
            provider:  users[j]._id,
            status: 'accepted',
          }).lean();

          if (!proposal) {
            // Create a minimal accepted proposal for demo purposes
            proposal = await TradeProposal.create({
              listing:           new mongoose.Types.ObjectId(),
              requester:         users[i]._id,
              provider:          users[j]._id,
              listingTitle:      `Demo Trade ${created + 1}`,
              category:          'programming',
              priceAtProposal:   1500,
              finalPriceBDT:     1500,
              proposedSessionAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
              status:            'accepted',
              requesterAccepted: true,
              providerAccepted:  true,
            });
            console.log(`  Created demo proposal: ${proposal.listingTitle}`);
          }

          try {
            await Review.create({
              tradeProposal: proposal._id,
              reviewer:      users[i]._id,
              reviewee:      users[j]._id,
              rating,
              comment,
            });
            console.log(`  ✓ Review: ${users[i].name} → ${users[j].name} (${rating}★)`);
            created++;
          } catch (err) {
            if (err.code === 11000) {
              console.log(`  ⊘ Duplicate review skipped: ${users[i].name} → ${users[j].name}`);
            } else {
              console.error(`  ✗ Error: ${err.message}`);
            }
          }
        }
        if (created >= 10) {break;}
      }

      console.log(`\n✅ Created ${created} demo reviews.`);
    } else {
      console.log(`Found ${acceptedProposals.length} accepted proposals. Creating reviews...\n`);

      let created = 0;
      for (const proposal of acceptedProposals) {
        if (created >= 10) {break;}

        const rating  = Math.floor(Math.random() * 3) + 3; // 3-5 stars
        const comment = SAMPLE_COMMENTS[created % SAMPLE_COMMENTS.length];

        // Requester reviews provider
        try {
          await Review.create({
            tradeProposal: proposal._id,
            reviewer:      proposal.requester,
            reviewee:      proposal.provider,
            rating,
            comment,
          });
          console.log(`  ✓ Review created (${rating}★): requester → provider`);
          created++;
        } catch (err) {
          if (err.code === 11000) {
            console.log(`  ⊘ Duplicate review skipped`);
          } else {
            console.error(`  ✗ Error: ${err.message}`);
          }
        }

        // Provider reviews requester (slightly different rating)
        if (created < 10) {
          const providerRating = Math.min(5, rating + (Math.random() > 0.5 ? 1 : 0));
          const providerComment = SAMPLE_COMMENTS[(created + 3) % SAMPLE_COMMENTS.length];

          try {
            await Review.create({
              tradeProposal: proposal._id,
              reviewer:      proposal.provider,
              reviewee:      proposal.requester,
              rating:        providerRating,
              comment:       providerComment,
            });
            console.log(`  ✓ Review created (${providerRating}★): provider → requester`);
            created++;
          } catch (err) {
            if (err.code === 11000) {
              console.log(`  ⊘ Duplicate review skipped`);
            } else {
              console.error(`  ✗ Error: ${err.message}`);
            }
          }
        }
      }

      console.log(`\n✅ Created ${created} reviews from accepted proposals.`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB. Done.');
  } catch (err) {
    console.error('Seed script failed:', err);
    process.exit(1);
  }
};

seedReviews();
