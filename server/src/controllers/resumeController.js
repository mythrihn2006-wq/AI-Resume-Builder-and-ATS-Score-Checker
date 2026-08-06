const Resume = require('../models/Resume');
const fs = require('fs');
const path = require('path');

const createResume = async (req, res) => {
  try {
    const resume = await Resume.create({ ...req.body, userId: req.user.id });
    res.status(201).json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadProfilePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No photo uploaded' });

    const resume = await Resume.findOne({ _id: id, userId: req.user.id });
    if (!resume) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (resume.personalInfo.profilePhoto) {
      const cleanPath = resume.personalInfo.profilePhoto.replace(/^\/+/, '');
      const oldPathNew = path.join(__dirname, '../..', cleanPath);
      const oldPathOld = path.join(__dirname, '..', cleanPath);
      const oldPath = fs.existsSync(oldPathNew) ? oldPathNew : oldPathOld;
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const relativePath = `/uploads/${req.file.filename}`;
    resume.personalInfo.profilePhoto = relativePath;
    await resume.save();

    res.json({ profilePhoto: relativePath });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createResume, getResumes, getResumeById, updateResume, deleteResume, uploadProfilePhoto };
