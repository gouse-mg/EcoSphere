const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const upload = require('../../middleware/upload');
const controller = require('../../controllers/employee/csr.controller');

router.get('/', asyncHandler(controller.listOpenActivities));
router.post('/:id/join', asyncHandler(controller.join));

module.exports = router;
