/**
 * AdminATS.jsx
 * Full admin analytics dashboard for ATS Checker data
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import {
  ShieldCheckIcon, TrendingUpIcon, UsersIcon, FileTextIcon,
  TargetIcon, ZapIcon, AlertTriangleIcon, StarIcon, ActivityIcon,
} from 'lucide-react';
import adminApi from '../../configs/adminApi';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, sub, icon: Icon, color = '#3b82f6' }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-sm text-gray-500 font-medium">{title}</div>
        <div className="text-3xl font-black text-gray-900 mt-1">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
  </div>
);

const SCORE_COLORS = ['#ef4444','#f97316','#f59e0b','#3b82f6','#10b981','#10b981'];

const AdminATS = () => {
  const [overview,  setOverview]  = useState(null);
  const [scoreDist, setScoreDist] = useState(null);
  const [issues,    setIssues]    = useState(null);
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, sd, ci, ul] = await Promise.all([
        adminApi.get('/api/ats/admin/overview'),
        adminApi.get('/api/ats/admin/score-dist'),
        adminApi.get('/api/ats/admin/common-issues'),
        adminApi.get('/api/ats/admin/users?limit=10'),
      ]);
      setOverview(ov.data);
      setScoreDist(sd.data);
      setIssues(ci.data);
      setUsers(ul.data.users || []);
    } catch (err) {
      toast.error('Failed to load ATS analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">ATS Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Resume quality insights across all users</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50">
          <ActivityIcon size={14} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Analyses"    value={overview?.totalReports || 0}   sub={`+${overview?.reportsThisMonth || 0} this month`} icon={FileTextIcon} color="#3b82f6" />
        <StatCard title="Avg. ATS Score"    value={`${overview?.avgScore || 0}/100`} sub="Platform average"                                icon={TrendingUpIcon} color="#10b981" />
        <StatCard title="Pass Rate (≥75)"   value={`${overview?.passRate || 0}%`}  sub={`${overview?.highScoreCount || 0} resumes`}        icon={StarIcon}       color="#f59e0b" />
        <StatCard title="Needs Work (<45)"  value={overview?.lowScoreCount || 0}   sub="Below threshold"                                  icon={AlertTriangleIcon} color="#ef4444" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Score distribution */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreDist?.distribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6,6,0,0]}>
                {(scoreDist?.distribution || []).map((_, i) => (
                  <Cell key={i} fill={SCORE_COLORS[i] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category averages */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Category Averages (% of max)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              layout="vertical"
              data={[
                { name: 'Structure',  pct: Math.round(((scoreDist?.categoryAverages?.structure||0)/25)*100) },
                { name: 'Content',    pct: Math.round(((scoreDist?.categoryAverages?.content  ||0)/35)*100) },
                { name: 'Writing',    pct: Math.round(((scoreDist?.categoryAverages?.writing  ||0)/20)*100) },
                { name: 'ATS Compat', pct: Math.round(((scoreDist?.categoryAverages?.ats      ||0)/20)*100) },
                { name: 'Advanced',   pct: Math.round(((scoreDist?.categoryAverages?.advanced ||0)/10)*100) },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" domain={[0,100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
              <Tooltip formatter={v => [`${v}%`]} />
              <Bar dataKey="pct" fill="#3b82f6" radius={[0,6,6,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Common issues row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Missing keywords */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <TargetIcon size={15} className="text-blue-500" /> Top Missing Keywords
          </h3>
          <div className="space-y-2">
            {(issues?.missingKeywords || []).slice(0, 8).map((k, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${Math.min(100, k.count * 5)}%` }} />
                </div>
                <span className="text-xs text-gray-600 w-24 shrink-0">{k.keyword}</span>
                <span className="text-xs text-gray-400 w-8 text-right">{k.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weak verbs */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <ZapIcon size={15} className="text-amber-500" /> Most Overused Weak Verbs
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(issues?.weakVerbs || []).slice(0, 12).map((v, i) => (
              <span key={i} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">
                {v.verb} <span className="text-orange-400">({v.count}×)</span>
              </span>
            ))}
          </div>
          <div className="mt-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Section Issues</h4>
            {[
              { label: 'Missing Email',    pct: issues?.sectionIssues?.missingEmail    || 0 },
              { label: 'Missing Phone',    pct: issues?.sectionIssues?.missingPhone    || 0 },
              { label: 'Missing LinkedIn', pct: issues?.sectionIssues?.missingLinkedIn || 0 },
              { label: 'Low Metrics',      pct: issues?.sectionIssues?.lowQuantification || 0 },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-gray-500 w-28 shrink-0">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top domains */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <UsersIcon size={15} className="text-green-500" /> Top User Domains
          </h3>
          <div className="space-y-2">
            {(issues?.topDomains || []).slice(0, 7).map((d, i) => {
              const colors = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899'];
              const pct = issues.total > 0 ? Math.round((d.count / issues.total) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[i] }} />
                  <span className="text-xs text-gray-600 flex-1 capitalize">{(d.domain || 'general').replace(/_/g,' ')}</span>
                  <div className="w-20 bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: colors[i] }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Recent Users by ATS Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-semibold">User</th>
                <th className="px-5 py-3 text-center font-semibold">Reports</th>
                <th className="px-5 py-3 text-center font-semibold">Avg Score</th>
                <th className="px-5 py-3 text-center font-semibold">Best Score</th>
                <th className="px-5 py-3 text-right font-semibold">Last Analysis</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const color = u.avgScore >= 75 ? '#10b981' : u.avgScore >= 55 ? '#f59e0b' : '#ef4444';
                return (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-gray-900">{u.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </td>
                    <td className="px-5 py-3 text-center text-gray-600">{u.reportCount}</td>
                    <td className="px-5 py-3 text-center font-bold" style={{ color }}>{u.avgScore}/100</td>
                    <td className="px-5 py-3 text-center text-gray-600">{u.bestScore}/100</td>
                    <td className="px-5 py-3 text-right text-xs text-gray-400">
                      {u.lastAnalyzed ? new Date(u.lastAnalyzed).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400">No ATS analyses yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminATS;