/**
 * models/Skill.model.js — Skill Listing Schema
 *
 * Backs two features:
 *  - Skill Listing Profiles (Module 1, Feature 2): users create a listing with
 *    a title, description, category, and a self-declared `baseRate` — the
 *    "starting reference point" the valuation engine adjusts from.
 *  - Category Browsing with Live Price Filtering (Module 1, Feature 3): every
 *    listing saved here is immediately part of the pool the browse/category
 *    endpoints read from, so a new post shows up in Browse right away.
 *
 * `interestCount` is a lightweight demand proxy (how much attention/requests
 * a listing has attracted) used by services/valuation.service.js until the
 * full Dynamic Valuation Engine (Module 1, Feature 1) is wired in to feed
 * real trade-request volume instead.
 */

'use strict';

const mongoose = require('mongoose');

const CATEGORY_VALUES = [
  'web-development',
  'graphic-design',
  'content-writing',
  'digital-marketing',
  'data-analysis',
  'business-support',
  'other',
];

const AVAILABILITY_VALUES = ['available', 'limited', 'booked'];

const STATUS_VALUES = ['active', 'paused', 'archived'];

const SkillSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: CATEGORY_VALUES,
      index: true,
    },
    // Only used (and required) when category === 'other' — lets a user post
    // a skill that isn't in the fixed list yet (e.g. "Harmonium Lessons").
    // All "other" listings still share one live-value bucket on Browse;
    // this is just the human-readable name shown on that specific listing.
    categoryLabel: {
      type: String,
      trim: true,
      maxlength: 60,
      default: '',
      validate: {
        validator: function (value) {
          if (this.category !== 'other') return true;
          return Boolean(value && value.trim().length > 0);
        },
        message: 'categoryLabel is required when category is "other"',
      },
    },
    baseRate: {
      type: Number,
      required: [true, 'Base rate is required'],
      min: [0, 'Base rate cannot be negative'],
    },
    availability: {
      type: String,
      enum: AVAILABILITY_VALUES,
      default: 'available',
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote',
    },
    tags: {
      type: [String],
      default: [],
      set: tags => (Array.isArray(tags) ? tags.map(tag => String(tag).trim()).filter(Boolean) : []),
    },
    // Demand proxy — see file header. Incremented elsewhere (e.g. trade
    // proposals, watchlist hits) once those modules exist.
    interestCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: 'active',
      index: true,
    },
    // Denormalised so listings render without depending on the auth/profile
    // module being finished first. `providerId` is kept for when it is.
    provider: {
      name: { type: String, required: true, trim: true },
      initials: { type: String, trim: true, uppercase: true, maxlength: 3 },
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

SkillSchema.index({ title: 'text', description: 'text', tags: 'text', categoryLabel: 'text' });
SkillSchema.index({ status: 1, category: 1, availability: 1 });

SkillSchema.statics.CATEGORY_VALUES = CATEGORY_VALUES;
SkillSchema.statics.AVAILABILITY_VALUES = AVAILABILITY_VALUES;
SkillSchema.statics.STATUS_VALUES = STATUS_VALUES;

const Skill = mongoose.model('Skill', SkillSchema);

module.exports = Skill;