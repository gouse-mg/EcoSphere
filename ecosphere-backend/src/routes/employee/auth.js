const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const controller = require('../../controllers/employee/auth.controller');

router.post('/login', asyncHandler(controller.login));

module.exports = router;
