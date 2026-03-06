import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  CheckIcon,
  LayoutTemplateIcon,
  ListIcon,
  PaletteIcon,
  SearchIcon,
  GripVerticalIcon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  Trash2Icon,
  TypeIcon,
  SlidersHorizontalIcon,
  PencilIcon,
} from 'lucide-react'
import DynamicResumeRenderer from '../components/admin/DynamicResumeRenderer'

// ─────────────────────────────────────────────────────────────
const RESUME_RENDER_WIDTH  = 794
const RESUME_RENDER_HEIGHT = 1123

const FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Playfair Display', 'Merriweather', 'Raleway', 'Nunito',
  'Poppins', 'Georgia', 'Times New Roman', 'Arial',
]

const COLOR_PRESETS = [
  '#10b981','#3b82f6','#8b5cf6','#f59e0b',
  '#ef4444','#ec4899','#06b6d4','#6366f1',
  '#14b8a6','#f97316','#64748b','#1e293b',
]

const DEFAULT_GLOBAL_STYLE = {
  layout: 'single', showPhoto: false, photoShape: 'circle',
  photoPosition: 'top-left', sidebarWidth: 30,
  accentColor: '#10b981', backgroundColor: '#ffffff',
  sidebarBg: '#f1f5f9', headerBg: '#10b981',
  headerTextColor: '#ffffff', sectionTitleColor: '#10b981',
  bodyTextColor: '#334155', mutedTextColor: '#64748b',
  borderColor: '#e2e8f0', fontFamily: 'Inter',
  baseFontSize: 14, nameSize: 32, nameBold: true,
  sectionTitleSize: 13, sectionTitleBold: true,
  sectionTitleUppercase: true, sectionTitleLetterSpacing: 2,
  pagePadding: 32, sectionGap: 24, itemGap: 12,
  showDividers: true, dividerStyle: 'solid', headerStyle: 'none',
  skillStyle: 'plain', skillBg: '#d1fae5', skillColor: '#065f46',
  bulletStyle: 'disc',
  timelineColor: '#10b981', cardRadius: 8, cardShadow: true,
  gradientSidebar: false, gradientFrom: '#10b981', gradientTo: '#0d9488',
  timelineDotSize: 8, boxedBorderWidth: 1,
}

const DEFAULT_SECTIONS = [
  { id: 'summary',    label: 'Professional Summary', visible: true, order: 0 },
  { id: 'experience', label: 'Work Experience',      visible: true, order: 1 },
  { id: 'education',  label: 'Education',            visible: true, order: 2 },
  { id: 'projects',   label: 'Projects',             visible: true, order: 3 },
  { id: 'skills',     label: 'Skills',               visible: true, order: 4 },
]

const TABS = [
  { id: 'templates',  label: 'Templates',  icon: LayoutTemplateIcon   },
  { id: 'sections',   label: 'Sections',   icon: ListIcon             },
  { id: 'colors',     label: 'Colors',     icon: PaletteIcon          },
  { id: 'typography', label: 'Typography', icon: TypeIcon             },
  { id: 'spacing',    label: 'Spacing',    icon: SlidersHorizontalIcon },
]

const CATEGORY_LABELS = {
  all: 'All', professional: 'Professional', modern: 'Modern',
  minimal: 'Minimal', creative: 'Creative', classic: 'Classic',
}

// ── Reusable UI primitives ────────────────────────────────────
const Lbl = ({ children }) => (
  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{children}</p>
)

const Divider = ({ children }) => (
  <div className="py-4 border-b border-gray-100 last:border-0">{children}</div>
)

const SliderRow = ({ label, value, onChange, min = 0, max = 100, unit = 'px' }) => (
  <Divider>
    <div className="flex justify-between items-center mb-2">
      <Lbl>{label}</Lbl>
      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-emerald-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
    />
  </Divider>
)

const ColorRow = ({ label, value, onChange }) => (
  <Divider>
    <div className="flex items-center justify-between gap-4">
      <Lbl>{label}</Lbl>
      <div className="flex items-center gap-2 shrink-0 bg-gray-50 p-1 rounded-lg border border-gray-200">
        <input type="color" value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 shrink-0 bg-transparent"
        />
        <input type="text" value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-[72px] px-1 py-1 text-[11px] bg-transparent font-mono font-medium text-gray-700 outline-none uppercase"
        />
      </div>
    </div>
  </Divider>
)

// ── Scaled resume thumbnail ───────────────────────────────────
const ResumeThumb = ({ globalStyle, sections, data }) => {
  const wrapRef = useRef(null)
  const [scale, setScale]   = useState(0.38)
  const [height, setHeight] = useState(280)

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width
      if (w > 0) {
        setScale(w / RESUME_RENDER_WIDTH)
        setHeight(w * (RESUME_RENDER_HEIGHT / RESUME_RENDER_WIDTH))
      }
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height, overflow: 'hidden', background: globalStyle?.backgroundColor || '#fff' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: RESUME_RENDER_WIDTH, height: RESUME_RENDER_HEIGHT,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        pointerEvents: 'none',
      }}>
        <DynamicResumeRenderer globalStyle={globalStyle} sections={sections} data={data} />
      </div>
    </div>
  )
}

// ── Scaled Live Preview ───────────────────────────────────────
const ScaledLivePreview = ({ globalStyle, sections, data }) => {
  const wrapRef  = useRef(null)
  const innerRef = useRef(null)

  useEffect(() => {
    const apply = () => {
      if (!wrapRef.current || !innerRef.current) return
      const w = wrapRef.current.clientWidth
      innerRef.current.style.width = `${RESUME_RENDER_WIDTH}px`
      innerRef.current.style.transformOrigin = 'top left'
      const scale = Math.min(w / RESUME_RENDER_WIDTH, 1)
      innerRef.current.style.transform = `scale(${scale})`
      wrapRef.current.style.height = `${innerRef.current.getBoundingClientRect().height}px`
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wrapRef} className="inline-block overflow-hidden relative">
      <div ref={innerRef}>
        <DynamicResumeRenderer globalStyle={globalStyle} sections={sections} data={data} />
      </div>
    </div>
  )
}

// ── Template card ─────────────────────────────────────────────
const TemplateCard = React.memo(({ template, isSelected, onSelect, resumeData }) => {
  const gs       = { ...DEFAULT_GLOBAL_STYLE, ...(template.globalStyle || {}) }
  const sections = template.sections?.length ? template.sections : DEFAULT_SECTIONS
  const data     = { ...(resumeData || {}), globalStyle: gs, sections }

  return (
    <div
      onClick={() => onSelect(template)}
      className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-emerald-500 shadow-md shadow-emerald-100'
          : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-lg'
      }`}
    >
      <div className="relative bg-gray-50 border-b border-gray-100">
        <ResumeThumb globalStyle={gs} sections={sections} data={data} />
        {isSelected && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
            <CheckIcon className="size-4" />
          </div>
        )}
      </div>
      <div className="px-3 py-2.5 bg-white">
        <p className="text-sm font-bold text-gray-800 truncate leading-snug">{template.name}</p>
        {template.category && (
          <p className="text-[11px] font-medium text-gray-500 capitalize mt-0.5">{template.category}</p>
        )}
      </div>
    </div>
  )
})

// ── User custom section manager ───────────────────────────────
const UserCustomSections = ({ customSections, onChange }) => {
  const [newLabel, setNewLabel] = useState('')

  const addSection = () => {
    const label = newLabel.trim()
    if (!label) { toast.error('Enter a section name'); return }
    const id = `user_${Date.now()}`
    onChange([...customSections, { id, label, isUserCustom: true, content: '' }])
    setNewLabel('')
  }

  const updateContent = (id, content) =>
    onChange(customSections.map((s) => s.id === id ? { ...s, content } : s))

  const removeSection = (id) =>
    onChange(customSections.filter((s) => s.id !== id))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="text" value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSection()}
          placeholder="New Section (e.g. Certifications)"
          className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
        />
        <button
          onClick={addSection}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 rounded-xl transition-colors shrink-0"
        >
          <PlusIcon className="size-4" /> Add
        </button>
      </div>

      {customSections.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <PlusIcon className="size-6 mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-medium text-gray-500">No custom sections</p>
          <p className="text-xs text-gray-400 mt-1">Add a section name above to include it.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {customSections.map((s) => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-bold text-gray-700">{s.label}</span>
                <button
                  onClick={() => removeSection(s.id)}
                  className="text-rose-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
              <textarea
                rows={4} value={s.content || ''}
                onChange={(e) => updateContent(s.id, e.target.value)}
                placeholder={`Enter ${s.label} content...`}
                className="w-full px-4 py-3 text-sm text-gray-700 outline-none resize-none placeholder:text-gray-300 bg-transparent"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// Main TemplateStudio Page
// ═════════════════════════════════════════════════════════════
const TemplateStudio = () => {
  const { resumeId } = useParams()
  const navigate     = useNavigate()
  const { token }    = useSelector((s) => s.auth)

  const [resumeData,         setResumeData]         = useState(null)
  const [templates,          setTemplates]          = useState([])
  const [loading,            setLoading]            = useState(true)
  const [saving,             setSaving]             = useState(false)
  const [activeTab,          setActiveTab]          = useState('templates')
  const [search,             setSearch]             = useState('')
  const [category,           setCategory]           = useState('all')
  const [mobileShowPreview,  setMobileShowPreview]  = useState(false)

  const [selectedTemplate,   setSelectedTemplate]   = useState(null)
  const [workingStyle,       setWorkingStyle]       = useState(DEFAULT_GLOBAL_STYLE)
  const [templateBaseStyle,  setTemplateBaseStyle]  = useState(DEFAULT_GLOBAL_STYLE)
  const [workingSections,    setWorkingSections]    = useState(DEFAULT_SECTIONS)
  const [userCustomSections, setUserCustomSections] = useState([])

  const [dragIndex, setDragIndex] = useState(null)

  // ── Load resume + templates ───────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [resumeRes, templatesRes] = await Promise.all([
          api.get(`/api/resumes/get/${resumeId}`, { headers: { Authorization: token } }),
          api.get('/api/admin/templates/published'),
        ])
        const resume = resumeRes.data.resume
        const tmpls  = templatesRes.data.templates || []

        setResumeData(resume)
        setTemplates(tmpls)

        const base     = resume.globalStyle || DEFAULT_GLOBAL_STYLE
        const overrides = resume.userStyling || {}
        const merged   = { ...DEFAULT_GLOBAL_STYLE, ...base, ...overrides }
        setWorkingStyle(merged)
        setTemplateBaseStyle(base)
        setWorkingSections(resume.sections?.length ? resume.sections : DEFAULT_SECTIONS)
        // ── FIX Problem 2b: Load existing userCustomSections from resume ──
        setUserCustomSections(resume.userCustomSections || [])
      } catch {
        toast.error('Failed to load data')
        navigate(`/app/builder/${resumeId}`)
      } finally {
        setLoading(false)
      }
    }
    if (resumeId && token) load()
  }, [resumeId, token])

  // ── FIX Problem 1: Template selection no longer accumulates sections ──
  // When a new template is selected, we REPLACE the template sections
  // completely and only preserve the user's own custom sections
  // (isUserCustom: true from userCustomSections, NOT admin isCustom sections
  //  which belong to the template itself)
  const handleSelectTemplate = useCallback((template) => {
    setSelectedTemplate(template)

    // Fresh template base style — no merging with previous template
    const base = { ...DEFAULT_GLOBAL_STYLE, ...(template.globalStyle || {}) }
    setWorkingStyle(base)
    setTemplateBaseStyle(base)

    // Use only the new template's sections — no accumulation from previous templates
    const freshTemplateSections = (template.sections?.length ? template.sections : DEFAULT_SECTIONS)
      .map((s, i) => ({ ...s, order: i }))

    setWorkingSections(freshTemplateSections)
    // Note: userCustomSections stay intact (those are user-added freetext sections)
  }, [])

  const updateStyle = useCallback((key, value) => {
    setWorkingStyle((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetToTemplate = () => {
    setWorkingStyle({ ...templateBaseStyle })
    toast.success('Reset to template defaults')
  }

  // ── Drag reorder ──────────────────────────────────────────
  const handleDragStart = (idx) => setDragIndex(idx)
  const handleDragOver  = (e, idx) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === idx) return
    setWorkingSections((prev) => {
      const arr = [...prev]
      const [moved] = arr.splice(dragIndex, 1)
      arr.splice(idx, 0, moved)
      return arr.map((s, i) => ({ ...s, order: i }))
    })
    setDragIndex(idx)
  }
  const handleDragEnd = () => setDragIndex(null)

  const toggleSection = (idx) =>
    setWorkingSections((prev) => prev.map((s, i) => i === idx ? { ...s, visible: !s.visible } : s))

  // ── FIX Problem 2b: Save persists userCustomSections ─────
  const handleSave = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('resumeId', resumeId)
      fd.append('resumeData', JSON.stringify({
        globalStyle:        workingStyle,
        userStyling:        {},
        sections:           workingSections.map((s, i) => ({ ...s, order: i })),
        userCustomSections: userCustomSections,  // ← Always included
      }))
      await api.put('/api/resumes/update', fd, { headers: { Authorization: token } })
      toast.success('Saved successfully!')
      navigate(`/app/builder/${resumeId}`)
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const filtered = templates.filter((t) => {
    const matchCat = category === 'all' || t.category === category
    const q = search.toLowerCase()
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
    return matchCat && matchSearch
  })
  const categories = ['all', ...new Set(templates.map((t) => t.category))]

  const liveData = resumeData ? {
    ...resumeData,
    globalStyle: workingStyle,
    sections: workingSections,
    userCustomSections,   // ← Always pass to renderer
  } : null

  // ── Get layout-specific options ───────────────────────────
  const isTwoColOrModernSidebar = ['two-col-left', 'two-col-right', 'modern-sidebar'].includes(workingStyle.layout)
  const isGradientCapable       = workingStyle.layout === 'modern-sidebar'

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Initializing Studio...</p>
      </div>
    </div>
  )

  return (
    <div className='min-h-screen font-sans pb-28 text-slate-900' style={{ backgroundColor: '#F4F6F3', backgroundImage: `linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)`, backgroundSize: '32px 32px' }}>

      {/* ── TOP BAR ──────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/app/builder/${resumeId}`)}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeftIcon className="size-3.5" />
              <span className="hidden sm:inline">Back to Builder</span>
            </button>
            <span className="hidden sm:block text-gray-200">|</span>
            <h1 className="text-sm font-bold text-gray-700 truncate max-w-[160px] sm:max-w-xs">Template Studio</h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setMobileShowPreview((v) => !v)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors"
            >
              {!mobileShowPreview ? <><EyeIcon className="size-3.5" /> Preview</> : <><PencilIcon className="size-3.5" /> Edit</>}
            </button>
            <button
              onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {saving ? (
                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span className="hidden sm:inline">Saving...</span></>
              ) : (
                <><CheckIcon className="size-3.5" /><span className="hidden sm:inline">Save Changes</span></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT — Editor panel */}
          <div className={`lg:w-[460px] lg:shrink-0 ${mobileShowPreview ? "hidden lg:block" : "block"}`}>
            <div className="relative bg-white rounded-2xl mt-8 border border-gray-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 w-full" />

              {/* Section tabs */}
              <div className="flex overflow-x-auto scrollbar-none border-b border-gray-100 px-2 pt-2 gap-0.5">
                {TABS.map(({ id, label, icon: Icon }) => {
                  const active = activeTab === id
                  return (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                        active ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="size-3 shrink-0" />{label}
                    </button>
                  )
                })}
              </div>

              {/* Scrollable form area */}
              <div className="px-5 py-4 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">

                {/* ── TEMPLATES TAB ── */}
                {activeTab === 'templates' && (
                  <div className="flex flex-col gap-5">
                    <div className="relative">
                      <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                      />
                    </div>
                    {categories.length > 1 && (
                      <div className="flex gap-2 flex-wrap">
                        {categories.map((c) => (
                          <button key={c} onClick={() => setCategory(c)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${category === c ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            {CATEGORY_LABELS[c] || c}
                          </button>
                        ))}
                      </div>
                    )}
                    {filtered.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <LayoutTemplateIcon className="size-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No matching templates found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 pb-4">
                        {filtered.map((t) => (
                          <TemplateCard
                            key={t._id} template={t}
                            isSelected={selectedTemplate?._id === t._id}
                            onSelect={handleSelectTemplate}
                            resumeData={resumeData}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── SECTIONS TAB ── */}
                {activeTab === 'sections' && (
                  <div className="space-y-6 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">Section Order</h3>
                      <p className="text-xs text-gray-500 mb-4 mt-1">Drag sections to rearrange your resume layout.</p>
                      <div className="space-y-2.5">
                        {workingSections.map((section, idx) => (
                          <div
                            key={section.id} draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            className={`group flex items-center gap-3 rounded-xl px-4 py-3 border cursor-grab active:cursor-grabbing transition-all ${
                              dragIndex === idx ? 'border-emerald-500 bg-emerald-50 opacity-80 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'
                            } ${!section.visible ? 'opacity-50 grayscale bg-gray-50' : ''}`}
                          >
                            <GripVerticalIcon className="size-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
                            <span className="flex-1 text-sm font-bold text-gray-700 truncate">
                              {section.label}
                              {section.isCustom && (
                                <span className="ml-2 text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md uppercase tracking-wide">Custom</span>
                              )}
                            </span>
                            <button onClick={() => toggleSection(idx)}
                              className={`p-1.5 rounded-lg transition-colors ${section.visible ? 'text-emerald-600 hover:bg-emerald-100' : 'text-gray-400 hover:bg-gray-200'}`}
                            >
                              {section.visible ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── FIX Problem 2b: User custom sections properly wired ── */}
                    <div className="pt-6 border-t border-gray-100">
                      <h3 className="text-sm font-bold text-gray-800 mb-1">Add Custom Section</h3>
                      <p className="text-xs text-gray-500 mb-4">Add freetext sections (certifications, awards, etc.)</p>
                      <UserCustomSections
                        customSections={userCustomSections}
                        onChange={setUserCustomSections}
                      />
                    </div>
                  </div>
                )}

                {/* ── COLORS TAB ── */}
                {activeTab === 'colors' && (
                  <div className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">Color Palette</h3>
                        <p className="text-xs text-gray-500 mt-1">Configure global resume colors.</p>
                      </div>
                      <button onClick={resetToTemplate}
                        className="text-xs font-bold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Reset Defaults
                      </button>
                    </div>

                    <Divider>
                      <Lbl>Quick Accent Pick</Lbl>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {COLOR_PRESETS.map((c) => (
                          <button key={c}
                            onClick={() => { updateStyle('accentColor', c); updateStyle('sectionTitleColor', c); updateStyle('headerBg', c) }}
                            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${workingStyle.accentColor === c ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent'}`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </Divider>

                    <ColorRow label="Accent Color"       value={workingStyle.accentColor}       onChange={(v) => { updateStyle('accentColor', v); updateStyle('sectionTitleColor', v); updateStyle('headerBg', v) }} />
                    <ColorRow label="Background"         value={workingStyle.backgroundColor}   onChange={(v) => updateStyle('backgroundColor', v)} />
                    <ColorRow label="Sidebar Background" value={workingStyle.sidebarBg}         onChange={(v) => updateStyle('sidebarBg', v)} />
                    <ColorRow label="Header Background"  value={workingStyle.headerBg}          onChange={(v) => updateStyle('headerBg', v)} />
                    <ColorRow label="Header Text"        value={workingStyle.headerTextColor}   onChange={(v) => updateStyle('headerTextColor', v)} />
                    <ColorRow label="Section Titles"     value={workingStyle.sectionTitleColor} onChange={(v) => updateStyle('sectionTitleColor', v)} />
                    <ColorRow label="Body Text"          value={workingStyle.bodyTextColor}     onChange={(v) => updateStyle('bodyTextColor', v)} />
                    <ColorRow label="Muted Text"         value={workingStyle.mutedTextColor}    onChange={(v) => updateStyle('mutedTextColor', v)} />
                    <ColorRow label="Borders / Dividers" value={workingStyle.borderColor}       onChange={(v) => updateStyle('borderColor', v)} />
                    {(workingStyle.skillStyle === 'badge' || workingStyle.skillStyle === 'pill' || workingStyle.skillStyle === 'grid') && (
                      <>
                        <ColorRow label="Skill Background" value={workingStyle.skillBg}    onChange={(v) => updateStyle('skillBg', v)} />
                        <ColorRow label="Skill Text"       value={workingStyle.skillColor} onChange={(v) => updateStyle('skillColor', v)} />
                      </>
                    )}
                    {isGradientCapable && (
                      <>
                        <Divider>
                          <div className="flex items-center justify-between mb-2">
                            <Lbl>Gradient Sidebar</Lbl>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={!!workingStyle.gradientSidebar}
                                onChange={(e) => updateStyle('gradientSidebar', e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                              />
                              <span className="text-xs text-gray-600">Enable</span>
                            </label>
                          </div>
                        </Divider>
                        {workingStyle.gradientSidebar && (
                          <>
                            <ColorRow label="Gradient From" value={workingStyle.gradientFrom || workingStyle.accentColor} onChange={(v) => updateStyle('gradientFrom', v)} />
                            <ColorRow label="Gradient To"   value={workingStyle.gradientTo   || workingStyle.accentColor} onChange={(v) => updateStyle('gradientTo', v)} />
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ── TYPOGRAPHY TAB ── */}
                {activeTab === 'typography' && (
                  <div className="pb-4">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-gray-800">Typography</h3>
                      <p className="text-xs text-gray-500 mt-1">Adjust fonts, sizes, and formatting.</p>
                    </div>
                    <Divider>
                      <Lbl>Font Family</Lbl>
                      <select value={workingStyle.fontFamily}
                        onChange={(e) => updateStyle('fontFamily', e.target.value)}
                        className="w-full mt-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer"
                      >
                        {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </Divider>
                    <SliderRow label="Base Font Size"    value={workingStyle.baseFontSize}              onChange={(v) => updateStyle('baseFontSize', v)}              min={10} max={18} />
                    <SliderRow label="Name Size"         value={workingStyle.nameSize}                  onChange={(v) => updateStyle('nameSize', v)}                  min={20} max={56} />
                    <SliderRow label="Section Title Size" value={workingStyle.sectionTitleSize}         onChange={(v) => updateStyle('sectionTitleSize', v)}          min={10} max={20} />
                    <SliderRow label="Letter Spacing"    value={workingStyle.sectionTitleLetterSpacing} onChange={(v) => updateStyle('sectionTitleLetterSpacing', v)} min={0}  max={8} />
                    <Divider>
                      <Lbl>Formatting Options</Lbl>
                      <div className="flex flex-col gap-3 mt-3">
                        {[
                          { key: 'nameBold',              label: 'Bold Applicant Name' },
                          { key: 'sectionTitleBold',      label: 'Bold Section Titles' },
                          { key: 'sectionTitleUppercase', label: 'Uppercase Section Titles' },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={!!workingStyle[key]}
                              onChange={(e) => updateStyle(key, e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
                          </label>
                        ))}
                      </div>
                    </Divider>
                  </div>
                )}

                {/* ── SPACING TAB ── */}
                {activeTab === 'spacing' && (
                  <div className="pb-4">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-gray-800">Spacing & Layout</h3>
                      <p className="text-xs text-gray-500 mt-1">Control page padding, gaps, and structural dividers.</p>
                    </div>
                    <SliderRow label="Page Padding"  value={workingStyle.pagePadding}  onChange={(v) => updateStyle('pagePadding', v)}  min={12} max={64} />
                    <SliderRow label="Section Gap"   value={workingStyle.sectionGap}   onChange={(v) => updateStyle('sectionGap', v)}   min={8}  max={48} />
                    <SliderRow label="Item Gap"      value={workingStyle.itemGap}       onChange={(v) => updateStyle('itemGap', v)}      min={4}  max={32} />
                    {isTwoColOrModernSidebar && (
                      <SliderRow label="Sidebar Width" value={workingStyle.sidebarWidth} onChange={(v) => updateStyle('sidebarWidth', v)} min={20} max={45} unit="%" />
                    )}
                    {['card', 'boxed'].includes(workingStyle.layout) && (
                      <SliderRow label="Card Radius" value={workingStyle.cardRadius || 8} onChange={(v) => updateStyle('cardRadius', v)} min={0} max={20} />
                    )}

                    <Divider>
                      <div className="flex flex-col gap-4">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Show Section Dividers</span>
                          <input type="checkbox" checked={!!workingStyle.showDividers}
                            onChange={(e) => updateStyle('showDividers', e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </label>
                        {workingStyle.showDividers && (
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <Lbl>Divider Line Style</Lbl>
                            <div className="flex gap-2 mt-2">
                              {['solid', 'dashed', 'dotted'].map((s) => (
                                <button key={s} onClick={() => updateStyle('dividerStyle', s)}
                                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all capitalize ${workingStyle.dividerStyle === s ? 'bg-white text-emerald-600 border-emerald-500 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                >{s}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Divider>

                    <Divider>
                      <Lbl>Bullet Style</Lbl>
                      <div className="flex gap-2 mt-3">
                        {['disc', 'dash', 'arrow', 'none'].map((s) => (
                          <button key={s} onClick={() => updateStyle('bulletStyle', s)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${workingStyle.bulletStyle === s ? 'bg-gray-800 text-white border-gray-800 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                          >
                            {s === 'disc' ? '•' : s === 'dash' ? '—' : s === 'arrow' ? '→' : 'None'}
                          </button>
                        ))}
                      </div>
                    </Divider>

                    <Divider>
                      <Lbl>Skill Style</Lbl>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {['plain', 'badge', 'pill', 'dot', 'bar', 'grid'].map((s) => (
                          <button key={s} onClick={() => updateStyle('skillStyle', s)}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all capitalize ${workingStyle.skillStyle === s ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                          >{s}</button>
                        ))}
                      </div>
                    </Divider>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* RIGHT — Preview panel */}
          <div className={`min-w-0 ${!mobileShowPreview ? "hidden lg:block" : "block"}`}>
            <div className="items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-lg capitalize">
                  {selectedTemplate?.name || 'Dynamic Template'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-violet-600 bg-violet-50 border border-violet-200">● Live Editing</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-600 bg-emerald-50 border border-emerald-200 capitalize">{workingStyle.layout}</span>
              </div>
            </div>

            <div id="resume-root" className="shadow-xl flex justify-center border">
              {liveData && (
                <ScaledLivePreview
                  globalStyle={workingStyle}
                  sections={workingSections}
                  data={liveData}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default TemplateStudio