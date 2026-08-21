/**
 * models/Skill.model.js — Skill Listing Schema
 */

'use strict';

const mongoose = require('mongoose');

const SKILL_CATEGORIES = [
  'Programming',
  'Graphic Design',
  'UI/UX',
  'Video Editing',
  'Writing',
  'Tutoring',
  'Music',
  'Photography',
  'Marketing',
  'Career Advice',
  'Language Learning',
  'Other',
];

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const SKILL_STATUSES = ['active', 'paused', 'draft'];

const SkillSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Skill owner is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [80, 'Title cannot exceed 80 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [30, 'Description must be at least 30 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: SKILL_CATEGORIES,
        message: 'Category is not supported',
      },
      index: true,
    },
    baseRate: {
      type: Number,
      required: [true, 'Base rate is required'],
      min: [0.01, 'Base rate must be a positive number'],
    },
    experienceLevel: {
      type: String,
      enum: {
        values: EXPERIENCE_LEVELS,
        message: 'Experience level is not supported',
      },
      default: 'Intermediate',
    },
    estimatedDuration: {
      type: String,
      trim: true,
      maxlength: [120, 'Estimated duration cannot exceed 120 characters'],
      default: '',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: tags => tags.length <= 10,
        message: 'A skill can have up to 10 tags',
      },
    },
    status: {
      type: String,
      enum: {
        values: SKILL_STATUSES,
        message: 'Status is not supported',
      },
      default: 'active',
      index: true,
    },
    thumbnail: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

SkillSchema.index({ owner: 1, createdAt: -1 });
SkillSchema.index({ title: 'text', description: 'text', tags: 'text' });

SkillSchema.pre('validate', function syncActiveFlag(next) {
  this.isActive = this.status === 'active';
  next();
});

module.exports = {
  Skill: mongoose.model('Skill', SkillSchema),
  SKILL_CATEGORIES,
  EXPERIENCE_LEVELS,
  SKILL_STATUSES,
};
