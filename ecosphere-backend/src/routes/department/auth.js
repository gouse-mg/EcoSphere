const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const authController = require('../../controllers/department/auth.controller');

router.post('/login', asyncHandler(authController.login));

module.exports = router;
