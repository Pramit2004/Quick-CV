import React, { useEffect, useState, useCallback } from "react";
import {
  TargetIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  BarChart2Icon,
  ClockIcon,
  UserIcon,
  AlertCircleIcon,
} from "lucide-react";
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import StatCard from "../../components/admin/StatCard";
import adminApi from "../../configs/adminApi";
import toast from "react-hot-toast";

// Score bucket colors
const SCORE_COLORS = {
  "0–19":   "#ef4444",
  "20–39":  "#f97316",
  "40–59":  "#f59e0b",
  "60–79":  "#3b82f6",
  "80–100": "#10b981",
};

const SKILL_COLORS = [
  "#10b981","#3b82f6","#8b5cf6","#f59e0b","#ef4444",
  "#06b6d4","#ec4899","#14b8a6","#f97316","#6366f1",
];

// Score badge
const ScoreBadge = ({ score }) => {
  const color =
    score >= 80 ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : score >= 60 ? "bg-blue-100 text-blue-700 border-blue-200"
    : score >= 40 ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-rose-100 text-rose-700 border-rose-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border ${color}`}>
      {score}%
    </span>
  );
};

// Status badge
const StatusBadge = ({ status }) => {
  if (status === "Success")
    return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircleIcon className="size-3" />Success</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600"><XCircleIcon className="size-3" />{status}</span>;
};

// Format date
const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

// ─────────────────────────────────────────────────────────────
const AdminJDMatch = () => {
  const [overview,      setOverview]      = useState(null);
  const [chart,         setChart]         = useState([]);
  const [scoreDist,     setScoreDist]     = useState([]);
  const [missingSkills, setMissingSkills] = useState([]);
  const [recent,        setRecent]        = useState([]);
  const [loading,       setLoading]       = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [ovRes, chartRes, distRes, skillsRes, recentRes] = await Promise.all([
        adminApi.get("/api/admin/jd-match/overview"),
        adminApi.get("/api/admin/jd-match/chart"),
        adminApi.get("/api/admin/jd-match/score-distribution"),
        adminApi.get("/api/admin/jd-match/missing-skills"),
        adminApi.get("/api/admin/jd-match/recent"),
      ]);
      setOverview(ovRes.data);
      setChart(chartRes.data);
      setScoreDist(distRes.data);
      setMissingSkills(skillsRes.data);
      setRecent(recentRes.data);
    } catch {
      toast.error("Failed to load JD Match analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading JD Match analytics...</p>
        </div>
      </div>
    );
  }

  const maxSkillCount = missingSkills[0]?.count || 1;

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">JD Match Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resume-to-job compatibility analysis insights.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
          <TargetIcon className="size-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">JD Matcher</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Analyses"
          value={overview?.total?.toLocaleString()}
          icon={TargetIcon}
          color="emerald"
          sub="All time"
        />
        <StatCard
          label="Avg Match Score"
          value={`${overview?.avgScore ?? 0}%`}
          icon={TrendingUpIcon}
          color="blue"
          sub="Successful runs"
        />
        <StatCard
          label="Successful"
          value={overview?.successful?.toLocaleString()}
          icon={CheckCircleIcon}
          color="teal"
          sub="Completed analyses"
        />
        <StatCard
          label="Analyses Today"
          value={overview?.todayCount?.toLocaleString()}
          icon={BarChart2Icon}
          color="purple"
          sub="Last 24 hours"
        />
      </div>

      {/* Daily analyses chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-slate-700 mb-4">Daily Analyses — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chart}>
            <defs>
              <linearGradient id="jdGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => v.slice(5)}
              interval={4}
            />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
              labelFormatter={(v) => `Date: ${v}`}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#jdGrad)"
              name="Analyses"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Score distribution + Missing skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Score distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-700 mb-4">Score Distribution</h2>
          {scoreDist.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={scoreDist} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Bar dataKey="count" name="Analyses" radius={[6, 6, 0, 0]}>
                    {scoreDist.map((entry, i) => (
                      <Cell key={i} fill={SCORE_COLORS[entry.range] || "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-3">
                {scoreDist.map((entry) => (
                  <div key={entry.range} className="flex items-center gap-1.5">
                    <div
                      className="size-2.5 rounded-sm"
                      style={{ backgroundColor: SCORE_COLORS[entry.range] || "#94a3b8" }}
                    />
                    <span className="text-[11px] text-slate-500">{entry.range} ({entry.count})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top missing skills */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-700 mb-4">Top Missing Skills</h2>
          {missingSkills.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
          ) : (
            <div className="space-y-2.5">
              {missingSkills.map((item, i) => {
                const pct = Math.round((item.count / maxSkillCount) * 100);
                return (
                  <div key={item.skill}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 capitalize">{item.skill}</span>
                      <span className="text-slate-400 text-xs">{item.count}×</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: SKILL_COLORS[i % SKILL_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent analyses table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-700">Recent Analyses</h2>
          <span className="text-xs text-slate-400">Last 20</span>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <AlertCircleIcon className="size-8 mb-2 text-slate-300" />
            <p className="text-sm">No analyses yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Score</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Summary</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recent.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <UserIcon className="size-3.5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700 text-xs">
                            {item.userId?.name || "Unknown"}
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            {item.userId?.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <ScoreBadge score={item.score} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell max-w-xs">
                      <p className="text-slate-500 text-xs truncate">
                        {item.summary || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <ClockIcon className="size-3" />
                        {fmtDate(item.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminJDMatch;