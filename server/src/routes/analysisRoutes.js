const express = require('express');
const router = express.Router();
const { upload, analyzeUploadedResume } = require('../utils/upload');

router.post('/analyze', upload.single('resume'), analyzeUploadedResume);

module.exports = router;
