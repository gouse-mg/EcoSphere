const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const controller = require('../../controllers/department/dashboard.controller');

router.get('/', asyncHandler(controller.getDashboard));
router.get('/goals', asyncHandler(controller.getGoals));

module.exports = router;
