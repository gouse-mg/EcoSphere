const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const controller = require('../../controllers/employee/policies.controller');

router.get('/', asyncHandler(controller.listMine));
router.post('/:id/acknowledge', asyncHandler(controller.acknowledge));

module.exports = router;
