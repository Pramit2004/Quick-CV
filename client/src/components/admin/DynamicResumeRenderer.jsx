import React, { useEffect, lazy, Suspense } from 'react'

export const A4_WIDTH  = 794
export const A4_HEIGHT = 1123

const ResumePaginated = lazy(() => import('../pagination/ResumePaginated'))

// ── Google Fonts ──────────────────────────────────────────────
const loadedFonts = new Set()
export const loadFont = (fontFamily) => {
  if (!fontFamily || loadedFonts.has(fontFamily)) return
  loadedFonts.add(fontFamily)
  const slug = fontFamily.replace(/ /g, '+')
  const id   = `gfont-${slug}`
  if (document.getElementById(id)) return
  const link  = document.createElement('link')
  link.id     = id
  link.rel    = 'stylesheet'
  link.href   = `https://fonts.googleapis.com/css2?family=${slug}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap`
  document.head.appendChild(link)
}

// ── Helpers ───────────────────────────────────────────────────
const fmt = (str) => {
  if (!str) return ''
  const [year, month] = str.split('-')
  if (!year) return str
  try {
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  } catch { return str }
}

const bullet = (style) => {
  if (style === 'dash')  return '– '
  if (style === 'arrow') return '› '
  if (style === 'none')  return ''
  return '• '
}

// ── Merge defaults ────────────────────────────────────────────
export const mergeGlobalStyle = (gs = {}) => ({
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
  pagePadding: 32, sectionGap: 18, itemGap: 12,
  showDividers: true, dividerStyle: 'solid', headerStyle: 'none',
  skillStyle: 'plain', skillBg: '#d1fae5', skillColor: '#065f46',
  bulletStyle: 'disc', cardRadius: 8, cardShadow: true,
  gradientSidebar: false, gradientFrom: '#10b981', gradientTo: '#0d9488',
  timelineDotSize: 8, boxedBorderWidth: 1,
  ...gs,
})

// ── Shared Primitives ─────────────────────────────────────────

const Photo = ({ src, gs, size = 80 }) => {
  const radius = gs.photoShape === 'circle' ? '50%' : gs.photoShape === 'rounded' ? '10px' : '0'
  if (!src) return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: gs.accentColor + '25',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: gs.accentColor, fontSize: size * 0.35, fontWeight: 700,
      flexShrink: 0, fontFamily: `'${gs.fontFamily}', sans-serif`,
    }}>AJ</div>
  )
  return <img src={src} alt="" style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0, display: 'block' }} />
}

const SkillsBlock = ({ skills, gs }) => {
  const ff = `'${gs.fontFamily}', sans-serif`
  if (!skills?.length) return null

  if (gs.skillStyle === 'badge') return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {skills.map((s, i) => <span key={i} style={{ fontSize: gs.baseFontSize - 1, background: gs.skillBg, color: gs.skillColor, padding: '3px 9px', borderRadius: 4, fontWeight: 600, fontFamily: ff }}>{s}</span>)}
    </div>
  )
  if (gs.skillStyle === 'pill') return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {skills.map((s, i) => <span key={i} style={{ fontSize: gs.baseFontSize - 1, background: gs.skillBg, color: gs.skillColor, padding: '3px 12px', borderRadius: 999, fontWeight: 600, fontFamily: ff }}>{s}</span>)}
    </div>
  )
  if (gs.skillStyle === 'dot') return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {skills.map((s, i) => <span key={i} style={{ fontSize: gs.baseFontSize - 1, color: gs.bodyTextColor, fontFamily: ff, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: gs.accentColor, flexShrink: 0, display: 'inline-block' }}/>{s}</span>)}
    </div>
  )
  if (gs.skillStyle === 'bar') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {skills.map((s, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: gs.baseFontSize - 1, color: gs.bodyTextColor, fontFamily: ff }}>{s}</span>
          </div>
          <div style={{ height: 3, background: gs.borderColor, borderRadius: 99 }}>
            <div style={{ height: '100%', width: `${60 + (i % 4) * 10}%`, background: gs.accentColor, borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>
  )
  if (gs.skillStyle === 'grid') return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5 }}>
      {skills.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: gs.skillBg, borderRadius: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: gs.accentColor, flexShrink: 0 }} />
          <span style={{ fontSize: gs.baseFontSize - 1, color: gs.skillColor, fontFamily: ff, fontWeight: 500 }}>{s}</span>
        </div>
      ))}
    </div>
  )
  // plain default
  return <p style={{ fontSize: gs.baseFontSize - 1, color: gs.bodyTextColor, lineHeight: 1.7, margin: 0, fontFamily: ff }}>{skills.join(' · ')}</p>
}

// ── Section content by id ────────────────────────────────────
const SectionBody = ({ section, data, gs }) => {
  const ff = `'${gs.fontFamily}', sans-serif`
  const b  = bullet(gs.bulletStyle)

  switch (section.id) {
    case 'summary':
      if (!data.professional_summary) return null
      return <p style={{ fontSize: gs.baseFontSize, color: gs.bodyTextColor, lineHeight: 1.75, margin: 0, fontFamily: ff }}>{data.professional_summary}</p>

    case 'experience':
      if (!data.experience?.length) return null
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gs.itemGap }}>
          {data.experience.map((e, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <p style={{ fontSize: gs.baseFontSize + 0.5, fontWeight: 700, color: gs.bodyTextColor, margin: 0, fontFamily: ff, lineHeight: 1.3 }}>{e.position}</p>
                  <p style={{ fontSize: gs.baseFontSize - 0.5, color: gs.accentColor, fontWeight: 600, margin: '1px 0 0', fontFamily: ff }}>{e.company}</p>
                </div>
                <p style={{ fontSize: gs.baseFontSize - 2, color: gs.mutedTextColor, whiteSpace: 'nowrap', margin: 0, fontFamily: ff, flexShrink: 0, paddingTop: 2 }}>
                  {fmt(e.start_date)} – {e.is_current ? 'Present' : fmt(e.end_date)}
                </p>
              </div>
              {e.description && (
                <div style={{ marginTop: 5 }}>
                  {e.description.split('\n').filter(Boolean).map((line, li) => (
                    <p key={li} style={{ fontSize: gs.baseFontSize - 1, color: gs.bodyTextColor, lineHeight: 1.6, margin: '2px 0', fontFamily: ff }}>
                      {gs.bulletStyle !== 'none' && b}{line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )

    case 'education':
      if (!data.education?.length) return null
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gs.itemGap }}>
          {data.education.map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <p style={{ fontSize: gs.baseFontSize + 0.5, fontWeight: 700, color: gs.bodyTextColor, margin: 0, fontFamily: ff }}>{e.degree}{e.field ? ` in ${e.field}` : ''}</p>
                <p style={{ fontSize: gs.baseFontSize - 0.5, color: gs.accentColor, fontWeight: 500, margin: '2px 0 0', fontFamily: ff }}>{e.institution}</p>
                {e.gpa && <p style={{ fontSize: gs.baseFontSize - 2, color: gs.mutedTextColor, margin: '2px 0 0', fontFamily: ff }}>GPA: {e.gpa}</p>}
              </div>
              <p style={{ fontSize: gs.baseFontSize - 2, color: gs.mutedTextColor, whiteSpace: 'nowrap', margin: 0, fontFamily: ff, flexShrink: 0, paddingTop: 2 }}>{fmt(e.graduation_date)}</p>
            </div>
          ))}
        </div>
      )

    case 'projects':
      if (!data.project?.length) return null
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gs.itemGap }}>
          {data.project.map((p, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ fontSize: gs.baseFontSize + 0.5, fontWeight: 700, color: gs.bodyTextColor, margin: 0, fontFamily: ff }}>{p.name}</p>
                {p.type && <p style={{ fontSize: gs.baseFontSize - 2, color: gs.accentColor, fontWeight: 600, margin: 0, fontFamily: ff, flexShrink: 0 }}>{p.type}</p>}
              </div>
              {p.description && p.description.split('\n').filter(Boolean).map((line, li) => (
                <p key={li} style={{ fontSize: gs.baseFontSize - 1, color: gs.bodyTextColor, lineHeight: 1.6, margin: '2px 0', fontFamily: ff }}>{gs.bulletStyle !== 'none' && b}{line}</p>
              ))}
              {(p.liveUrl || p.githubUrl) && (
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {p.liveUrl && <a href={p.liveUrl} style={{ fontSize: gs.baseFontSize - 2, color: gs.accentColor, fontFamily: ff }}>Live Demo ↗</a>}
                  {p.githubUrl && <a href={p.githubUrl} style={{ fontSize: gs.baseFontSize - 2, color: gs.accentColor, fontFamily: ff }}>GitHub ↗</a>}
                </div>
              )}
            </div>
          ))}
        </div>
      )

    case 'skills':
      return <SkillsBlock skills={data.skills} gs={gs} />

    default: {
      // Admin custom section with fieldDefs
      if (section.fieldDefs?.length > 0) {
        const sectionData  = (data.customSections || []).find(s => s.id === section.id)
        const fieldValues  = sectionData?.fields || {}
        const hasRealData  = section.fieldDefs.some(fd => fieldValues[fd.fieldKey])
        const getValue     = (fd) => fieldValues[fd.fieldKey] ?? (hasRealData ? '' : (fd.dummyData || ''))
        const anyValue     = section.fieldDefs.some(fd => getValue(fd))
        if (!anyValue) return null
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: gs.itemGap * 0.65 }}>
            {section.fieldDefs.map(fd => {
              const val = getValue(fd)
              if (!val) return null
              return (
                <div key={fd.fieldKey}>
                  <p style={{ fontSize: gs.baseFontSize - 2, fontWeight: 700, color: gs.mutedTextColor, margin: '0 0 2px', fontFamily: ff, textTransform: 'uppercase', letterSpacing: 0.5 }}>{fd.label}</p>
                  {fd.fieldType === 'url'
                    ? <a href={val} target="_blank" rel="noopener noreferrer" style={{ fontSize: gs.baseFontSize - 1, color: gs.accentColor, fontFamily: ff, wordBreak: 'break-all' }}>{val}</a>
                    : <p style={{ fontSize: gs.baseFontSize - 1, color: gs.bodyTextColor, lineHeight: 1.6, margin: 0, fontFamily: ff, whiteSpace: fd.fieldType === 'textarea' ? 'pre-line' : 'normal' }}>{val}</p>
                  }
                </div>
              )
            })}
          </div>
        )
      }
      // Legacy freetext
      if (section.customContent) return (
        <div>{section.customContent.split('\n').map((line, i) => <p key={i} style={{ margin: '2px 0', fontSize: gs.baseFontSize, color: gs.bodyTextColor, lineHeight: 1.7, fontFamily: ff }}>{line || <br/>}</p>)}</div>
      )
      return null
    }
  }
}

// ─────────────────────────────────────────────────────────────
// LAYOUT COMPONENTS
// Each layout is a standalone, thoughtfully designed resume style
// ─────────────────────────────────────────────────────────────

// ── Shared section title styles ───────────────────────────────
const makeTitleStyle = (gs, variant = 'default') => {
  const base = {
    fontSize: gs.sectionTitleSize,
    fontWeight: gs.sectionTitleBold ? 700 : 400,
    color: gs.sectionTitleColor,
    textTransform: gs.sectionTitleUppercase ? 'uppercase' : 'none',
    letterSpacing: gs.sectionTitleLetterSpacing,
    margin: 0,
    fontFamily: `'${gs.fontFamily}', sans-serif`,
    lineHeight: 1.2,
  }
  return base
}

// ── SINGLE COLUMN — Classic top-to-bottom, ATS-safe ──────────
const SingleLayout = ({ gs, sections, data, userSections, pad }) => {
  const ff = `'${gs.fontFamily}', sans-serif`
  const info = data.personal_info || {}
  const isBanner = gs.headerStyle === 'full-color'
  const showPhoto = gs.showPhoto
  const photoCenter = showPhoto && gs.photoPosition === 'top-center'
  const photoRight  = showPhoto && gs.photoPosition === 'top-right'
  const photoLeft   = showPhoto && (gs.photoPosition === 'top-left' || gs.photoPosition === 'sidebar')

  const nameColor = isBanner ? gs.headerTextColor : gs.bodyTextColor
  const subColor  = isBanner ? gs.headerTextColor + 'cc' : gs.mutedTextColor

  const contacts = [
    info.email    && { v: info.email,    h: `mailto:${info.email}` },
    info.phone    && { v: info.phone,    h: `tel:${info.phone.replace(/\s/g, '')}` },
    info.location && { v: info.location, h: null },
    info.linkedin && { v: info.linkedin, h: info.linkedin.startsWith('http') ? info.linkedin : `https://${info.linkedin}` },
    info.website  && { v: info.website,  h: info.website.startsWith('http') ? info.website : `https://${info.website}` },
  ].filter(Boolean)

  return (
    <div style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, background: gs.backgroundColor, boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{
        background: isBanner ? gs.headerBg : 'transparent',
        borderLeft: gs.headerStyle === 'left-accent' ? `4px solid ${gs.accentColor}` : 'none',
        borderBottom: gs.headerStyle === 'bottom-border' ? `2px solid ${gs.accentColor}` : 'none',
        padding: isBanner ? pad : `${pad}px ${pad}px 0`,
        paddingLeft: gs.headerStyle === 'left-accent' ? pad + 12 : (isBanner ? pad : pad),
        marginBottom: isBanner ? 0 : gs.sectionGap,
      }}>
        <div style={{ display: 'flex', flexDirection: photoCenter ? 'column' : 'row', alignItems: photoCenter ? 'center' : 'flex-start', gap: 16 }}>
          {(photoLeft || photoCenter) && <Photo src={info.image} gs={gs} size={photoCenter ? 86 : 70} />}
          <div style={{ flex: 1, textAlign: photoCenter ? 'center' : 'left' }}>
            <h1 style={{ fontSize: gs.nameSize, fontWeight: gs.nameBold ? 800 : 400, color: nameColor, margin: '0 0 3px', lineHeight: 1.1, fontFamily: ff }}>{info.full_name || 'Your Name'}</h1>
            {info.profession && <p style={{ fontSize: gs.baseFontSize + 1, color: isBanner ? gs.headerTextColor + 'bb' : gs.accentColor, margin: '0 0 7px', fontFamily: ff, fontWeight: 500 }}>{info.profession}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', justifyContent: photoCenter ? 'center' : 'flex-start' }}>
              {contacts.map((c, i) => c.h
                ? <a key={i} href={c.h} style={{ fontSize: gs.baseFontSize - 2, color: subColor, fontFamily: ff, textDecoration: 'none' }}>{c.v}</a>
                : <span key={i} style={{ fontSize: gs.baseFontSize - 2, color: subColor, fontFamily: ff }}>{c.v}</span>
              )}
            </div>
          </div>
          {photoRight && <Photo src={info.image} gs={gs} size={70} />}
        </div>
      </div>
      {/* Sections */}
      <div style={{ padding: `${gs.sectionGap}px ${pad}px ${pad}px` }}>
        {sections.map(s => {
          const body = <SectionBody section={s} data={data} gs={gs} />
          if (!body) return null
          return (
            <div key={s.id} style={{ marginBottom: gs.sectionGap }}>
              <div style={{ marginBottom: 6 }}>
                <h2 style={makeTitleStyle(gs)}>{s.label}</h2>
                {gs.showDividers && <div style={{ marginTop: 4, borderTop: `1px ${gs.dividerStyle} ${gs.borderColor}` }} />}
              </div>
              {body}
            </div>
          )
        })}
        {userSections.map(s => s.content?.trim() ? (
          <div key={s.id} style={{ marginBottom: gs.sectionGap }}>
            <div style={{ marginBottom: 6 }}>
              <h2 style={makeTitleStyle(gs)}>{s.label}</h2>
              {gs.showDividers && <div style={{ marginTop: 4, borderTop: `1px ${gs.dividerStyle} ${gs.borderColor}` }} />}
            </div>
            {s.content.split('\n').map((line, i) => <p key={i} style={{ margin: '2px 0', fontSize: gs.baseFontSize, color: gs.bodyTextColor, lineHeight: 1.7, fontFamily: ff }}>{line || <br/>}</p>)}
          </div>
        ) : null)}
      </div>
    </div>
  )
}

// ── TWO COLUMN — Left or Right sidebar ───────────────────────
const TwoColLayout = ({ gs, sections, data, userSections, pad, sidebarLeft }) => {
  const ff = `'${gs.fontFamily}', sans-serif`
  const sidebarW = Math.round(A4_WIDTH * gs.sidebarWidth / 100)
  const mainW    = A4_WIDTH - sidebarW
  const photoInSidebar = gs.showPhoto && gs.photoPosition === 'sidebar'

  const sidebarSecs = sections.filter(s => s.inSidebar)
  const mainSecs    = sections.filter(s => !s.inSidebar)
  const finalSide   = sidebarSecs.length ? sidebarSecs : sections.slice(0, 2)
  const finalMain   = sidebarSecs.length ? mainSecs    : sections.slice(2)

  const renderSection = (s, sidebarMode = false) => {
    const body = <SectionBody section={s} data={data} gs={gs} />
    if (!body) return null
    return (
      <div key={s.id} style={{ marginBottom: gs.sectionGap }}>
        <div style={{ marginBottom: 6 }}>
          <h2 style={{ ...makeTitleStyle(gs), color: sidebarMode ? gs.sectionTitleColor : gs.sectionTitleColor }}>{s.label}</h2>
          {gs.showDividers && <div style={{ marginTop: 4, borderTop: `1px ${gs.dividerStyle} ${sidebarMode ? gs.borderColor : gs.borderColor}` }} />}
        </div>
        {body}
      </div>
    )
  }

  const info = data.personal_info || {}
  const contacts = [
    info.email    && { v: info.email,    h: `mailto:${info.email}` },
    info.phone    && { v: info.phone,    h: `tel:${info.phone.replace(/\s/g,'')}` },
    info.location && { v: info.location, h: null },
    info.linkedin && { v: info.linkedin, h: info.linkedin.startsWith('http') ? info.linkedin : `https://${info.linkedin}` },
    info.website  && { v: info.website,  h: info.website.startsWith('http') ? info.website : `https://${info.website}` },
  ].filter(Boolean)

  const sidebarEl = (
    <div style={{ width: sidebarW, minHeight: A4_HEIGHT, background: gs.sidebarBg, padding: pad, boxSizing: 'border-box', flexShrink: 0 }}>
      {photoInSidebar && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: gs.sectionGap }}>
          <Photo src={info.image} gs={gs} size={90} />
        </div>
      )}
      {finalSide.map(s => renderSection(s, true))}
    </div>
  )

  const mainEl = (
    <div style={{ width: mainW, padding: pad, boxSizing: 'border-box', flex: 1 }}>
      {/* Header in main column */}
      <div style={{ marginBottom: gs.sectionGap * 1.2, paddingBottom: gs.sectionGap, borderBottom: `2px solid ${gs.accentColor}` }}>
        <h1 style={{ fontSize: gs.nameSize, fontWeight: gs.nameBold ? 800 : 400, color: gs.bodyTextColor, margin: '0 0 3px', lineHeight: 1.1, fontFamily: ff }}>{info.full_name || 'Your Name'}</h1>
        {info.profession && <p style={{ fontSize: gs.baseFontSize + 1, color: gs.accentColor, margin: '0 0 8px', fontFamily: ff, fontWeight: 500 }}>{info.profession}</p>}
        {!photoInSidebar && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
            {contacts.map((c, i) => c.h
              ? <a key={i} href={c.h} style={{ fontSize: gs.baseFontSize - 2, color: gs.mutedTextColor, fontFamily: ff, textDecoration: 'none' }}>{c.v}</a>
              : <span key={i} style={{ fontSize: gs.baseFontSize - 2, color: gs.mutedTextColor, fontFamily: ff }}>{c.v}</span>
            )}
          </div>
        )}
      </div>
      {finalMain.map(s => renderSection(s, false))}
      {userSections.map(s => s.content?.trim() ? (
        <div key={s.id} style={{ marginBottom: gs.sectionGap }}>
          <div style={{ marginBottom: 6 }}>
            <h2 style={makeTitleStyle(gs)}>{s.label}</h2>
            {gs.showDividers && <div style={{ marginTop: 4, borderTop: `1px ${gs.dividerStyle} ${gs.borderColor}` }} />}
          </div>
          {s.content.split('\n').map((line, i) => <p key={i} style={{ margin: '2px 0', fontSize: gs.baseFontSize, color: gs.bodyTextColor, lineHeight: 1.7, fontFamily: ff }}>{line || <br/>}</p>)}
        </div>
      ) : null)}
    </div>
  )

  return (
    <div style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, background: gs.backgroundColor, display: 'flex', boxSizing: 'border-box' }}>
      {sidebarLeft ? <>{sidebarEl}{mainEl}</> : <>{mainEl}{sidebarEl}</>}
    </div>
  )
}

// ── MODERN GRADIENT SIDEBAR ───────────────────────────────────
// Dark/gradient sidebar with white text, bold name in main
const ModernSidebarLayout = ({ gs, sections, data, userSections, pad }) => {
  const ff = `'${gs.fontFamily}', sans-serif`
  const sidebarW = Math.round(A4_WIDTH * gs.sidebarWidth / 100)
  const mainW    = A4_WIDTH - sidebarW

  const gradBg = gs.gradientSidebar
    ? `linear-gradient(175deg, ${gs.gradientFrom || gs.accentColor} 0%, ${gs.gradientTo || gs.accentColor + '99'} 100%)`
    : gs.sidebarBg

  const isLight = !gs.gradientSidebar
  const sText   = isLight ? gs.bodyTextColor : '#ffffff'
  const sMuted  = isLight ? gs.mutedTextColor : 'rgba(255,255,255,0.65)'
  const sAccent = isLight ? gs.accentColor : 'rgba(255,255,255,0.9)'
  const sBorder = isLight ? gs.borderColor : 'rgba(255,255,255,0.18)'
  const sTitleColor = isLight ? gs.sectionTitleColor : '#ffffff'

  const sideGs = { ...gs, bodyTextColor: sText, mutedTextColor: sMuted, sectionTitleColor: sTitleColor, borderColor: sBorder, accentColor: sAccent, skillBg: isLight ? gs.skillBg : 'rgba(255,255,255,0.18)', skillColor: isLight ? gs.skillColor : '#ffffff' }

  const info = data.personal_info || {}
  const contacts = [
    info.email    && { v: info.email,    h: `mailto:${info.email}` },
    info.phone    && { v: info.phone,    h: `tel:${info.phone.replace(/\s/g,'')}` },
    info.location && { v: info.location, h: null },
    info.linkedin && { v: info.linkedin, h: info.linkedin.startsWith('http') ? info.linkedin : `https://${info.linkedin}` },
    info.website  && { v: info.website,  h: info.website.startsWith('http') ? info.website : `https://${info.website}` },
  ].filter(Boolean)

  const sidebarSecs = sections.filter(s => s.inSidebar)
  const mainSecs    = sections.filter(s => !s.inSidebar)
  const finalSide   = sidebarSecs.length ? sidebarSecs : sections.slice(0, 2)
  const finalMain   = sidebarSecs.length ? mainSecs    : sections.slice(2)

  const renderSec = (s, sgs) => {
    const body = <SectionBody section={s} data={data} gs={sgs} />
    if (!body) return null
    return (
      <div key={s.id} style={{ marginBottom: sgs.sectionGap }}>
        <div style={{ marginBottom: 6 }}>
          <h2 style={{ ...makeTitleStyle(sgs), color: sgs.sectionTitleColor }}>{s.label}</h2>
          {sgs.showDividers && <div style={{ marginTop: 4, borderTop: `1px ${sgs.dividerStyle} ${sgs.borderColor}` }} />}
        </div>
        {body}
      </div>
    )
  }

  return (
    <div style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, background: gs.backgroundColor, display: 'flex', boxSizing: 'border-box' }}>
      {/* Sidebar */}
      <div style={{ width: sidebarW, minHeight: A4_HEIGHT, background: gradBg, padding: pad, boxSizing: 'border-box', flexShrink: 0 }}>
        {gs.showPhoto && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: gs.sectionGap }}>
            <Photo src={info.image} gs={gs} size={88} />
          </div>
        )}
        {/* Contact block in sidebar */}
        <div style={{ marginBottom: gs.sectionGap * 1.2 }}>
          <h2 style={{ fontSize: sideGs.sectionTitleSize, fontWeight: 700, color: sTitleColor, textTransform: 'uppercase', letterSpacing: sideGs.sectionTitleLetterSpacing, margin: '0 0 6px', fontFamily: ff }}>Contact</h2>
          <div style={{ borderTop: `1px solid ${sBorder}`, marginBottom: 8 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {contacts.map((c, i) => c.h
              ? <a key={i} href={c.h} style={{ fontSize: gs.baseFontSize - 2, color: sMuted, fontFamily: ff, textDecoration: 'none', wordBreak: 'break-all' }}>{c.v}</a>
              : <span key={i} style={{ fontSize: gs.baseFontSize - 2, color: sMuted, fontFamily: ff }}>{c.v}</span>
            )}
          </div>
        </div>
        {finalSide.map(s => renderSec(s, sideGs))}
      </div>
      {/* Main */}
      <div style={{ width: mainW, padding: pad, boxSizing: 'border-box', flex: 1 }}>
        <div style={{ marginBottom: gs.sectionGap * 1.3, paddingBottom: gs.sectionGap }}>
          <h1 style={{ fontSize: gs.nameSize, fontWeight: gs.nameBold ? 800 : 400, color: gs.bodyTextColor, margin: '0 0 3px', lineHeight: 1.1, fontFamily: ff }}>{info.full_name || 'Your Name'}</h1>
          {info.profession && <p style={{ fontSize: gs.baseFontSize + 2, color: gs.accentColor, margin: 0, fontFamily: ff, fontWeight: 500 }}>{info.profession}</p>}
        </div>
        {finalMain.map(s => renderSec(s, gs))}
        {userSections.map(s => s.content?.trim() ? (
          <div key={s.id} style={{ marginBottom: gs.sectionGap }}>
            <h2 style={makeTitleStyle(gs)}>{s.label}</h2>
            {gs.showDividers && <div style={{ marginTop: 4, marginBottom: 6, borderTop: `1px solid ${gs.borderColor}` }} />}
            {s.content.split('\n').map((ln, i) => <p key={i} style={{ margin: '2px 0', fontSize: gs.baseFontSize, color: gs.bodyTextColor, lineHeight: 1.7, fontFamily: ff }}>{ln || <br/>}</p>)}
          </div>
        ) : null)}
      </div>
    </div>
  )
}

// ── SPLIT HEADER — Wide color bar with name+title left, contact right
const SplitHeaderLayout = ({ gs, sections, data, userSections, pad }) => {
  const ff = `'${gs.fontFamily}', sans-serif`
  const info = data.personal_info || {}
  const contacts = [
    info.email    && { v: info.email },
    info.phone    && { v: info.phone },
    info.location && { v: info.location },
    info.linkedin && { v: info.linkedin },
    info.website  && { v: info.website },
  ].filter(Boolean)

  return (
    <div style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, background: gs.backgroundColor, boxSizing: 'border-box' }}>
      {/* Split header bar */}
      <div style={{ background: gs.headerBg, padding: `${pad * 0.85}px ${pad}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
        <div style={{ flex: 1 }}>
          {gs.showPhoto && (gs.photoPosition === 'top-left' || gs.photoPosition === 'sidebar') && (
            <div style={{ marginBottom: 10 }}><Photo src={info.image} gs={gs} size={64} /></div>
          )}
          <h1 style={{ fontSize: gs.nameSize * 0.85, fontWeight: gs.nameBold ? 800 : 400, color: gs.headerTextColor, margin: '0 0 3px', lineHeight: 1.1, fontFamily: ff }}>{info.full_name || 'Your Name'}</h1>
          {info.profession && <p style={{ fontSize: gs.baseFontSize, color: gs.headerTextColor + 'bb', margin: 0, fontFamily: ff, fontWeight: 500, letterSpacing: 0.3 }}>{info.profession}</p>}
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          {contacts.map((c, i) => <span key={i} style={{ fontSize: gs.baseFontSize - 2, color: gs.headerTextColor + 'bb', fontFamily: ff }}>{c.v}</span>)}
        </div>
      </div>
      {/* Thin accent stripe */}
      <div style={{ height: 3, background: gs.accentColor + '55' }} />
      <div style={{ padding: `${gs.sectionGap}px ${pad}px ${pad}px` }}>
        {sections.map(s => {
          const body = <SectionBody section={s} data={data} gs={gs} />
          if (!body) return null
          return (
            <div key={s.id} style={{ marginBottom: gs.sectionGap }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                <h2 style={makeTitleStyle(gs)}>{s.label}</h2>
                {gs.showDividers && <div style={{ flex: 1, borderTop: `1px ${gs.dividerStyle} ${gs.borderColor}` }} />}
              </div>
              {body}
            </div>
          )
        })}
        {userSections.map(s => s.content?.trim() ? (
          <div key={s.id} style={{ marginBottom: gs.sectionGap }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <h2 style={makeTitleStyle(gs)}>{s.label}</h2>
              {gs.showDividers && <div style={{ flex: 1, borderTop: `1px ${gs.dividerStyle} ${gs.borderColor}` }} />}
            </div>
            {s.content.split('\n').map((ln, i) => <p key={i} style={{ margin: '2px 0', fontSize: gs.baseFontSize, color: gs.bodyTextColor, lineHeight: 1.7, fontFamily: ff }}>{ln || <br/>}</p>)}
          </div>
        ) : null)}
      </div>
    </div>
  )
}

// ── CENTERED — Everything centered, elegant portrait style ────
const CenteredLayout = ({ gs, sections, data, userSections, pad }) => {
  const ff = `'${gs.fontFamily}', sans-serif`
  const info = data.personal_info || {}
  const contacts = [info.email, info.phone, info.location, info.linkedin, info.website].filter(Boolean)

  return (
    <div style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, background: gs.backgroundColor, boxSizing: 'border-box' }}>
      {/* Centered header */}
      <div style={{ textAlign: 'center', padding: `${pad}px ${pad}px ${pad * 0.6}px` }}>
        {gs.showPhoto && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Photo src={info.image} gs={gs} size={80} />
          </div>
        )}
        <h1 style={{ fontSize: gs.nameSize, fontWeight: gs.nameBold ? 800 : 400, color: gs.bodyTextColor, margin: '0 0 4px', lineHeight: 1.1, fontFamily: ff, letterSpacing: -0.5 }}>{info.full_name || 'Your Name'}</h1>
        {info.profession && <p style={{ fontSize: gs.baseFontSize + 1, color: gs.accentColor, margin: '0 0 10px', fontFamily: ff, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>{info.profession}</p>}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '3px 0' }}>
          {contacts.map((v, i) => (
            <React.Fragment key={i}>
              <span style={{ fontSize: gs.baseFontSize - 2, color: gs.mutedTextColor, fontFamily: ff }}>{v}</span>
              {i < contacts.length - 1 && <span style={{ fontSize: gs.baseFontSize - 2, color: gs.borderColor, margin: '0 8px' }}>|</span>}
            </React.Fragment>
          ))}
        </div>
        {/* Double rule */}
        <div style={{ marginTop: 14, borderTop: `2px solid ${gs.accentColor}` }} />
        <div style={{ marginTop: 2, borderTop: `1px solid ${gs.borderColor}` }} />
      </div>
      <div style={{ padding: `4px ${pad}px ${pad}px` }}>
        {sections.map(s => {
          const body = <SectionBody section={s} data={data} gs={gs} />
          if (!body) return null
          return (
            <div key={s.id} style={{ marginBottom: gs.sectionGap }}>
              {/* Centered section title with flanking lines */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1, borderTop: `1px ${gs.dividerStyle} ${gs.borderColor}` }} />
                <h2 style={{ ...makeTitleStyle(gs), margin: 0 }}>{s.label}</h2>
                <div style={{ flex: 1, borderTop: `1px ${gs.dividerStyle} ${gs.borderColor}` }} />
              </div>
              {body}
            </div>
          )
        })}
        {userSections.map(s => s.content?.trim() ? (
          <div key={s.id} style={{ marginBottom: gs.sectionGap }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ flex: 1, borderTop: `1px ${gs.dividerStyle} ${gs.borderColor}` }} />
              <h2 style={{ ...makeTitleStyle(gs), margin: 0 }}>{s.label}</h2>
              <div style={{ flex: 1, borderTop: `1px ${gs.dividerStyle} ${gs.borderColor}` }} />
            </div>
            {s.content.split('\n').map((ln, i) => <p key={i} style={{ margin: '2px 0', fontSize: gs.baseFontSize, color: gs.bodyTextColor, lineHeight: 1.7, fontFamily: ff, textAlign: 'center' }}>{ln || <br/>}</p>)}
          </div>
        ) : null)}
      </div>
    </div>
  )
}

// ── MINIMAL — Ultra-clean, pure typography, zero decoration ───
const MinimalLayout = ({ gs, sections, data, userSections, pad }) => {
  const ff = `'${gs.fontFamily}', sans-serif`
  const info = data.personal_info || {}
  const contacts = [info.email, info.phone, info.location, info.linkedin, info.website].filter(Boolean)

  return (
    <div style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, background: gs.backgroundColor, boxSizing: 'border-box' }}>
      <div style={{ padding: `${pad}px ${pad * 1.1}px` }}>
        {/* Stripped-down header — name massive, everything understated */}
        <div style={{ paddingBottom: gs.sectionGap, marginBottom: gs.sectionGap, borderBottom: `1px solid ${gs.bodyTextColor}` }}>
          {gs.showPhoto && gs.photoPosition === 'top-left' && (
            <div style={{ marginBottom: 12 }}><Photo src={info.image} gs={gs} size={60} /></div>
          )}
          <h1 style={{ fontSize: gs.nameSize * 1.05, fontWeight: gs.nameBold ? 700 : 300, color: gs.bodyTextColor, margin: '0 0 2px', lineHeight: 1, fontFamily: ff, letterSpacing: -1 }}>{info.full_name || 'Your Name'}</h1>
          {info.profession && <p style={{ fontSize: gs.baseFontSize, color: gs.mutedTextColor, margin: '4px 0 10px', fontFamily: ff, fontWeight: 400 }}>{info.profession}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 18px' }}>
            {contacts.map((v, i) => <span key={i} style={{ fontSize: gs.baseFontSize - 2, color: gs.mutedTextColor, fontFamily: ff }}>{v}</span>)}
          </div>
        </div>
        {/* Sections: label left, thin rule, content — zero extra chrome */}
        {sections.map(s => {
          const body = <SectionBody section={s} data={data} gs={gs} />
          if (!body) return null
          return (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: `0 ${gs.pagePadding * 0.5}px`, marginBottom: gs.sectionGap }}>
              <div style={{ paddingTop: 2, borderTop: `1px solid ${gs.accentColor}` }}>
                <h2 style={{ fontSize: gs.sectionTitleSize - 1, fontWeight: 700, color: gs.accentColor, textTransform: gs.sectionTitleUppercase ? 'uppercase' : 'none', letterSpacing: gs.sectionTitleLetterSpacing, margin: '5px 0 0', fontFamily: ff }}>{s.label}</h2>
              </div>
              <div style={{ paddingTop: 2, borderTop: `1px solid ${gs.borderColor}` }}>{body}</div>
            </div>
          )
        })}
        {userSections.map(s => s.content?.trim() ? (
          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: `0 ${gs.pagePadding * 0.5}px`, marginBottom: gs.sectionGap }}>
            <div style={{ paddingTop: 2, borderTop: `1px solid ${gs.accentColor}` }}>
              <h2 style={{ fontSize: gs.sectionTitleSize - 1, fontWeight: 700, color: gs.accentColor, textTransform: gs.sectionTitleUppercase ? 'uppercase' : 'none', letterSpacing: gs.sectionTitleLetterSpacing, margin: '5px 0 0', fontFamily: ff }}>{s.label}</h2>
            </div>
            <div style={{ paddingTop: 2, borderTop: `1px solid ${gs.borderColor}` }}>
              {s.content.split('\n').map((ln, i) => <p key={i} style={{ margin: '2px 0', fontSize: gs.baseFontSize, color: gs.bodyTextColor, lineHeight: 1.7, fontFamily: ff }}>{ln || <br/>}</p>)}
            </div>
          </div>
        ) : null)}
      </div>
    </div>
  )
}

// ── TIMELINE — Left-rail timeline with dot markers ────────────
const TimelineLayout = ({ gs, sections, data, userSections, pad }) => {
  const ff = `'${gs.fontFamily}', sans-serif`
  const info = data.personal_info || {}
  const contacts = [info.email, info.phone, info.location, info.linkedin, info.website].filter(Boolean)
  const dotSize = gs.timelineDotSize || 8

  return (
    <div style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, background: gs.backgroundColor, boxSizing: 'border-box' }}>
      {/* Header with accent left border */}
      <div style={{ borderLeft: `4px solid ${gs.accentColor}`, paddingLeft: 18, margin: `${pad}px ${pad}px ${gs.sectionGap}px`, paddingTop: 4, paddingBottom: 4 }}>
        <h1 style={{ fontSize: gs.nameSize, fontWeight: gs.nameBold ? 800 : 400, color: gs.bodyTextColor, margin: '0 0 3px', lineHeight: 1.1, fontFamily: ff }}>{info.full_name || 'Your Name'}</h1>
        {info.profession && <p style={{ fontSize: gs.baseFontSize + 1, color: gs.accentColor, margin: '0 0 7px', fontFamily: ff, fontWeight: 500 }}>{info.profession}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px' }}>
          {contacts.map((v, i) => <span key={i} style={{ fontSize: gs.baseFontSize - 2, color: gs.mutedTextColor, fontFamily: ff }}>{v}</span>)}
        </div>
      </div>
      {/* Timeline sections */}
      <div style={{ padding: `0 ${pad}px ${pad}px`, paddingLeft: pad + 4 }}>
        {sections.map((s, idx) => {
          const body = <SectionBody section={s} data={data} gs={gs} />
          if (!body) return null
          const isLast = idx === sections.length - 1 && !userSections.length
          return (
            <div key={s.id} style={{ display: 'flex', gap: 0, marginBottom: gs.sectionGap, position: 'relative' }}>
              {/* Timeline rail + dot */}
              <div style={{ width: 28, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <div style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: gs.accentColor, flexShrink: 0, marginTop: 4, zIndex: 1 }} />
                {!isLast && <div style={{ flex: 1, width: 1.5, background: gs.accentColor + '35', marginTop: 4 }} />}
              </div>
              <div style={{ flex: 1, paddingTop: 0 }}>
                <h2 style={{ ...makeTitleStyle(gs), marginBottom: 7 }}>{s.label}</h2>
                {body}
              </div>
            </div>
          )
        })}
        {userSections.map(s => s.content?.trim() ? (
          <div key={s.id} style={{ display: 'flex', gap: 0, marginBottom: gs.sectionGap }}>
            <div style={{ width: 28, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: gs.accentColor, flexShrink: 0, marginTop: 4 }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ ...makeTitleStyle(gs), marginBottom: 7 }}>{s.label}</h2>
              {s.content.split('\n').map((ln, i) => <p key={i} style={{ margin: '2px 0', fontSize: gs.baseFontSize, color: gs.bodyTextColor, lineHeight: 1.7, fontFamily: ff }}>{ln || <br/>}</p>)}
            </div>
          </div>
        ) : null)}
      </div>
    </div>
  )
}

// ── BOXED — Each section in a labeled border box ─────────────
const BoxedLayout = ({ gs, sections, data, userSections, pad }) => {
  const ff = `'${gs.fontFamily}', sans-serif`
  const info = data.personal_info || {}
  const contacts = [info.email, info.phone, info.location, info.linkedin, info.website].filter(Boolean)
  const r = gs.cardRadius || 6
  const bw = gs.boxedBorderWidth || 1

  return (
    <div style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, background: gs.backgroundColor, boxSizing: 'border-box' }}>
      {/* Header box */}
      <div style={{ margin: `${pad}px ${pad}px ${gs.sectionGap}px`, background: gs.headerBg, borderRadius: r, padding: `${pad * 0.7}px ${pad * 0.8}px`, ...(gs.cardShadow ? { boxShadow: '0 2px 10px rgba(0,0,0,0.1)' } : {}) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
          <div>
            {gs.showPhoto && <div style={{ marginBottom: 10 }}><Photo src={info.image} gs={gs} size={60} /></div>}
            <h1 style={{ fontSize: gs.nameSize * 0.88, fontWeight: gs.nameBold ? 800 : 400, color: gs.headerTextColor, margin: '0 0 3px', lineHeight: 1.1, fontFamily: ff }}>{info.full_name || 'Your Name'}</h1>
            {info.profession && <p style={{ fontSize: gs.baseFontSize, color: gs.headerTextColor + 'cc', margin: 0, fontFamily: ff, fontWeight: 500 }}>{info.profession}</p>}
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {contacts.map((v, i) => <span key={i} style={{ fontSize: gs.baseFontSize - 2, color: gs.headerTextColor + 'bb', fontFamily: ff }}>{v}</span>)}
          </div>
        </div>
      </div>
      {/* Section boxes */}
      <div style={{ padding: `0 ${pad}px ${pad}px`, display: 'grid', gap: gs.sectionGap * 0.75 }}>
        {sections.map(s => {
          const body = <SectionBody section={s} data={data} gs={gs} />
          if (!body) return null
          return (
            <div key={s.id} style={{ border: `${bw}px solid ${gs.borderColor}`, borderRadius: r, overflow: 'hidden', ...(gs.cardShadow ? { boxShadow: '0 1px 5px rgba(0,0,0,0.05)' } : {}) }}>
              {/* Section title bar */}
              <div style={{ background: gs.accentColor + '12', borderBottom: `${bw}px solid ${gs.borderColor}`, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 14, background: gs.accentColor, borderRadius: 2, flexShrink: 0 }} />
                <h2 style={{ ...makeTitleStyle(gs), color: gs.sectionTitleColor }}>{s.label}</h2>
              </div>
              <div style={{ padding: '10px 14px' }}>{body}</div>
            </div>
          )
        })}
        {userSections.map(s => s.content?.trim() ? (
          <div key={s.id} style={{ border: `${bw}px solid ${gs.borderColor}`, borderRadius: r, overflow: 'hidden' }}>
            <div style={{ background: gs.accentColor + '12', borderBottom: `${bw}px solid ${gs.borderColor}`, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 14, background: gs.accentColor, borderRadius: 2 }} />
              <h2 style={{ ...makeTitleStyle(gs), color: gs.sectionTitleColor }}>{s.label}</h2>
            </div>
            <div style={{ padding: '10px 14px' }}>
              {s.content.split('\n').map((ln, i) => <p key={i} style={{ margin: '2px 0', fontSize: gs.baseFontSize, color: gs.bodyTextColor, lineHeight: 1.7, fontFamily: ff }}>{ln || <br/>}</p>)}
            </div>
          </div>
        ) : null)}
      </div>
    </div>
  )
}

// ── CARD — Floating cards on a tinted background ─────────────
const CardLayout = ({ gs, sections, data, userSections, pad }) => {
  const ff = `'${gs.fontFamily}', sans-serif`
  const info = data.personal_info || {}
  const contacts = [info.email, info.phone, info.location, info.linkedin, info.website].filter(Boolean)
  const r = gs.cardRadius || 8

  return (
    <div style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, background: gs.sidebarBg || '#f1f5f9', boxSizing: 'border-box' }}>
      {/* Hero card header */}
      <div style={{ background: gs.headerBg, borderRadius: `0 0 ${r * 2}px ${r * 2}px`, padding: `${pad}px ${pad}px ${pad * 0.9}px`, marginBottom: gs.sectionGap, ...(gs.cardShadow ? { boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } : {}) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {gs.showPhoto && <Photo src={info.image} gs={gs} size={72} />}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: gs.nameSize * 0.9, fontWeight: gs.nameBold ? 800 : 400, color: gs.headerTextColor, margin: '0 0 3px', lineHeight: 1.1, fontFamily: ff }}>{info.full_name || 'Your Name'}</h1>
            {info.profession && <p style={{ fontSize: gs.baseFontSize + 1, color: gs.headerTextColor + 'bb', margin: '0 0 8px', fontFamily: ff, fontWeight: 400 }}>{info.profession}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
              {contacts.map((v, i) => <span key={i} style={{ fontSize: gs.baseFontSize - 2, color: gs.headerTextColor + '99', fontFamily: ff }}>{v}</span>)}
            </div>
          </div>
        </div>
      </div>
      {/* Section cards */}
      <div style={{ padding: `0 ${pad}px ${pad}px`, display: 'grid', gap: gs.sectionGap * 0.7 }}>
        {sections.map(s => {
          const body = <SectionBody section={s} data={data} gs={gs} />
          if (!body) return null
          return (
            <div key={s.id} style={{ background: gs.backgroundColor, borderRadius: r, padding: `12px ${pad * 0.7}px`, ...(gs.cardShadow ? { boxShadow: '0 1px 8px rgba(0,0,0,0.07)' } : {}) }}>
              <div style={{ paddingBottom: 8, marginBottom: 9, borderBottom: `2px solid ${gs.accentColor}22` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 4, height: 16, background: gs.accentColor, borderRadius: 2 }} />
                  <h2 style={makeTitleStyle(gs)}>{s.label}</h2>
                </div>
              </div>
              {body}
            </div>
          )
        })}
        {userSections.map(s => s.content?.trim() ? (
          <div key={s.id} style={{ background: gs.backgroundColor, borderRadius: r, padding: `12px ${pad * 0.7}px`, ...(gs.cardShadow ? { boxShadow: '0 1px 8px rgba(0,0,0,0.07)' } : {}) }}>
            <div style={{ paddingBottom: 8, marginBottom: 9, borderBottom: `2px solid ${gs.accentColor}22` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 4, height: 16, background: gs.accentColor, borderRadius: 2 }} />
                <h2 style={makeTitleStyle(gs)}>{s.label}</h2>
              </div>
            </div>
            {s.content.split('\n').map((ln, i) => <p key={i} style={{ margin: '2px 0', fontSize: gs.baseFontSize, color: gs.bodyTextColor, lineHeight: 1.7, fontFamily: ff }}>{ln || <br/>}</p>)}
          </div>
        ) : null)}
      </div>
    </div>
  )
}

// ── COMPACT — Dense single column, small spacing, max content ─
const CompactLayout = ({ gs, sections, data, userSections, pad }) => {
  const cgs = { ...gs, sectionGap: Math.max(8, Math.round(gs.sectionGap * 0.58)), itemGap: Math.max(4, Math.round(gs.itemGap * 0.6)), baseFontSize: Math.max(10, gs.baseFontSize - 1), sectionTitleSize: Math.max(9, gs.sectionTitleSize - 1) }
  const ff = `'${gs.fontFamily}', sans-serif`
  const info = data.personal_info || {}
  const contacts = [info.email, info.phone, info.location, info.linkedin, info.website].filter(Boolean)

  return (
    <div style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, background: gs.backgroundColor, boxSizing: 'border-box' }}>
      <div style={{ padding: `${pad * 0.75}px ${pad}px ${pad * 0.5}px`, borderBottom: `2px solid ${gs.accentColor}`, marginBottom: cgs.sectionGap }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: gs.nameSize * 0.78, fontWeight: gs.nameBold ? 800 : 400, color: gs.bodyTextColor, margin: '0 0 1px', lineHeight: 1.1, fontFamily: ff }}>{info.full_name || 'Your Name'}</h1>
            {info.profession && <p style={{ fontSize: gs.baseFontSize - 1, color: gs.accentColor, margin: 0, fontFamily: ff, fontWeight: 600 }}>{info.profession}</p>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 10px', justifyContent: 'flex-end', maxWidth: 300 }}>
            {contacts.map((v, i) => <span key={i} style={{ fontSize: gs.baseFontSize - 2.5, color: gs.mutedTextColor, fontFamily: ff }}>{v}</span>)}
          </div>
        </div>
      </div>
      <div style={{ padding: `0 ${pad}px ${pad}px` }}>
        {sections.map(s => {
          const body = <SectionBody section={s} data={data} gs={cgs} />
          if (!body) return null
          return (
            <div key={s.id} style={{ marginBottom: cgs.sectionGap }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h2 style={{ ...makeTitleStyle(cgs), color: cgs.sectionTitleColor }}>{s.label}</h2>
                <div style={{ flex: 1, borderTop: `1px ${gs.dividerStyle} ${gs.borderColor}` }} />
              </div>
              {body}
            </div>
          )
        })}
        {userSections.map(s => s.content?.trim() ? (
          <div key={s.id} style={{ marginBottom: cgs.sectionGap }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h2 style={{ ...makeTitleStyle(cgs), color: cgs.sectionTitleColor }}>{s.label}</h2>
              <div style={{ flex: 1, borderTop: `1px ${gs.dividerStyle} ${gs.borderColor}` }} />
            </div>
            {s.content.split('\n').map((ln, i) => <p key={i} style={{ margin: '1px 0', fontSize: cgs.baseFontSize, color: gs.bodyTextColor, lineHeight: 1.55, fontFamily: ff }}>{ln || <br/>}</p>)}
          </div>
        ) : null)}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// DynamicResumeRenderer — main export
// ═════════════════════════════════════════════════════════════
const DynamicResumeRenderer = ({
  globalStyle: gsProp = {},
  userStyling = {},
  sections    = [],
  data        = {},
  paginate    = false,
}) => {
  const gs = mergeGlobalStyle({ ...gsProp, ...userStyling })
  useEffect(() => { loadFont(gs.fontFamily) }, [gs.fontFamily])

  if (paginate) {
    return (
      <Suspense fallback={<div style={{ width: A4_WIDTH, height: A4_HEIGHT, background: gs.backgroundColor }} />}>
        <ResumePaginated globalStyle={gsProp} sections={sections} data={data} />
      </Suspense>
    )
  }

  const vis  = [...sections].filter(s => s.visible).sort((a, b) => a.order - b.order)
  const ucs  = (data.userCustomSections || []).filter(s => s.content?.trim())
  const pad  = gs.pagePadding
  const layout = gs.layout || 'single'

  const props = { gs, sections: vis, data, userSections: ucs, pad }

  switch (layout) {
    case 'two-col-left':   return <TwoColLayout    {...props} sidebarLeft={true}  />
    case 'two-col-right':  return <TwoColLayout    {...props} sidebarLeft={false} />
    case 'modern-sidebar': return <ModernSidebarLayout {...props} />
    case 'split-header':   return <SplitHeaderLayout  {...props} />
    case 'centered':       return <CenteredLayout      {...props} />
    case 'minimal':        return <MinimalLayout        {...props} />
    case 'timeline':       return <TimelineLayout       {...props} />
    case 'boxed':          return <BoxedLayout           {...props} />
    case 'card':           return <CardLayout             {...props} />
    case 'compact':        return <CompactLayout          {...props} />
    case 'single':
    case 'banner':
    default:
      return <SingleLayout {...props} />
  }
}

export default DynamicResumeRenderer