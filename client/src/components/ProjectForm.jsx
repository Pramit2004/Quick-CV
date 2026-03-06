import { ExternalLink, Github, Plus, Trash2 } from 'lucide-react'
import React from 'react'

const ProjectForm = ({ data, onChange }) => {

  const addProject = () => {
    const newProject = {
      name:        '',
      type:        '',
      description: '',
      liveUrl:     '',
      githubUrl:   '',
    }
    onChange([...data, newProject])
  }

  const removeProject = (index) => {
    onChange(data.filter((_, i) => i !== index))
  }

  const updateProject = (index, field, value) => {
    const updated = [...data]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='flex items-center gap-2 text-lg font-semibold text-gray-900'>
            Projects
          </h3>
          <p className='text-sm text-gray-500'>Add your projects</p>
        </div>
        <button
          onClick={addProject}
          className='flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors'
        >
          <Plus className='size-4' />
          Add Project
        </button>
      </div>

      {/* ── Empty state ─────────────────────────────────── */}
      {data.length === 0 && (
        <div className='mt-6 text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400'>
          <p className='text-sm'>No projects added yet.</p>
          <p className='text-xs mt-1'>Click "Add Project" to get started.</p>
        </div>
      )}

      {/* ── Project cards ───────────────────────────────── */}
      <div className='space-y-4 mt-6'>
        {data.map((project, index) => (
          <div key={index} className='p-4 border border-gray-200 rounded-xl space-y-3 bg-white shadow-sm'>

            {/* Card header */}
            <div className='flex justify-between items-center'>
              <h4 className='text-sm font-semibold text-gray-700'>
                Project #{index + 1}
              </h4>
              <button
                onClick={() => removeProject(index)}
                className='text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-lg'
              >
                <Trash2 className='size-4' />
              </button>
            </div>

            {/* Name + Type */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <input
                value={project.name || ''}
                onChange={(e) => updateProject(index, 'name', e.target.value)}
                type='text'
                placeholder='Project Name'
                className='px-3 py-2 text-sm rounded-lg'
              />
              <input
                value={project.type || ''}
                onChange={(e) => updateProject(index, 'type', e.target.value)}
                type='text'
                placeholder='Project Type (e.g. Web App, Open Source)'
                className='px-3 py-2 text-sm rounded-lg'
              />
            </div>

            {/* Description */}
            <textarea
              rows={4}
              value={project.description || ''}
              onChange={(e) => updateProject(index, 'description', e.target.value)}
              placeholder='Describe your project, technologies used, and key achievements...'
              className='w-full px-3 py-2 text-sm rounded-lg resize-none'
            />

            {/* ── Optional links ──────────────────────────── */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>

              {/* Live Demo URL */}
              <div className='space-y-1'>
                <label className='flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider'>
                  <ExternalLink className='size-3' />
                  Live Demo
                  <span className='font-normal normal-case text-gray-300'>(optional)</span>
                </label>
                <input
                  value={project.liveUrl || ''}
                  onChange={(e) => updateProject(index, 'liveUrl', e.target.value)}
                  type='url'
                  placeholder='https://myproject.com'
                  className='w-full px-3 py-2 text-sm rounded-lg'
                />
              </div>

              {/* GitHub URL */}
              <div className='space-y-1'>
                <label className='flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider'>
                  <Github className='size-3' />
                  GitHub Repo
                  <span className='font-normal normal-case text-gray-300'>(optional)</span>
                </label>
                <input
                  value={project.githubUrl || ''}
                  onChange={(e) => updateProject(index, 'githubUrl', e.target.value)}
                  type='url'
                  placeholder='https://github.com/user/repo'
                  className='w-full px-3 py-2 text-sm rounded-lg'
                />
              </div>
            </div>

            {/* ── Link preview chip ────────────────────────── */}
            {(project.liveUrl || project.githubUrl) && (
              <div className='flex items-center gap-2 pt-1'>
                <span className='text-xs text-gray-400'>Shows in resume as:</span>
                {project.liveUrl && (
                  <span className='inline-flex items-center gap-1 text-xs font-medium text-emerald-600 underline decoration-emerald-300'>
                    <ExternalLink className='size-3' />
                    Live Demo
                  </span>
                )}
                {project.liveUrl && project.githubUrl && (
                  <span className='text-gray-300 text-xs'>·</span>
                )}
                {project.githubUrl && (
                  <span className='inline-flex items-center gap-1 text-xs font-medium text-emerald-600 underline decoration-emerald-300'>
                    <Github className='size-3' />
                    GitHub
                  </span>
                )}
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  )
}

export default ProjectForm