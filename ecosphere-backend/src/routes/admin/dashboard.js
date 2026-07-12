const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const controller = require('../../controllers/admin/dashboard.controller');

router.get('/overview', asyncHandler(controller.overview));

module.exports = router;
