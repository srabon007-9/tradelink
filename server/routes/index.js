/**
 * routes/index.js — Root API Router
 *
 * Mounts all feature routers under their respective paths.
 * Add new feature routers here as the app grows.
 *
 * Team note: coordinate with team when adding new entries.
 */

'use strict';

const express = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const projectRoutes = require('./project.routes');
const procurementRoutes = require('./procurement.routes');
const commercialRoutes = require('./commercial.routes');

const router = express.Router();

// ─── Feature Route Mounts ─────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/procurement', procurementRoutes);
router.use('/commercial', commercialRoutes);

module.exports = router;
