const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|txt|doc|docx|jpg|jpeg|png|webp)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, DOC, DOCX, JPG, PNG allowed.'));
    }
  }
});

const analyzeResumeContent = (text) => {
  const suggestions = [];
  let score = 0;

  if (!text || text.trim().length < 50) {
    return { score: 0, suggestions: ['Resume content is too short or empty.'], missingSections: ['All sections'] };
  }

  const lowerText = text.toLowerCase();
  const wordCount = text.trim().split(/\s+/).length;

  const hasContact = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(lowerText) || /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(lowerText) || /linkedin\.com\/in\//.test(lowerText);
  if (hasContact) score += 15;
  else suggestions.push('Add contact information (email, phone, LinkedIn).');

  const hasExperience = /\b(experience|employment|work history|professional experience|internship)\b/.test(lowerText) && /(company|organization|firm|startup)/.test(lowerText);
  if (hasExperience) score += 25;
  else suggestions.push('Add a Professional Experience section with company names.');

  const hasEducation = /\b(education|degree|university|college|bachelor|master|phd|diploma|certification)\b/.test(lowerText);
  if (hasEducation) score += 20;
  else suggestions.push('Add an Education section.');

  const hasSkills = /\b(skills|technologies|tools|proficiencies|technical skills|competencies)\b/.test(lowerText) && /(javascript|python|java|react|sql|aws|docker|git|management|communication|leadership)/.test(lowerText);
  if (hasSkills) score += 20;
  else suggestions.push('Add a Skills section with specific technologies or tools.');

  const hasProjects = /\b(projects|portfolio|initiatives)\b/.test(lowerText);
  if (hasProjects) score += 10;
  else suggestions.push('Add a Projects section to showcase work.');

  const hasSummary = /\b(summary|objective|profile|about|professional summary)\b/.test(lowerText);
  if (hasSummary) score += 10;
  else suggestions.push('Add a Professional Summary or Objective.');

  const actionVerbs = /\b(achieved|improved|developed|led|managed|created|increased|reduced|designed|implemented|optimized|delivered|launched|built|coordinated|analyzed|engineered|spearheaded|orchestrated|revamped|streamlined)\b/;
  const hasActionVerbs = actionVerbs.test(lowerText);
  if (hasActionVerbs) score += 5;
  else suggestions.push('Use strong action verbs (e.g., Achieved, Developed, Led).');

  const hasQuantifiable = /\d+%|\$\d+|\d+ (users|clients|projects|team members|hours|weeks|months|years|people|dollars|revenue|budget)/.test(lowerText);
  if (hasQuantifiable) score += 5;
  else suggestions.push('Add quantifiable achievements (e.g., "Increased sales by 25%").');

  if (wordCount < 150) suggestions.push('Resume appears too short. Expand descriptions with more details.');
  else if (wordCount > 1200) suggestions.push('Resume may be too long. Consider condensing to 1-2 pages.');

  const missingSections = [];
  if (!hasContact) missingSections.push('Contact Information');
  if (!hasExperience) missingSections.push('Experience');
  if (!hasEducation) missingSections.push('Education');
  if (!hasSkills) missingSections.push('Skills');
  if (!hasProjects) missingSections.push('Projects');
  if (!hasSummary) missingSections.push('Summary');

  return { score: Math.min(score, 100), suggestions, missingSections, wordCount };
};

const analyzeUploadedResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let text = '';

    try {
      if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfParser = new PDFParse(dataBuffer);
        await pdfParser.load();
        text = await pdfParser.getText() || '';
      } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        text = result.value || '';
      } else if (ext === '.txt') {
        text = fs.readFileSync(filePath, 'utf-8');
      } else if (ext === '.doc') {
        text = fs.readFileSync(filePath, 'utf-8');
      } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        const tesseract = require('tesseract.js');
        const { data: { text: ocrText } } = await tesseract.recognize(filePath, 'eng');
        text = ocrText || '';
      } else {
        text = fs.readFileSync(filePath, 'utf-8');
      }
    } catch (readError) {
      console.error('File read error:', readError);
      return res.status(400).json({ message: 'Unable to read file. Please upload a valid PDF, DOCX, TXT, or image file.' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'No text could be extracted from the file. The file may be empty or corrupted.' });
    }

    const analysis = analyzeResumeContent(text);

    fs.unlinkSync(filePath);

    res.json({
      fileName: req.file.originalname,
      extractedText: text.substring(0, 3000) + (text.length > 3000 ? '...' : ''),
      ...analysis
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Analysis error:', error);
    res.status(500).json({ message: 'Analysis failed', error: error.message });
  }
};

module.exports = { upload, analyzeUploadedResume, analyzeResumeContent };
