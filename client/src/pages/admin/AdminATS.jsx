/**
 * AdminATS.jsx — COMPLETE REWRITE
 * ─────────────────────────────────────────────────────────────
 * Emerald-themed, mobile-responsive ATS analytics dashboard.
 *
 * Features:
 *  - Overview KPI cards + score distribution chart
 *  - User list with avg/best score
 *  - Per-user drill-down: see ALL their reports with full details
 *  - Common issues analysis
 * ─────────────────────────────────────────────────────────────
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  ShieldCheckIcon, TrendingUpIcon, UsersIcon, FileTextIcon,
  TargetIcon, ZapIcon, AlertTriangleIcon, StarIcon, ActivityIcon,
  ArrowLeftIcon, ChevronRightIcon, CheckCircle2Icon, XCircleIcon,
  BarChart2Icon, UserIcon, LoaderCircleIcon, EyeIcon, RefreshCwIcon,
  BriefcaseIcon,
} from 'lucide-react';
import adminApi from '../../configs/adminApi';
import toast from 'react-hot-toast';

// ── Helpers ────────────────────────────────────────────────────
const safeNum  = (v)     => (typeof v === 'number' && !isNaN(v)) ? v : 0;
const safeScore = (val)  => typeof val === 'object' ? (val?.score ?? 0) : (val ?? 0);

function scoreColor(s) {
  if (s >= 80) return '#10b981';
  if (s >= 65) return '#3b82f6';
  if (s >= 50) return '#f59e0b';
  if (s >= 35) return '#f97316';
  return '#ef4444';
}
function scoreLabel(s) {
  if (s >= 90) return 'Excellent';
  if (s >= 75) return 'Great';
  if (s >= 60) return 'Good';
  if (s >= 45) return 'Fair';
  return 'Needs Work';
}

// ── Stat Card ──────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, color = '#10b981' }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{title}</div>
        <div className="text-2xl font-black text-slate-900 mt-1">{value}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18' }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
  </div>
);

// ── Score Badge ────────────────────────────────────────────────
const ScoreBadge = ({ score }) => {
  const s = safeNum(score);
  const c = scoreColor(s);
  return (
    <div className="w-10 h-10 rounded-xl border-2 flex flex-col items-center justify-center shrink-0" style={{ borderColor: c, background: c + '15' }}>
      <span className="text-sm font-black leading-none" style={{ color: c }}>{s}</span>
      <span className="text-[8px] text-slate-400 leading-none">/100</span>
    </div>
  );
};

// ── Report Detail Card ─────────────────────────────────────────
const ReportDetailCard = ({ report }) => {
  const [open, setOpen] = useState(false);
  const s = report.scores || {};
  const fs = safeNum(s.final);
  const c  = scoreColor(fs);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <ScoreBadge score={fs} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 text-sm truncate">{report.resumeTitle || 'Uploaded Resume'}</div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${report.source === 'upload' ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {report.source === 'upload' ? 'Uploaded' : 'Quick-CV'}
            </span>
            {new Date(report.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: c, background: c + '18' }}>{scoreLabel(fs)}</span>
          <ChevronRightIcon size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50">
          {/* Section scores */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Section Scores</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { label: 'Structure', score: safeScore(s.structure), max: 25, color: '#8b5cf6' },
                { label: 'Content',   score: safeScore(s.content),   max: 35, color: '#3b82f6' },
                { label: 'Writing',   score: safeScore(s.writing),   max: 20, color: '#10b981' },
                { label: 'ATS',       score: safeScore(s.ats),       max: 20, color: '#f59e0b' },
                { label: 'Advanced',  score: safeScore(s.advanced),  max: 10, color: '#ef4444' },
              ].map(({ label, score, max, color }) => (
                <div key={label} className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                  <div className="text-base font-black" style={{ color }}>{safeNum(score).toFixed(1)}</div>
                  <div className="text-[9px] text-slate-400 font-medium">{label}</div>
                  <div className="text-[9px] text-slate-300">/ {max}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Contact Parsed</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { l: 'Email',    has: report.contact?.hasEmail    || report.parsing?.hasEmail },
                { l: 'Phone',    has: report.contact?.hasPhone    || report.parsing?.hasPhone },
                { l: 'Location', has: report.contact?.hasLocation || report.parsing?.hasLocation },
                { l: 'LinkedIn', has: report.contact?.hasLinkedIn || report.parsing?.hasLinkedIn },
              ].map(c => (
                <span key={c.l} className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${c.has ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                  {c.has ? <CheckCircle2Icon size={10} /> : <XCircleIcon size={10} />} {c.l}
                </span>
              ))}
            </div>
          </div>

          {/* Keywords */}
          {report.keywords?.missing?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                Missing Keywords ({report.keywords.missing.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {report.keywords.missing.slice(0,12).map((k,i) => (
                  <span key={i} className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full">{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Top suggestions */}
          {(report.suggestions?.filter(s => s.priority === 'high') || []).length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Critical Issues</h4>
              <div className="space-y-1.5">
                {report.suggestions.filter(s => s.priority === 'high').slice(0,3).map((sug,i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                    <AlertTriangleIcon size={11} className="shrink-0 mt-0.5" />
                    {sug.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parsed content */}
          {report.parsedContent?.skills?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Skills Detected</h4>
              <div className="flex flex-wrap gap-1.5">
                {report.parsedContent.skills.slice(0,15).map((sk,i) => (
                  <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{sk}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const AdminATS = () => {
  const [view,      setView]     = useState('main');   // main | userDetail
  const [overview,  setOverview] = useState(null);
  const [scoreDist, setScoreDist]= useState(null);
  const [issues,    setIssues]   = useState(null);
  const [users,     setUsers]    = useState([]);
  const [selUser,   setSelUser]  = useState(null);
  const [userDetail,setUserDetail]= useState(null);
  const [loading,   setLoading]  = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadMain = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, sd, ci, ul] = await Promise.all([
        adminApi.get('/api/ats/admin/overview'),
        adminApi.get('/api/ats/admin/score-dist'),
        adminApi.get('/api/ats/admin/common-issues'),
        adminApi.get('/api/ats/admin/users?limit=20'),
      ]);
      setOverview(ov.data);
      setScoreDist(sd.data);
      setIssues(ci.data);
      setUsers(ul.data.users || []);
    } catch {
      toast.error('Failed to load ATS analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMain(); }, [loadMain]);

  const openUserDetail = async (user) => {
    setSelUser(user);
    setDetailLoading(true);
    setView('userDetail');
    try {
      const { data } = await adminApi.get(`/api/ats/admin/user/${user.userId}`);
      setUserDetail(data);
    } catch {
      toast.error('Failed to load user detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const DIST_COLORS = ['#ef4444','#f97316','#f59e0b','#3b82f6','#10b981','#10b981'];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading ATS analytics…</p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // USER DETAIL VIEW
  // ─────────────────────────────────────────────────────────
  if (view === 'userDetail') {
    const ud = userDetail;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView('main'); setUserDetail(null); setSelUser(null); }}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium"
          >
            <ArrowLeftIcon size={14} /> Back to All Users
          </button>
        </div>

        {detailLoading ? (
          <div className="flex items-center justify-center h-40">
            <LoaderCircleIcon size={28} className="text-emerald-500 animate-spin" />
          </div>
        ) : ud ? (
          <>
            {/* User header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <UserIcon size={24} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-slate-900">{ud.user?.name || selUser?.name || 'User'}</h2>
                  <p className="text-sm text-slate-400">{ud.user?.email || selUser?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                {[
                  { label: 'Total Analyses', val: safeNum(ud.summary?.totalReports), color: '#3b82f6' },
                  { label: 'Avg Score',      val: `${safeNum(ud.summary?.avgScore)}/100`, color: '#10b981' },
                  { label: 'Best Score',     val: `${safeNum(ud.summary?.bestScore)}/100`, color: '#f59e0b' },
                  { label: 'Latest Score',   val: `${safeNum(ud.summary?.latestScore)}/100`, color: scoreColor(safeNum(ud.summary?.latestScore)) },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                    <div className="text-xl font-black" style={{ color }}>{val}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* All reports */}
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-3">All Analyses ({(ud.reports||[]).length})</h3>
              <div className="space-y-3">
                {(ud.reports || []).map((report, i) => (
                  <ReportDetailCard key={i} report={report} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-slate-400">No data found for this user.</p>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // MAIN VIEW
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800">ATS Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">Resume quality insights across all users</p>
        </div>
        <button
          onClick={loadMain}
          className="flex items-center gap-2 text-sm bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <RefreshCwIcon size={14} /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Analyses"  value={safeNum(overview?.totalReports)}   sub={`+${safeNum(overview?.reportsThisMonth)} this month`} icon={FileTextIcon}       color="#3b82f6" />
        <StatCard title="Avg. ATS Score"  value={`${safeNum(overview?.avgScore)}/100`} sub="Platform average"                                  icon={TrendingUpIcon}     color="#10b981" />
        <StatCard title="Pass Rate (≥75)" value={`${safeNum(overview?.passRate)}%`} sub={`${safeNum(overview?.highScoreCount)} resumes`}       icon={StarIcon}           color="#f59e0b" />
        <StatCard title="Needs Work (<45)"value={safeNum(overview?.lowScoreCount)}  sub="Below threshold"                                     icon={AlertTriangleIcon}  color="#ef4444" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Score distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4 text-sm">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreDist?.distribution || []} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }} />
              <Bar dataKey="count" radius={[6,6,0,0]}>
                {(scoreDist?.distribution || []).map((_, i) => (
                  <Cell key={i} fill={DIST_COLORS[i] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Common missing keywords */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4 text-sm">Top Missing Keywords</h3>
          {(issues?.missingKeywords || []).slice(0,8).map((k,i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <span className="text-xs text-slate-500 w-32 truncate capitalize">{k.keyword}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-red-400" style={{ width: `${Math.min(100, (k.count / (issues.missingKeywords[0]?.count || 1)) * 100)}%` }} />
              </div>
              <span className="text-xs font-bold text-slate-500 w-6 text-right">{k.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Users ({safeNum(overview?.totalReports)} analyses)</h3>
          <div className="text-xs text-slate-400">Click any row for full details</div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['User','Analyses','Avg Score','Best Score','Last Analysis',''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => openUserDetail(u)}
                >
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-800">{u.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 font-medium">{safeNum(u.reportCount)}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold" style={{ color: scoreColor(safeNum(u.avgScore)) }}>{safeNum(u.avgScore)}/100</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold" style={{ color: scoreColor(safeNum(u.bestScore)) }}>{safeNum(u.bestScore)}/100</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{u.lastAnalyzed ? new Date(u.lastAnalyzed).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 text-emerald-500 text-xs font-semibold">
                      <EyeIcon size={12} /> View
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {users.map((u, i) => (
            <button
              key={i}
              onClick={() => openUserDetail(u)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 text-left transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <UserIcon size={18} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm truncate">{u.name || 'Unknown'}</div>
                <div className="text-xs text-slate-400 truncate">{u.email}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{safeNum(u.reportCount)} analyses</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-black" style={{ color: scoreColor(safeNum(u.avgScore)) }}>{safeNum(u.avgScore)}</div>
                <div className="text-[9px] text-slate-400">avg /100</div>
              </div>
              <ChevronRightIcon size={14} className="text-slate-300" />
            </button>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <ShieldCheckIcon size={32} className="mx-auto mb-2 text-slate-200" />
            <p className="text-sm">No ATS analyses yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminATS;