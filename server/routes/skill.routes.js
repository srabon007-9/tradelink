/**
 * routes/skill.routes.js — Skill listing routes.
 */

'use strict';

const express = require('express');
const skillController = require('../controllers/skill.controller');
const { protect } = require('../middleware/auth');
const {
  validateCreateSkill,
  validateUpdateSkill,
  validateSkillId,
  validateStatusUpdate,
  validateSkillQuery,
} = require('../validations/skill.validation');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(validateCreateSkill, skillController.createSkill)
  .get(validateSkillQuery, skillController.listSkills);

router.get('/my', validateSkillQuery, skillController.listMySkills);

router
  .route('/:id')
  .get(validateSkillId, skillController.getSkill)
  .put(validateUpdateSkill, skillController.updateSkill)
  .delete(validateSkillId, skillController.deleteSkill);

router.patch('/:id/status', validateStatusUpdate, skillController.updateSkillStatus);

module.exports = router;
