const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const rewriteBulletPoint = async (req, res) => {
  try {
    const { bulletPoint, jobTitle } = req.body;
    const prompt = `Rewrite this resume bullet point to be more impactful and professional. Job Title: ${jobTitle || 'General'}. Bullet Point: "${bulletPoint}". Return ONLY the rewritten bullet point in a single line, no explanations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    res.json({ original: bulletPoint, rewritten: text });
  } catch (error) {
    res.status(500).json({ message: 'AI rewrite failed', error: error.message });
  }
};

const generateSummary = async (req, res) => {
  try {
    const { skills, experience } = req.body;
    const prompt = `Generate a professional 2-sentence resume summary for a candidate with the following skills: ${skills.join(', ')} and experience: ${JSON.stringify(experience)}. Return ONLY the summary text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ summary: response.text().trim() });
  } catch (error) {
    res.status(500).json({ message: 'Summary generation failed', error: error.message });
  }
};

const extractSkillsFromJD = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const prompt = `Extract technical and soft skills from this job description. Return as JSON with keys "technicalSkills" and "softSkills" (arrays of strings). Job Description: "${jobDescription}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');
    const skills = JSON.parse(jsonMatch[0]);
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: 'Skill extraction failed', error: error.message });
  }
};

const suggestMissingSkills = async (req, res) => {
  try {
    const { resumeSkills, jobDescription } = req.body;
    const prompt = `Compare these resume skills: ${resumeSkills.join(', ')} with this job description: "${jobDescription}". List skills mentioned in the job description that are missing from the resume. Return as a JSON array of strings.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid AI response format');
    const missingSkills = JSON.parse(jsonMatch[0]);
    res.json({ missingSkills });
  } catch (error) {
    res.status(500).json({ message: 'Skill suggestion failed', error: error.message });
  }
};

const generateImprovedResume = async (req, res) => {
  try {
    const { originalText, suggestions } = req.body;
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(500).json({ message: 'Gemini API key not configured. Please add GEMINI_API_KEY to server/.env' });
    }

    const prompt = `You are an expert resume writer and ATS optimization specialist. Improve the following resume content by addressing ALL of these suggestions: ${suggestions.join('; ')}.

Original Resume:
${originalText}

Rules:
- Keep the structure and sections.
- Improve clarity, impact, and ATS compatibility.
- Use strong action verbs and quantifiable achievements where possible.
- Ensure proper formatting with clear section headers.
- Do NOT add fictional information.
- Return the complete improved resume as plain text, preserving section order.`;

    let result;
    let response;
    
    try {
      result = await model.generateContent(prompt);
      response = await result.response;
      res.json({ improvedResume: response.text().trim(), mode: 'ai' });
    } catch (modelError) {
      console.error('Gemini model error:', modelError.message);
      const fallbackResume = generateFallbackResume(originalText, suggestions);
      res.json({ improvedResume: fallbackResume, mode: 'fallback', message: 'AI service unavailable. Showing template-based improvements.' });
    }
  } catch (error) {
    console.error('Generate improved resume error:', error);
    res.status(500).json({ message: 'Improvement generation failed', error: error.message });
  }
};

const generateFallbackResume = (originalText, suggestions) => {
  let improved = originalText;
  
  if (suggestions.some(s => s.toLowerCase().includes('action verb'))) {
    improved = improved.replace(/\bworked on\b/gi, 'Developed');
    improved = improved.replace(/\bdid some\b/gi, 'Executed');
    improved = improved.replace(/\bresponsible for\b/gi, 'Managed');
  }
  
  if (suggestions.some(s => s.toLowerCase().includes('quantifiable'))) {
    if (!/\d+%|\$\d+/.test(improved)) {
      improved += '\n\n- Achieved measurable results through dedicated effort and process optimization.';
    }
  }
  
  if (suggestions.some(s => s.toLowerCase().includes('summary') || s.toLowerCase().includes('objective'))) {
    const summaryMatch = improved.match(/^(.*?)(\n\n|\nExperience:|\nEducation:|\nSkills:)/s);
    const insertPoint = summaryMatch ? summaryMatch[1].length : 0;
    const summary = '\n\nPROFESSIONAL SUMMARY\nDedicated professional with proven experience and strong technical skills. Committed to delivering high-quality results and driving organizational success through innovative solutions.';
    improved = improved.slice(0, insertPoint) + summary + improved.slice(insertPoint);
  }
  
  if (suggestions.some(s => s.toLowerCase().includes('contact'))) {
    if (!/@.*\./.test(improved)) {
      improved = 'Email: your.email@example.com | Phone: (123) 456-7890\n\n' + improved;
    }
  }
  
  return improved;
};

module.exports = { rewriteBulletPoint, generateSummary, extractSkillsFromJD, suggestMissingSkills, generateImprovedResume, generateFallbackResume };
