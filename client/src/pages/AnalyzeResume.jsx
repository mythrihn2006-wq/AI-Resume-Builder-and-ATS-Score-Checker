import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Upload, FileText, BarChart3, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function AnalyzeResume() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const analyzeUploadedFile = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await api.post('/analysis/analyze', formData, {
        timeout: 30000
      });

      setResult(res.data);
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Analysis failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-900/50 border border-emerald-700';
    if (score >= 60) return 'text-amber-400 bg-amber-900/50 border border-amber-700';
    return 'text-red-400 bg-red-900/50 border border-red-700';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getScoreBarColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <nav className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => navigate('/dashboard')} className="mr-4 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-white">ATS Resume Analyzer</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto py-8 px-4">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-emerald-500 mb-4 shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Analyze Your Resume</h2>
            <p className="text-gray-400">Upload a resume file to get an instant ATS score and improvement suggestions.</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <form onSubmit={analyzeUploadedFile}>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragActive ? 'border-amber-500 bg-amber-500/10' : 'border-gray-600 hover:border-amber-500/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleChange}
                  className="hidden"
                />
                <Upload className="mx-auto h-10 w-10 text-gray-500 mb-3" />
                {file ? (
                  <div>
                    <FileText className="mx-auto h-6 w-6 text-amber-400 mb-2" />
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-300">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, TXT, DOC, DOCX (max 10MB)</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!file || loading}
                className="mt-4 w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-gray-900 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
              >
                {loading ? 'Analyzing...' : 'Analyze Uploaded Resume'}
              </button>
            </form>
          </div>
        </div>

        {result && (
          <div className="space-y-6">
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Analysis Results</h3>
                <span className={`px-4 py-2 rounded-full text-lg font-bold ${getScoreColor(result.score)}`}>
                  {result.score}/100
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-lg font-medium text-gray-300">
                    Overall Score: {getScoreLabel(result.score)}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${getScoreBarColor(result.score)}`}
                    style={{ width: `${result.score}%` }}
                  ></div>
                </div>
              </div>

              {result.wordCount && (
                <p className="text-sm text-gray-400 mb-4">Word Count: {result.wordCount}</p>
              )}

              {result.missingSections && result.missingSections.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    Missing Sections
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.missingSections.map((section, i) => (
                      <span key={i} className="px-3 py-1 bg-red-900/50 text-red-300 border border-red-700 rounded-full text-sm font-medium">
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.suggestions && result.suggestions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
                    Improvement Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start">
                        <span className="flex-shrink-0 h-2 w-2 rounded-full bg-amber-500 mt-2 mr-3"></span>
                        <span className="text-gray-300">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-8 flex space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-gray-600 rounded-lg shadow-sm text-base font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => navigate('/builder/new')}
                  className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-base font-semibold text-gray-900 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 transition-all transform hover:scale-[1.02]"
                >
                  Create New Resume
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
