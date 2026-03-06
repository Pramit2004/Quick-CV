import React, { useEffect, useState, useCallback } from 'react'
import {
  UsersIcon, FileTextIcon, DownloadIcon,
  TrendingUpIcon, UserPlusIcon, ActivityIcon,
  MessageSquareIcon, CalendarIcon, RadioIcon,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import StatCard from '../../components/admin/StatCard'
import adminApi from '../../configs/adminApi'
import toast from 'react-hot-toast'

const TEMPLATE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

const AdminDashboard = () => {
  const [overview,     setOverview]     = useState(null)
  const [usersChart,   setUsersChart]   = useState([])
  const [resumeStats,  setResumeStats]  = useState(null)
  const [activeNow,    setActiveNow]    = useState(0)
  const [loading,      setLoading]      = useState(true)

  // ── Fetch active-now separately so it can auto-refresh ──
  const fetchActiveNow = useCallback(async () => {
    try {
      const { data } = await adminApi.get('/api/admin/analytics/active-now')
      setActiveNow(data.count)
    } catch (_) {}
  }, [])

  // ── Fetch all dashboard data ────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [ovRes, ucRes, rsRes] = await Promise.all([
        adminApi.get('/api/admin/analytics/overview'),
        adminApi.get('/api/admin/analytics/users-chart'),
        adminApi.get('/api/admin/analytics/resume-stats'),
      ])
      setOverview(ovRes.data)
      setUsersChart(ucRes.data)
      setResumeStats(rsRes.data)
      await fetchActiveNow()
    } catch (e) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [fetchActiveNow])

  useEffect(() => {
    fetchAll()

    // Auto-refresh "Online Now" every 30 seconds
    const interval = setInterval(fetchActiveNow, 30000)
    return () => clearInterval(interval)
  }, [fetchAll, fetchActiveNow])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Welcome back. Here's what's happening.</p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-emerald-700">
            {activeNow} online now
          </span>
        </div>
      </div>

      {/* Row 1 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={overview?.totalUsers?.toLocaleString()}
          icon={UsersIcon}
          color="emerald"
          sub="All time"
        />
        <StatCard
          label="New Users Today"
          value={overview?.newUsersToday?.toLocaleString()}
          icon={UserPlusIcon}
          color="blue"
          sub="Last 24 hours"
        />
        <StatCard
          label="Active Users (30d)"
          value={overview?.activeUsersThisMonth?.toLocaleString()}
          icon={ActivityIcon}
          color="purple"
          sub="Monthly active"
        />
        <StatCard
          label="Total Downloads"
          value={overview?.totalDownloads?.toLocaleString()}
          icon={DownloadIcon}
          color="orange"
          sub="All time"
        />
      </div>

      {/* Row 2 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Resumes"
          value={overview?.totalResumes?.toLocaleString()}
          icon={FileTextIcon}
          color="teal"
          sub="All time"
        />
        <StatCard
          label="Resumes (30d)"
          value={overview?.resumesThisMonth?.toLocaleString()}
          icon={TrendingUpIcon}
          color="emerald"
          sub="This month"
        />
        <StatCard
          label="Weekly Active"
          value={overview?.weeklyActiveUsers?.toLocaleString()}
          icon={CalendarIcon}
          color="blue"
          sub="Last 7 days"
        />
        <StatCard
          label="Unread Feedback"
          value={overview?.unreadFeedback?.toLocaleString()}
          icon={MessageSquareIcon}
          color="rose"
          sub="Needs review"
        />
      </div>

      {/* New users chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-slate-700 mb-4">New Users — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={usersChart}>
            <defs>
              <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(v) => v.slice(5)}
              interval={4}
            />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
              labelFormatter={(v) => `Date: ${v}`}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#usersGrad)"
              name="New Users"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Template usage */}
      {resumeStats?.templateUsage?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Bar chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-slate-700 mb-4">Template Usage</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resumeStats.templateUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="count" name="Resumes" radius={[6, 6, 0, 0]}>
                  {resumeStats.templateUsage.map((_, i) => (
                    <Cell key={i} fill={TEMPLATE_COLORS[i % TEMPLATE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Template breakdown list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-slate-700 mb-4">Template Breakdown</h2>
            <div className="space-y-3">
              {resumeStats.templateUsage.map((t, i) => {
                const total = resumeStats.templateUsage.reduce((s, x) => s + x.count, 0)
                const pct   = total ? Math.round((t.count / total) * 100) : 0
                return (
                  <div key={t._id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 capitalize">
                        {t._id || 'Unknown'}
                      </span>
                      <span className="text-slate-400">
                        {t.count} resumes ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: TEMPLATE_COLORS[i % TEMPLATE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  )
}

export default AdminDashboard