import React, { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line,
} from 'recharts'
import adminApi from '../../configs/adminApi'
import toast from 'react-hot-toast'

const AdminAnalytics = () => {
  const [traffic, setTraffic]   = useState(null)
  const [monthly, setMonthly]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState('daily') // 'hourly' | 'daily'

  const fetchAll = async () => {
    try {
      const [trRes, moRes] = await Promise.all([
        adminApi.get('/api/admin/analytics/traffic-chart'),
        adminApi.get('/api/admin/analytics/monthly-users'),
      ])
      setTraffic(trRes.data)
      setMonthly(moRes.data)
    } catch (e) {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  const trafficData = view === 'hourly' ? traffic?.hourly : traffic?.daily
  const trafficKey  = view === 'hourly' ? 'hour' : 'date'

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Traffic patterns and user growth over time.</p>
      </div>

      {/* Traffic chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-700">Site Traffic</h2>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {['hourly', 'daily'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  view === v
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v === 'hourly' ? "Today (Hourly)" : "30 Days (Daily)"}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={trafficData}>
            <defs>
              <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey={trafficKey}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(v) => view === 'daily' ? v.slice(5) : v}
              interval={view === 'hourly' ? 2 : 4}
            />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#trafficGrad)"
              name="Requests"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly users chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-slate-700 mb-4">Monthly Active vs New Users — Last 6 Months</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="activeUsers"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Active Users"
            />
            <Line
              type="monotone"
              dataKey="newUsers"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="New Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-slate-700 mb-4">Monthly Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-slate-500 font-semibold">Month</th>
                <th className="text-right py-2 px-3 text-slate-500 font-semibold">New Users</th>
                <th className="text-right py-2 px-3 text-slate-500 font-semibold">Active Users</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.month} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-slate-700">{m.label}</td>
                  <td className="py-2.5 px-3 text-right text-blue-600 font-semibold">{m.newUsers}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">{m.activeUsers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default AdminAnalytics