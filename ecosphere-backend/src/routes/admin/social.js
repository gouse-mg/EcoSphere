const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const crudRouter = require('../shared/crudRouter');
const controller = require('../../controllers/admin/social.controller');

router.use('/csr-activities', crudRouter(controller.csrActivities));
router.get('/participation', asyncHandler(controller.listParticipationQueue));
router.patch('/participation/:id/approve', asyncHandler(controller.approveParticipation));
router.patch('/participation/:id/reject', asyncHandler(controller.rejectParticipation));
router.use('/diversity', crudRouter(controller.diversity));

module.exports = router;
