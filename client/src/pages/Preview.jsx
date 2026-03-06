import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../configs/api'
import toast from 'react-hot-toast'

import ClassicTemplate      from '../components/templates/ClassicTemplate'
import ModernTemplate       from '../components/templates/ModernTemplate'
import MinimalTemplate      from '../components/templates/MinimalTemplate'
import MinimalImageTemplate from '../components/templates/MinimalImageTemplate'
import DynamicResumeRenderer from '../components/admin/DynamicResumeRenderer'

// ── Same resolver used in ResumeBuilder ──────────────────────
const ResumePreview = ({ data, template, accentColor }) => {
  if (data.globalStyle && data.sections) {
    return (
      <DynamicResumeRenderer
        globalStyle={data.globalStyle}
        sections={data.sections}
        data={data}
      />
    )
  }
  switch (template) {
    case 'modern':       return <ModernTemplate       data={data} accentColor={accentColor} />
    case 'minimal':      return <MinimalTemplate      data={data} accentColor={accentColor} />
    case 'minimalImage': return <MinimalImageTemplate data={data} accentColor={accentColor} />
    default:             return <ClassicTemplate      data={data} accentColor={accentColor} />
  }
}

const Preview = () => {
  const { resumeId }       = useParams()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/api/resumes/preview/${resumeId}`)
        if (!data.resume?.public) {
          setNotFound(true)
        } else {
          setResume(data.resume)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [resumeId])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-slate-500">
      <p className="text-xl font-bold mb-2">Resume not found</p>
      <p className="text-sm">This resume may be private or doesn't exist.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <ResumePreview
            data={resume}
            template={resume.template}
            accentColor={resume.accent_color || '#10b981'}
          />
        </div>
      </div>
    </div>
  )
}

export default Preview