const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  school: { type: String, required: true },
  degree: { type: String, required: true },
  startDate: { type: String, required: true, match: [/^\d{4}$/, 'Start year must be a 4-digit number'] },
  endDate: { type: String, required: true, match: [/^\d{4}$/, 'End year must be a 4-digit number'] },
  gpa: { type: Number }
});

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  position: { type: String, required: true },
  startDate: { type: String, required: true, match: [/^\d{4}$/, 'Start year must be a 4-digit number'] },
  endDate: { type: String, required: true, match: [/^\d{4}$/, 'End year must be a 4-digit number'] },
  description: { type: [String], default: [] }
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  techStack: { type: [String], default: [] },
  link: { type: String }
});

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'Untitled Resume'
  },
  personalInfo: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '', match: [/^\d{10}$|^$/, 'Phone number must be exactly 10 digits'] },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' }
  },
  education: [educationSchema],
  experience: [experienceSchema],
  skills: [String],
  projects: [projectSchema],
  atsScore: {
    type: Number,
    default: 0
  },
  summary: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resume', resumeSchema);
