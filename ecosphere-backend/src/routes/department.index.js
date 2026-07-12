const express = require('express');
const router = express.Router();
const authDepartment = require('../middleware/authDepartment');
const asyncHandler = require('../middleware/asyncHandler');

const authRoutes = require('./department/auth');
const carbonTransactionsRoutes = require('./department/carbonTransactions');
const dashboardRoutes = require('./department/dashboard');
const dashboardController = require('../controllers/department/dashboard.controller');

// Login route has no auth middleware - it IS the login endpoint
router.use('/auth', authRoutes);

// Everything else requires a valid department JWT
router.use('/carbon-transactions', authDepartment, carbonTransactionsRoutes);
router.get('/dashboard', authDepartment, asyncHandler(dashboardController.getDashboard));
router.get('/goals', authDepartment, asyncHandler(dashboardController.getGoals));

module.exports = router;
