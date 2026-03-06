import React from 'react'
import { Plus, Trash2, DollarSign } from 'lucide-react'

const BLANK = {
  title: '', agency: '', amount: '', role: 'Principal Investigator',
  start_date: '', end_date: '', is_current: false, description: '',
}

const ROLES = [
  'Principal Investigator', 'Co-Investigator', 'Collaborator',
  'Research Affiliate', 'Postdoctoral Fellow', 'Other',
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

const GrantsForm = ({ data = [], onChange }) => {
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
          <h3 className="text-sm font-bold text-gray-800">Grants & Funding</h3>
          <p className="text-xs text-gray-400 mt-0.5">Research grants, fellowships, awards</p>
        </div>
        <button onClick={add} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
          <Plus className="size-3.5" /> Add
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <DollarSign className="size-7 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No grants or funding yet</p>
          <p className="text-xs text-gray-300 mt-0.5">Research grants, fellowships, awards</p>
        </div>
      )}

      <div className="space-y-4">
        {data.map((g, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Grant #{i + 1}</span>
              <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>

            <Field label="Grant Title" required>
              <input type="text" value={g.title} onChange={(e) => update(i, 'title', e.target.value)}
                placeholder="e.g. NIH R01 — Machine Learning for Cancer Detection" className={base} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Funding Agency">
                <input type="text" value={g.agency} onChange={(e) => update(i, 'agency', e.target.value)}
                  placeholder="NIH, NSF, Wellcome Trust…" className={base} />
              </Field>
              <Field label="Amount">
                <input type="text" value={g.amount} onChange={(e) => update(i, 'amount', e.target.value)}
                  placeholder="$250,000" className={base} />
              </Field>
            </div>

            <Field label="Your Role">
              <select value={g.role} onChange={(e) => update(i, 'role', e.target.value)}
                className={`${base} cursor-pointer`}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date">
                <input type="month" value={g.start_date} onChange={(e) => update(i, 'start_date', e.target.value)}
                  className={base} />
              </Field>
              <Field label="End Date">
                <input type="month" value={g.end_date}
                  disabled={g.is_current}
                  onChange={(e) => update(i, 'end_date', e.target.value)}
                  className={`${base} disabled:opacity-50 disabled:cursor-not-allowed`} />
              </Field>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={g.is_current}
                onChange={(e) => update(i, 'is_current', e.target.checked)}
                className="rounded accent-emerald-600" />
              <span className="text-xs text-gray-600">Currently active</span>
            </label>

            <Field label="Description">
              <textarea rows={3} value={g.description} onChange={(e) => update(i, 'description', e.target.value)}
                placeholder="Brief description of the research or project" className={`${base} resize-none`} />
            </Field>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GrantsForm