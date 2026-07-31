const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { calculateATSScore, calculateMatchPercentage, analyzeExistingResume } = require('../controllers/atsController');

router.use(authMiddleware);

router.get('/:id/score', calculateATSScore);
router.post('/:id/match', calculateMatchPercentage);
router.get('/:id/analyze', analyzeExistingResume);

module.exports = router;
