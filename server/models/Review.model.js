/**
 * models/Review.model.js — Client feedback schema placeholder
 *
 * TODO (Member 1 — Backend):
 *
 * Fields to implement:
 *  - project         ObjectId ref: 'Project', required
 *  - client          ObjectId ref: 'User', required
 *  - rating          Number, min: 1, max: 5
 *  - comment         String
 *  - createdAt       Date (via timestamps)
 *
 * Post-save hook:
 *  - Recalculate project-level client satisfaction metrics
 */

'use strict';

const mongoose = require('mongoose');

// Schema will be implemented in the reputation feature sprint.
// const ReviewSchema = new mongoose.Schema({ ... }, { timestamps: true });

// const Review = mongoose.model('Review', ReviewSchema);
// module.exports = Review;

module.exports = {};
