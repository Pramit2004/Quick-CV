/**
 * DynamicSectionForm.jsx
 *
 * FIX Problem 2a:
 * Admin defines custom sections with fieldDefs (e.g. Certifications with cert_name, issuer, date fields).
 * Users fill in data here.
 *
 * Data is stored as:
 *   resumeData.customSections = [
 *     { id: "custom_123", fields: { cert_name: "AWS", issuer: "Amazon", date: "2023" } }
 *   ]
 *
 * DynamicResumeRenderer reads:
 *   const sectionData = (data.customSections || []).find(s => s.id === section.id)
 *   const fieldValues = sectionData?.fields || {}
 *
 * Previously the old code was saving to `items` array format instead of `fields` flat object.
 * This fix aligns the save format with what the renderer expects.
 */

import React from 'react'

const DynamicSectionForm = ({ sectionDef, data = {}, onChange }) => {
  if (!sectionDef) return null

  const fieldDefs = sectionDef.fieldDefs || []

  // data here is the `fields` object: { fieldKey: value, ... }
  // (Not items array — we store as flat object for simple single-record sections)
  const fields = typeof data === 'object' && !Array.isArray(data) ? data : {}

  const updateField = (fieldKey, value) => {
    onChange({ ...fields, [fieldKey]: value })
  }

  if (fieldDefs.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center">
        This section has no fields defined yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <div className="w-2 h-2 rounded-full bg-violet-500" />
        <p className="text-xs font-bold text-gray-600">{sectionDef.label}</p>
        <span className="text-[10px] text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full font-bold">CUSTOM</span>
      </div>

      {fieldDefs.map((fd) => (
        <div key={fd.fieldKey}>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {fd.label}
            {fd.required && <span className="text-rose-500 ml-1">*</span>}
          </label>

          {fd.fieldType === 'textarea' ? (
            <textarea
              rows={4}
              value={fields[fd.fieldKey] || ''}
              onChange={(e) => updateField(fd.fieldKey, e.target.value)}
              placeholder={fd.placeholder || `Enter ${fd.label}...`}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none bg-white"
            />
          ) : fd.fieldType === 'select' ? (
            <select
              value={fields[fd.fieldKey] || ''}
              onChange={(e) => updateField(fd.fieldKey, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all bg-white cursor-pointer"
            >
              <option value="">Select {fd.label}...</option>
              {(fd.options || []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : fd.fieldType === 'date' ? (
            <input
              type="month"
              value={fields[fd.fieldKey] || ''}
              onChange={(e) => updateField(fd.fieldKey, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all bg-white"
            />
          ) : fd.fieldType === 'url' ? (
            <input
              type="url"
              value={fields[fd.fieldKey] || ''}
              onChange={(e) => updateField(fd.fieldKey, e.target.value)}
              placeholder={fd.placeholder || `https://...`}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all bg-white"
            />
          ) : (
            <input
              type="text"
              value={fields[fd.fieldKey] || ''}
              onChange={(e) => updateField(fd.fieldKey, e.target.value)}
              placeholder={fd.placeholder || `Enter ${fd.label}...`}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all bg-white"
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default DynamicSectionForm