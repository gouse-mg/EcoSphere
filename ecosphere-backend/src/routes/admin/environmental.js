const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const crudRouter = require('../shared/crudRouter');
const controller = require('../../controllers/admin/environmental.controller');

router.use('/emission-factors', crudRouter(controller.emissionFactors));
router.use('/goals', crudRouter(controller.goals));
router.get('/carbon-transactions', asyncHandler(controller.listCarbonTransactions));
router.use('/product-profiles', crudRouter(controller.productProfiles));

module.exports = router;
