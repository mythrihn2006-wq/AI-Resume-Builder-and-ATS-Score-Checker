const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ATS Resume Builder API is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/ats', require('./routes/atsRoutes'));
app.use('/api/analysis', require('./routes/analysisRoutes'));
app.use('/api/pdf', require('./routes/pdfRoutes'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  res.status(500).json({ message: 'Server error', error: err.message });
});

const net = require('net');

const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => resolve(findAvailablePort(startPort + 1)));
  });
};

const startServer = async () => {
  const desiredPort = parseInt(process.env.PORT) || 5000;
  const PORT = await findAvailablePort(desiredPort);
  
  if (PORT !== desiredPort) {
    console.log(`Port ${desiredPort} in use, using port ${PORT} instead`);
  }
  
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
