const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { rewriteBulletPoint, generateSummary, extractSkillsFromJD, suggestMissingSkills, generateImprovedResume } = require('../controllers/aiController');

router.use(authMiddleware);

router.post('/rewrite-bullet', rewriteBulletPoint);
router.post('/generate-summary', generateSummary);
router.post('/extract-skills', extractSkillsFromJD);
router.post('/suggest-missing-skills', suggestMissingSkills);
router.post('/generate-improved-resume', generateImprovedResume);

module.exports = router;
