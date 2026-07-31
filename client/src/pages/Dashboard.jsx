import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { LogOut, Plus, FileText, TrendingUp, Trash2, Upload } from 'lucide-react';

export default function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resumes');
      setResumes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResumes(); }, []);

  const createNewResume = async () => {
    try {
      const res = await api.post('/resumes', { title: 'My Resume' });
      navigate(`/builder/${res.data._id}`);
    } catch (err) {
      alert('Failed to create resume');
    }
  };

  const deleteResume = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.delete(`/resumes/${id}`);
      setResumes(resumes.filter(r => r._id !== id));
    } catch (err) {
      alert('Failed to delete resume');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">ATS Resume Builder</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.name}</span>
              <button onClick={handleLogout} className="flex items-center text-gray-400 hover:text-white transition-colors">
                <LogOut className="h-5 w-5 mr-1" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">My Resumes</h2>
            <div className="flex space-x-3">
              <button onClick={() => navigate('/analyze')} className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
                <Upload className="h-4 w-4 mr-2" /> Analyze Resume
              </button>
              <button onClick={createNewResume} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 transition-all">
                <Plus className="h-4 w-4 mr-2" /> New Resume
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 border border-gray-700 rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-white">No resumes</h3>
              <p className="mt-1 text-sm text-gray-400">Get started by creating a new resume or analyzing an existing one.</p>
              <div className="mt-4 flex justify-center space-x-3">
                <button onClick={createNewResume} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 transition-all">
                  <Plus className="h-4 w-4 mr-2" /> New Resume
                </button>
                <button onClick={() => navigate('/analyze')} className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
                  <Upload className="h-4 w-4 mr-2" /> Analyze Resume
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resumes.map(resume => (
                <div key={resume._id} className="bg-gray-800/50 border border-gray-700 overflow-hidden shadow rounded-lg hover:border-gray-600 transition-colors">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white truncate">{resume.title}</h3>
                      <button onClick={() => deleteResume(resume._id)} className="text-red-400 hover:text-red-300 transition-colors">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-400">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>ATS Score: {resume.atsScore}%</span>
                    </div>
                    <div className="mt-4">
                      <button onClick={() => navigate(`/builder/${resume._id}`)} className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-amber-400 bg-gray-700 hover:bg-gray-600 transition-colors">
                        Edit Resume
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
