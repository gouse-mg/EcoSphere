const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const upload = require('../../middleware/upload');
const controller = require('../../controllers/employee/csr.controller');

router.post('/:id/upload-proof', upload.single('proof'), asyncHandler(controller.uploadProof));

module.exports = router;
