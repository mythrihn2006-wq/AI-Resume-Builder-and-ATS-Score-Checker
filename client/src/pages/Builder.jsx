import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Save, Download, Sparkles, BarChart3, FileText, Palette } from 'lucide-react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 15, borderBottom: '2px solid #333', paddingBottom: 10 },
  name: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  contact: { fontSize: 9, color: '#555', flexDirection: 'row', flexWrap: 'wrap' },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5, color: '#333' },
  item: { marginBottom: 8 },
  itemTitle: { fontSize: 10, fontWeight: 'bold' },
  itemSubtitle: { fontSize: 9, color: '#666' },
  description: { fontSize: 9, color: '#444', marginTop: 2 }
});

const ResumePDF = ({ resume }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{resume.personalInfo.fullName || 'Your Name'}</Text>
        <View style={styles.contact}>
          {resume.personalInfo.email && <Text>{resume.personalInfo.email}  </Text>}
          {resume.personalInfo.phone && <Text>{resume.personalInfo.phone}  </Text>}
          {resume.personalInfo.linkedin && <Text>{resume.personalInfo.linkedin}  </Text>}
          {resume.personalInfo.github && <Text>{resume.personalInfo.github}  </Text>}
          {resume.personalInfo.portfolio && <Text>{resume.personalInfo.portfolio}</Text>}
        </View>
      </View>

      {resume.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.description}>{resume.summary}</Text>
        </View>
      )}

      {resume.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <Text style={styles.description}>{resume.skills.join(' • ')}</Text>
        </View>
      )}

      {resume.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {resume.experience.map((exp, i) => (
            <View key={i} style={styles.item}>
              <Text style={styles.itemTitle}>{exp.position}</Text>
              <Text style={styles.itemSubtitle}>{exp.company} | {exp.startDate} - {exp.endDate}</Text>
              {exp.description.map((desc, j) => (
                <Text key={j} style={styles.description}>• {desc}</Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {resume.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {resume.education.map((edu, i) => (
            <View key={i} style={styles.item}>
              <Text style={styles.itemTitle}>{edu.school}</Text>
              <Text style={styles.itemSubtitle}>{edu.degree} | {edu.startDate} - {edu.endDate}</Text>
              {edu.gpa && <Text style={styles.description}>GPA: {edu.gpa}</Text>}
            </View>
          ))}
        </View>
      )}

      {resume.projects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {resume.projects.map((proj, i) => (
            <View key={i} style={styles.item}>
              <Text style={styles.itemTitle}>{proj.title}</Text>
              <Text style={styles.description}>{proj.description}</Text>
              {proj.techStack.length > 0 && <Text style={styles.description}>Tech: {proj.techStack.join(', ')}</Text>}
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
);

export default function Builder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState({
    title: 'My Resume',
    personalInfo: { fullName: '', email: '', phone: '', linkedin: '', github: '', portfolio: '' },
    summary: '',
    education: [],
    experience: [],
    skills: [],
    projects: [],
    atsScore: 0
  });
  const [activeTab, setActiveTab] = useState('personal');
  const [aiLoading, setAiLoading] = useState(false);
  const [atsScore, setAtsScore] = useState(null);
  const [jdMatch, setJdMatch] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [pdfLoading, setPdfLoading] = useState(false);

  const templateStyles = {
    modern: {
      bg: 'bg-slate-50',
      header: 'text-slate-700',
      border: 'border-slate-200',
      sectionTitle: 'text-slate-700 border-slate-200',
      accent: 'bg-blue-600'
    },
    classic: {
      bg: 'bg-white',
      header: 'text-black',
      border: 'border-black',
      sectionTitle: 'text-black border-gray-300',
      accent: 'bg-black'
    },
    minimal: {
      bg: 'bg-gray-50',
      header: 'text-gray-600',
      border: 'border-gray-200',
      sectionTitle: 'text-gray-600 border-gray-200',
      accent: 'bg-gray-500'
    },
    professional: {
      bg: 'bg-blue-50',
      header: 'text-blue-900',
      border: 'border-blue-200',
      sectionTitle: 'text-blue-900 border-blue-200',
      accent: 'bg-blue-800'
    },
    creative: {
      bg: 'bg-purple-50',
      header: 'text-purple-900',
      border: 'border-purple-200',
      sectionTitle: 'text-purple-900 border-purple-200',
      accent: 'bg-purple-600'
    },
    executive: {
      bg: 'bg-gray-100',
      header: 'text-gray-900',
      border: 'border-gray-400',
      sectionTitle: 'text-gray-900 border-gray-400',
      accent: 'bg-gray-800'
    }
  };

  const currentStyle = templateStyles[selectedTemplate] || templateStyles.modern;

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const res = await api.get(`/resumes/${id}`);
        setResume(res.data);
      } catch (err) {
        navigate('/dashboard');
      }
    };
    fetchResume();
  }, [id, navigate]);

  const saveResume = async () => {
    try {
      const res = await api.put(`/resumes/${id}`, resume);
      setResume(res.data);
      alert('Resume saved!');
    } catch (err) {
      alert('Failed to save');
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const contactParts = [];
      if (resume.personalInfo.email) contactParts.push(`Email: ${resume.personalInfo.email}`);
      if (resume.personalInfo.phone) contactParts.push(`Phone: ${resume.personalInfo.phone}`);
      if (resume.personalInfo.linkedin) contactParts.push(`LinkedIn: ${resume.personalInfo.linkedin}`);
      if (resume.personalInfo.github) contactParts.push(`GitHub: ${resume.personalInfo.github}`);
      if (resume.personalInfo.portfolio) contactParts.push(`Portfolio: ${resume.personalInfo.portfolio}`);

      const resumeText = [
        resume.personalInfo.fullName,
        contactParts.join('\n'),
        '',
        resume.summary,
        'SKILLS',
        resume.skills.join('\n'),
        'EXPERIENCE',
        ...resume.experience.map(e => `${e.position} at ${e.company}\n${e.startDate} - ${e.endDate}\n${e.description.map(d => '• ' + d).join('\n')}`),
        'EDUCATION',
        ...resume.education.map(e => `${e.school}\n${e.degree}\n${e.startDate} - ${e.endDate}${e.gpa ? '\nGPA: ' + e.gpa : ''}`),
        'PROJECTS',
        ...resume.projects.map(p => `${p.title}\n${p.description}\nTech: ${p.techStack.join(', ')}${p.link ? '\n' + p.link : ''}`)
      ].filter(Boolean).join('\n');

      const res = await api.post('/pdf/generate-pdf', {
        resumeText,
        template: selectedTemplate
      }, { responseType: 'blob' });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.personalInfo.fullName || 'resume'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const aiRewriteBullet = async (expIndex, bulletIndex) => {
    setAiLoading(true);
    try {
      const res = await api.post('/ai/rewrite-bullet', {
        bulletPoint: resume.experience[expIndex].description[bulletIndex],
        jobTitle: resume.experience[expIndex].position
      });
      const updated = [...resume.experience];
      updated[expIndex].description[bulletIndex] = res.data.rewritten;
      setResume({ ...resume, experience: updated });
    } catch (err) {
      alert('AI rewrite failed');
    }
    setAiLoading(false);
  };

  const generateAISummary = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/ai/generate-summary', {
        skills: resume.skills,
        experience: resume.experience
      });
      setResume({ ...resume, summary: res.data.summary });
    } catch (err) {
      alert('Summary generation failed');
    }
    setAiLoading(false);
  };

  const calculateScore = async () => {
    try {
      const res = await api.get(`/ats/${id}/score`);
      setAtsScore(res.data);
    } catch (err) {
      alert('Failed to calculate ATS score');
    }
  };

  const checkJDMatch = async () => {
    const jd = prompt('Paste job description here:');
    if (!jd) return;
    try {
      const res = await api.post(`/ats/${id}/match`, { jobDescription: jd });
      setJdMatch(res.data);
    } catch (err) {
      alert('JD match failed');
    }
  };

  const addEducation = () => {
    setResume({
      ...resume,
      education: [...resume.education, { school: '', degree: '', startDate: '', endDate: '', gpa: '' }]
    });
  };

  const addExperience = () => {
    setResume({
      ...resume,
      experience: [...resume.experience, { company: '', position: '', startDate: '', endDate: '', description: [''] }]
    });
  };

  const addProject = () => {
    setResume({
      ...resume,
      projects: [...resume.projects, { title: '', description: '', techStack: [], link: '' }]
    });
  };

  const addSkill = () => {
    const skill = prompt('Enter skill:');
    if (skill) setResume({ ...resume, skills: [...resume.skills, skill] });
  };

  const tabs = ['personal', 'summary', 'experience', 'education', 'projects', 'skills'];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => navigate('/dashboard')} className="mr-4 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={resume.title}
                onChange={e => setResume({...resume, title: e.target.value})}
                className="text-xl font-bold text-gray-900 border-none focus:ring-0 p-0"
              />
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                >
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="minimal">Minimal</option>
                  <option value="professional">Professional</option>
                  <option value="creative">Creative</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
              <button onClick={calculateScore} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <BarChart3 className="h-4 w-4 mr-2" /> Score
              </button>
              <button onClick={checkJDMatch} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <FileText className="h-4 w-4 mr-2" /> JD Match
              </button>
              <button onClick={saveResume} className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                <Save className="h-4 w-4 mr-2" /> Save
              </button>
              <button onClick={handleDownloadPDF} disabled={pdfLoading} className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400">
                <Download className="h-4 w-4 mr-2" /> {pdfLoading ? 'Generating...' : 'PDF'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`${activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'} flex-1 py-4 px-2 text-center border-b-2 font-medium text-xs uppercase`}>
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {activeTab === 'personal' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                    {Object.keys(resume.personalInfo).map(key => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 capitalize">{key}</label>
                        <input type="text" value={resume.personalInfo[key]}
                          onChange={e => setResume({...resume, personalInfo: {...resume.personalInfo, [key]: e.target.value}})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Professional Summary</h3>
                    <textarea rows="6" value={resume.summary}
                      onChange={e => setResume({...resume, summary: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Write a brief professional summary..." />
                    <button onClick={generateAISummary} disabled={aiLoading}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400">
                      <Sparkles className="h-4 w-4 mr-2" /> {aiLoading ? 'Generating...' : 'AI Generate Summary'}
                    </button>
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Experience</h3>
                      <button onClick={addExperience} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">+ Add</button>
                    </div>
                    {resume.experience.map((exp, expIndex) => (
                      <div key={expIndex} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Company</label>
                          <input type="text" value={exp.company} onChange={e => {
                            const updated = [...resume.experience];
                            updated[expIndex].company = e.target.value;
                            setResume({...resume, experience: updated});
                          }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Position</label>
                          <input type="text" value={exp.position} onChange={e => {
                            const updated = [...resume.experience];
                            updated[expIndex].position = e.target.value;
                            setResume({...resume, experience: updated});
                          }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Start</label>
                            <input type="text" value={exp.startDate} onChange={e => {
                              const updated = [...resume.experience];
                              updated[expIndex].startDate = e.target.value;
                              setResume({...resume, experience: updated});
                            }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">End</label>
                            <input type="text" value={exp.endDate} onChange={e => {
                              const updated = [...resume.experience];
                              updated[expIndex].endDate = e.target.value;
                              setResume({...resume, experience: updated});
                            }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                        </div>
                        {exp.description.map((desc, descIndex) => (
                          <div key={descIndex}>
                            <label className="block text-sm font-medium text-gray-700">Bullet Point {descIndex + 1}</label>
                            <div className="flex space-x-2">
                              <textarea rows="2" value={desc} onChange={e => {
                                const updated = [...resume.experience];
                                updated[expIndex].description[descIndex] = e.target.value;
                                setResume({...resume, experience: updated});
                              }} className="mt-1 flex-1 px-3 py-2 border border-gray-300 rounded-md" />
                              <button onClick={() => aiRewriteBullet(expIndex, descIndex)} disabled={aiLoading}
                                className="mt-1 px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:bg-gray-200">
                                <Sparkles className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => {
                          const updated = [...resume.experience];
                          updated[expIndex].description.push('');
                          setResume({...resume, experience: updated});
                        }} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add Bullet Point</button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'education' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Education</h3>
                      <button onClick={addEducation} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">+ Add</button>
                    </div>
                    {resume.education.map((edu, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">School</label>
                          <input type="text" value={edu.school} onChange={e => {
                            const updated = [...resume.education];
                            updated[index].school = e.target.value;
                            setResume({...resume, education: updated});
                          }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Degree</label>
                          <input type="text" value={edu.degree} onChange={e => {
                            const updated = [...resume.education];
                            updated[index].degree = e.target.value;
                            setResume({...resume, education: updated});
                          }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Start</label>
                            <input type="text" value={edu.startDate} onChange={e => {
                              const updated = [...resume.education];
                              updated[index].startDate = e.target.value;
                              setResume({...resume, education: updated});
                            }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">End</label>
                            <input type="text" value={edu.endDate} onChange={e => {
                              const updated = [...resume.education];
                              updated[index].endDate = e.target.value;
                              setResume({...resume, education: updated});
                            }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">GPA</label>
                          <input type="text" value={edu.gpa} onChange={e => {
                            const updated = [...resume.education];
                            updated[index].gpa = e.target.value;
                            setResume({...resume, education: updated});
                          }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Projects</h3>
                      <button onClick={addProject} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">+ Add</button>
                    </div>
                    {resume.projects.map((proj, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <input type="text" value={proj.title} onChange={e => {
                            const updated = [...resume.projects];
                            updated[index].title = e.target.value;
                            setResume({...resume, projects: updated});
                          }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <textarea rows="3" value={proj.description} onChange={e => {
                            const updated = [...resume.projects];
                            updated[index].description = e.target.value;
                            setResume({...resume, projects: updated});
                          }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tech Stack (comma separated)</label>
                          <input type="text" value={proj.techStack.join(', ')} onChange={e => {
                            const updated = [...resume.projects];
                            updated[index].techStack = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            setResume({...resume, projects: updated});
                          }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Link</label>
                          <input type="text" value={proj.link} onChange={e => {
                            const updated = [...resume.projects];
                            updated[index].link = e.target.value;
                            setResume({...resume, projects: updated});
                          }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Skills</h3>
                      <button onClick={addSkill} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">+ Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.map((skill, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                          {skill}
                          <button onClick={() => {
                            const updated = resume.skills.filter((_, i) => i !== index);
                            setResume({...resume, skills: updated});
                          }} className="ml-2 text-indigo-600 hover:text-indigo-900">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            {atsScore && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ATS Score Analysis</h3>
                <div className="flex items-center mb-4">
                  <div className="text-4xl font-bold text-indigo-600">{atsScore.score}%</div>
                  <div className="ml-4 text-sm text-gray-600">Overall Score</div>
                </div>
                {atsScore.suggestions.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Suggestions:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {atsScore.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {jdMatch && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Job Description Match</h3>
                <div className="text-4xl font-bold text-green-600 mb-4">{jdMatch.matchPercentage}% Match</div>
                <div>
                  <p className="font-medium text-gray-700 mb-2">Matched Keywords:</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {jdMatch.matchedKeywords.map((k, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">{k}</span>
                    ))}
                  </div>
                  <p className="font-medium text-gray-700 mb-2">Missing Keywords:</p>
                  <div className="flex flex-wrap gap-2">
                    {jdMatch.missingKeywords.map((k, i) => (
                      <span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">{k}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className={`bg-white shadow rounded-lg overflow-hidden`}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Live Preview</h3>
              </div>
              <div id="resume-preview" className={`p-8 ${currentStyle.bg}`} style={{ maxWidth: '210mm', margin: '0 auto' }}>
                <div className={`border-b-2 ${currentStyle.border} pb-4 mb-6`}>
                  <h1 className={`text-3xl font-bold ${currentStyle.header}`}>{resume.personalInfo.fullName || 'Your Name'}</h1>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-2">
                    {resume.personalInfo.email && <span>📧 {resume.personalInfo.email}</span>}
                    {resume.personalInfo.phone && <span>📱 {resume.personalInfo.phone}</span>}
                    {resume.personalInfo.linkedin && <span>💼 {resume.personalInfo.linkedin}</span>}
                    {resume.personalInfo.github && <span>💻 {resume.personalInfo.github}</span>}
                    {resume.personalInfo.portfolio && <span>🌐 {resume.personalInfo.portfolio}</span>}
                  </div>
                </div>

                {resume.summary && (
                  <div className="mb-6">
                    <h2 className={`text-lg font-bold ${currentStyle.header} uppercase border-b ${currentStyle.sectionTitle} mb-2`}>Summary</h2>
                    <p className="text-sm text-gray-700">{resume.summary}</p>
                  </div>
                )}

                {resume.skills.length > 0 && (
                  <div className="mb-6">
                    <h2 className={`text-lg font-bold ${currentStyle.header} uppercase border-b ${currentStyle.sectionTitle} mb-2`}>Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.map((skill, i) => (
                        <span key={i} className={`px-3 py-1 ${currentStyle.accent} text-white rounded-full text-sm`}>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {resume.experience.length > 0 && (
                  <div className="mb-6">
                    <h2 className={`text-lg font-bold ${currentStyle.header} uppercase border-b ${currentStyle.sectionTitle} mb-2`}>Experience</h2>
                    {resume.experience.map((exp, i) => (
                      <div key={i} className="mb-4">
                        <div className="flex justify-between">
                          <h3 className="font-bold text-gray-900">{exp.position}</h3>
                          <span className="text-sm text-gray-600">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{exp.company}</p>
                        {exp.description.map((desc, j) => (
                          <p key={j} className="text-sm text-gray-600 ml-4">• {desc}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {resume.education.length > 0 && (
                  <div className="mb-6">
                    <h2 className={`text-lg font-bold ${currentStyle.header} uppercase border-b ${currentStyle.sectionTitle} mb-2`}>Education</h2>
                    {resume.education.map((edu, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex justify-between">
                          <h3 className="font-bold text-gray-900">{edu.school}</h3>
                          <span className="text-sm text-gray-600">{edu.startDate} - {edu.endDate}</span>
                        </div>
                        <p className="text-sm text-gray-700">{edu.degree}</p>
                        {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {resume.projects.length > 0 && (
                  <div className="mb-6">
                    <h2 className={`text-lg font-bold ${currentStyle.header} uppercase border-b ${currentStyle.sectionTitle} mb-2`}>Projects</h2>
                    {resume.projects.map((proj, i) => (
                      <div key={i} className="mb-3">
                        <h3 className="font-bold text-gray-900">{proj.title}</h3>
                        <p className="text-sm text-gray-600">{proj.description}</p>
                        {proj.techStack.length > 0 && (
                          <p className="text-sm text-gray-600">Tech: {proj.techStack.join(', ')}</p>
                        )}
                        {proj.link && <p className="text-sm text-indigo-600">{proj.link}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
