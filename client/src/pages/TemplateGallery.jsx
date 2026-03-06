import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../configs/api";
import toast from "react-hot-toast";
import { LayoutTemplateIcon, ArrowRightIcon, SearchIcon, ArrowLeftIcon } from "lucide-react";
import DynamicResumeRenderer from "../components/admin/DynamicResumeRenderer";
import { Link } from "react-router-dom";

const CATEGORY_LABELS = {
  all: "All",
  professional: "Professional",
  modern: "Modern",
  minimal: "Minimal",
  creative: "Creative",
  classic: "Classic",
};

const DEFAULT_GLOBAL_STYLE = {
  layout: "single",
  showPhoto: false,
  photoShape: "circle",
  photoPosition: "top-left",
  sidebarWidth: 30,
  accentColor: "#10b981",
  backgroundColor: "#ffffff",
  sidebarBg: "#f1f5f9",
  headerBg: "#10b981",
  headerTextColor: "#ffffff",
  sectionTitleColor: "#10b981",
  bodyTextColor: "#334155",
  mutedTextColor: "#64748b",
  borderColor: "#e2e8f0",
  fontFamily: "Inter",
  baseFontSize: 14,
  nameSize: 32,
  nameBold: true,
  sectionTitleSize: 13,
  sectionTitleBold: true,
  sectionTitleUppercase: true,
  sectionTitleLetterSpacing: 2,
  pagePadding: 32,
  sectionGap: 24,
  itemGap: 12,
  showDividers: true,
  dividerStyle: "solid",
  headerStyle: "none",
  skillStyle: "plain",
  skillBg: "#d1fae5",
  skillColor: "#065f46",
  bulletStyle: "disc",
};

const DEFAULT_SECTIONS = [
  { id: "summary", label: "Professional Summary", visible: true, order: 0 },
  { id: "experience", label: "Work Experience", visible: true, order: 1 },
  { id: "education", label: "Education", visible: true, order: 2 },
  { id: "projects", label: "Projects", visible: true, order: 3 },
  { id: "skills", label: "Skills", visible: true, order: 4 },
];

const PREVIEW_DATA = {
  personal_info: {
    full_name: "Alexandra Johnson",
    profession: "Senior Product Designer",
    email: "alex@email.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexjohnson",
    website: "alexjohnson.design",
    image: "",
  },
  professional_summary:
    "Creative and results-driven Product Designer with 6+ years crafting user-centered digital experiences. Proven track record of shipping impactful products.",
  skills: ["Figma", "UX Research", "Prototyping", "Design Systems", "React"],
  experience: [
    {
      position: "Senior Product Designer",
      company: "Notion",
      start_date: "2022-03",
      end_date: "",
      is_current: true,
      description: "Led redesign of core editor used by 30M+ users.\nBuilt component library of 200+ elements.",
    },
    {
      position: "Product Designer",
      company: "Figma",
      start_date: "2019-06",
      end_date: "2022-02",
      is_current: false,
      description: "Designed onboarding flows improving activation by 25%.",
    },
  ],
  education: [
    {
      degree: "Bachelor of Design",
      field: "Interaction Design",
      institution: "California College of the Arts",
      graduation_date: "2019-05",
      gpa: "3.9",
    },
  ],
  project: [
    {
      name: "DesignOS",
      type: "Open Source",
      description: "Built accessible React component library used by 500+ developers.",
    },
  ],
};

const getLayoutLabel = (layout) => {
  switch (layout) {
    case "two-col-left": return "Sidebar Left";
    case "two-col-right": return "Sidebar Right";
    case "banner": return "Banner";
    default: return "Single Column";
  }
};

// ─────────────────────────────────────────────────────────────
// ResumePreviewThumb
// Renders the actual resume at its native 794px width, then
// scales it down to fill the card container width exactly.
// ResizeObserver ensures the scale stays correct at every
// breakpoint — no hard-coded magic numbers.
// ─────────────────────────────────────────────────────────────
const RESUME_RENDER_WIDTH = 794;

const ResumePreviewThumb = ({ globalStyle, sections, data, previewHeight = 280 }) => {
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(0.43); // sensible default ~340/794

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / RESUME_RENDER_WIDTH);
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // The inner resume slice height (how many px of the resume we reveal)
  const innerHeight = previewHeight / scale;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        width: "100%",
        height: previewHeight,
        overflow: "hidden",
        background: globalStyle?.backgroundColor || "#ffffff",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: RESUME_RENDER_WIDTH,
          height: innerHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        <DynamicResumeRenderer
          globalStyle={globalStyle}
          sections={sections}
          data={data}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// TemplateCard
// ─────────────────────────────────────────────────────────────
const TemplateCard = React.memo(({ template, onUse, isUsing }) => {
  const gs = { ...DEFAULT_GLOBAL_STYLE, ...(template.globalStyle || {}) };
  const sections = template.sections?.length ? template.sections : DEFAULT_SECTIONS;
  const data = template.previewData || PREVIEW_DATA;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 hover:border-slate-300">

      {/* Preview */}
      <div className="relative overflow-hidden">
        <ResumePreviewThumb
          globalStyle={gs}
          sections={sections}
          data={data}
          previewHeight={280}
        />

        {/* Top badges */}
        {/* <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between items-start pointer-events-none z-10">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm border border-slate-200/70 text-black-500">
            {getLayoutLabel(gs.layout)}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm border border-slate-200/70 text-black-500 capitalize">
            {CATEGORY_LABELS[template.category] || template.category}
          </span>
        </div> */}
      </div>

      {/* Separator */}
      <div className="h-px bg-slate-100" />
      

      {/* Footer */}
      <div className="px-4 pt-3.5 pb-4 flex flex-col gap-3">
        <div>
          <p className="font-semibold text-black-800 text-sm truncate leading-snug">{template.name}</p>
          {template.description && (
            <p className="text-xs text-black-400 mt-0.5 line-clamp-1 leading-relaxed">{template.description}</p>
          )}
        </div>
        
        <button
          onClick={() => onUse(template)}
          disabled={isUsing}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-all active:scale-[0.98]"
        >
          {isUsing ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              Loading...
            </>
          ) : (
            <>Use This Template <ArrowRightIcon className="size-3.5" /></>
          )}
        </button>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// TemplateGallery — main page
// ─────────────────────────────────────────────────────────────
const TemplateGallery = () => {
  const navigate = useNavigate();
  const { token } = useSelector((s) => s.auth);

  const [templates, setTemplates] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [using, setUsing] = useState(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/api/admin/templates/published");
        setTemplates(data.templates || []);
      } catch {
        toast.error("Failed to load templates");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let result = templates;
    if (category !== "all") result = result.filter((t) => t.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [category, search, templates]);

  const handleUseTemplate = useCallback(
    async (template) => {
      if (!token) { toast.error("Please log in to use templates"); return; }
      setUsing(template._id);
      try {
        const { data } = await api.post(
          "/api/resumes/create-from-template",
          {
            title: `${template.name} Resume`,
            globalStyle: template.globalStyle || DEFAULT_GLOBAL_STYLE,
            sections: template.sections || DEFAULT_SECTIONS,
            previewData: template.previewData || PREVIEW_DATA,
          },
          { headers: { Authorization: token } }
        );
        toast.success("Template loaded! Customize it now.");
        navigate(`/app/builder/${data.resume._id}`);
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to use template");
      } finally {
        setUsing(null);
      }
    },
    [token, navigate]
  );

  const categories = ["all", ...new Set(templates.map((t) => t.category))];

  return (
    <div
      className='min-h-screen font-sans pb-28 text-slate-900'
      style={{
        backgroundColor: '#F4F6F3',
        backgroundImage: `
          linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Back */}
        <Link
                  to="/app"
                  className="inline-flex items-center gap-2 text-sm mt-0 mb-0 font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mb-8"
                >
                  <ArrowLeftIcon className="size-4" /> Back to Dashboard
                </Link>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 mb-3">
            <LayoutTemplateIcon className="size-3 text-emerald-600" />
            <span className="text-[11px] font-bold text-emerald-700 tracking-widest uppercase">
              Template Gallery
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Choose Your Template
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Pick a professionally designed template, fill in your details, and download.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative max-w-xs w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          {categories.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                    category === c
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
                  }`}
                >
                  {CATEGORY_LABELS[c] || c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-8 h-8 border-[3px] border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading templates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
            <LayoutTemplateIcon className="size-10 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700">
              {search ? "No templates match your search" : "No templates available"}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {search ? "Try a different search term or category." : "Check back soon."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-4 px-4 py-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-5">
              {filtered.length} template{filtered.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((t) => (
                <TemplateCard
                  key={t._id}
                  template={t}
                  onUse={handleUseTemplate}
                  isUsing={using === t._id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateGallery;