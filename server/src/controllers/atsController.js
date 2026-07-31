const Resume = require('../models/Resume');

const { analyzeResumeContent } = require('../utils/upload');

const calculateATSScore = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    let score = 0;
    const suggestions = [];

    if (resume.personalInfo.fullName) score += 10; else suggestions.push('Add full name');
    if (resume.personalInfo.email) score += 10; else suggestions.push('Add email');
    if (resume.personalInfo.phone) score += 10; else suggestions.push('Add phone number');
    if (resume.personalInfo.linkedin || resume.personalInfo.github) score += 5; else suggestions.push('Add LinkedIn or GitHub');

    if (resume.skills.length >= 5) score += 20; else suggestions.push('Add more skills (at least 5)');
    if (resume.education.length > 0) score += 15; else suggestions.push('Add education details');
    if (resume.experience.length > 0) score += 15; else suggestions.push('Add work experience');
    if (resume.projects.length > 0) score += 10; else suggestions.push('Add projects');

    if (resume.summary) score += 5; else suggestions.push('Add a professional summary');

    resume.atsScore = Math.min(score, 100);
    await resume.save();

    res.json({ score: resume.atsScore, suggestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const calculateMatchPercentage = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    const { jobDescription } = req.body;
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const resumeText = [
      resume.summary,
      resume.skills.join(' '),
      resume.experience.map(e => `${e.position} ${e.description.join(' ')}`).join(' '),
      resume.projects.map(p => `${p.title} ${p.description} ${p.techStack.join(' ')}`).join(' '),
      resume.education.map(e => `${e.school} ${e.degree}`).join(' ')
    ].join(' ').toLowerCase();

    const jdWords = jobDescription.toLowerCase().split(/\W+/);
    const resumeWords = resumeText.split(/\W+/);

    const jdUniqueWords = [...new Set(jdWords.filter(w => w.length > 3))];
    let matches = 0;
    jdUniqueWords.forEach(word => {
      if (resumeWords.includes(word)) matches++;
    });

    const matchPercentage = jdUniqueWords.length > 0 ? Math.round((matches / jdUniqueWords.length) * 100) : 0;

    res.json({
      matchPercentage,
      matchedKeywords: jdUniqueWords.filter(w => resumeWords.includes(w)),
      missingKeywords: jdUniqueWords.filter(w => !resumeWords.includes(w))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const analyzeExistingResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    let score = 0;
    const suggestions = [];

    if (resume.personalInfo.fullName) score += 10; else suggestions.push('Add full name');
    if (resume.personalInfo.email) score += 10; else suggestions.push('Add email');
    if (resume.personalInfo.phone) score += 10; else suggestions.push('Add phone number');
    if (resume.personalInfo.linkedin || resume.personalInfo.github) score += 5; else suggestions.push('Add LinkedIn or GitHub');

    if (resume.skills.length >= 5) score += 20; else suggestions.push('Add more skills (at least 5)');
    if (resume.education.length > 0) score += 15; else suggestions.push('Add education details');
    if (resume.experience.length > 0) score += 15; else suggestions.push('Add work experience');
    if (resume.projects.length > 0) score += 10; else suggestions.push('Add projects');

    if (resume.summary) score += 5; else suggestions.push('Add a professional summary');

    const finalScore = Math.min(score, 100);

    resume.atsScore = finalScore;
    await resume.save();

    res.json({
      resumeId: resume._id,
      resumeTitle: resume.title,
      score: finalScore,
      suggestions,
      missingSections: suggestions.map(s => s.replace(/^Add /, '').replace(/ \(.*\)$/, ''))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { calculateATSScore, calculateMatchPercentage, analyzeExistingResume };
