const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const crudRouter = require('../shared/crudRouter');
const controller = require('../../controllers/admin/governance.controller');

router.use('/policies', crudRouter(controller.policies));
router.get('/acknowledgements', asyncHandler(controller.listAcknowledgements));
router.use('/audits', crudRouter(controller.audits));
router.get('/compliance-issues', asyncHandler(controller.listComplianceIssues));
router.post('/compliance-issues', asyncHandler(controller.createComplianceIssue));
router.patch('/compliance-issues/:id/resolve', asyncHandler(controller.resolveComplianceIssue));

module.exports = router;
