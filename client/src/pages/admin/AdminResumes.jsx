import React, { useEffect, useState, useCallback } from 'react'
import {
  FileTextIcon, DownloadIcon, TrashIcon,
  ChevronLeftIcon, ChevronRightIcon,
  TrendingUpIcon, EyeIcon, XIcon,
} from 'lucide-react'
import adminApi from '../../configs/adminApi'
import toast from 'react-hot-toast'
import StatCard from '../../components/admin/StatCard'

const TEMPLATE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

const AdminResumes = () => {
  const [stats,      setStats]      = useState(null)
  const [resumes,    setResumes]    = useState([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [tableLoad,  setTableLoad]  = useState(false)

  const [search,   setSearch]   = useState('')
  const [template, setTemplate] = useState('all')
  const [sort,     setSort]     = useState('newest')
  const [page,     setPage]     = useState(1)

  // Fetch stats once
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await adminApi.get('/api/admin/resumes/stats')
        setStats(data)
      } catch {
        toast.error('Failed to load resume stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Fetch resume table
  const fetchResumes = useCallback(async () => {
    setTableLoad(true)
    try {
      const { data } = await adminApi.get('/api/admin/resumes', {
        params: { search, template, sort, page, limit: 10 },
      })
      setResumes(data.resumes)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      toast.error('Failed to load resumes')
    } finally {
      setTableLoad(false)
    }
  }, [search, template, sort, page])

  useEffect(() => { fetchResumes() }, [fetchResumes])
  useEffect(() => { setPage(1) }, [search, template, sort])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete resume "${title}"? This cannot be undone.`)) return
    try {
      await adminApi.delete(`/api/admin/resumes/${id}`)
      toast.success('Resume deleted')
      fetchResumes()
    } catch {
      toast.error('Failed to delete resume')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Resumes</h1>
        <p className="text-slate-500 text-sm mt-0.5">Resume stats and management.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Resumes"
          value={stats?.totalResumes?.toLocaleString()}
          icon={FileTextIcon}
          color="emerald"
          sub="All time"
        />
        <StatCard
          label="Total Downloads"
          value={stats?.totalDownloads?.toLocaleString()}
          icon={DownloadIcon}
          color="blue"
          sub="All time"
        />
        <StatCard
          label="Public Resumes"
          value={stats?.publicResumes?.toLocaleString()}
          icon={EyeIcon}
          color="purple"
          sub="Shared by users"
        />
      </div>

      {/* Template stats */}
      {stats?.templateStats?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-700 mb-4">Template Performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.templateStats.map((t, i) => (
              <div
                key={t._id}
                className="rounded-xl p-4 border"
                style={{
                  borderColor: TEMPLATE_COLORS[i % TEMPLATE_COLORS.length] + '40',
                  backgroundColor: TEMPLATE_COLORS[i % TEMPLATE_COLORS.length] + '08',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white capitalize"
                    style={{ backgroundColor: TEMPLATE_COLORS[i % TEMPLATE_COLORS.length] }}
                  >
                    {t._id || 'unknown'}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-slate-800">{t.count}</p>
                <p className="text-xs text-slate-400 mt-0.5">resumes created</p>
                <p className="text-xs text-slate-500 mt-1">
                  <DownloadIcon className="size-3 inline mr-1" />
                  {t.downloads} downloads
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top downloaded */}
      {stats?.topDownloaded?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-700 mb-4">Top Downloaded Resumes</h2>
          <div className="space-y-2">
            {stats.topDownloaded.map((r, i) => (
              <div key={r._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{r.title}</p>
                    <p className="text-xs text-slate-400">
                      {r.userId?.name || 'Unknown'} · {r.template} template
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                  <DownloadIcon className="size-3.5" />
                  {r.downloadCount}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resume table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-emerald-500 transition-all">
            <FileTextIcon className="size-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name..."
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Templates</option>
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="minimal">Minimal</option>
            <option value="minimalImage">Minimal Image</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="downloads">Most Downloaded</option>
          </select>
        </div>

        {tableLoad ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <FileTextIcon className="size-10 mb-2 opacity-30" />
            <p className="text-sm">No resumes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold">Resume</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold hidden md:table-cell">Owner</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold hidden lg:table-cell">Template</th>
                  <th className="text-center py-3 px-4 text-slate-500 font-semibold">Downloads</th>
                  <th className="text-center py-3 px-4 text-slate-500 font-semibold hidden sm:table-cell">Visibility</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold hidden lg:table-cell">Created</th>
                  <th className="text-right py-3 px-4 text-slate-500 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {resumes.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 truncate max-w-[180px]">{r.title}</p>
                      {r.personal_info?.full_name && (
                        <p className="text-xs text-slate-400">{r.personal_info.full_name}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <p className="text-slate-700 text-sm">{r.userId?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{r.userId?.email || ''}</p>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full capitalize">
                        {r.template}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-sm">
                        <DownloadIcon className="size-3.5" />
                        {r.downloadCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        r.public
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {r.public ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-sm hidden lg:table-cell">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(r._id, r.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete resume"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!tableLoad && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">Page {page} of {totalPages} — {total} resumes</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminResumes