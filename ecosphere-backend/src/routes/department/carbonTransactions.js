const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const controller = require('../../controllers/department/carbonTransactions.controller');

router.get('/', asyncHandler(controller.listMine));
router.post('/', asyncHandler(controller.create));

module.exports = router;
