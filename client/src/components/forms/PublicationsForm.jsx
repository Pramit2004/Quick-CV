import React from 'react'
import { Plus, Trash2, BookOpen } from 'lucide-react'

const BLANK = {
  title: '', authors: '', venue: '', year: '',
  url: '', type: 'journal', description: '',
}

const PUB_TYPES = [
  'journal', 'conference', 'book chapter',
  'preprint', 'thesis', 'report', 'other',
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

const PublicationsForm = ({ data = [], onChange }) => {
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
          <h3 className="text-sm font-bold text-gray-800">Publications</h3>
          <p className="text-xs text-gray-400 mt-0.5">Journal articles, conference papers, book chapters</p>
        </div>
        <button onClick={add} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
          <Plus className="size-3.5" /> Add
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <BookOpen className="size-7 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No publications yet</p>
          <p className="text-xs text-gray-300 mt-0.5">Articles, papers, book chapters</p>
        </div>
      )}

      <div className="space-y-4">
        {data.map((pub, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">#{i + 1}</span>
              <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>

            <Field label="Title" required>
              <input type="text" value={pub.title} onChange={(e) => update(i, 'title', e.target.value)}
                placeholder="Paper or article title" className={base} />
            </Field>

            <Field label="Authors">
              <input type="text" value={pub.authors} onChange={(e) => update(i, 'authors', e.target.value)}
                placeholder="Smith J., Doe A., et al." className={base} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select value={pub.type} onChange={(e) => update(i, 'type', e.target.value)}
                  className={`${base} cursor-pointer`}>
                  {PUB_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Year">
                <input type="number" value={pub.year} onChange={(e) => update(i, 'year', e.target.value)}
                  placeholder="2024" min="1900" max="2099" className={base} />
              </Field>
            </div>

            <Field label="Journal / Conference / Publisher">
              <input type="text" value={pub.venue} onChange={(e) => update(i, 'venue', e.target.value)}
                placeholder="Nature, NeurIPS, Oxford University Press…" className={base} />
            </Field>

            <Field label="DOI / URL">
              <input type="url" value={pub.url} onChange={(e) => update(i, 'url', e.target.value)}
                placeholder="https://doi.org/…" className={base} />
            </Field>

            <Field label="Brief Description">
              <textarea rows={2} value={pub.description} onChange={(e) => update(i, 'description', e.target.value)}
                placeholder="One-sentence summary (optional)" className={`${base} resize-none`} />
            </Field>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PublicationsForm