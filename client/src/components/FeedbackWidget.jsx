import React, { useState } from 'react'
import { MessageSquareIcon, StarIcon, XIcon, SendIcon } from 'lucide-react'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'general',  label: '💬 General' },
  { value: 'bug',      label: '🐛 Bug Report' },
  { value: 'feature',  label: '✨ Feature Request' },
  { value: 'template', label: '🎨 Template' },
  { value: 'other',    label: '📌 Other' },
]

const FeedbackWidget = () => {
  const { token } = useSelector((s) => s.auth)
  const [open,     setOpen]     = useState(false)
  const [rating,   setRating]   = useState(0)
  const [hovered,  setHovered]  = useState(0)
  const [message,  setMessage]  = useState('')
  const [category, setCategory] = useState('general')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  const handleSubmit = async () => {
    if (!rating) return toast.error('Please select a rating')
    setLoading(true)
    try {
      await api.post(
        '/api/users/feedback',
        { rating, message, category },
        { headers: { Authorization: token } }
      )
      setDone(true)
      toast.success('Thank you for your feedback!')
      setTimeout(() => {
        setOpen(false)
        setDone(false)
        setRating(0)
        setMessage('')
        setCategory('general')
      }, 2000)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-full shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5"
      >
        <MessageSquareIcon className="size-4" />
        Feedback
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

            {/* Green bar */}
            <div className="h-[3px] w-full bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquareIcon className="size-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Share Feedback</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center justify-center py-10 px-5">
                <div className="size-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                  <span className="text-2xl">🎉</span>
                </div>
                <p className="font-bold text-slate-800">Thanks for your feedback!</p>
                <p className="text-sm text-slate-400 mt-1">It helps us improve.</p>
              </div>
            ) : (
              <div className="px-5 py-5 space-y-4">

                {/* Star rating */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    How would you rate your experience?
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onMouseEnter={() => setHovered(s)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(s)}
                        className="transition-transform hover:scale-110"
                      >
                        <StarIcon
                          className={`size-8 transition-colors ${
                            s <= (hovered || rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 fill-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="text-sm text-slate-500 ml-2">
                        {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Category
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setCategory(c.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                          category === c.value
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Message (optional)
                  </p>
                  <textarea
                    rows={3}
                    placeholder="Tell us what you think..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                  />
                  <p className="text-right text-[10px] text-slate-400 mt-0.5">
                    {message.length}/500
                  </p>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !rating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <SendIcon className="size-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default FeedbackWidget