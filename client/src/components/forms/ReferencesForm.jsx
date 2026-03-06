import React from 'react'
import { Plus, Trash2, Users } from 'lucide-react'

const BLANK = {
  name: '', title: '', institution: '',
  email: '', phone: '', relationship: '',
}

const base = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-colors bg-white'

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

const ReferencesForm = ({ data = [], onChange }) => {
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
          <h3 className="text-sm font-bold text-gray-800">References</h3>
          <p className="text-xs text-gray-400 mt-0.5">Academic and professional referees</p>
        </div>
        <button onClick={add} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
          <Plus className="size-3.5" /> Add
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <Users className="size-7 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No references yet</p>
          <p className="text-xs text-gray-300 mt-0.5">Academic supervisors, collaborators, managers</p>
        </div>
      )}

      <div className="space-y-4">
        {data.map((r, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Reference #{i + 1}</span>
              <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>

            <Field label="Full Name" required>
              <input type="text" value={r.name} onChange={(e) => update(i, 'name', e.target.value)}
                placeholder="Dr. Jane Smith" className={base} />
            </Field>

            <Field label="Title / Position">
              <input type="text" value={r.title} onChange={(e) => update(i, 'title', e.target.value)}
                placeholder="Professor of Computer Science" className={base} />
            </Field>

            <Field label="Institution / Organisation">
              <input type="text" value={r.institution} onChange={(e) => update(i, 'institution', e.target.value)}
                placeholder="MIT, Google, Stanford…" className={base} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <input type="email" value={r.email} onChange={(e) => update(i, 'email', e.target.value)}
                  placeholder="referee@example.com" className={base} />
              </Field>
              <Field label="Phone">
                <input type="tel" value={r.phone} onChange={(e) => update(i, 'phone', e.target.value)}
                  placeholder="+1 (555) 000-0000" className={base} />
              </Field>
            </div>

            <Field label="Relationship">
              <input type="text" value={r.relationship} onChange={(e) => update(i, 'relationship', e.target.value)}
                placeholder="PhD Supervisor, Former Manager, Collaborator…" className={base} />
            </Field>
          </div>
        ))}
      </div>

      {data.length > 0 && (
        <p className="text-[11px] text-gray-400 text-center">
          Always seek permission before listing someone as a referee.
        </p>
      )}
    </div>
  )
}

export default ReferencesForm