const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const controller = require('../../controllers/employee/dashboard.controller');

router.get('/', asyncHandler(controller.getDashboard));

module.exports = router;
