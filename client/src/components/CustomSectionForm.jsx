// components/CustomSectionForm.jsx
// ─────────────────────────────────────────────────────────────
// Renders a dynamic editable form for any custom section
// (certifications, awards, languages, publications, etc.)
// Each item has a title + optional subtitle + optional description
// Users can add / remove items freely
// ─────────────────────────────────────────────────────────────
import React from 'react'
import { PlusIcon, TrashIcon } from 'lucide-react'

const inputCls = 'w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm'
const labelCls = 'block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5'

// Schema per section type — defines what fields each item has
const SECTION_SCHEMAS = {
  certifications: [
    { key: 'name',   label: 'Certification Name', placeholder: 'e.g. AWS Certified Developer', required: true },
    { key: 'issuer', label: 'Issuer',              placeholder: 'e.g. Amazon Web Services' },
    { key: 'date',   label: 'Date',                placeholder: 'e.g. Jan 2024' },
    { key: 'url',    label: 'Certificate URL',     placeholder: 'https://...' },
  ],
  awards: [
    { key: 'title',       label: 'Award Title',   placeholder: 'e.g. Employee of the Year', required: true },
    { key: 'issuer',      label: 'Issuer',         placeholder: 'e.g. Company Name' },
    { key: 'date',        label: 'Date',            placeholder: 'e.g. 2023' },
    { key: 'description', label: 'Description',    placeholder: 'Brief description...', multiline: true },
  ],
  languages: [
    { key: 'language',    label: 'Language',     placeholder: 'e.g. Spanish',    required: true },
    { key: 'proficiency', label: 'Proficiency',  placeholder: 'e.g. Fluent / B2 / Native' },
  ],
  publications: [
    { key: 'title',       label: 'Title',         placeholder: 'Publication title', required: true },
    { key: 'publisher',   label: 'Publisher',     placeholder: 'e.g. IEEE, Medium' },
    { key: 'date',        label: 'Date',           placeholder: 'e.g. March 2023' },
    { key: 'url',         label: 'URL',            placeholder: 'https://...' },
    { key: 'description', label: 'Summary',        placeholder: 'Brief summary...', multiline: true },
  ],
  volunteer: [
    { key: 'role',         label: 'Role',         placeholder: 'e.g. Mentor',           required: true },
    { key: 'organization', label: 'Organization', placeholder: 'e.g. Code.org' },
    { key: 'start_date',   label: 'Start Date',   placeholder: 'e.g. Jan 2022' },
    { key: 'end_date',     label: 'End Date',      placeholder: 'e.g. Present' },
    { key: 'description',  label: 'Description',  placeholder: 'What you did...', multiline: true },
  ],
  references: [
    { key: 'name',         label: 'Name',         placeholder: 'Reference name',   required: true },
    { key: 'title',        label: 'Title / Role', placeholder: 'e.g. Senior Manager' },
    { key: 'company',      label: 'Company',      placeholder: 'e.g. Google' },
    { key: 'contact',      label: 'Contact',      placeholder: 'Email or phone' },
  ],
}

// Generic schema for any unrecognized section type
const GENERIC_SCHEMA = [
  { key: 'title',       label: 'Title',       placeholder: 'Item title', required: true },
  { key: 'subtitle',    label: 'Subtitle',    placeholder: 'Optional subtitle' },
  { key: 'date',        label: 'Date',         placeholder: 'Optional date' },
  { key: 'description', label: 'Description', placeholder: 'Details...', multiline: true },
]

const getSchema = (sectionId) => {
  const id = sectionId?.toLowerCase()
  return SECTION_SCHEMAS[id] || GENERIC_SCHEMA
}

const emptyItem = (schema) =>
  Object.fromEntries(schema.map(f => [f.key, '']))

// ─────────────────────────────────────────────────────────────
const CustomSectionForm = ({ sectionId, sectionLabel, items = [], onChange }) => {
  const schema = getSchema(sectionId)

  const handleItemChange = (index, key, value) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    )
    onChange(updated)
  }

  const addItem = () => {
    onChange([...items, emptyItem(schema)])
  }

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className='space-y-4'>
      {items.length === 0 && (
        <div className='text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl'>
          No {sectionLabel} added yet.
        </div>
      )}

      {items.map((item, index) => (
        <div key={index} className='border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50'>
          <div className='flex items-center justify-between mb-1'>
            <span className='text-xs font-bold text-slate-500'>
              {sectionLabel} #{index + 1}
            </span>
            <button
              type='button'
              onClick={() => removeItem(index)}
              className='p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
            >
              <TrashIcon className='size-3.5' />
            </button>
          </div>

          {schema.map(field => (
            <div key={field.key}>
              <label className={labelCls}>{field.label}</label>
              {field.multiline ? (
                <textarea
                  value={item[field.key] || ''}
                  onChange={e => handleItemChange(index, field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              ) : (
                <input
                  type='text'
                  value={item[field.key] || ''}
                  onChange={e => handleItemChange(index, field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputCls}
                />
              )}
            </div>
          ))}
        </div>
      ))}

      <button
        type='button'
        onClick={addItem}
        className='w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-300 rounded-xl transition-colors'
      >
        <PlusIcon className='size-3.5' />
        Add {sectionLabel}
      </button>
    </div>
  )
}

export default CustomSectionForm