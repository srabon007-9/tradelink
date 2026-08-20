'use strict';

/**
 * server/seeds/seedDemoStudents.js — Seeding 100 Demo Student Users & Skills
 *
 * Usage: node server/seeds/seedDemoStudents.js
 * Creates:
 * - 100 Demo Students (user1@gmail.com ... user100@gmail.com / pass: user123)
 * - ~120 Active Skill Listings across categories
 * - ~30 Trade Proposals (Pending, Accepted, Completed, Disputed)
 * - Updates valuation engine prices automatically
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User.model');
const SkillListing = require('../models/SkillListing.model');
const TradeProposal = require('../models/TradeProposal.model');
const CreditWallet = require('../models/CreditWallet.model');
const { recalculateAll } = require('../services/valuation.service');

const CATEGORIES = [
  'web-development',
  'graphic-design',
  'content-writing',
  'video-editing',
  'photography',
  'data-analysis'
];

const SKILL_TITLES = {
  'web-development': [
    'React & Tailwind Web Development',
    'Node.js & Express API Backend',
    'Fullstack MERN App Development',
    'HTML/CSS Responsive Layout Fixes',
    'JavaScript Async & DOM Tutoring'
  ],
  'graphic-design': [
    'Minimalist Logo & Brand Identity',
    'Social Media Banner & Poster Design',
    'Photoshop Image Editing & Retouching',
    'Figma UI Design & Wireframing',
    'Vector Illustration & Icon Sets'
  ],
  'content-writing': [
    'SEO Blog & Article Writing',
    'Technical Documentation & Readme',
    'Creative Story & Copywriting',
    'Academic Essay Proofreading & Editing',
    'Resume & LinkedIn Profile Optimization'
  ],
  'video-editing': [
    'Premiere Pro Video Editing & Cuts',
    'YouTube Short & Reel Video Creation',
    'Color Grading & Audio Enhancement',
    'Motion Graphics & Subtitles',
    'Vlog & Event Aftermovie Editing'
  ],
  'photography': [
    'Portrait & Product Photography',
    'Lightroom Photo Editing & Presets',
    'Event Coverage & Photo Shoot',
    'Studio Lighting Techniques',
    'Mobile Photography Masterclass'
  ],
  'data-analysis': [
    'Python & Pandas Data Cleaning',
    'Excel Advanced Formulas & Dashboards',
    'SQL Querying & Database Analysis',
    'Power BI Interactive Reports',
    'Statistical Analysis & Visualization'
  ]
};

const MESSAGES = [
  'Hi! I would love to learn from your session this weekend.',
  'Hey there, looking forward to trading skills with you!',
  'Hi, can we schedule our session for Friday afternoon?',
  'Hello! I need help with a project, let me know if the time works.',
  'Thanks! Excited to trade skills on TradeLink.'
];

async function seedDemoStudents() {
  console.log('🚀 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  console.log('🧹 Cleaning up any previous demo students (user1@gmail.com - user100@gmail.com)...');
  const demoEmailRegex = /^user([1-9][0-9]?|100)@gmail\.com$/i;
  
  const existingDemoUsers = await User.find({ email: { $regex: demoEmailRegex } });
  const demoUserIds = existingDemoUsers.map(u => u._id);

  if (demoUserIds.length > 0) {
    await SkillListing.deleteMany({ user: { $in: demoUserIds } });
    await TradeProposal.deleteMany({ $or: [{ requester: { $in: demoUserIds } }, { provider: { $in: demoUserIds } }] });
    await CreditWallet.deleteMany({ user: { $in: demoUserIds } });
    await User.deleteMany({ _id: { $in: demoUserIds } });
    console.log(`Removed ${demoUserIds.length} existing demo users and associated data.`);
  }

  console.log('🔑 Hashing password "user123"...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('user123', salt);

  console.log('👥 Creating 100 demo student accounts...');
  const userDocs = [];
  for (let i = 1; i <= 100; i++) {
    userDocs.push({
      name: `Student ${i}`,
      email: `user${i}@gmail.com`,
      password: hashedPassword,
      role: 'client',
      isVerified: i % 3 === 0, // 1 in 3 verified
      bio: `Computer Science & Skill Exchange enthusiast (Demo Student ${i})`,
      company: 'TradeLink Student Community',
      phone: `+880 1711 000${String(i).padStart(3, '0')}`
    });
  }

  // Insert users using insertMany
  const createdUsers = await User.insertMany(userDocs);
  console.log(`✅ Created 100 demo users (user1@gmail.com to user100@gmail.com).`);

  // Create credit wallets for all 100 demo students
  const walletDocs = createdUsers.map(u => ({
    user: u._id,
    balance: 50 + (Math.floor(Math.random() * 20) * 10),
    entries: [
      {
        type: 'earned',
        credits: 50,
        bdtEquivalent: 75000,
        description: 'Welcome Bonus Credits',
        createdAt: new Date()
      }
    ]
  }));
  await CreditWallet.insertMany(walletDocs);
  console.log(`💳 Created Credit Wallets for all 100 demo students.`);

  console.log('🎨 Generating ~120 skill listings for demo students...');
  const listingDocs = [];

  // Each user posts 1 or 2 skills
  createdUsers.forEach((user, index) => {
    const category = CATEGORIES[index % CATEGORIES.length];
    const titles = SKILL_TITLES[category];
    const title = titles[index % titles.length];

    listingDocs.push({
      user: user._id,
      title: `${title} by Student ${index + 1}`,
      description: `Comprehensive 1-on-1 practical session on ${title}. Learn best practices and real-world examples.`,
      category: category,
      status: 'active'
    });

    // Every 5th user posts a second skill
    if (index % 5 === 0) {
      const cat2 = CATEGORIES[(index + 2) % CATEGORIES.length];
      const titles2 = SKILL_TITLES[cat2];
      listingDocs.push({
        user: user._id,
        title: `${titles2[(index + 1) % titles2.length]} (Advanced)`,
        description: `Advanced workshop and hands-on guidance for experienced students.`,
        category: cat2,
        status: 'active'
      });
    }
  });

  const createdListings = await SkillListing.insertMany(listingDocs);
  console.log(`✅ Created ${createdListings.length} active skill listings.`);

  console.log('🤝 Creating sample trade proposals (Pending, Accepted, Declined, Cancelled)...');
  const proposalDocs = [];
  const statuses = ['pending', 'accepted', 'declined', 'cancelled'];

  for (let i = 0; i < 32; i++) {
    const requesterIndex = i % 100;
    const providerIndex = (i + 15) % 100;

    const requester = createdUsers[requesterIndex];
    const provider = createdUsers[providerIndex];
    
    // Find a listing from the provider
    const providerListing = createdListings.find(l => String(l.user) === String(provider._id)) || createdListings[i];
    const status = statuses[i % statuses.length];

    const sessionDate = new Date();
    sessionDate.setDate(sessionDate.getDate() + (i % 7) + 1);

    const priceAtProposal = 1200 + (i % 5) * 200;
    const creditsRedeemed = (i % 3) * 5;
    const discountBDT = creditsRedeemed * 15;
    const finalPriceBDT = Math.max(0, priceAtProposal - discountBDT);

    proposalDocs.push({
      listing: providerListing._id,
      requester: requester._id,
      provider: provider._id,
      listingTitle: providerListing.title,
      category: providerListing.category,
      priceAtProposal,
      creditsRedeemed,
      discountBDT,
      finalPriceBDT,
      proposedSessionAt: sessionDate,
      message: MESSAGES[i % MESSAGES.length],
      status: status,
      requesterAccepted: true,
      providerAccepted: status === 'accepted',
    });
  }

  await TradeProposal.insertMany(proposalDocs);
  console.log(`✅ Created 32 trade proposals in various statuses.`);

  console.log('⚡ Recalculating dynamic category prices...');
  await recalculateAll('seed');

  console.log('\n======================================================');
  console.log('🎉 DEMO STUDENTS SEEDED SUCCESSFULLY!');
  console.log('------------------------------------------------------');
  console.log('Demo Login Credentials:');
  console.log('📧 Email: user1@gmail.com  (up to user100@gmail.com)');
  console.log('🔑 Password: user123');
  console.log('------------------------------------------------------');
  console.log('Admin Account (to monitor all 100 students & trades):');
  console.log('📧 Email: admin@tradelink.com');
  console.log('🔑 Password: admin123');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

seedDemoStudents().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
