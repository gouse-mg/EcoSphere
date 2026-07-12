const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const controller = require('../../controllers/admin/reports.controller');

router.get('/environmental', asyncHandler(controller.environmentalReport));
router.get('/social', asyncHandler(controller.socialReport));
router.get('/governance', asyncHandler(controller.governanceReport));
router.get('/esg-summary', asyncHandler(controller.esgSummary));
router.post('/custom', asyncHandler(controller.customReport));
router.get('/custom/export', asyncHandler(controller.exportReport));

module.exports = router;
