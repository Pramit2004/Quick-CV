import React, { useEffect, useState, useRef } from "react";
import {
  PlusIcon, TrashIcon, EyeIcon, EyeOffIcon,
  EditIcon, CheckCircleIcon, XCircleIcon,
  LayoutTemplateIcon, XIcon,
} from "lucide-react";
import adminApi from "../../configs/adminApi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DynamicResumeRenderer from "../../components/admin/DynamicResumeRenderer";

const CATEGORIES = ["professional", "modern", "minimal", "creative", "classic"];

const DEFAULT_GLOBAL_STYLE = {
  layout: "single",
  showPhoto: false,
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
  { id: "skills", label: "Skills", visible: true, order: 3 },
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
    "Creative and results-driven Product Designer with 6+ years crafting user-centered digital experiences.",
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
  project: [],
};

const getLayoutLabel = (layout) => {
  switch (layout) {
    case "two-col-left": return "Sidebar Left";
    case "two-col-right": return "Sidebar Right";
    case "banner": return "Banner";
    default: return "Single";
  }
};

// ─────────────────────────────────────────────────────────────
// ResumePreviewThumb — shared between user gallery & admin
// Uses ResizeObserver to always fill the container width.
// ─────────────────────────────────────────────────────────────
const RESUME_RENDER_WIDTH = 794;

const ResumePreviewThumb = ({ globalStyle, sections, data, previewHeight = 260 }) => {
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(0.43);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / RESUME_RENDER_WIDTH);
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

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
// AdminTemplateCard
// ─────────────────────────────────────────────────────────────
const AdminTemplateCard = ({ template, onTogglePublish, onDelete, onEdit }) => {
  const gs = { ...DEFAULT_GLOBAL_STYLE, ...(template.globalStyle || {}) };
  const sections = template.sections?.length ? template.sections : DEFAULT_SECTIONS;
  const data = template.previewData || PREVIEW_DATA;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 hover:border-slate-300">

      {/* Preview — clickable to open builder */}
      <div
        className="relative overflow-hidden cursor-pointer"
        onClick={onEdit}
      >
        <ResumePreviewThumb
          globalStyle={gs}
          sections={sections}
          data={data}
          previewHeight={260}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/10 transition-colors duration-150 flex items-center justify-center">
          <span className="opacity-0 hover:opacity-100 transition-opacity bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md border border-slate-200 flex items-center gap-1.5">
            <EditIcon className="size-3" /> Open Builder
          </span>
        </div>

        {/* Badges */}
        {/* <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start pointer-events-none z-10">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm border border-slate-200/70 text-slate-500">
            {getLayoutLabel(gs.layout)}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
              template.isPublished
                ? "bg-emerald-50/90 text-emerald-700 border-emerald-200"
                : "bg-white/90 text-slate-500 border-slate-200"
            }`}
          >
            {template.isPublished
              ? <><CheckCircleIcon className="size-2.5" />Published</>
              : <><XCircleIcon className="size-2.5" />Draft</>}
          </span>
        </div> */}
      </div>

      {/* Separator */}
      <div className="h-px bg-slate-100" />

      {/* Card Body */}
      <div className="px-4 pt-3.5 pb-4 flex flex-col gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-black-800 text-sm truncate leading-snug">{template.name}</p>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-black-500 capitalize shrink-0">
              {template.category}
            </span>
          </div>
          {template.description && (
            <p className="text-xs text-black-400 mt-0.5 line-clamp-1">{template.description}</p>
          )}
        </div>

        <p className="text-xs text-slate-400 -mt-1">
          <span className="font-semibold text-slate-600">
            {template.sections?.filter((s) => s.visible).length || 0}
          </span>{" "}active sections
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePublish}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
              template.isPublished
                ? "bg-slate-100 text-black-600 hover:bg-slate-200 border border-slate-200"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200/60"
            }`}
          >
            {template.isPublished
              ? <><EyeOffIcon className="size-3" />Unpublish</>
              : <><EyeIcon className="size-3" />Publish</>}
          </button>

          <button
            onClick={onEdit}
            className="p-2 text-black-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200"
            title="Open Builder"
          >
            <EditIcon className="size-4" />
          </button>

          <button
            onClick={onDelete}
            className="p-2 text-black-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
            title="Delete"
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Create Modal
// ─────────────────────────────────────────────────────────────
const TemplateModal = ({ onClose, onSave }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "professional",
    sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const { data } = await adminApi.post("/api/admin/templates", form);
      toast.success("Template created — opening builder...");
      onSave(data.template, "create");
      onClose();
      navigate(`/admin/templates/${data.template._id}/edit`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-[3px] w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />

        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">New Template</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Template Name *
            </label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Executive Pro"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              placeholder="Brief description..."
              rows={2}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Category
            </label>
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Sort Order
            </label>
            <input
              type="number"
              className={inputCls}
              value={form.sortOrder}
              onChange={(e) => handleChange("sortOrder", Number(e.target.value))}
              min={0}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-black-500 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-200 transition-all"
          >
            {saving ? "Creating..." : "Create & Open Builder →"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// AdminTemplates — main component
// ─────────────────────────────────────────────────────────────
const AdminTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await adminApi.get("/api/admin/templates");
        setTemplates(data.templates);
      } catch {
        toast.error("Failed to load templates");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = (saved, action) => {
    if (action === "create") {
      setTemplates((prev) => [saved, ...prev]);
    } else {
      setTemplates((prev) => prev.map((t) => (t._id === saved._id ? saved : t)));
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/api/admin/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      const { data } = await adminApi.patch(`/api/admin/templates/${id}/publish`);
      setTemplates((prev) =>
        prev.map((t) => (t._id === id ? { ...t, isPublished: data.isPublished } : t))
      );
      toast.success(data.message);
    } catch {
      toast.error("Failed to update template");
    }
  };

  const publishedCount = templates.filter((t) => t.isPublished).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-[3px] border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {modal && <TemplateModal onClose={() => setModal(false)} onSave={handleSave} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Templates</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {templates.length} total ·{" "}
            <span className="text-emerald-600 font-semibold">{publishedCount} published</span>
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-emerald-200 transition-all"
        >
          <PlusIcon className="size-4" />
          New Template
        </button>
      </div>

      {/* Stats */}
      {templates.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: templates.length, cls: "text-slate-700" },
            { label: "Published", value: publishedCount, cls: "text-emerald-600" },
            { label: "Drafts", value: templates.length - publishedCount, cls: "text-slate-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <p className={`text-xl font-extrabold ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-slate-400">
          <LayoutTemplateIcon className="size-10 mb-2 opacity-30" />
          <p className="text-sm font-medium">No templates yet.</p>
          <button
            onClick={() => setModal(true)}
            className="mt-3 text-xs font-semibold text-emerald-600 hover:underline"
          >
            Create your first template →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t) => (
            <AdminTemplateCard
              key={t._id}
              template={t}
              onTogglePublish={() => handleTogglePublish(t._id)}
              onDelete={() => handleDelete(t._id, t.name)}
              onEdit={() => navigate(`/admin/templates/${t._id}/edit`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTemplates;