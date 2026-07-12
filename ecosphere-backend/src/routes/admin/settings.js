const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const controller = require('../../controllers/admin/settings.controller');

router.get('/config', asyncHandler(controller.getConfig));
router.put('/config', asyncHandler(controller.updateConfig));
router.get('/notifications', asyncHandler(controller.getNotifications));
router.put('/notifications', asyncHandler(controller.updateNotifications));

module.exports = router;
