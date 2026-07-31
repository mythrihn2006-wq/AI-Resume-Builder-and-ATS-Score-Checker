const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createResume, getResumes, getResumeById, updateResume, deleteResume } = require('../controllers/resumeController');

router.use(authMiddleware);

router.post('/', createResume);
router.get('/', getResumes);
router.get('/:id', getResumeById);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);

module.exports = router;
