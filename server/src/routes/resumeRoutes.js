const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createResume, getResumes, getResumeById, updateResume, deleteResume, uploadProfilePhoto } = require('../controllers/resumeController');
const { upload } = require('../utils/upload');

router.use(authMiddleware);

router.post('/', createResume);
router.get('/', getResumes);
router.get('/:id', getResumeById);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);
router.post('/:id/upload-photo', upload.single('profilePhoto'), uploadProfilePhoto);

module.exports = router;
