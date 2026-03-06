import React from 'react'
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react'

const StatCard = ({ label, value, icon: Icon, color = 'emerald', trend = null, sub = null }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue:    'bg-blue-50 text-blue-600 border-blue-100',
    purple:  'bg-purple-50 text-purple-600 border-purple-100',
    orange:  'bg-orange-50 text-orange-600 border-orange-100',
    rose:    'bg-rose-50 text-rose-600 border-rose-100',
    teal:    'bg-teal-50 text-teal-600 border-teal-100',
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        {Icon && (
          <div className={`p-2 rounded-xl border ${colors[color]}`}>
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <p className="text-3xl font-extrabold text-slate-800 tracking-tight">
        {value ?? '—'}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      {trend !== null && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
          {trend >= 0
            ? <TrendingUpIcon className="size-3" />
            : <TrendingDownIcon className="size-3" />
          }
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  )
}

export default StatCard