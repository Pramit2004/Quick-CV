import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../configs/api";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  FileText,
  FolderIcon,
  GraduationCap,
  Share2Icon,
  Sparkles,
  User,
  SparklesIcon,
  LockIcon,
  LayoutTemplate,
  CheckCircle2,
  PencilIcon,
  CheckIcon,
  LayoutList,
} from "lucide-react";

import PersonalInfoForm from "../components/PersonalInfoForm";
import ProfessionalSummaryForm from "../components/ProfessionalSummaryForm";
import ExperienceForm from "../components/ExperienceForm";
import EducationForm from "../components/EducationForm";
import ProjectForm from "../components/ProjectForm";
import SkillsForm from "../components/SkillsForm";
import DynamicSectionForm from "../components/DynamicSectionForm";

import ClassicTemplate from "../components/templates/ClassicTemplate";
import ModernTemplate from "../components/templates/ModernTemplate";
import MinimalTemplate from "../components/templates/MinimalTemplate";
import MinimalImageTemplate from "../components/templates/MinimalImageTemplate";
import DynamicResumeRenderer from "../components/admin/DynamicResumeRenderer";

import useSocket from "../hooks/useSocket";

const A4_WIDTH = 794;

// ── Legacy template list ──────────────────────────────────────
const LEGACY_TEMPLATES = [
  { id: "classic",      label: "Classic",       description: "Clean two-column layout"      },
  { id: "modern",       label: "Modern",        description: "Bold header, sleek sections"  },
  { id: "minimal",      label: "Minimal",       description: "White space focused"           },
  { id: "minimalImage", label: "Minimal Photo", description: "Minimal with profile photo"   },
];

const COLOR_PRESETS = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B",
  "#EF4444", "#EC4899", "#06B6D4", "#6366F1",
  "#14B8A6", "#F97316", "#64748B", "#1E293B",
];

// ── Core sidebar sections (always present) ───────────────────
const CORE_SECTIONS = [
  { id: "personal",   label: "Personal Info", icon: User          },
  { id: "summary",    label: "Summary",       icon: FileText      },
  { id: "experience", label: "Experience",    icon: Briefcase     },
  { id: "education",  label: "Education",     icon: GraduationCap },
  { id: "projects",   label: "Projects",      icon: FolderIcon    },
  { id: "skills",     label: "Skills",        icon: Sparkles      },
  { id: "studio",     label: "Template",      icon: LayoutTemplate },
];

const mergeStyles = (globalStyle, userStyling) => ({
  ...(globalStyle || {}),
  ...(userStyling || {}),
});

// ── Smart preview — handles both dynamic & legacy templates ──
const SmartResumePreview = ({ data, template, accentColor }) => {
  if (data?.globalStyle && data?.sections) {
    return (
      <DynamicResumeRenderer
        globalStyle={data.globalStyle}
        sections={data.sections}
        data={data}
      />
    );
  }
  switch (template) {
    case "modern":      return <ModernTemplate       data={data} accentColor={accentColor} />;
    case "minimal":     return <MinimalTemplate      data={data} accentColor={accentColor} />;
    case "minimalImage":return <MinimalImageTemplate data={data} accentColor={accentColor} />;
    default:            return <ClassicTemplate      data={data} accentColor={accentColor} />;
  }
};

// ── Scaled preview container ──────────────────────────────────
const ScaledPreview = ({ children }) => {
  const wrapRef  = useRef(null);
  const innerRef = useRef(null);

  useEffect(() => {
    const apply = () => {
      if (!wrapRef.current || !innerRef.current) return;
      const w = wrapRef.current.clientWidth;
      innerRef.current.style.width          = `${A4_WIDTH}px`;
      innerRef.current.style.transformOrigin = "top left";
      const scale = Math.min(w / A4_WIDTH, 1);
      innerRef.current.style.transform       = `scale(${scale})`;
      wrapRef.current.style.height           = `${innerRef.current.getBoundingClientRect().height}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="overflow-hidden relative">
      <div ref={innerRef}>{children}</div>
    </div>
  );
};

// ── Inline studio for legacy (non-dynamic) resumes ───────────
const LegacyTemplateStudio = ({
  resumeData, onTemplateChange, onColorChange, onDownload, downloading,
}) => {
  const [studioTemplate, setStudioTemplate] = useState(resumeData.template || "classic");
  const [studioColor,    setStudioColor]    = useState(resumeData.accent_color || "#3B82F6");

  const selectTemplate = (id) => { setStudioTemplate(id); onTemplateChange(id); };
  const selectColor    = (c)  => { setStudioColor(c);     onColorChange(c);     };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="xl:w-64 shrink-0 space-y-5">
        {/* Template list */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Templates</p>
          <div className="grid grid-cols-2 xl:grid-cols-1 gap-2">
            {LEGACY_TEMPLATES.map((t) => {
              const selected = studioTemplate === t.id;
              return (
                <button
                  key={t.id} onClick={() => selectTemplate(t.id)}
                  className={`relative flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                    selected ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div
                    className="w-8 h-10 rounded shrink-0 border border-gray-200 overflow-hidden"
                    style={{ background: selected ? studioColor + "22" : "#f8fafc" }}
                  >
                    <div className="w-full h-1.5 mt-1.5" style={{ background: selected ? studioColor : "#e2e8f0" }} />
                    <div className="px-0.5 mt-0.5 space-y-0.5">
                      {[3, 2, 2.5, 2].map((w, i) => (
                        <div key={i} className="h-px bg-gray-300 rounded" style={{ width: `${w * 10}px` }} />
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${selected ? "text-emerald-700" : "text-gray-700"}`}>{t.label}</p>
                    <p className="text-[10px] text-gray-400 truncate hidden xl:block">{t.description}</p>
                  </div>
                  {selected && <CheckCircle2 className="size-3.5 text-emerald-500 absolute top-2 right-2" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Accent Color</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c} onClick={() => selectColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${studioColor === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 rounded-lg border border-gray-200 shrink-0" style={{ background: studioColor }} />
            <input
              type="text" value={studioColor}
              onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) selectColor(e.target.value); }}
              className="flex-1 text-xs font-mono border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="#3B82F6"
            />
          </div>
        </div>

        {/* Download */}
        <button
          onClick={onDownload} disabled={downloading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-lg shadow-emerald-200"
        >
          {downloading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
          ) : (
            <><DownloadIcon className="size-4" /> Download PDF</>
          )}
        </button>
      </div>

      {/* Inline preview */}
      <div className="flex justify-center">
        <div id="resume-root" className="inline-block bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
          <ScaledPreview>
            <SmartResumePreview data={resumeData} template={resumeData.template} accentColor={resumeData.accent_color} />
          </ScaledPreview>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
const ResumeBuilder = () => {
  const { resumeId } = useParams();
  const navigate     = useNavigate();
  const { token }    = useSelector((s) => s.auth);

  const { joinResumeRoom, leaveResumeRoom, emitResumeSaved, onResumeSaved } = useSocket();

  const [resumeData, setResumeData] = useState({
    _id:                  "",
    title:                "My Resume",
    personal_info:        { name: "", email: "", phone: "", location: "", jobTitle: "" },
    professional_summary: "",
    experience:           [],
    education:            [],
    project:              [],
    skills:               [],
    customSections:       [],
    // FIX: initialise userCustomSections so the field exists in state
    // even before the API response returns (prevents undefined errors)
    userCustomSections:   [],
    template:             "classic",
    accent_color:         "#3B82F6",
    public:               false,
    globalStyle:          null,
    sections:             null,
    userStyling:          {},
  });

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [removeBackground,   setRemoveBackground]   = useState(false);
  const [loading,            setLoading]            = useState(true);
  const [mobileView,         setMobileView]         = useState("form");
  const [downloading,        setDownloading]        = useState(false);

  // ── Dynamic sections from template ───────────────────────
  const SECTIONS = useMemo(() => {
    const core       = [...CORE_SECTIONS];
    const customTabs = (resumeData.sections || [])
      .filter((s) => s.isCustom && s.visible !== false)
      .map((s) => ({
        id:         s.id,
        label:      s.label,
        icon:       LayoutList,
        isCustom:   true,
        fieldDefs:  s.fieldDefs || [],
        sectionDef: s,
      }));
    if (customTabs.length === 0) return core;
    return [...core.slice(0, -1), ...customTabs, core[core.length - 1]];
  }, [resumeData.sections]);

  const activeSection = SECTIONS[activeSectionIndex];
  const isDynamic     = !!(resumeData.globalStyle && resumeData.sections);
  const isStudio      = activeSection?.id === "studio";

  // Clamp index when SECTIONS array shrinks
  useEffect(() => {
    if (activeSectionIndex >= SECTIONS.length)
      setActiveSectionIndex(SECTIONS.length - 1);
  }, [SECTIONS.length, activeSectionIndex]);

  // ── Load resume ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/resumes/get/${resumeId}`, {
          headers: { Authorization: token },
        });
        if (data.resume) {
          setResumeData((prev) => ({
            ...prev,
            ...data.resume,
            customSections:     data.resume.customSections     || [],
            // FIX: explicitly restore userCustomSections from API response.
            // Without this line, if the spread ...data.resume didn't include it
            // (e.g. older saved resumes), the field would remain [] from initial state.
            userCustomSections: data.resume.userCustomSections || [],
            userStyling:        data.resume.userStyling        || {},
          }));
          document.title = data.resume.title || "Resume Builder";
        }
      } catch {
        toast.error("Failed to load resume");
      } finally {
        setLoading(false);
      }
    };
    if (resumeId && token) load();
  }, [resumeId, token]);

  // ── Socket ────────────────────────────────────────────────
  useEffect(() => {
    if (!resumeId) return;
    joinResumeRoom(resumeId);
    const off = onResumeSaved(resumeId, (updated) => {
      setResumeData((prev) => ({ ...prev, ...updated }));
      toast("Resume synced from another session", { icon: "🔄" });
    });
    return () => {
      leaveResumeRoom(resumeId);
      off();
    };
  }, [resumeId, joinResumeRoom, leaveResumeRoom, onResumeSaved]);

  // ── Save ──────────────────────────────────────────────────
  const saveResume = async () => {
    const updatedData = structuredClone(resumeData);
    if (typeof resumeData.personal_info?.image === "object")
      delete updatedData.personal_info.image;

    const fd = new FormData();
    fd.append("resumeId", resumeId);
    fd.append("resumeData", JSON.stringify(updatedData));
    if (removeBackground) fd.append("removeBackground", "yes");
    if (typeof resumeData.personal_info?.image === "object")
      fd.append("image", resumeData.personal_info.image);

    const { data } = await api.put("/api/resumes/update", fd, {
      headers: { Authorization: token },
    });
    setResumeData((prev) => ({ ...prev, ...data.resume }));
    emitResumeSaved(resumeId, data.resume);
  };

  // ── Visibility ────────────────────────────────────────────
  const toggleVisibility = async () => {
    const next = !resumeData.public;
    try {
      const fd = new FormData();
      fd.append("resumeId", resumeId);
      fd.append("resumeData", JSON.stringify({ public: next }));
      await api.put("/api/resumes/update", fd, { headers: { Authorization: token } });
      setResumeData((prev) => ({ ...prev, public: next }));
      toast.success(next ? "Resume is now public" : "Resume is now private");
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  // ── Share ─────────────────────────────────────────────────
  const handleShare = () => {
    if (!resumeData.public) { toast.error("Make the resume public first!"); return; }
    const base = window.location.href.includes("/app/")
      ? window.location.href.split("/app/")[0]
      : window.location.origin;
    const url = `${base}/view/${resumeId}`;
    if (navigator.share) navigator.share({ url, title: resumeData.title || "My Resume" });
    else { navigator.clipboard.writeText(url); toast.success("Share link copied!"); }
  };

  // ── Download PDF ──────────────────────────────────────────
  const downloadResume = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const el = document.getElementById("resume-root");
      if (!el) { toast.error("Preview not found"); return; }

      const effectiveStyle = mergeStyles(resumeData.globalStyle, resumeData.userStyling);
      const fontFamily     = effectiveStyle?.fontFamily || "Inter";
      const fontSlug       = fontFamily.replace(/ /g, "+");

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${fontSlug}:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<style>*,*::before,*::after{box-sizing:border-box}html,body{margin:0;padding:0;background:white}body{font-family:'${fontFamily}','Inter',sans-serif}#resume-root{width:794px;min-height:1123px}</style>
</head><body><div id="resume-root">${el.innerHTML}</div></body></html>`;

      const res = await api.post(
        "/api/resumes/export-pdf",
        { html, resumeId },
        { headers: { Authorization: token }, responseType: "blob" },
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${resumeData.title || "resume"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("PDF generation failed");
    } finally {
      setDownloading(false);
    }
  };

  // ── Custom section data helpers ───────────────────────────
  // getCustomSectionData / setCustomSectionData manage the items[]
  // array for admin-defined fieldDef sections.
  const getCustomSectionData = (sectionId) =>
    (resumeData.customSections || []).find((s) => s.id === sectionId)?.items || [];

  const setCustomSectionData = (sectionId, items) => {
    setResumeData((prev) => {
      const existing = prev.customSections || [];
      const idx      = existing.findIndex((s) => s.id === sectionId);
      const updated  = idx >= 0
        ? existing.map((s, i) => (i === idx ? { ...s, items } : s))
        : [...existing, { id: sectionId, items }];
      return { ...prev, customSections: updated };
    });
  };

  // ── Form renderer ─────────────────────────────────────────
  const renderForm = () => {
    if (isStudio || !activeSection) return null;
    switch (activeSection.id) {
      case "personal":
        return (
          <PersonalInfoForm
            data={resumeData.personal_info || {}}
            onChange={(v) => setResumeData((p) => ({ ...p, personal_info: v }))}
            removeBackground={removeBackground}
            setRemoveBackground={setRemoveBackground}
          />
        );
      case "summary":
        return (
          <ProfessionalSummaryForm
            data={resumeData.professional_summary}
            onChange={(v) => setResumeData((p) => ({ ...p, professional_summary: v }))}
            setResumeData={setResumeData}
          />
        );
      case "experience":
        return (
          <ExperienceForm
            data={resumeData.experience || []}
            onChange={(v) => setResumeData((p) => ({ ...p, experience: v }))}
          />
        );
      case "education":
        return (
          <EducationForm
            data={resumeData.education || []}
            onChange={(v) => setResumeData((p) => ({ ...p, education: v }))}
          />
        );
      case "projects":
        return (
          <ProjectForm
            data={resumeData.project || []}
            onChange={(v) => setResumeData((p) => ({ ...p, project: v }))}
          />
        );
      case "skills":
        return (
          <SkillsForm
            data={resumeData.skills || []}
            onChange={(v) => setResumeData((p) => ({ ...p, skills: v }))}
          />
        );
      default:
        if (activeSection.isCustom && activeSection.sectionDef) {
          return (
            <DynamicSectionForm
              sectionDef={activeSection.sectionDef}
              data={getCustomSectionData(activeSection.id)}
              onChange={(items) => setCustomSectionData(activeSection.id, items)}
            />
          );
        }
        return null;
    }
  };

  // ── Loading state ─────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading your resume...</p>
      </div>
    </div>
  );

  const progressPct = activeSectionIndex === 0
    ? 0
    : Math.round((activeSectionIndex / (SECTIONS.length - 1)) * 100);

  return (
    <div className='min-h-screen font-sans pb-28 text-slate-900' style={{ backgroundColor: '#F4F6F3', backgroundImage: `linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)`, backgroundSize: '32px 32px' }}>
      {/* ── TOP BAR ──────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/app"
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeftIcon className="size-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <span className="hidden sm:block text-gray-200">|</span>
            <h1 className="text-sm font-bold text-gray-700 truncate max-w-[160px] sm:max-w-xs">
              {resumeData.title || "Resume Builder"}
            </h1>
            {isDynamic && (
              <span className="shrink-0 hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                <SparklesIcon className="size-2.5" /> Dynamic
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleShare}
              title={resumeData.public ? "Copy share link" : "Make public first"}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                resumeData.public
                  ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                  : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
              }`}
            >
              <Share2Icon className="size-3.5" /> Share
            </button>

            <button
              onClick={toggleVisibility}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                resumeData.public
                  ? "bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {resumeData.public ? (
                <><EyeIcon className="size-3.5" /><span className="hidden sm:inline">Public</span></>
              ) : (
                <><EyeOffIcon className="size-3.5" /><span className="hidden sm:inline">Private</span></>
              )}
            </button>

            <button
              onClick={downloadResume} disabled={downloading}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {downloading ? (
                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span className="hidden sm:inline">Generating...</span></>
              ) : (
                <><DownloadIcon className="size-3.5" /><span className="hidden sm:inline">Download PDF</span></>
              )}
            </button>

            <button
              onClick={() => setMobileView((v) => (v === "form" ? "preview" : "form"))}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors"
            >
              {mobileView === "form" ? (
                <><EyeIcon className="size-3.5" /> Preview</>
              ) : (
                <><PencilIcon className="size-3.5" /> Edit</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {isStudio ? (
          /* ── STUDIO TAB CONTENT ─────────────────────── */
          <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-800">Template Studio</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isDynamic
                    ? "Customize your dynamic template in the full studio"
                    : "Pick a template, choose a colour, download your resume"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSectionIndex(activeSectionIndex - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200"
                >
                  <ChevronLeft className="size-3.5" /> Back
                </button>
                <button
                  onClick={() => toast.promise(saveResume(), { loading: "Saving...", success: "Saved!", error: "Save failed" })}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-200"
                >
                  <CheckIcon className="size-3.5" /> Save
                </button>
              </div>
            </div>

            {isDynamic ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                  <LayoutTemplate className="size-7 text-violet-500" />
                </div>
                <h3 className="text-base font-bold text-gray-700">Full Template Studio</h3>
                <p className="text-sm text-gray-400 text-center max-w-xs">
                  Change templates, adjust colors, fonts, spacing and section order — all with a live preview.
                </p>
                <button
                  onClick={() => navigate(`/app/template-studio/${resumeId}`)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors shadow-sm"
                >
                  <LayoutTemplate className="size-4" /> Open Template Studio
                </button>
              </div>
            ) : (
              <LegacyTemplateStudio
                resumeData={resumeData}
                onTemplateChange={(t) => setResumeData((p) => ({ ...p, template: t }))}
                onColorChange={(c)    => setResumeData((p) => ({ ...p, accent_color: c }))}
                onDownload={downloadResume}
                downloading={downloading}
              />
            )}
          </div>
        ) : (
          /* ── FORM + PREVIEW SPLIT ───────────────────── */
          <div className="flex flex-col lg:flex-row gap-6">
            {/* LEFT — Form panel */}
            <div className={`lg:w-[460px] lg:shrink-0 ${mobileView === "preview" ? "hidden lg:block" : "block"}`}>
              <div className="relative bg-white rounded-2xl mt-8 border border-gray-200 shadow-sm overflow-hidden">
                {/* Progress bar */}
                <div className="h-1 bg-gray-100 w-full">
                  <div
                    className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Section tabs */}
                <div className="flex overflow-x-auto scrollbar-none border-b border-gray-100 px-2 pt-2 gap-0.5">
                  {SECTIONS.map((s, idx) => {
                    const Icon   = s.icon;
                    const active = activeSectionIndex === idx;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveSectionIndex(idx)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                          active
                            ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="size-3 shrink-0" />
                        {s.label}
                        {s.isCustom && (
                          <span className="ml-0.5 text-[8px] font-bold text-violet-500 bg-violet-50 px-1 rounded-full leading-4">
                            CUSTOM
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Section header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-1">
                  <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    {activeSection && React.createElement(activeSection.icon, { className: "size-4 text-emerald-500" })}
                    {activeSection?.label}
                  </h2>
                  <span className="text-[10px] font-semibold text-gray-400">
                    {activeSectionIndex + 1} / {SECTIONS.length}
                  </span>
                </div>

                {/* Form content */}
                <div className="px-5 py-4 space-y-4">{renderForm()}</div>

                {/* Bottom nav */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                  <button
                    onClick={() => toast.promise(saveResume(), { loading: "Saving...", success: "Saved!", error: "Save failed" })}
                    className="flex items-center gap-1.5 bg-gradient-to-br from-emerald-50 to-emerald-100 ring ring-emerald-200 text-emerald-700 hover:ring-emerald-400 transition-all rounded-xl px-5 py-2 text-xs font-bold"
                  >
                    <CheckIcon className="size-3.5" /> Save Changes
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveSectionIndex((i) => Math.max(i - 1, 0))}
                      disabled={activeSectionIndex === 0}
                      className="flex items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="size-3.5" /> Prev
                    </button>
                    <button
                      onClick={() => setActiveSectionIndex((i) => Math.min(i + 1, SECTIONS.length - 1))}
                      disabled={activeSectionIndex === SECTIONS.length - 1}
                      className="flex items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — Preview panel */}
            <div className={`min-w-0 ${mobileView === "form" ? "hidden lg:block" : "block"}`}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {!isDynamic && (
                    <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-lg capitalize">
                      {resumeData.template || "classic"}
                    </span>
                  )}
                  {!isDynamic && (
                    <span
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                      style={{ background: resumeData.accent_color || "#3B82F6" }}
                    />
                  )}
                  <button
                    onClick={() => navigate(`/app/template-studio/${resumeId}`)}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 hover:border-violet-300 transition-all"
                  >
                    <LayoutTemplate className="size-3.5" />
                    Change Template
                  </button>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  resumeData.public
                    ? "text-emerald-600 bg-emerald-50 border border-emerald-200"
                    : "text-gray-400 bg-gray-50 border border-gray-200"
                }`}>
                  {resumeData.public ? "● Public" : "○ Private"}
                </span>
              </div>

              <div id="resume-root" className="shadow-xl flex justify-center border">
                <ScaledPreview>
                  <SmartResumePreview
                    data={resumeData}
                    template={resumeData.template}
                    accentColor={resumeData.accent_color}
                  />
                </ScaledPreview>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilder;