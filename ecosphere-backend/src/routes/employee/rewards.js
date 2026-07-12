const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const controller = require('../../controllers/employee/rewards.controller');

router.get('/', asyncHandler(controller.listCatalog));
router.post('/:id/redeem', asyncHandler(controller.redeem));

module.exports = router;
