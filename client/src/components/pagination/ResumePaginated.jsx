import React, { useRef, useState, useLayoutEffect } from 'react'
import { buildPages, attachItems } from './PageEngine'
import PageRenderer from './PageRenderer'
import {
  mergeGlobalStyle,
  loadFont,
  A4_WIDTH,
  A4_HEIGHT,
} from '../admin/DynamicResumeRenderer'

// ═══════════════════════════════════════════════════════════════
// ResumePaginated
//
// Smart multi-page resume renderer.
//
// FLOW
// ────────────────────────────────────────────────────────────────
// 1. MEASURE — Render all content off-screen in a hidden div.
//              Read pixel heights of: header, each section total,
//              each section title, and each individual item inside
//              splittable sections (experience / education / projects).
//
// 2. PLAN    — Pass measurements to PageEngine.buildPages() which
//              returns an array of page descriptors: each page knows
//              exactly which sections (and which item slices) to render.
//
// 3. RENDER  — Map page descriptors to <PageRenderer> components.
//              Pages are stacked vertically with a gap.
//              First page has id="resume-root" for PDF export.
//
// The hidden measurement div stays mounted at all times so that
// when data changes, useLayoutEffect re-fires immediately with
// accurate measurements before the browser repaints — zero flicker.
// ═══════════════════════════════════════════════════════════════

const PAGE_GAP = 24   // gap between stacked A4 pages in the viewer

const ResumePaginated = ({ globalStyle: gsProp = {}, sections = [], data = {} }) => {
  const gs = mergeGlobalStyle(gsProp)

  // Load Google Font so measurement has the right glyph widths
  React.useEffect(() => { loadFont(gs.fontFamily) }, [gs.fontFamily])

  const measureRef       = useRef(null)
  const [pages, setPages] = useState(null)

  // Sorted visible sections, enriched with their data items
  const visibleSections   = [...sections].filter((s) => s.visible).sort((a, b) => a.order - b.order)
  const sectionsWithItems = attachItems(visibleSections, data)

  // ── Measurement + page-building ───────────────────────────
  // useLayoutEffect: fires synchronously after DOM mutations,
  // before the browser repaints. This means:
  //   • The hidden measurement div is in the DOM when we measure
  //   • Pages are built before any visible repaint → no flicker
  //
  // Deps: stringified so React's shallow comparison catches deep changes.
  // JSON.stringify produces a primitive string — safe as a dep.
  useLayoutEffect(() => {
    const container = measureRef.current
    if (!container) return

    const heights = {}    // { [sectionId]: totalHeight, [`${id}__title`]: titleHeight }
    const itemHs  = {}    // { [sectionId]: number[] }

    // ── Header ──────────────────────────────────────────────
    const headerEl     = container.querySelector('[data-m="header"]')
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 80

    // ── Sections ─────────────────────────────────────────────
    for (const section of sectionsWithItems) {
      const secEl  = container.querySelector(`[data-m="s-${section.id}"]`)
      heights[section.id] = secEl ? secEl.getBoundingClientRect().height : 120

      const titleEl = container.querySelector(`[data-m="t-${section.id}"]`)
      if (titleEl) {
        heights[`${section.id}__title`] = titleEl.getBoundingClientRect().height
      }

      // Per-item heights for splittable sections
      const items = section.__items__ || []
      if (items.length > 0) {
        itemHs[section.id] = items.map((_, idx) => {
          const el = container.querySelector(`[data-m="i-${section.id}-${idx}"]`)
          return el ? el.getBoundingClientRect().height : 80
        })
      }
    }

    const builtPages = buildPages({
      sections:        sectionsWithItems,
      measuredHeights: heights,
      itemHeights:     itemHs,
      pagePadding:     gs.pagePadding,
      headerHeight,
    })

    setPages(builtPages)

  }, [
    // Remeasure whenever content or relevant style changes.
    // JSON.stringify is intentional — produces a stable primitive dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(data),
    JSON.stringify(visibleSections.map((s) => s.id)),
    gs.pagePadding,
    gs.fontFamily,
    gs.baseFontSize,
    gs.nameSize,
    gs.sectionGap,
    gs.itemGap,
    gs.layout,
    gs.sidebarWidth,
  ])

  // ── Hidden measurement div (always mounted) ───────────────
  // Positioned way off-screen so it never shows to the user.
  // aria-hidden and pointer-events:none for accessibility/safety.
  const measurementDiv = (
    <div
      ref={measureRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        top:           -99999,
        left:          -99999,
        width:         A4_WIDTH,
        visibility:    'hidden',
        pointerEvents: 'none',
        zIndex:        -9999,
      }}
    >
      {/* Header measurement */}
      <div data-m="header">
        <MeasureHeader data={data} gs={gs} />
      </div>

      {/* Section measurements */}
      {sectionsWithItems.map((section) => {
        const items = section.__items__ || []
        return (
          <div key={section.id} data-m={`s-${section.id}`}>
            {/* Title measurement */}
            <div data-m={`t-${section.id}`}>
              <MeasureTitle label={section.label} gs={gs} />
            </div>
            {/* Per-item measurements */}
            {items.map((item, idx) => (
              <div key={idx} data-m={`i-${section.id}-${idx}`}>
                <MeasureItem sectionId={section.id} item={item} gs={gs} />
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )

  // ── Loading state ─────────────────────────────────────────
  // Shows a blank A4 placeholder while measuring (first render only).
  if (!pages) {
    return (
      <>
        {measurementDiv}
        <div style={{ width: A4_WIDTH, height: A4_HEIGHT, backgroundColor: gs.backgroundColor }} />
      </>
    )
  }

  // ── Real pages ────────────────────────────────────────────
  return (
    <>
      {/* Keep measurement div so re-renders remeasure correctly */}
      {measurementDiv}

      <div style={{ display: 'flex', flexDirection: 'column', gap: PAGE_GAP }}>
        {pages.map((page, idx) => (
          <PageRenderer
            key={idx}
            page={page}
            globalStyle={gsProp}
            data={data}
            pageIndex={idx}
            totalPages={pages.length}
          />
        ))}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Measurement components
//
// These mirror the real rendering styles exactly so measured
// heights match what the user actually sees.
// fontFamily inline on every element to beat index.css * rule.
// ─────────────────────────────────────────────────────────────

const MeasureHeader = ({ data, gs }) => {
  const info     = data.personal_info || {}
  const ff       = `'${gs.fontFamily}', sans-serif`
  const isBanner = gs.headerStyle === 'full-color'
  const contacts = [info.email, info.phone, info.location, info.linkedin, info.website].filter(Boolean)

  return (
    <div style={{
      padding:      isBanner
        ? gs.pagePadding
        : `${gs.pagePadding}px ${gs.pagePadding}px 0`,
      marginBottom: gs.sectionGap,
    }}>
      <p style={{ fontSize: gs.nameSize, fontWeight: '700', margin: '0 0 4px 0', fontFamily: ff }}>
        {info.full_name || 'Name'}
      </p>
      {info.profession && (
        <p style={{ fontSize: gs.baseFontSize + 1, margin: '0 0 6px 0', fontFamily: ff }}>
          {info.profession}
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px' }}>
        {contacts.map((c, i) => (
          <span key={i} style={{ fontSize: gs.baseFontSize - 1, fontFamily: ff }}>{c}</span>
        ))}
      </div>
    </div>
  )
}

const MeasureTitle = ({ label, gs }) => {
  const ff = `'${gs.fontFamily}', sans-serif`
  return (
    <div style={{ marginBottom: gs.itemGap * 0.5 }}>
      <h2 style={{ fontSize: gs.sectionTitleSize, margin: 0, fontFamily: ff }}>{label}</h2>
      {gs.showDividers && (
        <div style={{ marginTop: 5, borderTop: `1px solid ${gs.borderColor}`, marginBottom: 6 }} />
      )}
    </div>
  )
}

// MeasureItem must exactly mirror the real item rendering
// so that measured heights are accurate
const MeasureItem = ({ sectionId, item, gs }) => {
  const ff     = `'${gs.fontFamily}', sans-serif`
  const bullet = gs.bulletStyle === 'dash' ? '— '
               : gs.bulletStyle === 'arrow' ? '→ '
               : gs.bulletStyle === 'none'  ? ''
               : '• '

  if (sectionId === 'experience') {
    return (
      <div style={{ marginBottom: gs.itemGap }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: gs.baseFontSize + 1, fontWeight: '700', margin: 0, fontFamily: ff }}>
              {item.position}
            </p>
            <p style={{ fontSize: gs.baseFontSize, margin: 0, fontFamily: ff }}>{item.company}</p>
          </div>
          <p style={{ fontSize: gs.baseFontSize - 1, margin: 0, fontFamily: ff, whiteSpace: 'nowrap' }}>
            {item.start_date}
          </p>
        </div>
        {item.description && item.description.split('\n').filter(Boolean).map((line, li) => (
          <p key={li} style={{ fontSize: gs.baseFontSize - 1, lineHeight: 1.6, margin: '1px 0', fontFamily: ff }}>
            {bullet}{line}
          </p>
        ))}
      </div>
    )
  }

  if (sectionId === 'education') {
    return (
      <div style={{ marginBottom: gs.itemGap }}>
        <p style={{ fontSize: gs.baseFontSize + 1, fontWeight: '700', margin: 0, fontFamily: ff }}>
          {item.degree}{item.field ? ` in ${item.field}` : ''}
        </p>
        <p style={{ fontSize: gs.baseFontSize, margin: 0, fontFamily: ff }}>{item.institution}</p>
        {item.gpa && (
          <p style={{ fontSize: gs.baseFontSize - 1, margin: 0, fontFamily: ff }}>GPA: {item.gpa}</p>
        )}
      </div>
    )
  }

  if (sectionId === 'projects') {
    return (
      <div style={{ marginBottom: gs.itemGap }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <p style={{ fontSize: gs.baseFontSize + 1, fontWeight: '700', margin: 0, fontFamily: ff }}>
            {item.name}
          </p>
          {item.type && (
            <p style={{ fontSize: gs.baseFontSize - 1, margin: 0, fontFamily: ff }}>{item.type}</p>
          )}
        </div>
        {item.description && item.description.split('\n').filter(Boolean).map((line, li) => (
          <p key={li} style={{ fontSize: gs.baseFontSize - 1, lineHeight: 1.6, margin: '1px 0', fontFamily: ff }}>
            {bullet}{line}
          </p>
        ))}
        {(item.liveUrl || item.githubUrl) && (
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            {item.liveUrl  && <span style={{ fontSize: gs.baseFontSize - 1, fontFamily: ff }}>Live Demo</span>}
            {item.githubUrl && <span style={{ fontSize: gs.baseFontSize - 1, fontFamily: ff }}>GitHub</span>}
          </div>
        )}
      </div>
    )
  }

  // Generic custom section item
  return (
    <div style={{ marginBottom: gs.itemGap }}>
      <p style={{ fontSize: gs.baseFontSize, margin: 0, fontFamily: ff }}>
        {item.label || item.value || String(item)}
      </p>
    </div>
  )
}

export default ResumePaginated