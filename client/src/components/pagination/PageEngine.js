// ═══════════════════════════════════════════════════════════════
// PageEngine.js — Pure JS, zero React, zero DOM
//
// Receives measured pixel heights and produces a page map.
//
// ALGORITHM
// ───────────────────────────────────────────────────────────────
//   For each visible section (sorted by order):
//
//   1. Does it fit entirely on the current page?
//      YES → add it, advance usedHeight
//
//   2. Is it a splittable section (experience / education / projects)?
//      YES → try to fit as many items as possible on current page.
//        • If 0 items fit → flush page, put whole section on next page
//        • If ≥1 items fit but some remain → flush page, continue
//          remaining items on next page (recursing through the loop)
//
//   3. Not splittable (summary, skills) and doesn't fit?
//      → flush page, put section at top of next page
//
//   ORPHAN RULE: section title always accompanies ≥1 item.
//   A title without items is never left at the bottom of a page.
//
//   SAFETY MARGIN: 48 px bottom buffer so content is never clipped.
// ═══════════════════════════════════════════════════════════════

export const A4_HEIGHT    = 1123
const BOTTOM_MARGIN       = 48    // px safety buffer at bottom of each page

// Section IDs whose entries can be split across pages one-by-one
const SPLITTABLE = new Set(['experience', 'education', 'projects'])

const canSplit = (id) => SPLITTABLE.has(id) || String(id).startsWith('custom_')

// ─────────────────────────────────────────────────────────────
// buildPages
//
// sections        — sections with __items__ already attached via attachItems()
// measuredHeights — { [sectionId]: px, [`${sectionId}__title`]: px }
// itemHeights     — { [sectionId]: number[] }   per-item heights
// pagePadding     — gs.pagePadding
// headerHeight    — measured height of the header block (page 1 only)
//
// Returns: Page[]
//   Page = { isFirst: boolean, sections: Slice[] }
//   Slice = { section: object, items: array|null }
//     items null  → render all items for this section
//     items array → render only these items (split scenario)
// ─────────────────────────────────────────────────────────────
export function buildPages({
  sections,
  measuredHeights,
  itemHeights,
  pagePadding,
  headerHeight,
}) {
  const PAGE_SAFE = A4_HEIGHT - pagePadding - BOTTOM_MARGIN

  const pages   = []
  let curPage   = { isFirst: true,  sections: [] }
  let usedH     = (headerHeight || 0)   // page 1 already has the header

  const flushPage = () => {
    if (curPage.sections.length > 0) pages.push(curPage)
    curPage = { isFirst: false, sections: [] }
    usedH   = 0
  }

  for (const section of sections) {
    const totalH = measuredHeights[section.id] ?? 100
    const itemHs = itemHeights[section.id]     ?? []

    // ── Case 1: fits entirely ─────────────────────────────
    if (usedH + totalH <= PAGE_SAFE) {
      curPage.sections.push({ section, items: null })
      usedH += totalH
      continue
    }

    // ── Case 2: doesn't fit + not splittable ──────────────
    if (!canSplit(section.id) || itemHs.length === 0) {
      flushPage()
      curPage.sections.push({ section, items: null })
      usedH = totalH
      continue
    }

    // ── Case 3: splittable — split by items ───────────────
    const titleH    = measuredHeights[`${section.id}__title`] ?? 28
    const available = PAGE_SAFE - usedH - titleH
    const allItems  = section.__items__ || []

    const fitting   = []
    const remaining = []
    let   accumulated = 0

    for (let i = 0; i < allItems.length; i++) {
      const h = itemHs[i] ?? 80
      if (fitting.length === 0 && remaining.length === 0 && accumulated + h <= available) {
        // first item check
        fitting.push(allItems[i])
        accumulated += h
      } else if (remaining.length === 0 && accumulated + h <= available) {
        fitting.push(allItems[i])
        accumulated += h
      } else {
        remaining.push(allItems[i])
      }
    }

    // Orphan prevention: 0 items fit on this page
    if (fitting.length === 0) {
      flushPage()
      curPage.sections.push({ section, items: null })
      usedH = totalH
      continue
    }

    // Some items fit → put them on current page
    curPage.sections.push({ section, items: fitting })
    flushPage()

    // Remaining items start the next page
    if (remaining.length > 0) {
      const remainH = titleH + remaining.reduce((sum, _, i) => {
        return sum + (itemHs[fitting.length + i] ?? 80)
      }, 0)
      curPage.sections.push({ section, items: remaining })
      usedH = remainH
    }
  }

  // Push the last page
  if (curPage.sections.length > 0) pages.push(curPage)

  // Always return at least one page
  if (pages.length === 0) pages.push({ isFirst: true, sections: [] })

  return pages
}

// ─────────────────────────────────────────────────────────────
// attachItems
//
// Enriches each section with its real data items so
// PageEngine knows the count (and ResumePaginated can measure
// each item individually).
// ─────────────────────────────────────────────────────────────
export function attachItems(sections, data) {
  return sections.map((s) => ({
    ...s,
    __items__: getItems(s.id, data),
  }))
}

function getItems(sectionId, data) {
  switch (sectionId) {
    case 'experience': return data.experience || []
    case 'education':  return data.education  || []
    case 'projects':   return data.project    || []
    default:
      if (String(sectionId).startsWith('custom_')) {
        return data.customSections?.find((cs) => cs.id === sectionId)?.fields || []
      }
      return []
  }
}