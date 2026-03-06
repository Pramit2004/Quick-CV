import React, { useEffect, useState, useCallback } from 'react'
import {
  MessageSquareIcon, StarIcon, CheckCheckIcon,
  TrashIcon, ChevronLeftIcon, ChevronRightIcon,
  XIcon, FilterIcon,
} from 'lucide-react'
import adminApi from '../../configs/adminApi'
import toast from 'react-hot-toast'

const CATEGORIES = ["all", "general", "bug", "feature", "template", "other"]
const CATEGORY_COLORS = {
  general:  "bg-slate-100 text-slate-600",
  bug:      "bg-rose-100 text-rose-600",
  feature:  "bg-blue-100 text-blue-600",
  template: "bg-purple-100 text-purple-600",
  other:    "bg-orange-100 text-orange-600",
}

// Star rating display
const Stars = ({ rating, size = "sm" }) => {
  const sz = size === "sm" ? "size-3.5" : "size-5"
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <StarIcon
          key={s}
          className={`${sz} ${
            s <= rating
              ? "text-amber-400 fill-amber-400"
              : "text-slate-200 fill-slate-200"
          }`}
        />
      ))}
    </div>
  )
}

const AdminFeedback = () => {
  const [feedback,   setFeedback]   = useState([])
  const [stats,      setStats]      = useState(null)
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading,    setLoading]    = useState(true)

  const [category, setCategory] = useState('all')
  const [status,   setStatus]   = useState('all')
  const [rating,   setRating]   = useState('all')
  const [sort,     setSort]     = useState('newest')
  const [page,     setPage]     = useState(1)

  const fetchFeedback = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.get('/api/admin/feedback', {
        params: { category, status, rating, sort, page, limit: 10 },
      })
      setFeedback(data.feedback)
      setStats(data.stats)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      toast.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [category, status, rating, sort, page])

  useEffect(() => { fetchFeedback() }, [fetchFeedback])
  useEffect(() => { setPage(1) }, [category, status, rating, sort])

  const handleMarkRead = async (id) => {
    try {
      await adminApi.patch(`/api/admin/feedback/${id}/read`)
      setFeedback((prev) =>
        prev.map((f) => f._id === id ? { ...f, isRead: true } : f)
      )
      if (stats) {
        setStats((prev) => ({ ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }))
      }
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await adminApi.patch('/api/admin/feedback/mark-all-read')
      setFeedback((prev) => prev.map((f) => ({ ...f, isRead: true })))
      setStats((prev) => ({ ...prev, unreadCount: 0 }))
      toast.success('All feedback marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feedback permanently?')) return
    try {
      await adminApi.delete(`/api/admin/feedback/${id}`)
      setFeedback((prev) => prev.filter((f) => f._id !== id))
      setTotal((prev) => prev - 1)
      toast.success('Feedback deleted')
    } catch {
      toast.error('Failed to delete feedback')
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Feedback</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {stats?.totalFeedback || 0} total ·{' '}
            <span className="text-rose-500 font-semibold">
              {stats?.unreadCount || 0} unread
            </span>
          </p>
        </div>
        {stats?.unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all"
          >
            <CheckCheckIcon className="size-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Average rating */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium mb-1">Average Rating</p>
            <p className="text-3xl font-extrabold text-slate-800">{stats.averageRating}</p>
            <Stars rating={Math.round(stats.averageRating)} size="sm" />
          </div>

          {/* Total */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium mb-1">Total Feedback</p>
            <p className="text-3xl font-extrabold text-slate-800">{stats.totalFeedback}</p>
            <p className="text-xs text-slate-400 mt-1">All time</p>
          </div>

          {/* Rating breakdown */}
          <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium mb-3">Rating Breakdown</p>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((r) => {
                const found = stats.ratingStats.find((x) => x._id === r)
                const count = found?.count || 0
                const pct   = stats.totalFeedback
                  ? Math.round((count / stats.totalFeedback) * 100)
                  : 0
                return (
                  <div key={r} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-3">{r}</span>
                    <StarIcon className="size-3 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          {/* Rating */}
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_rating">Highest Rating</option>
            <option value="lowest_rating">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-48 bg-white border border-slate-200 rounded-2xl">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 bg-white border border-slate-200 rounded-2xl text-slate-400">
            <MessageSquareIcon className="size-10 mb-2 opacity-30" />
            <p className="text-sm">No feedback found</p>
          </div>
        ) : (
          feedback.map((f) => (
            <div
              key={f._id}
              className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                !f.isRead
                  ? 'border-emerald-200 shadow-emerald-50'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">

                {/* Left — user + content */}
                <div className="flex items-start gap-3 flex-1 min-w-0">

                  {/* Avatar */}
                  <div className="size-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                    {f.userId?.name?.[0]?.toUpperCase() || '?'}
                  </div>

                  <div className="flex-1 min-w-0">

                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-slate-800 text-sm">
                        {f.userId?.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-slate-400">{f.userId?.email}</p>
                      {!f.isRead && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>

                    {/* Rating + category + date */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Stars rating={f.rating} size="sm" />
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        CATEGORY_COLORS[f.category] || CATEGORY_COLORS.general
                      }`}>
                        {f.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(f.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Message */}
                    {f.message && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {f.message}
                      </p>
                    )}
                    {!f.message && (
                      <p className="text-sm text-slate-300 italic">No message provided</p>
                    )}
                  </div>
                </div>

                {/* Right — actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!f.isRead && (
                    <button
                      onClick={() => handleMarkRead(f._id)}
                      title="Mark as read"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <CheckCheckIcon className="size-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(f._id)}
                    title="Delete"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} — {total} feedback
          </p>
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
  )
}

export default AdminFeedback