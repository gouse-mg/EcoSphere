const express = require('express');
const router = express.Router();

// NOTE: no auth middleware is applied anywhere in this file, intentionally.
// See Section 1 of the build spec: Admin has no auth for this build.
// Before any real deployment, put these routes behind at least a shared
// static token or basic auth at the reverse-proxy level.

router.use('/departments', require('./admin/departments'));
router.use('/employees', require('./admin/employees'));
router.use('/categories', require('./admin/categories'));
router.use('/environmental', require('./admin/environmental'));
router.use('/social', require('./admin/social'));
router.use('/governance', require('./admin/governance'));
router.use('/gamification', require('./admin/gamification'));
router.use('/reports', require('./admin/reports'));
router.use('/settings', require('./admin/settings'));
router.use('/dashboard', require('./admin/dashboard'));

module.exports = router;
