import React from 'react'
import { Plus, Trash2, GraduationCap } from 'lucide-react'

const BLANK = {
  course: '', course_code: '', institution: '',
  role: 'Instructor', start_date: '', end_date: '',
  is_current: false, students: '', description: '',
}

const ROLES = [
  'Instructor', 'Lecturer', 'Teaching Assistant',
  'Guest Lecturer', 'Workshop Facilitator', 'Tutor', 'Other',
]

const base = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-colors bg-white'

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

const TeachingForm = ({ data = [], onChange }) => {
  const add    = () => onChange([...data, { ...BLANK }])
  const remove = (i) => onChange(data.filter((_, idx) => idx !== i))
  const update = (i, key, val) => {
    const next = [...data]
    next[i] = { ...next[i], [key]: val }
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Teaching Experience</h3>
          <p className="text-xs text-gray-400 mt-0.5">Courses taught, workshops, lectures</p>
        </div>
        <button onClick={add} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
          <Plus className="size-3.5" /> Add
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <GraduationCap className="size-7 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No teaching experience yet</p>
          <p className="text-xs text-gray-300 mt-0.5">Courses, workshops, guest lectures</p>
        </div>
      )}

      <div className="space-y-4">
        {data.map((t, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">#{i + 1}</span>
              <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>

            <Field label="Course Title" required>
              <input type="text" value={t.course} onChange={(e) => update(i, 'course', e.target.value)}
                placeholder="e.g. Introduction to Machine Learning" className={base} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Course Code">
                <input type="text" value={t.course_code} onChange={(e) => update(i, 'course_code', e.target.value)}
                  placeholder="CS 101" className={base} />
              </Field>
              <Field label="Your Role">
                <select value={t.role} onChange={(e) => update(i, 'role', e.target.value)}
                  className={`${base} cursor-pointer`}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Institution">
              <input type="text" value={t.institution} onChange={(e) => update(i, 'institution', e.target.value)}
                placeholder="University / Organization name" className={base} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date">
                <input type="month" value={t.start_date} onChange={(e) => update(i, 'start_date', e.target.value)}
                  className={base} />
              </Field>
              <Field label="End Date">
                <input type="month" value={t.end_date}
                  disabled={t.is_current}
                  onChange={(e) => update(i, 'end_date', e.target.value)}
                  className={`${base} disabled:opacity-50 disabled:cursor-not-allowed`} />
              </Field>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={t.is_current}
                onChange={(e) => update(i, 'is_current', e.target.checked)}
                className="rounded accent-emerald-600" />
              <span className="text-xs text-gray-600">Currently teaching</span>
            </label>

            <Field label="Enrolment / Class Size">
              <input type="text" value={t.students} onChange={(e) => update(i, 'students', e.target.value)}
                placeholder="e.g. 120 students" className={base} />
            </Field>

            <Field label="Description">
              <textarea rows={3} value={t.description} onChange={(e) => update(i, 'description', e.target.value)}
                placeholder="Topics covered, teaching methods, outcomes…" className={`${base} resize-none`} />
            </Field>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TeachingForm