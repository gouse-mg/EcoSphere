const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const upload = require('../../middleware/upload');
const controller = require('../../controllers/employee/challenges.controller');

router.patch('/:id/progress', asyncHandler(controller.updateProgress));
router.post('/:id/upload-proof', upload.single('proof'), asyncHandler(controller.uploadProof));

module.exports = router;
