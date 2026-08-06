const Resume = require('../models/Resume');

// ============================================================
// 1. PARSEABILITY CHECK
// Simulates whether an ATS parser could extract clean, ordered
// text from the resume (tables/columns/images break this).
// ============================================================
function checkParseability(rawText) {
  const issues = [];
  let parseScore = 100;

  if (!rawText || rawText.trim().length < 50) {
    issues.push('Very little text could be extracted — resume may be image-based or scanned');
    parseScore -= 50;
  }

  // Excessive short lines usually indicates multi-column layout
  // parsed out of order
  const lines = rawText.split('\n').filter(l => l.trim().length > 0);
  const shortLineRatio = lines.filter(l => l.trim().split(/\s+/).length <= 2).length / (lines.length || 1);
  if (shortLineRatio > 0.4) {
    issues.push('Layout may use columns or tables — content order can get scrambled by ATS parsers');
    parseScore -= 20;
  }

  // Detect likely table/graphic artifacts (common junk chars from PDF extraction)
  const junkCharCount = (rawText.match(/[\|\u2022\u25CF\u25A0]{2,}/g) || []).length;
  if (junkCharCount > 3) {
    issues.push('Detected table/graphic elements that may not parse correctly');
    parseScore -= 15;
  }

  // Detect contact info likely stuck in header/footer (often skipped by parsers)
  const hasEmailInBody = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(rawText.slice(0, 500));
  if (!hasEmailInBody) {
    issues.push('Email not detected near the top of the document — avoid placing contact info in headers/footers');
    parseScore -= 10;
  }

  return { parseScore: Math.max(parseScore, 0), issues };
}

// ============================================================
// 2. SECTION DETECTION
// Finds standard section headers the way ATS parsers look for
// them (regex against common header variants).
// ============================================================
const SECTION_PATTERNS = {
  experience: /\b(work experience|professional experience|experience|employment history)\b/i,
  education: /\b(education|academic background)\b/i,
  skills: /\b(skills|technical skills|core competencies)\b/i,
  summary: /\b(summary|profile|objective)\b/i
};

function checkSections(rawText) {
  const found = {};
  const missing = [];

  for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(rawText)) found[section] = true;
    else missing.push(section);
  }

  const sectionScore = Math.round((Object.keys(found).length / Object.keys(SECTION_PATTERNS).length) * 100);
  return { sectionScore, found, missing };
}

// ============================================================
// 3. FORMAT COMPLIANCE
// Flags formatting patterns known to break real ATS parsers.
// ============================================================
function checkFormat(fileExt, rawText) {
  const issues = [];
  let formatScore = 100;

  if (!['pdf', 'doc', 'docx'].includes(fileExt)) {
    issues.push('Unsupported file format — use PDF or DOCX');
    formatScore -= 40;
  }

  if (/\t{2,}/.test(rawText)) {
    issues.push('Possible table structure detected — tables often parse incorrectly');
    formatScore -= 15;
  }

  const bulletVariants = (rawText.match(/[•●▪◦‣]/g) || []).length;
  if (bulletVariants > 0 && bulletVariants < 3) {
    issues.push('Inconsistent or unusual bullet characters — use standard bullets ("-" or "•")');
    formatScore -= 5;
  }

  return { formatScore: Math.max(formatScore, 0), issues };
}

// ============================================================
// 4. WEIGHTED KEYWORD MATCHING
// Required JD skills weigh more than nice-to-have ones.
// ============================================================
const STOPWORDS = new Set([
  'this', 'that', 'with', 'from', 'have', 'will', 'your', 'about',
  'they', 'their', 'them', 'been', 'were', 'what', 'when', 'where',
  'which', 'while', 'into', 'these', 'those', 'able', 'must', 'should',
  'work', 'working', 'years', 'experience', 'strong', 'good'
]);

function normalize(word) {
  return word.toLowerCase().replace(/[^a-z0-9+#.]/g, '');
}

function extractKeywords(text) {
  return [...new Set(
    text.toLowerCase()
      .split(/\W+/)
      .map(normalize)
      .filter(w => w.length > 2 && !STOPWORDS.has(w))
  )];
}

// Splits JD into "required" vs "preferred" sections if labeled,
// otherwise treats everything as required.
function splitRequiredPreferred(jobDescription) {
  const preferredMatch = jobDescription.match(/(preferred|nice to have|bonus)[\s\S]*/i);
  const requiredText = preferredMatch
    ? jobDescription.slice(0, preferredMatch.index)
    : jobDescription;
  const preferredText = preferredMatch ? preferredMatch[0] : '';

  return {
    required: extractKeywords(requiredText),
    preferred: extractKeywords(preferredText)
  };
}

function weightedKeywordMatch(resumeText, jobDescription) {
  const resumeKeywords = new Set(extractKeywords(resumeText));
  const { required, preferred } = splitRequiredPreferred(jobDescription);

  const matchedRequired = required.filter(k => resumeKeywords.has(k));
  const missingRequired = required.filter(k => !resumeKeywords.has(k));
  const matchedPreferred = preferred.filter(k => resumeKeywords.has(k));
  const missingPreferred = preferred.filter(k => !resumeKeywords.has(k));

  // Required keywords worth 70% of match score, preferred worth 30%
  const requiredScore = required.length > 0 ? (matchedRequired.length / required.length) * 70 : 70;
  const preferredScore = preferred.length > 0 ? (matchedPreferred.length / preferred.length) * 30 : 30;

  return {
    matchPercentage: Math.round(requiredScore + preferredScore),
    matchedRequired,
    missingRequired,
    matchedPreferred,
    missingPreferred
  };
}

// ============================================================
// COMBINED REAL-WORLD ATS ANALYSIS
// ============================================================
function runAtsAnalysis(rawText, fileExt, jobDescription) {
  const parseability = checkParseability(rawText);
  const sections = checkSections(rawText);
  const format = checkFormat(fileExt, rawText);

  // Overall score blends parseability, section presence, and format —
  // these are the things that actually determine whether an ATS
  // can process a resume at all.
  const baseScore = Math.round(
    parseability.parseScore * 0.4 +
    sections.sectionScore * 0.35 +
    format.formatScore * 0.25
  );

  const result = { baseScore, parseability, sections, format };

  if (jobDescription) {
    result.keywordMatch = weightedKeywordMatch(rawText, jobDescription);
    // Final score factors in JD match once one is provided
    result.finalScore = Math.round(baseScore * 0.5 + result.keywordMatch.matchPercentage * 0.5);
  } else {
    result.finalScore = baseScore;
  }

  return result;
}

// ============================================================
// ROUTE HANDLERS
// ============================================================

const extractTextFromFile = async (file, fileExt) => {
  if (fileExt === 'pdf') {
    const { PDFParse } = require('pdf-parse');
    const pdfParser = new PDFParse({ data: file.buffer });
    await pdfParser.load();
    const result = await pdfParser.getText();
    return result?.text || '';
  }
  if (fileExt === 'docx') {
    const mammoth = require('mammoth');
    const data = await mammoth.extractRawText({ buffer: file.buffer });
    return data.value;
  }
  if (fileExt === 'doc') {
    const mammoth = require('mammoth');
    const data = await mammoth.extractRawText({ buffer: file.buffer });
    return data.value;
  }
  return file.buffer.toString('utf8');
};

// Used by /analyze (upload.single('resume')) — needs rawText
// extracted from the file via your existing parser (pdf-parse / mammoth).
const analyzeUploadedResume = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No resume file uploaded' });

    const fileExt = file.originalname.split('.').pop().toLowerCase();
    const jobDescription = req.body.jobDescription || '';

    const rawText = await extractTextFromFile(file, fileExt); // your existing parser (pdf-parse/mammoth)

    const analysis = runAtsAnalysis(rawText, fileExt, jobDescription);

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const calculateATSScore = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const rawText = [
      resume.summary || '',
      ...(resume.skills || []),
      ...(resume.experience || []).map(e => `${e.position} ${(e.description || []).join(' ')}`),
      ...(resume.education || []).map(e => `${e.school} ${e.degree}`)
    ].join('\n');

    const analysis = runAtsAnalysis(rawText, 'docx', '');
    resume.atsScore = analysis.finalScore;
    await resume.save();

    res.json({
      score: analysis.finalScore,
      suggestions: analysis.suggestions || [],
      breakdown: {
        parseability: analysis.parseability,
        sections: analysis.sections,
        format: analysis.format
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const calculateMatchPercentage = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const { jobDescription } = req.body;
    if (!jobDescription) return res.status(400).json({ message: 'Job description is required' });

    const rawText = [
      resume.summary || '',
      ...(resume.skills || []),
      ...(resume.experience || []).map(e => `${e.position} ${(e.description || []).join(' ')}`),
      ...(resume.education || []).map(e => `${e.school} ${e.degree}`)
    ].join('\n');

    const keywordMatch = weightedKeywordMatch(rawText, jobDescription);

    res.json({
      resumeId: resume._id,
      resumeTitle: resume.title,
      matchPercentage: keywordMatch.matchPercentage,
      matchedRequired: keywordMatch.matchedRequired,
      missingRequired: keywordMatch.missingRequired,
      matchedPreferred: keywordMatch.matchedPreferred,
      missingPreferred: keywordMatch.missingPreferred
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const analyzeExistingResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const { jobDescription } = req.body || {};

    const rawText = [
      `Experience`,
      ...(resume.experience || []).map(e => `${e.position} ${(e.description || []).join(' ')}`),
      `Education`,
      ...(resume.education || []).map(e => `${e.school} ${e.degree}`),
      `Skills`,
      (resume.skills || []).join(' '),
      `Summary`,
      resume.summary || ''
    ].join('\n');

    const analysis = runAtsAnalysis(rawText, 'docx', jobDescription);

    resume.atsScore = analysis.finalScore;
    await resume.save();

    res.json({
      resumeId: resume._id,
      resumeTitle: resume.title,
      ...analysis
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { calculateATSScore, calculateMatchPercentage, analyzeUploadedResume, analyzeExistingResume, runAtsAnalysis };