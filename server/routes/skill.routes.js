/**
 * routes/skill.routes.js — Skill listing & category browsing routes.
 *
 *  - GET  /api/skills             browse/search/filter/sort active listings
 *  - GET  /api/skills/categories  live credit value per category
 *  - POST /api/skills             create a new skill listing
 */

'use strict';

const express = require('express');
const skillController = require('../controllers/skill.controller');
const { validateBrowseQuery, validateCreateSkill } = require('../validations/skill.validation');

const router = express.Router();

router.get('/categories', skillController.getCategorySummary);
router.get('/', validateBrowseQuery, skillController.browseSkills);
router.post('/', validateCreateSkill, skillController.createSkill);

module.exports = router;