import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  SaveIcon, ArrowLeftIcon, EyeIcon, EyeOffIcon,
  GripVerticalIcon, CheckCircleIcon, PaletteIcon,
  TypeIcon, LayoutIcon, SlidersIcon, ListIcon,
  PlusIcon, TrashIcon, XIcon, PencilIcon,
  ChevronDownIcon, ChevronUpIcon,
} from 'lucide-react'
import adminApi from '../../configs/adminApi'
import toast from 'react-hot-toast'
import DynamicResumeRenderer from '../../components/admin/DynamicResumeRenderer'

// ── A4 dimensions ─────────────────────────────────────────────
const A4_WIDTH  = 794
const A4_HEIGHT = 1123

// ── Preview data ──────────────────────────────────────────────
const PREVIEW_DATA = {
  personal_info: {
    full_name:  'Alexandra Johnson',
    profession: 'Senior Product Designer',
    email:      'alex.johnson@email.com',
    phone:      '+1 (555) 234-5678',
    location:   'San Francisco, CA',
    linkedin:   'linkedin.com/in/alexjohnson',
    website:    'alexjohnson.design',
    image:      '',
  },
  professional_summary:
    'Creative and results-driven Product Designer with 6+ years crafting user-centered digital experiences. Proven track record leading design systems and shipping impactful products used by millions.',
  skills: ['Figma', 'UX Research', 'Prototyping', 'Design Systems', 'React', 'Tailwind CSS'],
  experience: [
    {
      position:   'Senior Product Designer',
      company:    'Notion',
      start_date: '2022-03',
      end_date:   '',
      is_current: true,
      description:
        'Led redesign of core editor used by 30M+ users.\nBuilt component library of 200+ elements.\nReduced design-to-dev handoff time by 40%.',
    },
    {
      position:   'Product Designer',
      company:    'Figma',
      start_date: '2019-06',
      end_date:   '2022-02',
      is_current: false,
      description:
        'Designed onboarding flows improving activation by 25%.\nDrove accessibility improvements across the platform.',
    },
  ],
  education: [{
    degree:          'Bachelor of Design',
    field:           'Interaction Design',
    institution:     'California College of the Arts',
    graduation_date: '2019-05',
    gpa:             '3.9',
  }],
  project: [{
    name:      'DesignOS — Open Source Design System',
    type:      'Open Source',
    description:
      'Built accessible React component library with 150+ components.\nUsed by 500+ developers on GitHub.',
    liveUrl:   'https://designos.dev',
    githubUrl: 'https://github.com/alex/designos',
  }],
}

// ── ALL Layout options ────────────────────────────────────────
const LAYOUT_OPTIONS = [
  { value: 'single',         label: '■ Single Column',            desc: 'ATS-friendly, clean flow',          group: 'Standard' },
  { value: 'two-col-left',   label: '▌■ Sidebar Left',            desc: 'Sidebar on left side',              group: 'Standard' },
  { value: 'two-col-right',  label: '■▐ Sidebar Right',           desc: 'Sidebar on right side',             group: 'Standard' },
  { value: 'banner',         label: '▬ Header Banner',            desc: 'Full-width color header',           group: 'Standard' },
  { value: 'split-header',   label: '⫷ Split Header',             desc: 'Name left, contact right',          group: 'Modern' },
  { value: 'centered',       label: '◎ Centered Classic',         desc: 'Everything centered, elegant',      group: 'Modern' },
  { value: 'minimal',        label: '─ Minimal Clean',            desc: 'Ultra-clean, whitespace focused',   group: 'Modern' },
  { value: 'timeline',       label: '⎯ Timeline',                 desc: 'Sections along a timeline rail',    group: 'Creative' },
  { value: 'boxed',          label: '▣ Boxed Sections',           desc: 'Each section in a border box',      group: 'Creative' },
  { value: 'card',           label: '▢ Card Based',               desc: 'Sections as floating cards',        group: 'Creative' },
  { value: 'modern-sidebar', label: '▌ Modern Gradient Sidebar',  desc: 'Gradient sidebar, premium look',    group: 'Premium' },
  { value: 'compact',        label: '≡ Compact Density',          desc: 'Maximized content, minimal waste',  group: 'Premium' },
]

const LAYOUT_GROUPS = ['Standard', 'Modern', 'Creative', 'Premium']

// ── Defaults ──────────────────────────────────────────────────
const DEFAULT_STYLE = {
  layout:                    'single',
  showPhoto:                 false,
  photoShape:                'circle',
  photoPosition:             'top-left',
  sidebarWidth:              30,
  accentColor:               '#10b981',
  backgroundColor:           '#ffffff',
  sidebarBg:                 '#f1f5f9',
  headerBg:                  '#10b981',
  headerTextColor:           '#ffffff',
  sectionTitleColor:         '#10b981',
  bodyTextColor:             '#334155',
  mutedTextColor:            '#64748b',
  borderColor:               '#e2e8f0',
  fontFamily:                'Inter',
  baseFontSize:              14,
  nameSize:                  32,
  nameBold:                  true,
  sectionTitleSize:          13,
  sectionTitleBold:          true,
  sectionTitleUppercase:     true,
  sectionTitleLetterSpacing: 2,
  pagePadding:               32,
  sectionGap:                24,
  itemGap:                   12,
  showDividers:              true,
  dividerStyle:              'solid',
  headerStyle:               'none',
  skillStyle:                'plain',
  skillBg:                   '#d1fae5',
  skillColor:                '#065f46',
  bulletStyle:               'disc',
  // Extended options
  cardRadius:                8,
  cardShadow:                true,
  gradientSidebar:           false,
  gradientFrom:              '#10b981',
  gradientTo:                '#0d9488',
  timelineDotSize:           8,
  boxedBorderWidth:          1,
}

const DEFAULT_SECTIONS = [
  { id: 'summary',    label: 'Professional Summary', visible: true, order: 0, inSidebar: false, style: {} },
  { id: 'experience', label: 'Work Experience',      visible: true, order: 1, inSidebar: false, style: {} },
  { id: 'education',  label: 'Education',            visible: true, order: 2, inSidebar: false, style: {} },
  { id: 'projects',   label: 'Projects',             visible: true, order: 3, inSidebar: false, style: {} },
  { id: 'skills',     label: 'Skills',               visible: true, order: 4, inSidebar: false, style: {} },
]

const FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Playfair Display', 'Merriweather', 'Source Sans Pro',
  'Raleway', 'Nunito', 'Poppins', 'Georgia', 'Times New Roman',
  'Arial', 'Helvetica', 'Verdana', 'DM Sans', 'Sora', 'Cabinet Grotesk',
]

const FIELD_TYPES = [
  { value: 'text',     label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'url',      label: 'URL / Link' },
  { value: 'date',     label: 'Date' },
  { value: 'select',   label: 'Dropdown' },
]

const TABS = [
  { id: 'layout',     label: 'Layout',     icon: LayoutIcon },
  { id: 'colors',     label: 'Colors',     icon: PaletteIcon },
  { id: 'typography', label: 'Typography', icon: TypeIcon },
  { id: 'spacing',    label: 'Spacing',    icon: SlidersIcon },
  { id: 'sections',   label: 'Sections',   icon: ListIcon },
]

// ── Reusable controls ─────────────────────────────────────────
const Label = ({ children }) => (
  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{children}</p>
)

const Row = ({ children }) => (
  <div className="py-2 border-b border-slate-100 last:border-0">{children}</div>
)

const ColorRow = ({ label, value, onChange }) => (
  <Row>
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <div className="flex items-center gap-1.5">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
          className="size-6 rounded cursor-pointer border border-slate-200" />
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
          className="w-[72px] px-1.5 py-0.5 text-[11px] bg-slate-50 border border-slate-200 rounded font-mono outline-none" />
      </div>
    </div>
  </Row>
)

const SliderRow = ({ label, value, onChange, min = 0, max = 100, step = 1, unit = 'px' }) => (
  <Row>
    <div className="flex justify-between items-center mb-1">
      <Label>{label}</Label>
      <span className="text-[11px] font-bold text-emerald-600">{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-emerald-600 h-1" />
  </Row>
)

const SelectRow = ({ label, value, onChange, options }) => (
  <Row>
    <Label>{label}</Label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-emerald-500 cursor-pointer mt-1">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </Row>
)

const ToggleRow = ({ label, value, onChange }) => (
  <Row>
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <button type="button" onClick={() => onChange(!value)} style={{
        position: 'relative', width: 36, height: 20, borderRadius: 999,
        backgroundColor: value ? '#10b981' : '#cbd5e1',
        border: 'none', cursor: 'pointer', transition: 'background-color 0.2s', flexShrink: 0, padding: 0,
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 'auto' : 2, right: value ? 2 : 'auto',
          width: 16, height: 16, borderRadius: '50%', backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s, right 0.2s', display: 'block',
        }} />
      </button>
    </div>
  </Row>
)

// ── Sidebar chip ──────────────────────────────────────────────
const SidebarChip = ({ active, onClick }) => (
  <button type="button" onClick={onClick}
    title={active ? 'In sidebar — click to move to main' : 'In main — click to move to sidebar'}
    style={{
      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999,
      border: `1px solid ${active ? '#8b5cf6' : '#e2e8f0'}`,
      backgroundColor: active ? '#ede9fe' : '#f8fafc',
      color: active ? '#7c3aed' : '#94a3b8',
      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', lineHeight: 1.4,
    }}
  >
    {active ? 'SIDEBAR' : 'MAIN'}
  </button>
)

// ── Layout Picker ─────────────────────────────────────────────
const LayoutPicker = ({ value, onChange }) => {
  return (
    <Row>
      <Label>Layout Type</Label>
      <div className="mt-2 space-y-3">
        {LAYOUT_GROUPS.map((group) => {
          const groupLayouts = LAYOUT_OPTIONS.filter((l) => l.group === group)
          return (
            <div key={group}>
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">{group}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {groupLayouts.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
                    className={`text-left px-2.5 py-2 rounded-lg border text-[10px] transition-all ${
                      value === opt.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="font-bold leading-tight">{opt.label}</div>
                    <div className={`text-[9px] mt-0.5 leading-tight ${value === opt.value ? 'text-emerald-600' : 'text-slate-400'}`}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Row>
  )
}

// ── Field Builder ─────────────────────────────────────────────
const FieldBuilder = ({ field, index, total, onChange, onDelete, onMove }) => {
  const [open, setOpen] = useState(index === 0)

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 cursor-pointer select-none" onClick={() => setOpen((v) => !v)}>
        <GripVerticalIcon className="size-3.5 text-slate-300 shrink-0" />
        <span className="flex-1 text-xs font-semibold text-slate-700 truncate">
          {field.label || <span className="text-slate-400 font-normal italic">Unnamed field</span>}
        </span>
        <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded uppercase">{field.fieldType}</span>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={(e) => { e.stopPropagation(); onMove(index, -1) }} disabled={index === 0}
            className="p-0.5 text-slate-300 hover:text-slate-500 disabled:opacity-30 rounded">
            <ChevronUpIcon className="size-3" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMove(index, 1) }} disabled={index === total - 1}
            className="p-0.5 text-slate-300 hover:text-slate-500 disabled:opacity-30 rounded">
            <ChevronDownIcon className="size-3" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(index) }}
            className="p-0.5 text-slate-300 hover:text-rose-500 rounded ml-0.5">
            <TrashIcon className="size-3" />
          </button>
        </div>
        {open ? <ChevronUpIcon className="size-3.5 text-slate-400 shrink-0" /> : <ChevronDownIcon className="size-3.5 text-slate-400 shrink-0" />}
      </div>

      {open && (
        <div className="p-3 space-y-2.5 border-t border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Label <span className="text-rose-400">*</span></p>
            <input type="text" value={field.label} onChange={(e) => onChange(index, 'label', e.target.value)}
              placeholder="e.g. Institution, Description, URL..."
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Field Type</p>
            <select value={field.fieldType} onChange={(e) => onChange(index, 'fieldType', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 cursor-pointer">
              {FIELD_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
            </select>
          </div>
          {field.fieldType === 'select' && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Options <span className="text-slate-300">(one per line)</span></p>
              <textarea
                value={(field.options || []).join('\n')}
                onChange={(e) => onChange(index, 'options', e.target.value.split('\n').filter((l) => l.trim()))}
                placeholder={"Option 1\nOption 2\nOption 3"} rows={3}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 resize-none" />
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Placeholder</p>
            <input type="text" value={field.placeholder} onChange={(e) => onChange(index, 'placeholder', e.target.value)}
              placeholder="Hint text shown inside the input..."
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Preview Value <span className="text-slate-300">(shown in preview)</span></p>
            <input type="text" value={field.dummyData} onChange={(e) => onChange(index, 'dummyData', e.target.value)}
              placeholder="Sample value for live preview..."
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required</p>
            <button type="button" onClick={() => onChange(index, 'required', !field.required)} style={{
              position: 'relative', width: 32, height: 18, borderRadius: 999,
              backgroundColor: field.required ? '#10b981' : '#cbd5e1', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
            }}>
              <span style={{
                position: 'absolute', top: 2, left: field.required ? 'auto' : 2, right: field.required ? 2 : 'auto',
                width: 14, height: 14, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.2)', display: 'block',
              }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dynamic Section Builder Modal ────────────────────────────
const DynamicSectionBuilder = ({ onAdd, onClose }) => {
  const [sectionName, setSectionName] = useState('')
  const [fields, setFields] = useState([])

  const makeField = () => ({
    fieldKey: `field_${Date.now()}`, label: '', fieldType: 'text',
    placeholder: '', dummyData: '', options: [], required: false,
  })

  const addField = () => setFields((prev) => [...prev, makeField()])

  const updateField = (idx, key, value) => {
    setFields((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [key]: value }
      if (key === 'label') {
        next[idx].fieldKey = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `field_${idx}`
      }
      return next
    })
  }

  const deleteField = (idx) => setFields((prev) => prev.filter((_, i) => i !== idx))

  const moveField = (idx, dir) => {
    const next = idx + dir
    if (next < 0 || next >= fields.length) return
    setFields((prev) => {
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }

  const handleAdd = () => {
    if (!sectionName.trim()) return toast.error('Section name is required')
    if (fields.some((f) => !f.label.trim())) return toast.error('All fields need a label')
    onAdd({
      id: `custom_${Date.now()}`,
      label: sectionName.trim(),
      visible: true, order: 999, inSidebar: false, style: {},
      isCustom: true, fieldDefs: fields, customContent: '',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="h-[3px] w-full bg-gradient-to-r from-emerald-400 to-violet-500 shrink-0" />
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
          <div>
            <p className="font-bold text-slate-800 text-sm">Add Custom Section</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Define the fields users will fill in for this section</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><XIcon className="size-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Section Name <span className="text-rose-400">*</span></p>
            <input type="text" value={sectionName} onChange={(e) => setSectionName(e.target.value)}
              placeholder="e.g. Certifications, Awards, Languages, Volunteer..." autoFocus
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
          </div>

          {fields.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fields ({fields.length})</p>
              {fields.map((field, idx) => (
                <FieldBuilder key={field.fieldKey} field={field} index={idx} total={fields.length}
                  onChange={updateField} onDelete={deleteField} onMove={moveField} />
              ))}
            </div>
          )}

          {fields.length === 0 && (
            <div className="border-2 border-dashed border-slate-200 rounded-xl py-6 text-center">
              <p className="text-xs text-slate-400">No fields yet.</p>
              <p className="text-[10px] text-slate-300 mt-0.5">Add fields to define what users fill in.</p>
            </div>
          )}

          <button type="button" onClick={addField}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-300 rounded-xl transition-colors">
            <PlusIcon className="size-3.5" /> Add Field
          </button>
        </div>

        <div className="px-4 py-3 border-t border-slate-100 flex justify-between items-center shrink-0 bg-slate-50">
          <p className="text-[10px] text-slate-400">
            {fields.length === 0 ? 'Add at least one field, or save for freetext' : `${fields.length} field${fields.length > 1 ? 's' : ''} defined`}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleAdd} className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-200 transition-colors">Add Section</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// MAIN BUILDER
// ═════════════════════════════════════════════════════════════
const AdminTemplateBuilder = () => {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = !!id

  const [name,        setName]        = useState('Untitled Template')
  const [description, setDescription] = useState('')
  const [category,    setCategory]    = useState('professional')
  const [gs,          setGs]          = useState(DEFAULT_STYLE)
  const [sections,    setSections]    = useState(DEFAULT_SECTIONS)
  const [activeTab,   setActiveTab]   = useState('layout')
  const [saving,      setSaving]      = useState(false)
  const [loading,     setLoading]     = useState(isEdit)
  const [dragIndex,   setDragIndex]   = useState(null)
  const [addSection,  setAddSection]  = useState(false)
  const [mobileView,  setMobileView]  = useState('form')

  const previewRef = useRef(null)
  const [scale, setScale] = useState(1)

  const isTwoCol        = gs.layout === 'two-col-left' || gs.layout === 'two-col-right'
  const isModernSidebar = gs.layout === 'modern-sidebar'
  const hasSidebar      = isTwoCol || isModernSidebar
  const isCardOrBoxed   = gs.layout === 'card' || gs.layout === 'boxed'
  const isTimeline      = gs.layout === 'timeline'
  const isGradientCap   = isModernSidebar

  useEffect(() => {
    const update = () => {
      if (!previewRef.current || previewRef.current.clientWidth === 0) return
      const panelW = previewRef.current.clientWidth - 48
      const panelH = previewRef.current.clientHeight - 80
      const scaleW = panelW / A4_WIDTH
      const scaleH = panelH / A4_HEIGHT
      setScale(Math.min(scaleW, scaleH, 1))
    }
    const timeoutId = setTimeout(update, 50)
    window.addEventListener('resize', update)
    return () => { clearTimeout(timeoutId); window.removeEventListener('resize', update) }
  }, [mobileView])

  // Load template for editing
  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const { data } = await adminApi.get(`/api/admin/templates/${id}`)
        const t = data.template
        setName(t.name)
        setDescription(t.description || '')
        setCategory(t.category)
        setGs({ ...DEFAULT_STYLE, ...(t.globalStyle || {}) })
        setSections(t.sections?.length ? t.sections.map((s) => ({ inSidebar: false, ...s })) : DEFAULT_SECTIONS)
      } catch {
        toast.error('Failed to load template')
        navigate('/admin/templates')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const updateGs = useCallback((key, value) => {
    setGs((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Drag reorder
  const handleDragStart = (idx) => setDragIndex(idx)
  const handleDragOver  = (e, idx) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === idx) return
    setSections((prev) => {
      const arr = [...prev]
      const [moved] = arr.splice(dragIndex, 1)
      arr.splice(idx, 0, moved)
      return arr.map((s, i) => ({ ...s, order: i }))
    })
    setDragIndex(idx)
  }
  const handleDragEnd = () => setDragIndex(null)

  const toggleSection   = (idx) => setSections((prev) => prev.map((s, i) => i === idx ? { ...s, visible: !s.visible } : s))
  const toggleSidebar   = (idx) => setSections((prev) => prev.map((s, i) => i === idx ? { ...s, inSidebar: !s.inSidebar } : s))
  const removeSection   = (idx) => setSections((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })))
  const handleAddSection = (section) => setSections((prev) => [...prev, { ...section, order: prev.length }])

  // Save
  const handleSave = async (publish = false) => {
    if (!name.trim()) return toast.error('Template name required')
    setSaving(true)
    try {
      const payload = {
        name, description, category,
        globalStyle: gs,
        sections: sections.map((s, i) => ({ ...s, order: i })),
        ...(publish ? { isPublished: true } : {}),
      }
      if (isEdit) {
        await adminApi.put(`/api/admin/templates/${id}`, payload)
        if (publish) await adminApi.patch(`/api/admin/templates/${id}/publish`)
        toast.success(publish ? 'Saved & published!' : 'Template saved')
      } else {
        const { data } = await adminApi.post('/api/admin/templates', payload)
        const newId = data.template._id
        if (publish) await adminApi.patch(`/api/admin/templates/${newId}/publish`)
        toast.success(publish ? 'Created & published!' : 'Template created')
        navigate(`/admin/templates/${newId}/edit`, { replace: true })
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-slate-100 flex-col lg:flex-row">

      {addSection && (
        <DynamicSectionBuilder onAdd={handleAddSection} onClose={() => setAddSection(false)} />
      )}

      {/* ── LEFT: Controls ─────────────────────────────── */}
      <div className={`w-full lg:w-80 shrink-0 flex-col bg-white border-r border-slate-200 overflow-hidden shadow-md z-10 ${mobileView === 'preview' ? 'hidden lg:flex' : 'flex'}`}>

        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 bg-slate-50">
          <button onClick={() => navigate('/admin/templates')}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors shrink-0">
            <ArrowLeftIcon className="size-4" />
          </button>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="flex-1 text-sm font-bold text-slate-800 bg-transparent outline-none border-b-2 border-transparent focus:border-emerald-500 transition-colors py-0.5 min-w-0"
            placeholder="Template name..." />
          <button onClick={() => setMobileView('preview')}
            className="lg:hidden shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">
            <EyeIcon className="size-3.5" /> Preview
          </button>
        </div>

        {/* Meta */}
        <div className="px-3 py-2 border-b border-slate-100 flex gap-2">
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Description..."
            className="flex-1 px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 min-w-0" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-24 px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer shrink-0">
            {['professional', 'modern', 'minimal', 'creative', 'classic'].map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto scrollbar-none">
          {TABS.map(({ id: tid, label, icon: Icon }) => (
            <button key={tid} onClick={() => setActiveTab(tid)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[9px] font-bold transition-colors shrink-0 border-b-2 flex-1 ${
                activeTab === tid ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="size-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-3 py-1">

          {/* LAYOUT TAB */}
          {activeTab === 'layout' && (
            <>
              <LayoutPicker value={gs.layout} onChange={(v) => updateGs('layout', v)} />

              {hasSidebar && (
                <SliderRow label="Sidebar Width" value={gs.sidebarWidth}
                  onChange={(v) => updateGs('sidebarWidth', v)} min={20} max={45} unit="%" />
              )}

              {isGradientCap && (
                <>
                  <ToggleRow label="Gradient Sidebar" value={gs.gradientSidebar} onChange={(v) => updateGs('gradientSidebar', v)} />
                  {gs.gradientSidebar && (
                    <>
                      <ColorRow label="Gradient From" value={gs.gradientFrom || gs.accentColor} onChange={(v) => updateGs('gradientFrom', v)} />
                      <ColorRow label="Gradient To"   value={gs.gradientTo   || gs.accentColor} onChange={(v) => updateGs('gradientTo', v)} />
                    </>
                  )}
                </>
              )}

              {isCardOrBoxed && (
                <>
                  <SliderRow label="Card Corner Radius" value={gs.cardRadius || 8} onChange={(v) => updateGs('cardRadius', v)} min={0} max={24} />
                  <ToggleRow label="Card Shadow" value={gs.cardShadow !== false} onChange={(v) => updateGs('cardShadow', v)} />
                  {gs.layout === 'boxed' && (
                    <SliderRow label="Box Border Width" value={gs.boxedBorderWidth || 1} onChange={(v) => updateGs('boxedBorderWidth', v)} min={1} max={4} />
                  )}
                </>
              )}

              {isTimeline && (
                <SliderRow label="Timeline Dot Size" value={gs.timelineDotSize || 8} onChange={(v) => updateGs('timelineDotSize', v)} min={4} max={16} />
              )}

              <ToggleRow label="Show Profile Photo" value={gs.showPhoto} onChange={(v) => updateGs('showPhoto', v)} />
              {gs.showPhoto && (
                <>
                  <SelectRow label="Photo Shape" value={gs.photoShape} onChange={(v) => updateGs('photoShape', v)}
                    options={[{ value: 'circle', label: '⬤ Circle' }, { value: 'square', label: '■ Square' }, { value: 'rounded', label: '▢ Rounded' }]} />
                  <SelectRow label="Photo Position" value={gs.photoPosition} onChange={(v) => updateGs('photoPosition', v)}
                    options={[
                      { value: 'top-left',   label: 'Top Left' },
                      { value: 'top-right',  label: 'Top Right' },
                      { value: 'top-center', label: 'Top Center' },
                      { value: 'sidebar',    label: 'In Sidebar' },
                    ]} />
                </>
              )}

              <SelectRow label="Header Style" value={gs.headerStyle} onChange={(v) => updateGs('headerStyle', v)}
                options={[
                  { value: 'none',          label: 'None' },
                  { value: 'full-color',    label: 'Full Color Header' },
                  { value: 'left-accent',   label: 'Left Accent Bar' },
                  { value: 'bottom-border', label: 'Bottom Border' },
                ]} />

              <SelectRow label="Skill Style" value={gs.skillStyle} onChange={(v) => updateGs('skillStyle', v)}
                options={[
                  { value: 'plain', label: 'Plain Text (x · y · z)' },
                  { value: 'badge', label: 'Badge' },
                  { value: 'pill',  label: 'Pill' },
                  { value: 'dot',   label: 'Dot List' },
                  { value: 'bar',   label: 'Progress Bar' },
                  { value: 'grid',  label: '2-Column Grid' },
                ]} />

              <SelectRow label="Bullet Style" value={gs.bulletStyle} onChange={(v) => updateGs('bulletStyle', v)}
                options={[
                  { value: 'disc',  label: '• Disc' },
                  { value: 'dash',  label: '— Dash' },
                  { value: 'arrow', label: '→ Arrow' },
                  { value: 'none',  label: 'None' },
                ]} />

              <ToggleRow label="Show Section Dividers" value={gs.showDividers} onChange={(v) => updateGs('showDividers', v)} />
              {gs.showDividers && (
                <SelectRow label="Divider Style" value={gs.dividerStyle} onChange={(v) => updateGs('dividerStyle', v)}
                  options={[
                    { value: 'solid',  label: 'Solid' },
                    { value: 'dashed', label: 'Dashed' },
                    { value: 'dotted', label: 'Dotted' },
                  ]} />
              )}
            </>
          )}

          {/* COLORS TAB */}
          {activeTab === 'colors' && (
            <>
              <Row>
                <Label>Quick Accent</Label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#ec4899','#06b6d4','#6366f1','#14b8a6','#f97316','#64748b','#1e293b'].map((c) => (
                    <button key={c} onClick={() => { updateGs('accentColor', c); updateGs('sectionTitleColor', c); updateGs('headerBg', c) }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${gs.accentColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </Row>
              <ColorRow label="Accent Color"       value={gs.accentColor}       onChange={(v) => updateGs('accentColor', v)} />
              <ColorRow label="Background"         value={gs.backgroundColor}   onChange={(v) => updateGs('backgroundColor', v)} />
              <ColorRow label="Sidebar Background" value={gs.sidebarBg}         onChange={(v) => updateGs('sidebarBg', v)} />
              <ColorRow label="Header Background"  value={gs.headerBg}          onChange={(v) => updateGs('headerBg', v)} />
              <ColorRow label="Header Text"        value={gs.headerTextColor}   onChange={(v) => updateGs('headerTextColor', v)} />
              <ColorRow label="Section Titles"     value={gs.sectionTitleColor} onChange={(v) => updateGs('sectionTitleColor', v)} />
              <ColorRow label="Body Text"          value={gs.bodyTextColor}     onChange={(v) => updateGs('bodyTextColor', v)} />
              <ColorRow label="Muted Text"         value={gs.mutedTextColor}    onChange={(v) => updateGs('mutedTextColor', v)} />
              <ColorRow label="Borders / Dividers" value={gs.borderColor}       onChange={(v) => updateGs('borderColor', v)} />
              {(gs.skillStyle === 'badge' || gs.skillStyle === 'pill' || gs.skillStyle === 'grid') && (
                <>
                  <ColorRow label="Skill Background" value={gs.skillBg}    onChange={(v) => updateGs('skillBg', v)} />
                  <ColorRow label="Skill Text"       value={gs.skillColor} onChange={(v) => updateGs('skillColor', v)} />
                </>
              )}
            </>
          )}

          {/* TYPOGRAPHY TAB */}
          {activeTab === 'typography' && (
            <>
              <SelectRow label="Font Family" value={gs.fontFamily} onChange={(v) => updateGs('fontFamily', v)}
                options={FONTS.map((f) => ({ value: f, label: f }))} />
              <SliderRow label="Base Font Size"     value={gs.baseFontSize}              onChange={(v) => updateGs('baseFontSize', v)}              min={10} max={18} />
              <SliderRow label="Name Size"          value={gs.nameSize}                  onChange={(v) => updateGs('nameSize', v)}                  min={20} max={56} />
              <ToggleRow label="Name Bold"          value={gs.nameBold}                  onChange={(v) => updateGs('nameBold', v)} />
              <SliderRow label="Section Title Size" value={gs.sectionTitleSize}          onChange={(v) => updateGs('sectionTitleSize', v)}          min={10} max={20} />
              <ToggleRow label="Section Title Bold" value={gs.sectionTitleBold}          onChange={(v) => updateGs('sectionTitleBold', v)} />
              <ToggleRow label="Title Uppercase"    value={gs.sectionTitleUppercase}     onChange={(v) => updateGs('sectionTitleUppercase', v)} />
              <SliderRow label="Title Spacing"      value={gs.sectionTitleLetterSpacing} onChange={(v) => updateGs('sectionTitleLetterSpacing', v)} min={0} max={8} unit="px" />
            </>
          )}

          {/* SPACING TAB */}
          {activeTab === 'spacing' && (
            <>
              <SliderRow label="Page Padding" value={gs.pagePadding} onChange={(v) => updateGs('pagePadding', v)} min={12} max={64} />
              <SliderRow label="Section Gap"  value={gs.sectionGap}  onChange={(v) => updateGs('sectionGap', v)}  min={8}  max={48} />
              <SliderRow label="Item Gap"     value={gs.itemGap}     onChange={(v) => updateGs('itemGap', v)}     min={4}  max={32} />
            </>
          )}

          {/* SECTIONS TAB */}
          {activeTab === 'sections' && (
            <div className="py-2">
              <p className="text-[10px] text-slate-400 mb-1">Drag to reorder · toggle visibility · assign to sidebar</p>
              {hasSidebar && (
                <p className="text-[10px] text-violet-500 bg-violet-50 border border-violet-100 rounded-lg px-2 py-1 mb-3">
                  Multi-column layout — use SIDEBAR / MAIN chips to assign sections.
                </p>
              )}
              <div className="space-y-1.5">
                {sections.map((section, idx) => (
                  <div key={section.id} draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-2 cursor-grab active:cursor-grabbing transition-all border ${
                      dragIndex === idx ? 'border-emerald-400 bg-emerald-50 opacity-60' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    } ${!section.visible ? 'opacity-40' : ''}`}
                  >
                    <GripVerticalIcon className="size-3.5 text-slate-300 shrink-0" />
                    <span className="flex-1 text-xs font-medium text-slate-700 truncate min-w-0">
                      {section.label}
                      {section.isCustom && (
                        <span className="ml-1.5 text-[9px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full">CUSTOM</span>
                      )}
                      {section.fieldDefs?.length > 0 && (
                        <span className="ml-1 text-[9px] text-slate-400">({section.fieldDefs.length} field{section.fieldDefs.length > 1 ? 's' : ''})</span>
                      )}
                    </span>
                    {hasSidebar && <SidebarChip active={!!section.inSidebar} onClick={() => toggleSidebar(idx)} />}
                    <button onClick={() => toggleSection(idx)}
                      className={`p-1 rounded-lg transition-colors shrink-0 ${section.visible ? 'text-emerald-600 hover:bg-emerald-100' : 'text-slate-300 hover:bg-slate-200'}`}
                    >
                      {section.visible ? <EyeIcon className="size-3" /> : <EyeOffIcon className="size-3" />}
                    </button>
                    {section.isCustom && (
                      <button onClick={() => removeSection(idx)}
                        className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0">
                        <TrashIcon className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={() => setAddSection(true)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-300 rounded-xl transition-colors">
                <PlusIcon className="size-3.5" /> Add Custom Section
              </button>
            </div>
          )}

        </div>

        {/* Save bar */}
        <div className="px-3 py-2.5 border-t border-slate-200 bg-slate-50 flex gap-2 pb-6 lg:pb-2">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors disabled:opacity-50">
            <SaveIcon className="size-3.5" />{saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-300 transition-colors disabled:opacity-50">
            <CheckCircleIcon className="size-3.5" />Publish
          </button>
        </div>
      </div>

      {/* ── RIGHT: Live A4 Preview ─────────────────────── */}
      <div ref={previewRef} className={`flex-1 w-full lg:w-auto overflow-auto bg-slate-300 flex-col ${mobileView === 'form' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Preview header */}
        <div className="sticky top-0 z-10 bg-slate-300/90 backdrop-blur px-4 lg:px-6 py-2 flex items-center justify-between border-b border-slate-400/30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileView('form')}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
              <PencilIcon className="size-3.5" /> Edit
            </button>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:block">Live Preview · A4</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 capitalize font-medium bg-white/50 px-2 py-0.5 rounded-full">{gs.layout}</span>
            <span className="text-[10px] text-slate-400">{A4_WIDTH}×{A4_HEIGHT}px · {Math.round(scale * 100)}%</span>
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Scaled A4 page */}
        <div className="flex-1 flex items-start justify-center py-8 px-4 lg:px-6">
          <div style={{ width: A4_WIDTH * scale, height: A4_HEIGHT * scale, position: 'relative', flexShrink: 0 }}>
            <div style={{
              transform: `scale(${scale})`, transformOrigin: 'top left',
              width: A4_WIDTH, height: A4_HEIGHT, overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.20)',
            }}>
              <DynamicResumeRenderer globalStyle={gs} sections={sections} data={PREVIEW_DATA} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminTemplateBuilder