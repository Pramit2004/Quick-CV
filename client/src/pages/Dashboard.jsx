import {
  BotIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UploadCloud,
  UploadCloudIcon,
  Waypoints,
  XIcon,
  FileTextIcon,
  LayoutGrid,
  CalendarIcon,
  ArrowRightIcon,
  LayoutTemplateIcon,
  SearchIcon,
  CheckCircle2Icon,
} from 'lucide-react'
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import pdfToText from 'react-pdftotext'
import DynamicResumeRenderer from '../components/admin/DynamicResumeRenderer'

// ─────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────
const DEFAULT_GLOBAL_STYLE = {
  layout: 'single', showPhoto: true, photoShape: 'circle',
  photoPosition: 'top-left', sidebarWidth: 30, accentColor: '#10b981',
  backgroundColor: '#ffffff', sidebarBg: '#f1f5f9', headerBg: '#10b981',
  headerTextColor: '#ffffff', sectionTitleColor: '#10b981', bodyTextColor: '#334155',
  mutedTextColor: '#64748b', borderColor: '#e2e8f0', fontFamily: 'Inter',
  baseFontSize: 14, nameSize: 32, nameBold: true, sectionTitleSize: 13,
  sectionTitleBold: true, sectionTitleUppercase: true, sectionTitleLetterSpacing: 2,
  pagePadding: 32, sectionGap: 8, itemGap: 5, showDividers: true,
  dividerStyle: 'solid', headerStyle: 'none', skillStyle: 'plain',
  skillBg: '#d1fae5', skillColor: '#065f46', bulletStyle: 'disc',
}

const DEFAULT_SECTIONS = [
  { id: 'summary',    label: 'Professional Summary', visible: true, order: 0 },
  { id: 'experience', label: 'Work Experience',       visible: true, order: 1 },
  { id: 'education',  label: 'Education',             visible: true, order: 2 },
  { id: 'projects',   label: 'Projects',              visible: true, order: 3 },
  { id: 'skills',     label: 'Skills',                visible: true, order: 4 },
]

const DUMMY_PREVIEW_DATA = {
  personal_info: {
    full_name: 'Alexandra Johnson', profession: 'Senior Product Designer',
    email: 'alex.johnson@email.com', phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA', linkedin: 'linkedin.com/in/alexjohnson',
    website: 'alexjohnson.design', image: '',
  },
  professional_summary: 'Creative and results-driven Product Designer with 6+ years crafting user-centered digital experiences.',
  skills: ['Figma', 'UX Research', 'Prototyping', 'Design Systems', 'React', 'Tailwind CSS'],
  experience: [
    { position: 'Senior Product Designer', company: 'Notion', start_date: '2022-03', end_date: '', is_current: true, description: 'Led redesign of core editor used by 30M+ users.\nBuilt component library of 200+ elements.' },
    { position: 'Product Designer', company: 'Figma', start_date: '2019-06', end_date: '2022-02', is_current: false, description: 'Designed onboarding flows improving activation by 25%.' },
  ],
  education: [{ degree: 'Bachelor of Design', field: 'Interaction Design', institution: 'California College of the Arts', graduation_date: '2019-05', gpa: '3.9' }],
  project: [{ name: 'DesignOS — Open Source Design System', type: 'Open Source', description: 'Built accessible React component library with 150+ components.' }],
}

const CATEGORY_LABELS = { all: 'All', professional: 'Professional', modern: 'Modern', minimal: 'Minimal', creative: 'Creative', classic: 'Classic' }

// ─────────────────────────────────────────────────────────────
// Style constants
// ─────────────────────────────────────────────────────────────
const inputCls  = 'w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm shadow-sm'
const labelCls  = 'block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2'
const cancelBtn = 'px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors'
const submitBtn = 'px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 transition-all'

// ─────────────────────────────────────────────────────────────
// Backdrop & ModalShell
// ─────────────────────────────────────────────────────────────
const Backdrop = ({ onClose, children }) => (
  <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm p-4' onClick={onClose}>
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
)

const ModalShell = ({ title: heading, onClose, children, footer, wide }) => (
  <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 ${wide ? 'w-full max-w-4xl' : 'w-full max-w-md'}`}>
    <div className='h-1 w-full bg-gradient-to-r from-emerald-400 to-green-500' />
    <div className='px-6 py-5 flex justify-between items-center border-b border-slate-100'>
      <div className='flex items-center gap-2.5'>
        <div className='size-2 rounded-full bg-emerald-500' />
        <h2 className='text-base font-bold text-slate-800'>{heading}</h2>
      </div>
      <button type="button" onClick={onClose} className='text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-all'>
        <XIcon className='size-4' />
      </button>
    </div>
    <div className='p-6'>{children}</div>
    {footer && <div className='px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2'>{footer}</div>}
  </div>
)

// ─────────────────────────────────────────────────────────────
// ResumePreviewThumb
// ─────────────────────────────────────────────────────────────
const RESUME_RENDER_WIDTH = 794

const ResumePreviewThumb = ({ globalStyle, sections, data, previewHeight = 280 }) => {
  const wrapperRef = useRef(null)
  const [scale, setScale] = useState(0.43)

  useEffect(() => {
    if (!wrapperRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      if (w > 0) setScale(w / RESUME_RENDER_WIDTH)
    })
    ro.observe(wrapperRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', height: previewHeight, overflow: 'hidden', background: globalStyle?.backgroundColor || '#ffffff' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: RESUME_RENDER_WIDTH, height: previewHeight / scale, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        <DynamicResumeRenderer globalStyle={globalStyle} sections={sections} data={data} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TemplatePickerModal
// ─────────────────────────────────────────────────────────────
const TemplatePickerModal = ({ onClose, onSelect, token }) => {
  const [templates, setTemplates] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [category,  setCategory]  = useState('all')
  const [search,    setSearch]    = useState('')
  const [filtered,  setFiltered]  = useState([])
  const [title,     setTitle]     = useState('')
  const [creating,  setCreating]  = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/admin/templates/published')
        setTemplates(data.templates || [])
        setFiltered(data.templates || [])
      } catch {
        toast.error('Failed to load templates')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let result = templates
    if (category !== 'all') result = result.filter(t => t.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(t => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    }
    setFiltered(result)
  }, [category, search, templates])

  const categories = ['all', ...new Set(templates.map(t => t.category))]

  const handleCreate = async () => {
    if (!title.trim()) return toast.error('Enter a resume name')
    setCreating(true)
    try {
      const gs       = selected ? { ...DEFAULT_GLOBAL_STYLE, ...(selected.globalStyle || {}) } : DEFAULT_GLOBAL_STYLE
      const sections = selected?.sections?.length ? selected.sections : DEFAULT_SECTIONS
      const previewData = selected?.previewData || DUMMY_PREVIEW_DATA

      const { data } = await api.post(
        '/api/resumes/create',
        { title, globalStyle: gs, sections, previewData },
        { headers: { Authorization: token } }
      )
      toast.success('Resume created!')
      onSelect(data.resume._id)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create resume')
    } finally {
      setCreating(false)
    }
  }

  return (
    <ModalShell title='Choose a Starting Template' onClose={onClose} wide>
      <div className='space-y-5'>
        {loading ? (
          <div className='flex flex-col items-center justify-center py-24 gap-4'>
            <div className='w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin' />
            <p className='text-sm text-slate-400 font-medium'>Loading templates...</p>
          </div>
        ) : (
          <>
            <div>
              <label className={labelCls}>Resume Name</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder='e.g. Frontend Developer 2024' className={inputCls} autoFocus />
            </div>

            <div className='flex flex-col sm:flex-row gap-3'>
              <div className='relative max-w-xs w-full'>
                <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400' />
                <input type='text' value={search} onChange={e => setSearch(e.target.value)} placeholder='Search templates...' className='w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition-all' />
              </div>
              {categories.length > 1 && (
                <div className='flex gap-2 flex-wrap'>
                  {categories.map(c => (
                    <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${category === c ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'}`}>
                      {CATEGORY_LABELS[c] || c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className='max-h-[50vh] overflow-y-auto pr-1'>
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
                <div onClick={() => setSelected(null)} className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${selected === null ? 'border-emerald-500 shadow-md shadow-emerald-100' : 'border-slate-200 hover:border-emerald-300'}`}>
                  <div className='h-36 bg-slate-50 flex flex-col items-center justify-center gap-2'>
                    <div className='size-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center'>
                      <PlusIcon className='size-5 text-slate-400' />
                    </div>
                    <span className='text-xs text-slate-400 font-medium'>Start Blank</span>
                  </div>
                  <div className='h-px bg-slate-100' />
                  <div className='px-3 py-2 flex items-center justify-between'>
                    <span className='text-xs font-semibold text-slate-600'>Blank Resume</span>
                    {selected === null && <CheckCircle2Icon className='size-3.5 text-emerald-500' />}
                  </div>
                </div>

                {filtered.map(t => {
                  const gs       = { ...DEFAULT_GLOBAL_STYLE, ...(t.globalStyle || {}) }
                  const sections = t.sections?.length ? t.sections : DEFAULT_SECTIONS
                  const data     = t.previewData || DUMMY_PREVIEW_DATA
                  const isSelected = selected?._id === t._id
                  return (
                    <div key={t._id} onClick={() => setSelected(t)} className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${isSelected ? 'border-emerald-500 shadow-md shadow-emerald-100' : 'border-slate-200 hover:border-emerald-300'}`}>
                      <ResumePreviewThumb globalStyle={gs} sections={sections} data={data} previewHeight={140} />
                      <div className='h-px bg-slate-100' />
                      <div className='px-3 py-2 flex items-center justify-between'>
                        <span className='text-xs font-semibold text-slate-600 truncate'>{t.name}</span>
                        {isSelected && <CheckCircle2Icon className='size-3.5 text-emerald-500 shrink-0' />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
              <button onClick={onClose} className={cancelBtn}>Cancel</button>
              <button onClick={handleCreate} disabled={creating || !title.trim()} className={`${submitBtn} flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}>
                {creating && <LoaderCircleIcon className='animate-spin size-4' />}
                {creating ? 'Creating...' : selected ? `Use "${selected.name}" →` : 'Create Blank →'}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  )
}

// ─────────────────────────────────────────────────────────────
// Resume Card Skeleton — shown while resumes are loading
// ─────────────────────────────────────────────────────────────
const ResumeCardSkeleton = () => (
  <div className='bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col animate-pulse'>
    {/* Preview area */}
    <div className='h-[220px] bg-gradient-to-b from-slate-100 to-slate-50 relative overflow-hidden'>
      {/* Fake header bar */}
      <div className='absolute top-0 left-0 right-0 h-12 bg-slate-200/70' />
      {/* Fake content lines */}
      <div className='absolute top-16 left-5 right-5 space-y-2'>
        <div className='h-2 bg-slate-200/60 rounded w-1/2' />
        <div className='h-1.5 bg-slate-100 rounded w-3/4' />
        <div className='h-1.5 bg-slate-100 rounded w-2/3' />
        <div className='mt-4 h-2 bg-slate-200/50 rounded w-2/5' />
        <div className='h-1.5 bg-slate-100 rounded w-4/5' />
        <div className='h-1.5 bg-slate-100 rounded w-3/5' />
        <div className='h-1.5 bg-slate-100 rounded w-4/5' />
      </div>
    </div>
    <div className='h-px bg-slate-100' />
    <div className='px-4 py-3.5 space-y-2'>
      <div className='h-3.5 bg-slate-200 rounded-lg w-3/4' />
      <div className='flex items-center justify-between'>
        <div className='h-2.5 bg-slate-100 rounded w-24' />
        <div className='h-4 bg-slate-100 rounded-full w-12' />
      </div>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { token } = useSelector(state => state.auth)

  const [allResumes,         setAllResumes]         = useState([])
  const [resumesLoading,     setResumesLoading]     = useState(true)  // ← loading state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showUploadResume,   setShowUploadResume]   = useState(false)
  const [title,              setTitle]              = useState('')
  const [resume,             setResume]             = useState(null)
  const [editResumeId,       setEditResumeId]       = useState('')
  const [isLoading,          setIsLoading]          = useState(false)

  const navigate = useNavigate()

  const loadAllResumes = async () => {
    setResumesLoading(true)
    try {
      const { data } = await api.get('/api/users/resumes', { headers: { Authorization: token } })
      setAllResumes(data.resumes)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setResumesLoading(false)
    }
  }

  const uploadResume = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    try {
      const resumeText = await pdfToText(resume)
      const { data } = await api.post('/api/ai/upload-resume', { title, resumeText }, { headers: { Authorization: token } })
      setTitle(''); setResume(null); setShowUploadResume(false)
      navigate(`/app/builder/${data.resumeId}`)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
    setIsLoading(false)
  }

  const editTitle = async (event) => {
    try {
      event.preventDefault()
      const { data } = await api.put('/api/resumes/update', { resumeId: editResumeId, resumeData: { title } }, { headers: { Authorization: token } })
      setAllResumes(allResumes.map(r => r._id === editResumeId ? { ...r, title } : r))
      setTitle(''); setEditResumeId('')
      toast.success(data.message)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const deleteResume = (resumeId) => {
    toast((t) => (
      <div className='flex flex-col items-center gap-3'>
        <p className='font-semibold text-slate-800 text-sm'>Delete this resume permanently?</p>
        <div className='flex gap-2'>
          <button onClick={() => toast.dismiss(t.id)} className='px-4 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors'>Cancel</button>
          <button onClick={async () => {
            toast.dismiss(t.id)
            const loadingId = toast.loading('Deleting resume...')
            try {
              const { data } = await api.delete(`/api/resumes/delete/${resumeId}`, { headers: { Authorization: token } })
              setAllResumes(prev => prev.filter(r => r._id !== resumeId))
              toast.success(data.message, { id: loadingId })
            } catch (error) {
              toast.error(error?.response?.data?.message || error.message, { id: loadingId })
            }
          }} className='px-4 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors'>Delete</button>
        </div>
      </div>
    ), { position: 'top-center', duration: 5000, style: { background: '#fff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' } })
  }

  useEffect(() => { loadAllResumes() }, [])

  const actionCards = [
    { label: 'Create Resume', sub: 'Choose a template', icon: <PlusIcon className='size-5' />, onClick: () => setShowTemplatePicker(true), iconBg: 'bg-emerald-600', border: 'border-emerald-200', hoverBorder: 'hover:border-emerald-400', tag: 'New', tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: 'Upload PDF',    sub: 'Parse with AI',     icon: <UploadCloudIcon className='size-5' />, onClick: () => setShowUploadResume(true), iconBg: 'bg-teal-600', border: 'border-teal-200', hoverBorder: 'hover:border-teal-400', tag: 'AI', tagColor: 'text-teal-700 bg-teal-50 border-teal-200' },
    { label: 'ATS Checker',  sub: 'Score your resume', icon: <Waypoints className='size-5' />, onClick: () => navigate('/app/ats-checker'), iconBg: 'bg-green-600', border: 'border-green-200', hoverBorder: 'hover:border-green-400', tag: 'Score', tagColor: 'text-green-700 bg-green-50 border-green-200' },
    { label: 'JD Match',     sub: 'Match & optimize',  icon: <BotIcon className='size-5' />, onClick: () => navigate('/app/jd-match'), iconBg: 'bg-emerald-700', border: 'border-emerald-200', hoverBorder: 'hover:border-emerald-500', tag: 'AI', tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: 'Templates',    sub: 'Browse gallery',    icon: <LayoutTemplateIcon className='size-5' />, onClick: () => navigate('/app/templates'), iconBg: 'bg-violet-600', border: 'border-violet-200', hoverBorder: 'hover:border-violet-400', tag: 'New', tagColor: 'text-violet-700 bg-violet-50 border-violet-200' },
  ]

  // ── Documents section renderer ───────────────────────────
  const renderDocuments = () => {
    // Show skeleton grid while fetching
    if (resumesLoading) {
      return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
          {[...Array(4)].map((_, i) => <ResumeCardSkeleton key={i} />)}
        </div>
      )
    }

    // Empty state — only rendered after loading completes with 0 results
    if (allResumes.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-white/70'>
          <div className='size-14 bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm'>
            <FileTextIcon className='size-6 text-emerald-500' />
          </div>
          <h3 className='text-base font-bold text-slate-700'>No resumes yet</h3>
          <p className='text-slate-400 text-sm mt-1 text-center max-w-xs'>Create your first resume or upload an existing PDF to get started.</p>
          <button onClick={() => setShowTemplatePicker(true)} className='mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5'>
            Create Resume
          </button>
        </div>
      )
    }

    // Resume cards
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
        {allResumes.map((resumeItem, index) => {
          const gs       = { ...DEFAULT_GLOBAL_STYLE, ...(resumeItem.globalStyle || {}) }
          const sections = resumeItem.sections?.length ? resumeItem.sections : DEFAULT_SECTIONS
          return (
            <div key={index} onClick={() => navigate(`/app/builder/${resumeItem._id}`)} className='group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 hover:border-slate-300 cursor-pointer'>
              <div className='relative overflow-hidden'>
                <ResumePreviewThumb globalStyle={gs} sections={sections} data={resumeItem} previewHeight={220} />
                <div className='absolute inset-0 bg-white/90 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2 z-20'>
                  <button onClick={e => { e.stopPropagation(); setEditResumeId(resumeItem._id); setTitle(resumeItem.title) }} className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 shadow-sm text-xs font-semibold transition-all'>
                    <PencilIcon className='size-3' /> Rename
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteResume(resumeItem._id) }} className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-500 shadow-sm text-xs font-semibold transition-all'>
                    <TrashIcon className='size-3' /> Delete
                  </button>
                </div>
              </div>
              <div className='h-px bg-slate-100' />
              <div className='px-4 py-3.5 bg-white'>
                <p className='text-sm font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors' title={resumeItem.title}>{resumeItem.title}</p>
                <div className='flex items-center justify-between mt-2'>
                  <div className='flex items-center gap-1.5'>
                    <CalendarIcon className='size-3 text-slate-300' />
                    <p className='text-[11px] text-slate-400 font-medium'>
                      {new Date(resumeItem.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className='text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full'>Active</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className='min-h-screen font-sans pb-28 text-slate-900' style={{ backgroundColor: '#F4F6F3', backgroundImage: `linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)`, backgroundSize: '32px 32px' }}>
      <div className='max-w-6xl mx-auto px-5 sm:px-8 py-12'>

        {/* Header */}
        <div className='mb-12 flex items-end justify-between'>
          <div>
            <div className='inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-3'>
              <div className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
              <span className='text-[11px] font-bold text-emerald-700 tracking-widest uppercase'>Workspace</span>
            </div>
            <h1 className='text-3xl font-extrabold text-slate-900 tracking-tight'>Dashboard</h1>
            <p className='text-slate-500 mt-1.5 text-sm'>Build, upload, and optimize your resumes.</p>
          </div>
          {!resumesLoading && allResumes.length > 0 && (
            <div className='hidden sm:flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm'>
              <LayoutGrid className='size-4 text-emerald-500' />
              <span className='text-sm font-bold text-slate-700'>{allResumes.length}</span>
              <span className='text-sm text-slate-400'>resumes</span>
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-14'>
          {actionCards.map(({ label, sub, icon, onClick, iconBg, border, hoverBorder, tag, tagColor }) => (
            <button key={label} onClick={onClick} className={`group relative bg-white ${border} border rounded-2xl p-5 text-left ${hoverBorder} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}>
              <div className='absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-emerald-50/0 group-hover:from-emerald-50/60 group-hover:to-transparent rounded-2xl transition-all duration-300 pointer-events-none' />
              <span className={`absolute top-3.5 right-3.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagColor}`}>{tag}</span>
              <div className={`${iconBg} text-white size-10 rounded-xl flex items-center justify-center mb-10 shadow-sm`}>{icon}</div>
              <div>
                <p className='text-sm font-bold text-slate-800 group-hover:text-emerald-800 transition-colors'>{label}</p>
                <p className='text-xs text-slate-400 mt-0.5'>{sub}</p>
              </div>
              <ArrowRightIcon className='absolute bottom-4 right-4 size-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all duration-200' />
            </button>
          ))}
        </div>

        {/* My Documents */}
        <div className='flex items-center gap-4 mb-6'>
          <div className='flex items-center gap-2 shrink-0'>
            <LayoutGrid className='size-4 text-emerald-500' />
            <h2 className='text-base font-bold text-slate-800'>My Documents</h2>
          </div>
          <div className='flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent' />
          <span className='shrink-0 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm'>
            {resumesLoading
              ? <span className='inline-flex items-center gap-1'><LoaderCircleIcon className='size-3 animate-spin' /> Loading</span>
              : `${allResumes.length} ${allResumes.length === 1 ? 'file' : 'files'}`
            }
          </span>
        </div>

        {renderDocuments()}

        {/* ── MODALS ── */}

        {showTemplatePicker && (
          <Backdrop onClose={() => setShowTemplatePicker(false)}>
            <TemplatePickerModal
              onClose={() => setShowTemplatePicker(false)}
              onSelect={resumeId => { setShowTemplatePicker(false); navigate(`/app/builder/${resumeId}`) }}
              token={token}
            />
          </Backdrop>
        )}

        {showUploadResume && (
          <Backdrop onClose={() => { setShowUploadResume(false); setTitle(''); setResume(null) }}>
            <ModalShell title='Upload PDF Resume' onClose={() => { setShowUploadResume(false); setTitle(''); setResume(null) }}
              footer={
                <>
                  <button type="button" onClick={() => { setShowUploadResume(false); setTitle(''); setResume(null) }} className={cancelBtn}>Cancel</button>
                  <button type="submit" form="upload-form" disabled={isLoading || !resume} className={`${submitBtn} flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {isLoading && <LoaderCircleIcon className='animate-spin size-4' />}
                    {isLoading ? 'Processing…' : 'Upload & Extract →'}
                  </button>
                </>
              }
            >
              <form id="upload-form" onSubmit={uploadResume} className='space-y-4'>
                <div>
                  <label className={labelCls}>Resume Name</label>
                  <input onChange={e => setTitle(e.target.value)} value={title} type="text" placeholder='e.g. Imported Resume' className={inputCls} required autoFocus />
                </div>
                <div>
                  <label className={labelCls}>PDF File</label>
                  <p className='text-[11px] text-slate-400 mb-2'>AI will extract your content into editable fields. Extra sections (certifications, awards, etc.) get their own form tabs.</p>
                  <label htmlFor="resume-upload-input" className='block cursor-pointer'>
                    <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-8 transition-all duration-200 ${resume ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'}`}>
                      {resume ? (
                        <div className='text-center'>
                          <div className='size-11 bg-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-center mx-auto mb-2'>
                            <FileTextIcon className='size-5 text-emerald-600' />
                          </div>
                          <p className='text-sm font-bold text-slate-700 truncate max-w-[200px]'>{resume.name}</p>
                          <p className='text-xs text-emerald-600 mt-1 font-medium'>Click to replace</p>
                        </div>
                      ) : (
                        <div className='text-center'>
                          <div className='size-11 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2'>
                            <UploadCloud className='size-5 text-slate-400' />
                          </div>
                          <p className='text-sm font-semibold text-slate-600'>Click to upload PDF</p>
                          <p className='text-xs text-slate-400 mt-1'>Max 5 MB</p>
                        </div>
                      )}
                    </div>
                  </label>
                  <input type="file" id='resume-upload-input' accept='.pdf' hidden onChange={e => setResume(e.target.files[0])} />
                </div>
              </form>
            </ModalShell>
          </Backdrop>
        )}

        {editResumeId && (
          <Backdrop onClose={() => { setEditResumeId(''); setTitle('') }}>
            <ModalShell title='Rename Resume' onClose={() => { setEditResumeId(''); setTitle('') }}
              footer={
                <>
                  <button type="button" onClick={() => { setEditResumeId(''); setTitle('') }} className={cancelBtn}>Cancel</button>
                  <button type="submit" form="rename-form" className={submitBtn}>Update →</button>
                </>
              }
            >
              <form id="rename-form" onSubmit={editTitle}>
                <label className={labelCls}>Resume Name</label>
                <input onChange={e => setTitle(e.target.value)} value={title} type="text" className={inputCls} required autoFocus />
              </form>
            </ModalShell>
          </Backdrop>
        )}

      </div>
    </div>
  )
}
export default Dashboard