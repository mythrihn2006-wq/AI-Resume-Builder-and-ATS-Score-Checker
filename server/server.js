const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ATS Resume Builder API is running' });
});

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/resumes', require('./src/routes/resumeRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));
app.use('/api/ats', require('./src/routes/atsRoutes'));
app.use('/api/analysis', require('./src/routes/analysisRoutes'));
app.use('/api/pdf', require('./src/routes/pdfRoutes'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
