const express = require('express');
const router = express.Router();
const authEmployee = require('../middleware/authEmployee');

const authRoutes = require('./employee/auth');
const csrRoutes = require('./employee/csr');
const challengesRoutes = require('./employee/challenges');
const participationRoutes = require('./employee/participation');
const challengeParticipationRoutes = require('./employee/challengeParticipation');
const policiesRoutes = require('./employee/policies');
const rewardsRoutes = require('./employee/rewards');
const dashboardRoutes = require('./employee/dashboard');

// Login route has no auth middleware - it IS the login endpoint
router.use('/auth', authRoutes);

// Everything else requires a valid employee JWT
router.use('/csr-activities', authEmployee, csrRoutes);
router.use('/challenges', authEmployee, challengesRoutes);
router.use('/participation', authEmployee, participationRoutes);
router.use('/challenge-participation', authEmployee, challengeParticipationRoutes);
router.use('/policies', authEmployee, policiesRoutes);
router.use('/rewards', authEmployee, rewardsRoutes);
router.use('/dashboard', authEmployee, dashboardRoutes);

module.exports = router;
