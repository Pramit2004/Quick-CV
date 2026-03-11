/**
 * ATSChecker.jsx
 * ─────────────────────────────────────────────────────────────
 * Industry-grade ATS Resume Checker Dashboard
 * Competes feature-for-feature with ResumeWorded & Enhancv
 *
 * Modes:
 *   1. Quick-CV Resume — analyze a resume stored in the builder
 *   2. File Upload     — upload PDF/DOCX for instant analysis
 *
 * Dashboard sections:
 *   • Score gauge + label
 *   • Category radar chart (recharts)
 *   • Score breakdown table (A–E)
 *   • ATS Compatibility meter (Workday/Taleo/Greenhouse/Lever)
 *   • Keyword cloud (matched vs. missing)
 *   • Writing analysis (verbs, metrics, readability)
 *   • Smart suggestions (critical / high-impact / optimization)
 *   • History / previous reports
 * ─────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api   from '../configs/api';
import toast from 'react-hot-toast';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell,
} from 'recharts';
import {
  UploadCloudIcon, FileTextIcon, SparklesIcon, CheckCircle2Icon,
  XCircleIcon, RefreshCwIcon, AlertTriangleIcon, TrendingUpIcon,
  ZapIcon, TargetIcon, BookOpenIcon, ActivityIcon, StarIcon,
  ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon, BriefcaseIcon,
  EyeIcon, ClockIcon, AwardIcon, BarChart2Icon, ShieldCheckIcon,
  MessageSquareIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// SCORE GAUGE
// ─────────────────────────────────────────────────────────────
const ScoreGauge = ({ score, label, color }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let n = 0;
    const step = Math.max(1, Math.floor(score / 60));
    const id = setInterval(() => {
      n = Math.min(n + step, score);
      setCurrent(n);
      if (n >= score) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [score]);

  const r    = 70;
  const circ = 2 * Math.PI * r;
  const pct  = current / 100;
  // Half-circle gauge: dash = pct * half-circumference
  const dash = pct * (circ / 2);
  const gap  = circ - dash;

  const gaugeColor =
    score >= 90 ? '#10b981' :
    score >= 75 ? '#3b82f6' :
    score >= 60 ? '#f59e0b' :
    score >= 45 ? '#f97316' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 180, height: 100 }}>
        <svg width="180" height="110" viewBox="0 0 180 110">
          {/* Background arc */}
          <path
            d="M 20 100 A 70 70 0 0 1 160 100"
            fill="none" stroke="#e5e7eb" strokeWidth="14" strokeLinecap="round"
          />
          {/* Score arc */}
          <path
            d="M 20 100 A 70 70 0 0 1 160 100"
            fill="none" stroke={gaugeColor} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${(current / 100) * 220} 220`}
            style={{ transition: 'stroke-dasharray 0.05s' }}
          />
          {/* Score text */}
          <text x="90" y="85" textAnchor="middle" fontSize="32" fontWeight="700" fill={gaugeColor}>
            {current}
          </text>
          <text x="90" y="105" textAnchor="middle" fontSize="11" fill="#6b7280">
            out of 100
          </text>
        </svg>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-lg font-bold" style={{ color: gaugeColor }}>{label?.emoji} {label?.label}</span>
      </div>
      {/* Grade bar */}
      <div className="mt-3 flex gap-1 items-center">
        {[20,40,60,75,90].map((threshold, i) => {
          const labels = ['Poor','Fair','Good','Great','Excellent'];
          const colors = ['#ef4444','#f97316','#f59e0b','#3b82f6','#10b981'];
          const active = score >= threshold;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="h-2 w-10 rounded-full" style={{ background: active ? colors[i] : '#e5e7eb' }} />
              <span className="text-[9px] text-gray-400">{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// CATEGORY RADAR
// ─────────────────────────────────────────────────────────────
const CategoryRadar = ({ scores }) => {
  const data = [
    { subject: 'Structure',  value: Math.round((scores.structure.score / 25) * 100),  max: 25 },
    { subject: 'Content',    value: Math.round((scores.content.score   / 35) * 100),  max: 35 },
    { subject: 'Writing',    value: Math.round((scores.writing.score   / 20) * 100),  max: 20 },
    { subject: 'ATS',        value: Math.round((scores.ats.score       / 20) * 100),  max: 20 },
    { subject: 'Advanced',   value: Math.round((scores.advanced.score  / 10) * 100),  max: 10 },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
        <Tooltip formatter={(v) => [`${v}%`]} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

// ─────────────────────────────────────────────────────────────
// SCORE BAR (for sub-categories)
// ─────────────────────────────────────────────────────────────
const ScoreBar = ({ label, score, max, color = '#3b82f6' }) => {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-36 text-xs text-gray-600 shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="text-xs font-semibold text-gray-700 w-14 text-right">
        {(score || 0).toFixed(1)} / {max}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ATS METER (per-platform scores)
// ─────────────────────────────────────────────────────────────
const ATSMeter = ({ sim }) => {
  const platforms = [
    { name: 'Workday',    score: sim?.workday,    icon: '🏢' },
    { name: 'Taleo',      score: sim?.taleo,      icon: '🔷' },
    { name: 'Greenhouse', score: sim?.greenhouse, icon: '🌱' },
    { name: 'Lever',      score: sim?.lever,      icon: '⚡' },
  ];

  return (
    <div className="space-y-3">
      {platforms.map(p => {
        const color = p.score >= 80 ? '#10b981' : p.score >= 65 ? '#3b82f6' : p.score >= 50 ? '#f59e0b' : '#ef4444';
        const ticks = p.score >= 75 ? 3 : p.score >= 60 ? 2 : 1;
        return (
          <div key={p.name} className="flex items-center gap-3">
            <div className="text-base w-6">{p.icon}</div>
            <div className="w-24 text-sm text-gray-700 font-medium">{p.name}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{ width: `${p.score || 0}%`, background: color }}
              />
            </div>
            <div className="text-sm font-bold w-10 text-right" style={{ color }}>
              {p.score || 0}%
            </div>
            <div className="text-green-500 text-xs">{'✓'.repeat(ticks)}</div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// KEYWORD CLOUD
// ─────────────────────────────────────────────────────────────
const KeywordCloud = ({ found = [], missing = [] }) => (
  <div className="grid grid-cols-2 gap-4">
    <div>
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2Icon size={14} className="text-green-500" />
        <span className="text-sm font-semibold text-green-700">Matched Keywords</span>
        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{found.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {found.slice(0, 20).map((k, i) => (
          <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
            {typeof k === 'object' ? k.word : k}
          </span>
        ))}
      </div>
    </div>
    <div>
      <div className="flex items-center gap-2 mb-2">
        <XCircleIcon size={14} className="text-red-400" />
        <span className="text-sm font-semibold text-red-600">Missing Keywords</span>
        <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{missing.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {missing.slice(0, 15).map((k, i) => (
          <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
            {k}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// SUGGESTION CARD
// ─────────────────────────────────────────────────────────────
const priorityConfig = {
  high:   { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '🚨', label: 'Critical' },
  medium: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '📈', label: 'High Impact' },
  low:    { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: '⚡', label: 'Optimization' },
};

const SuggestionCard = ({ s, idx }) => {
  const [open, setOpen] = useState(idx < 3);
  const cfg = priorityConfig[s.priority] || priorityConfig.low;
  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: cfg.border, background: '#fff' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-base">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
            {s.impact && (
              <span className="text-xs text-gray-500">+{s.impact} pts potential</span>
            )}
          </div>
          <p className="text-sm text-gray-700 mt-0.5 font-medium line-clamp-1">{s.message}</p>
        </div>
        {open ? <ChevronUpIcon size={14} className="text-gray-400 shrink-0" /> : <ChevronDownIcon size={14} className="text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3 pt-0 text-sm text-gray-600 border-t" style={{ borderColor: cfg.border }}>
          <p className="mt-2">{s.message}</p>
          {s.original && (
            <div className="mt-2 bg-gray-50 rounded-lg p-2 text-xs text-gray-500 font-mono">
              <span className="font-semibold text-gray-600">Found: </span>{s.original.substring(0, 200)}
            </div>
          )}
          {s.rewrite && (
            <div className="mt-2 bg-green-50 rounded-lg p-2 text-xs text-green-700 font-mono">
              <span className="font-semibold">Suggested: </span>{s.rewrite.substring(0, 200)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// READABILITY CARD
// ─────────────────────────────────────────────────────────────
const ReadabilityCard = ({ r }) => {
  if (!r) return null;
  const metrics = [
    { label: 'Flesch-Kincaid', value: r.fleschKincaid, ideal: '8–12' },
    { label: 'Gunning Fog',    value: r.gunningFog,    ideal: '9–13' },
    { label: 'SMOG Index',     value: r.smog,          ideal: '8–12' },
  ];
  return (
    <div className="space-y-2">
      {metrics.map(m => (
        <div key={m.label} className="flex items-center justify-between py-1 border-b border-gray-50">
          <span className="text-sm text-gray-600">{m.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800">{m.value ?? '—'}</span>
            <span className="text-xs text-gray-400">(ideal: {m.ideal})</span>
          </div>
        </div>
      ))}
      <div className="pt-1 text-sm font-semibold text-indigo-600">{r.grade}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const ATSChecker = () => {
  const { token, user } = useSelector(s => s.auth);
  const headers = { Authorization: token };

  // ── State ─────────────────────────────────────────────────
  const [mode,      setMode]     = useState('choose');   // choose | builder | upload | result | history
  const [loading,   setLoading]  = useState(false);
  const [report,    setReport]   = useState(null);
  const [resumes,   setResumes]  = useState([]);
  const [history,   setHistory]  = useState([]);
  const [dragOver,  setDragOver] = useState(false);
  const [fileName,  setFileName] = useState('');
  const [file,      setFile]     = useState(null);
  const [activeTab, setActiveTab] = useState('overview');  // overview|writing|keywords|ats|suggestions
  const fileRef = useRef(null);

  // ── Load user resumes ──────────────────────────────────────
  useEffect(() => {
    const loadResumes = async () => {
      try {
        const { data } = await api.get('/api/users/resumes', { headers });
        setResumes(data.resumes || data || []);
      } catch {}
    };
    loadResumes();
  }, []);

  // ── Analyze stored resume ──────────────────────────────────
  const analyzeStored = async (resumeId) => {
    setLoading(true);
    try {
      const { data } = await api.post(
        `/api/ats/analyze/${resumeId}`,
        {},
        { headers }
      );
      setReport(data.report);
      setMode('result');
      toast.success(data.cached ? 'Loaded cached report' : 'Analysis complete!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Analyze upload ─────────────────────────────────────────
  const analyzeFile = async () => {
    if (!file) return toast.error('Please select a file');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      const { data } = await api.post('/api/ats/analyze/upload', form, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });
      setReport(data.report);
      setMode('result');
      toast.success('File analysis complete!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'File analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Load history ───────────────────────────────────────────
  const loadHistory = async () => {
    try {
      const { data } = await api.get('/api/ats/history', { headers });
      setHistory(data.reports || []);
      setMode('history');
    } catch {}
  };

  // ── File drop / select ─────────────────────────────────────
  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowed.includes(f.type)) return toast.error('Only PDF, DOCX, or TXT files supported');
    if (f.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB');
    setFile(f);
    setFileName(f.name);
  };

  const s = report?.scores;

  // ─────────────────────────────────────────────────────────
  // CHOOSE MODE
  // ─────────────────────────────────────────────────────────
  if (mode === 'choose') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <ShieldCheckIcon size={14} /> ATS Resume Checker
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            How Strong Is Your Resume?
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Get an instant, 100-point ATS score with detailed feedback on structure, content, writing quality, and keyword optimization.
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Builder */}
          <button
            onClick={() => setMode('builder')}
            className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-blue-400 hover:shadow-xl transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
              <FileTextIcon className="text-blue-600" size={26} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quick-CV Resume</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Analyze a resume you built inside Quick-CV. Instant results — no upload needed.
            </p>
            <div className="mt-5 text-blue-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
              Select resume →
            </div>
          </button>

          {/* Upload */}
          <button
            onClick={() => setMode('upload')}
            className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-purple-400 hover:shadow-xl transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-5 group-hover:bg-purple-100 transition-colors">
              <UploadCloudIcon className="text-purple-600" size={26} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload a Resume</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Upload any PDF, DOCX, or TXT resume for instant ATS analysis. Works on any resume format.
            </p>
            <div className="mt-5 text-purple-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
              Upload file →
            </div>
          </button>
        </div>

        {/* History button */}
        <div className="mt-6 text-center">
          <button onClick={loadHistory} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5 mx-auto">
            <ClockIcon size={13} /> View analysis history
          </button>
        </div>

        {/* Feature highlights */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          {[
            { icon: '🎯', title: '100-Point Score', desc: '5 categories, 20+ sub-scores' },
            { icon: '🛡️', title: 'ATS Simulation', desc: 'Workday, Taleo, Greenhouse, Lever' },
            { icon: '💡', title: 'Smart Suggestions', desc: 'Prioritised, actionable fixes' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-bold text-gray-800">{f.title}</div>
              <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // SELECT BUILDER RESUME
  // ─────────────────────────────────────────────────────────
  if (mode === 'builder') return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setMode('choose')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm">
          <ArrowLeftIcon size={14} /> Back
        </button>
        <h2 className="text-2xl font-black text-gray-900 mb-6">Select a Resume to Analyze</h2>
        {resumes.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <FileTextIcon size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No resumes found. Build one first!</p>
            <Link to="/app" className="text-blue-600 font-semibold">Go to Dashboard →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map(r => (
              <button
                key={r._id}
                onClick={() => analyzeStored(r._id)}
                disabled={loading}
                className="w-full bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-blue-400 hover:shadow-md transition-all text-left flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <FileTextIcon size={18} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">{r.title || 'Untitled Resume'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {r.personal_info?.full_name && `${r.personal_info.full_name} · `}
                    Last updated {new Date(r.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                {r.atsScore && (
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-black text-blue-600">{r.atsScore}</div>
                    <div className="text-xs text-gray-400">prev. score</div>
                  </div>
                )}
                {loading && <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // FILE UPLOAD
  // ─────────────────────────────────────────────────────────
  if (mode === 'upload') return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setMode('choose')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm">
          <ArrowLeftIcon size={14} /> Back
        </button>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Upload Your Resume</h2>
        <p className="text-gray-500 mb-6 text-sm">PDF, DOCX, or TXT · Max 5MB</p>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragOver ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-300'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
          <UploadCloudIcon size={40} className={`mx-auto mb-3 ${dragOver ? 'text-purple-500' : 'text-gray-300'}`} />
          {fileName ? (
            <div>
              <p className="text-purple-700 font-bold text-lg">{fileName}</p>
              <p className="text-gray-400 text-sm mt-1">File ready — click Analyze to proceed</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 font-semibold">Drop your resume here</p>
              <p className="text-gray-400 text-sm mt-1">or click to browse files</p>
            </div>
          )}
        </div>

        {file && (
          <button
            onClick={analyzeFile}
            disabled={loading}
            className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing…</>
            ) : (
              <><SparklesIcon size={18} /> Analyze Resume</>
            )}
          </button>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // HISTORY
  // ─────────────────────────────────────────────────────────
  if (mode === 'history') return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => setMode('choose')} className="flex items-center gap-2 text-gray-500 mb-6 text-sm hover:text-gray-800">
          <ArrowLeftIcon size={14} /> Back
        </button>
        <h2 className="text-2xl font-black text-gray-900 mb-6">Analysis History</h2>
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            <ClockIcon size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No previous analyses found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(h => {
              const color = h.scores?.overall >= 75 ? '#10b981' : h.scores?.overall >= 55 ? '#f59e0b' : '#ef4444';
              return (
                <div key={h._id} className="bg-white rounded-xl p-5 border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl" style={{ background: color + '18', color }}>
                    {h.scores?.overall || 0}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{h.resumeTitle || 'Uploaded Resume'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {h.source === 'upload' ? '📎 Uploaded' : '📝 Builder'} · {new Date(h.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm font-semibold" style={{ color }}>{h.scores?.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // RESULT DASHBOARD
  // ─────────────────────────────────────────────────────────
  if (!report || !s) return null;

  const tabs = [
    { id: 'overview',     label: 'Overview',    icon: <BarChart2Icon size={14} /> },
    { id: 'writing',      label: 'Writing',     icon: <BookOpenIcon size={14} /> },
    { id: 'keywords',     label: 'Keywords',    icon: <TargetIcon size={14} /> },
    { id: 'ats',          label: 'ATS',         icon: <ShieldCheckIcon size={14} /> },
    { id: 'suggestions',  label: 'Fixes',       icon: <ZapIcon size={14} /> },
  ];

  const criticalSuggestions = report.suggestions?.filter(s => s.priority === 'high') || [];
  const mediumSuggestions   = report.suggestions?.filter(s => s.priority === 'medium') || [];
  const lowSuggestions      = report.suggestions?.filter(s => s.priority === 'low') || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <button onClick={() => { setMode('choose'); setReport(null); }} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm">
          <ArrowLeftIcon size={14} /> New Analysis
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{report.resumeTitle || 'Uploaded Resume'}</span>
          <button onClick={() => setMode('history')} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800">
            <ClockIcon size={12} /> History
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">

        {/* ── TOP: Score + Radar ─────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

          {/* Score gauge */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <ScoreGauge
              score={s.final}
              label={s.label}
              color={s.label?.color}
            />
            <div className="mt-4 w-full grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <div className="font-bold text-gray-800">{report.meta?.wordCount || 0}</div>
                <div className="text-gray-400">Words</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <div className="font-bold text-gray-800">{report.experience?.entryCount || 0}</div>
                <div className="text-gray-400">Jobs</div>
              </div>
            </div>
          </div>

          {/* Radar */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-1">Category Breakdown</h3>
            <CategoryRadar scores={s} />
          </div>

          {/* Score bars */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Section Scores</h3>
            <ScoreBar label="Structure (A)"  score={s.structure.score} max={25} color="#8b5cf6" />
            <ScoreBar label="Content (B)"    score={s.content.score}   max={35} color="#3b82f6" />
            <ScoreBar label="Writing (C)"    score={s.writing.score}   max={20} color="#10b981" />
            <ScoreBar label="ATS (D)"        score={s.ats.score}       max={20} color="#f59e0b" />
            <ScoreBar label="Advanced (E)"   score={s.advanced.score}  max={10} color="#ef4444" />
          </div>
        </div>

        {/* ── Alert bar for critical issues ─────────────── */}
        {criticalSuggestions.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangleIcon size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-red-700 text-sm">
                {criticalSuggestions.length} Critical Issue{criticalSuggestions.length > 1 ? 's' : ''} Found
              </div>
              <div className="text-red-600 text-xs mt-1">
                {criticalSuggestions[0]?.message}
              </div>
            </div>
            <button
              onClick={() => setActiveTab('suggestions')}
              className="ml-auto text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-200 transition-colors shrink-0"
            >
              Fix Now →
            </button>
          </div>
        )}

        {/* ── Tab navigation ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.icon} {tab.label}
                {tab.id === 'suggestions' && criticalSuggestions.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {criticalSuggestions.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── OVERVIEW TAB ──────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Sub-score breakdown */}
                <div>
                  <h3 className="text-base font-bold text-gray-800 mb-4">Detailed Sub-Scores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    {/* A */}
                    <div>
                      <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">A — Structure</div>
                      {[['A1: Format & Layout',5],['A2: Section Organization',5],['A3: Length',5],['A4: Visual Hierarchy',5],['A5: Whitespace',5]].map(([l, m], i) => (
                        <ScoreBar key={l} label={l} score={s.breakdown?.A?.[`A${i+1}`] ?? 0} max={m} color="#8b5cf6" />
                      ))}
                    </div>
                    {/* B */}
                    <div>
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">B — Content</div>
                      {[['B1: Contact',3],['B2: Experience',7],['B3: Education',5],['B4: Skills',5],['B5: Achievements',7],['B6: Projects',4],['B7: Certifications',4]].map(([l, m], i) => (
                        <ScoreBar key={l} label={l} score={s.breakdown?.B?.[`B${i+1}`] || 0} max={m} color="#3b82f6" />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mt-6">
                    {/* C */}
                    <div>
                      <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">C — Writing Quality</div>
                      {[['C1: Grammar',4],['C2: Action Verbs',4],['C3: Metrics',4],['C4: Readability',4],['C5: Conciseness',4]].map(([l, m], i) => (
                        <ScoreBar key={l} label={l} score={s.breakdown?.C?.[`C${i+1}`] || 0} max={m} color="#10b981" />
                      ))}
                    </div>
                    {/* D + E */}
                    <div>
                      <div className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">D — ATS Compatibility</div>
                      {[['D1: Keywords',6],['D2: Parsing',5],['D3: Format Safety',5],['D4: File Format',4]].map(([l, m], i) => (
                        <ScoreBar key={l} label={l} score={s.breakdown?.D?.[`D${i+1}`] || 0} max={m} color="#f59e0b" />
                      ))}
                      <div className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2 mt-4">E — Advanced (Bonus)</div>
                      {[['E1: Career Narrative',2],['E2: Personal Brand',2],['E3: Industry Align',2],['E4: Skill Recency',2],['E5: Cultural Fit',2]].map(([l, m], i) => (
                        <ScoreBar key={l} label={l} score={s.breakdown?.E?.[`E${i+1}`] || 0} max={m} color="#ef4444" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contact info summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Email',    has: report.contact?.hasEmail },
                      { label: 'Phone',    has: report.contact?.hasPhone },
                      { label: 'Location', has: report.contact?.hasLocation },
                      { label: 'LinkedIn', has: report.contact?.hasLinkedIn },
                    ].map(c => (
                      <div key={c.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${c.has ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {c.has ? <CheckCircle2Icon size={14} /> : <XCircleIcon size={14} />} {c.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── WRITING TAB ───────────────────────────── */}
            {activeTab === 'writing' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Action verbs */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">Action Verbs</h3>
                    <div className="text-xs text-gray-500">{report.writing?.actionVerbs?.strongRatio || 0}% strong verbs</div>
                  </div>
                  {report.writing?.actionVerbs?.strong?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-green-600 font-semibold mb-2">✅ Strong verbs used:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {report.writing.actionVerbs.strong.slice(0, 12).map((v, i) => (
                          <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize">{v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.writing?.actionVerbs?.weakSamples?.length > 0 && (
                    <div>
                      <div className="text-xs text-red-500 font-semibold mb-2">⚠️ Weak verb examples:</div>
                      {report.writing.actionVerbs.weakSamples.slice(0, 4).map((w, i) => (
                        <div key={i} className="text-xs text-gray-600 bg-red-50 rounded-lg px-3 py-1.5 mb-1.5">
                          {w.verb ? `Starts with "${w.verb}"` : 'Missing verb'}: <span className="text-gray-500 italic">{w.bullet}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantification */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Quantifiable Achievements</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl font-black text-blue-600">{report.writing?.quantification?.count || 0}</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Bullets with numbers</div>
                      <div className="text-xs text-gray-400">{report.writing?.quantification?.ratio || 0}% of all bullets</div>
                    </div>
                  </div>
                  {report.writing?.quantification?.examples?.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-green-600 mb-2">✅ Good examples:</div>
                      {report.writing.quantification.examples.slice(0, 3).map((e, i) => (
                        <div key={i} className="text-xs text-gray-600 bg-green-50 rounded-lg px-3 py-1.5">{e.substring(0, 100)}…</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Readability */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Readability Scores</h3>
                  <ReadabilityCard r={report.writing?.readability} />
                </div>

                {/* Fluff + repetition */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Content Clarity</h3>
                  {report.writing?.fluff?.found?.length > 0 ? (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-orange-500 mb-2">🚫 Buzzwords to remove:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {report.writing.fluff.found.map((f, i) => (
                          <span key={i} className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-green-600 flex items-center gap-2 mb-3"><CheckCircle2Icon size={14} /> No buzzwords detected</div>
                  )}
                  {report.writing?.repetition?.words?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-blue-500 mb-2">🔄 Overused words:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {report.writing.repetition.words.map((r, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{r.word} ({r.count}×)</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── KEYWORDS TAB ──────────────────────────── */}
            {activeTab === 'keywords' && (
              <div className="space-y-6">
                {/* Domain detection */}
                <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">🎯</div>
                  <div>
                    <div className="font-bold text-blue-800 capitalize">
                      Detected Domain: {(report.keywords?.domain?.domain || 'General').replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-blue-600">
                      {report.keywords?.domain?.confidence || 0}% confidence · Keyword analysis calibrated for this field
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-2xl font-black text-blue-600">{report.keywords?.density || 0}%</div>
                    <div className="text-xs text-blue-500">keyword coverage</div>
                  </div>
                </div>

                {/* Keyword cloud */}
                <KeywordCloud found={report.keywords?.found || []} missing={report.keywords?.missing || []} />

                {/* TF-IDF top terms */}
                {report.keywords?.tfidf?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">Top Keywords by Importance (TF-IDF)</h3>
                    <div className="flex flex-wrap gap-2">
                      {report.keywords.tfidf.slice(0, 20).map((k, i) => {
                        const size = Math.max(11, Math.min(18, Math.round(k.tfidf * 3 + 10)));
                        return (
                          <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-lg font-medium"
                            style={{ fontSize: size }}>
                            {k.word}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ATS TAB ───────────────────────────────── */}
            {activeTab === 'ats' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-800 mb-4">ATS System Compatibility</h3>
                  <ATSMeter sim={report.atsCompatibility?.simulation} />
                  <div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
                    Simulated based on each ATS platform's known parsing behavior and keyword weighting patterns.
                  </div>
                </div>

                {/* Format issues */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Format Safety Check</h3>
                  {(report.atsCompatibility?.issues?.length || 0) === 0 &&
                   (report.atsCompatibility?.warnings?.length || 0) === 0 ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl p-4">
                      <CheckCircle2Icon size={18} /> <span className="font-semibold">No format issues detected</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(report.atsCompatibility?.issues || []).map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 bg-red-50 rounded-xl p-3 text-sm text-red-700">
                          <XCircleIcon size={15} className="shrink-0 mt-0.5" /> {issue}
                        </div>
                      ))}
                      {(report.atsCompatibility?.warnings || []).map((w, i) => (
                        <div key={i} className="flex items-start gap-2 bg-yellow-50 rounded-xl p-3 text-sm text-yellow-700">
                          <AlertTriangleIcon size={15} className="shrink-0 mt-0.5" /> {w}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Advanced signals */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Professional Signals</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'LinkedIn Profile',  has: report.advanced?.hasLinkedIn },
                      { label: 'GitHub / Portfolio', has: report.advanced?.hasGitHub },
                      { label: 'Tense Consistent',  has: report.writing?.tenseConsistency?.consistent },
                      { label: 'In-Demand Skills',  has: (report.advanced?.hotSkillMatches || 0) >= 2 },
                    ].map(c => (
                      <div key={c.label} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${c.has ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                        {c.has ? <CheckCircle2Icon size={14} /> : <XCircleIcon size={14} className="opacity-40" />} {c.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SUGGESTIONS TAB ───────────────────────── */}
            {activeTab === 'suggestions' && (
              <div className="space-y-4">
                {/* Score impact summary */}
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-red-600">{criticalSuggestions.length}</div>
                    <div className="text-xs text-red-500 font-semibold">Critical Fixes</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-yellow-600">{mediumSuggestions.length}</div>
                    <div className="text-xs text-yellow-600 font-semibold">High Impact</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-blue-600">{lowSuggestions.length}</div>
                    <div className="text-xs text-blue-500 font-semibold">Optimization</div>
                  </div>
                </div>

                {criticalSuggestions.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">🚨 Critical — Fix Immediately</div>
                    <div className="space-y-2">
                      {criticalSuggestions.map((s, i) => <SuggestionCard key={i} s={s} idx={i} />)}
                    </div>
                  </div>
                )}
                {mediumSuggestions.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">📈 High Impact — Do This Next</div>
                    <div className="space-y-2">
                      {mediumSuggestions.map((s, i) => <SuggestionCard key={i} s={s} idx={i} />)}
                    </div>
                  </div>
                )}
                {lowSuggestions.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-2">⚡ Optimization Tips</div>
                    <div className="space-y-2">
                      {lowSuggestions.map((s, i) => <SuggestionCard key={i} s={s} idx={i} />)}
                    </div>
                  </div>
                )}
                {report.suggestions?.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <AwardIcon size={40} className="mx-auto mb-3 text-green-400" />
                    <p className="font-semibold text-green-600">Your resume looks great — no critical issues!</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSChecker;

/* PROBLEMS

    right now there is an problem

problem -1 
when i click on ATS checker through dashboard brower console show me __ATSChecker.jsx:339__  GET __http://localhost:3000/api/resumes__ 404 (Not Found)
loadResumes@__ATSChecker.jsx:339__(anonymous)@__ATSChecker.jsx:343__<ATSChecker>App@__App.jsx:94__<App>(anonymous)@__main.jsx:11__

problem -2
when i click on Quick CV resume -> it show me No Resume Found, Build one and show me dashboard link

but problem is that in my dashboard section i have already list of resumes that i was create
so fix this problem

problem-3
when i click on Upload Resume -> and upload my document and tun analysis it show me AST Analysis Failed

and console show me 
__ATSChecker.jsx:372__  POST __http://localhost:3000/api/ats/analyze/upload__ 500 (Internal Server Error)
analyzeFile@__ATSChecker.jsx:372__<button>ATSChecker@__ATSChecker.jsx:576__<ATSChecker>App@__App.jsx:94__<App>(anonymous)@__main.jsx:11__

and my TERMINAL show me
Database connected successfully
✅  Socket.IO initialized (namespaces: /user, /admin)
Server is running on port 3000
ATS analyze error: CastError: Cast to ObjectId failed for value "upload" (type string) at path "_id" for model "Resume"
    at SchemaObjectId.cast (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\schema\objectId.js:253:11)
    at SchemaType.applySetters (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\schemaType.js:1288:12)
    at SchemaType.castForQuery (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\schemaType.js:1724:17)
    at cast (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\cast.js:390:32)
    at Query.cast (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\query.js:5060:12)
    at Query._castConditions (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\query.js:2374:10)
    at model.Query._findOne (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\query.js:2697:8)
    at model.Query.exec (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\query.js:4627:80)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async analyzeStoredResume (file:///C:/Users/gopal/Sparrow%20Softtech%20Internship/Quick-Cv%20v2/server/controllers/atsController.js:35:20) {
  stringValue: '"upload"',
  messageFormat: undefined,
  kind: 'ObjectId',
  value: 'upload',
  path: '_id',
  reason: BSONError: input must be a 24 character hex string, 12 byte Uint8Array, or an integer  
      at new ObjectId (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\bson\lib\bson.cjs:2538:23)
      at castObjectId (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\cast\objectid.js:25:12)
      at SchemaObjectId.cast (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\schema\objectId.js:251:12)
      at SchemaType.applySetters (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\schemaType.js:1288:12)
      at SchemaType.castForQuery (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\schemaType.js:1724:17)
      at cast (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\cast.js:390:32)
      at Query.cast (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\query.js:5060:12)
      at Query._castConditions (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\query.js:2374:10)
      at model.Query._findOne (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\query.js:2697:8)
      at model.Query.exec (C:\Users\gopal\Sparrow Softtech Internship\Quick-Cv v2\server\node_modules\mongoose\lib\query.js:4627:80)
      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
      at async analyzeStoredResume (file:///C:/Users/gopal/Sparrow%20Softtech%20Internship/Quick-Cv%20v2/server/controllers/atsController.js:35:20),
  valueType: 'string'
}

can you see the problem

fix this.
*/