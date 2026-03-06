import Template from "../models/Template.js";

// ── Default sections every template starts with ───────────────
const defaultSections = [
  { id: "summary",    label: "Professional Summary", visible: true, order: 0,  style: {} },
  { id: "experience", label: "Work Experience",       visible: true, order: 1,  style: {} },
  { id: "education",  label: "Education",             visible: true, order: 2,  style: {} },
  { id: "projects",   label: "Projects",              visible: true, order: 3,  style: {} },
  { id: "skills",     label: "Skills",                visible: true, order: 4,  style: {} },
];

// ── Default preview data ──────────────────────────────────────
export const defaultPreviewData = {
  personal_info: {
    full_name:  "Alexandra Johnson",
    profession: "Senior Product Designer",
    email:      "alex.johnson@email.com",
    phone:      "+1 (555) 234-5678",
    location:   "San Francisco, CA",
    linkedin:   "linkedin.com/in/alexjohnson",
    website:    "alexjohnson.design",
    image:      "",
  },
  professional_summary:
    "Creative and results-driven Product Designer with 6+ years crafting user-centered digital experiences. Proven track record leading design systems and shipping impactful products.",
  skills: ["Figma", "UX Research", "Prototyping", "Design Systems", "React", "Tailwind CSS"],
  experience: [
    {
      position:    "Senior Product Designer",
      company:     "Notion",
      start_date:  "2022-03",
      end_date:    "",
      is_current:  true,
      description: "Led redesign of core editor used by 30M+ users.\nBuilt component library of 200+ elements.\nReduced design-to-dev handoff time by 40%.",
    },
    {
      position:    "Product Designer",
      company:     "Figma",
      start_date:  "2019-06",
      end_date:    "2022-02",
      is_current:  false,
      description: "Designed onboarding flows improving activation by 25%.\nDrove accessibility improvements across the platform.",
    },
  ],
  education: [
    {
      degree:          "Bachelor of Design",
      field:           "Interaction Design",
      institution:     "California College of the Arts",
      graduation_date: "2019-05",
      gpa:             "3.9",
    },
  ],
  project: [
    {
      name:        "DesignOS — Open Source Design System",
      type:        "Open Source",
      description: "Built accessible React component library with 150+ components.\nUsed by 500+ developers on GitHub.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/templates/published  — public, no auth required
// GET /api/admin/templates            — admin only, all templates
// ─────────────────────────────────────────────────────────────
export const getPublishedTemplates = async (req, res) => {
  try {
    const isAdmin = !!req.admin;
    const query   = isAdmin ? {} : { isPublished: true };

    const templates = await Template.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({ templates });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/templates/:id
// ─────────────────────────────────────────────────────────────
export const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id).lean();
    if (!template) return res.status(404).json({ message: "Template not found" });
    return res.status(200).json({ template });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/admin/templates
// ─────────────────────────────────────────────────────────────
export const createTemplate = async (req, res) => {
  try {
    const { name, description, category, globalStyle, sections, sortOrder } = req.body;

    if (!name) return res.status(400).json({ message: "Name is required" });

    const template = await Template.create({
      name,
      description: description || "",
      category:    category    || "professional",
      globalStyle: globalStyle || {},
      sections:    sections?.length ? sections : defaultSections,
      sortOrder:   sortOrder   || 0,
      createdBy:   req.adminId,
      isPublished: false,
    });

    return res.status(201).json({ message: "Template created", template });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/templates/:id
// ─────────────────────────────────────────────────────────────
export const updateTemplate = async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!template) return res.status(404).json({ message: "Template not found" });
    return res.status(200).json({ message: "Template saved", template });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/templates/:id
// ─────────────────────────────────────────────────────────────
export const deleteTemplate = async (req, res) => {
  try {
    const t = await Template.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ message: "Template not found" });
    return res.status(200).json({ message: "Template deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/templates/:id/publish
//
// BUG FIX: Previously used !template.isPublished (toggle).
// This caused: save-then-publish in builder to UNPUBLISH if
// the template was already published.
//
// FIX: This endpoint now ALWAYS sets isPublished = true.
// Use the separate /unpublish endpoint to unpublish.
// AdminTemplates.jsx calls this for the "Publish" button only.
// The "Unpublish" button calls /unpublish.
// ─────────────────────────────────────────────────────────────
export const publishTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });

    template.isPublished = true;
    await template.save();

    return res.status(200).json({
      message:     "Template published successfully",
      isPublished: true,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/templates/:id/unpublish
// ─────────────────────────────────────────────────────────────
export const unpublishTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });

    template.isPublished = false;
    await template.save();

    return res.status(200).json({
      message:     "Template unpublished",
      isPublished: false,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/templates/:id/toggle-publish
// Kept for AdminTemplates.jsx card "Publish / Unpublish" button
// which genuinely needs a toggle (show current state, flip it)
// ─────────────────────────────────────────────────────────────
export const togglePublish = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });

    template.isPublished = !template.isPublished;
    await template.save();

    return res.status(200).json({
      message:     template.isPublished ? "Published" : "Unpublished",
      isPublished: template.isPublished,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};