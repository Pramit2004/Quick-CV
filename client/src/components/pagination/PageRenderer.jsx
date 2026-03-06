import React from "react";
import {
  A4_WIDTH,
  A4_HEIGHT,
  Header,
  SectionTitle,
  SectionContent,
  Photo,
  mergeGlobalStyle,
} from "../admin/DynamicResumeRenderer";

// ═══════════════════════════════════════════════════════════════
// PageRenderer
//
// Renders exactly ONE A4 page from a page descriptor produced
// by PageEngine.buildPages().
//
// page.isFirst = true  → render full header
// page.isFirst = false → render a compact name + page-number bar
//
// page.sections = array of { section, items }
//   items null  → render all data for this section
//   items array → render only this slice (split across pages)
// ═══════════════════════════════════════════════════════════════

const PageRenderer = ({ page, globalStyle, data, pageIndex, totalPages }) => {
  const gs = mergeGlobalStyle(globalStyle);
  const isTwoCol =
    gs.layout === "two-col-left" || gs.layout === "two-col-right";
  const sidebarLeft = gs.layout === "two-col-left";
  const isBanner = gs.headerStyle === "full-color";
  const isFirst = page.isFirst;
  const contentPad = gs.pagePadding;
  const sidebarW = Math.round((A4_WIDTH * gs.sidebarWidth) / 100);
  const mainW = A4_WIDTH - sidebarW;
  const photoInSidebar = gs.showPhoto && gs.photoPosition === "sidebar";

  // ── Single column ──────────────────────────────────────────
  if (!isTwoCol) {
    return (
      <div
        id={isFirst ? "resume-root" : undefined}
        style={{
          width: A4_WIDTH,
          height: A4_HEIGHT,
          backgroundColor: gs.backgroundColor,
          boxSizing: "border-box",
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Full header — first page only */}
        {isFirst &&
          (isBanner ? (
            <div style={{ backgroundColor: gs.headerBg, padding: contentPad }}>
              <Header data={data} gs={gs} renderPhoto={gs.showPhoto} />
            </div>
          ) : (
            <div style={{ padding: `${contentPad}px ${contentPad}px 0` }}>
              <Header data={data} gs={gs} renderPhoto={gs.showPhoto} />
            </div>
          ))}

        {/* Continuation bar — page 2+ */}
        {!isFirst && (
          <ContinuationBar data={data} gs={gs} pageIndex={pageIndex} />
        )}

        {/* Sections */}
        <div
          style={{
            padding: isFirst
              ? `${gs.sectionGap}px ${contentPad}px ${contentPad}px`
              : `${gs.itemGap}px ${contentPad}px ${contentPad}px`,
          }}
        >
          {page.sections.map(({ section, items }, idx) => (
            <SplitSectionBlock
              key={`${section.id}-${idx}`}
              section={section}
              items={items}
              data={data}
              gs={gs}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Two column ─────────────────────────────────────────────
  // Sections flagged inSidebar go into the sidebar column.
  // If no sections are flagged, fall back: first 2 → sidebar, rest → main.
  const sidebarSlices = page.sections.filter((s) => s.section.inSidebar);
  const mainSlices = page.sections.filter((s) => !s.section.inSidebar);
  const finalSidebar =
    sidebarSlices.length > 0 ? sidebarSlices : page.sections.slice(0, 2);
  const finalMain =
    sidebarSlices.length > 0 ? mainSlices : page.sections.slice(2);

  const sidebarEl = (
    <div
      style={{
        width: sidebarW,
        height: A4_HEIGHT,
        backgroundColor: gs.sidebarBg,
        padding: contentPad,
        boxSizing: "border-box",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Photo in sidebar — first page only */}
      {isFirst && photoInSidebar && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: gs.sectionGap,
          }}
        >
          <Photo src={data.personal_info?.image} gs={gs} size={100} />
        </div>
      )}
      {finalSidebar.map(({ section, items }, idx) => (
        <SplitSectionBlock
          key={`sb-${section.id}-${idx}`}
          section={section}
          items={items}
          data={data}
          gs={gs}
        />
      ))}
    </div>
  );

  const mainEl = (
    <div
      style={{
        width: mainW,
        height: A4_HEIGHT,
        padding: contentPad,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {isFirst && (
        <Header
          data={data}
          gs={gs}
          renderPhoto={!photoInSidebar && gs.showPhoto}
        />
      )}
      {finalMain.map(({ section, items }, idx) => (
        <SplitSectionBlock
          key={`mn-${section.id}-${idx}`}
          section={section}
          items={items}
          data={data}
          gs={gs}
        />
      ))}
    </div>
  );

  return (
    <div
      id={isFirst ? "resume-root" : undefined}
      style={{
        width: A4_WIDTH,
        height: A4_HEIGHT,
        backgroundColor: gs.backgroundColor,
        display: "flex",
        flexShrink: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {sidebarLeft ? (
        <>
          {sidebarEl}
          {mainEl}
        </>
      ) : (
        <>
          {mainEl}
          {sidebarEl}
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ContinuationBar — shown on pages 2+ (single-col only)
// Name on left, page number on right.
// ─────────────────────────────────────────────────────────────
const ContinuationBar = ({ data, gs, pageIndex }) => {
  const info = data.personal_info || {};
  const ff = `'${gs.fontFamily}', sans-serif`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${gs.pagePadding}px ${gs.pagePadding}px ${gs.itemGap}px`,
        borderBottom: `1px solid ${gs.borderColor}`,
        marginBottom: gs.itemGap,
      }}
    >
      <p
        style={{
          fontSize: gs.baseFontSize,
          fontWeight: "600",
          color: gs.bodyTextColor,
          margin: 0,
          fontFamily: ff,
        }}
      >
        {info.full_name || ""}
      </p>
      <p
        style={{
          fontSize: gs.baseFontSize - 2,
          color: gs.mutedTextColor,
          margin: 0,
          fontFamily: ff,
        }}
      >
        Page {pageIndex + 1}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SplitSectionBlock
//
// Renders one section with an optional item slice.
//   items === null  → render all items (pass full data through)
//   items === array → inject only these items into data copy
//
// This is the mechanism that makes split pages work:
// SectionContent reads from data normally, but we've swapped
// the relevant array with just the items for this page.
// ─────────────────────────────────────────────────────────────
const SplitSectionBlock = ({ section, items, data, gs }) => {
  const pageData = items !== null ? injectItems(section.id, items, data) : data;
  const content = <SectionContent section={section} data={pageData} gs={gs} />;
  if (!content) return null;

  return (
    <div style={{ marginBottom: gs.sectionGap }}>
      <SectionTitle label={section.label} gs={gs} />
      {content}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// injectItems — shallow-clone data, replace section's array
// ─────────────────────────────────────────────────────────────
function injectItems(sectionId, items, data) {
  switch (sectionId) {
    case "experience":
      return { ...data, experience: items };
    case "education":
      return { ...data, education: items };
    case "projects":
      return { ...data, project: items };
    default:
      if (String(sectionId).startsWith("custom_")) {
        return {
          ...data,
          customSections: (data.customSections || []).map((cs) =>
            cs.id === sectionId ? { ...cs, fields: items } : cs,
          ),
        };
      }
      return data;
  }
}

export default PageRenderer;
