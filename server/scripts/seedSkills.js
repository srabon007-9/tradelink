/**
 * scripts/seedSkills.js — Default Skill Listings Seeder
 *
 * Populates a handful of sample listings across every category (including
 * one "other" example) so Browse isn't empty on a fresh database. Safe to
 * re-run — it only inserts if the Skill collection is currently empty.
 *
 * Usage (from server/):
 *   npm run seed
 */

'use strict';

const mongoose = require('mongoose');
const { validateEnv, config } = require('../config/env');
const Skill = require('../models/Skill.model');
const logger = require('../utils/logger');

const SEED_SKILLS = [
  {
    title: 'React Frontend Support',
    description: 'Building and debugging React components, hooks, and API integrations.',
    category: 'web-development',
    baseRate: 300,
    availability: 'available',
    location: 'Dhaka',
    tags: ['React', 'Tailwind CSS', 'API Integration'],
    interestCount: 6,
    provider: { name: 'Ayesha Rahman', initials: 'AR' },
  },
  {
    title: 'Node.js API Development',
    description: 'REST API design, authentication, and MongoDB schema work.',
    category: 'web-development',
    baseRate: 350,
    availability: 'limited',
    location: 'Remote',
    tags: ['Node.js', 'Express', 'MongoDB'],
    interestCount: 2,
    provider: { name: 'Rafi Chowdhury', initials: 'RC' },
  },
  {
    title: 'Brand Identity Design',
    description: 'Logo, color palette, and brand guideline packages for new ventures.',
    category: 'graphic-design',
    baseRate: 250,
    availability: 'limited',
    location: 'Remote',
    tags: ['Logo', 'Social Kit', 'Pitch Deck'],
    interestCount: 4,
    provider: { name: 'Nabil Hasan', initials: 'NH' },
  },
  {
    title: 'SEO Blog Writing',
    description: 'Keyword-researched, publish-ready articles for company blogs.',
    category: 'content-writing',
    baseRate: 150,
    availability: 'available',
    location: 'Chattogram',
    tags: ['SEO', 'Research', 'Editing'],
    interestCount: 1,
    provider: { name: 'Tasmia Chowdhury', initials: 'TC' },
  },
  {
    title: 'Facebook & Instagram Ads Setup',
    description: 'Campaign structure, audience targeting, and creative testing.',
    category: 'digital-marketing',
    baseRate: 220,
    availability: 'available',
    location: 'Sylhet',
    tags: ['Meta Ads', 'Analytics', 'Retargeting'],
    interestCount: 3,
    provider: { name: 'Imran Kabir', initials: 'IK' },
  },
  {
    title: 'Excel Dashboard Builder',
    description: 'Interactive dashboards with Power Query and pivot-based reporting.',
    category: 'data-analysis',
    baseRate: 280,
    availability: 'booked',
    location: 'Dhaka',
    tags: ['Excel', 'Power Query', 'Reporting'],
    interestCount: 5,
    provider: { name: 'Farzana Akter', initials: 'FA' },
  },
  {
    title: 'Virtual Admin Assistance',
    description: 'Scheduling, inbox triage, and documentation support.',
    category: 'business-support',
    baseRate: 120,
    availability: 'available',
    location: 'Remote',
    tags: ['Scheduling', 'Research', 'Documentation'],
    interestCount: 0,
    provider: { name: 'Sadia Islam', initials: 'SI' },
  },
  {
    title: 'Harmonium Lessons',
    description: 'Beginner-friendly harmonium lessons covering basic ragas and film songs.',
    category: 'other',
    categoryLabel: 'Music Lessons',
    baseRate: 100,
    availability: 'available',
    location: 'Dhaka',
    tags: ['Music', 'Harmonium', 'Beginner Friendly'],
    interestCount: 1,
    provider: { name: 'Mahmudul Karim', initials: 'MK' },
  },
];

const seed = async () => {
  validateEnv();
  await mongoose.connect(config.mongoUri);
  logger.info('Connected to MongoDB for seeding.');

  const existingCount = await Skill.countDocuments();
  if (existingCount > 0) {
    logger.info(`Skill collection already has ${existingCount} document(s) — skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  await Skill.insertMany(SEED_SKILLS);
  logger.info(`Seeded ${SEED_SKILLS.length} default skill listings.`);

  await mongoose.disconnect();
};

seed().catch(error => {
  logger.error('Seeding failed:', error.message);
  process.exit(1);
});