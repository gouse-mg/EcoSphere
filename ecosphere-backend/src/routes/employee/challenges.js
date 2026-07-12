const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const controller = require('../../controllers/employee/challenges.controller');

router.get('/', asyncHandler(controller.listActive));
router.post('/:id/join', asyncHandler(controller.join));

module.exports = router;
