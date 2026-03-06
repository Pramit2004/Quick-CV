import mongoose from "mongoose";

// ── Section Style Schema ──────────────────────────────────────
const sectionStyleSchema = new mongoose.Schema(
  {
    fontSize: { type: Number, default: 14 },
    fontWeight: { type: String, default: "normal", enum: ["normal", "bold"] },
    italic: { type: Boolean, default: false },
    underline: { type: Boolean, default: false },
    uppercase: { type: Boolean, default: false },
    letterSpacing: { type: Number, default: 0 },
    lineHeight: { type: Number, default: 1.5 },
    color: { type: String, default: "#334155" },
    marginTop: { type: Number, default: 12 },
    marginBottom: { type: Number, default: 8 },
  },
  { _id: false },
);

// ── Section Schema ────────────────────────────────────────────
const sectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    style: { type: sectionStyleSchema, default: () => ({}) },
    isCustom: { type: Boolean, default: false },
    inSidebar: { type: Boolean, default: false },
  },
  { _id: false },
);

// ── Global Style Schema ───────────────────────────────────────
const globalStyleSchema = new mongoose.Schema(
  {
    // Layout
    layout: {
      type: String,
      enum: [
        "single",
        "two-col-left",
        "two-col-right",
        "banner",
        "split-header",
        "centered",
        "minimal",
        "timeline",
        "boxed",
        "card",
        "modern-sidebar",
        "compact",
      ],
      default: "single",
    },
    showPhoto: { type: Boolean, default: false },
    photoShape: {
      type: String,
      enum: ["circle", "square", "rounded"],
      default: "circle",
    },
    photoPosition: {
      type: String,
      enum: ["top-left", "top-right", "top-center", "sidebar"],
      default: "top-left",
    },
    sidebarWidth: { type: Number, default: 30 },

    // Colors
    accentColor: { type: String, default: "#10b981" },
    backgroundColor: { type: String, default: "#ffffff" },
    sidebarBg: { type: String, default: "#f1f5f9" },
    headerBg: { type: String, default: "#10b981" },
    headerTextColor: { type: String, default: "#ffffff" },
    sectionTitleColor: { type: String, default: "#10b981" },
    bodyTextColor: { type: String, default: "#334155" },
    mutedTextColor: { type: String, default: "#64748b" },
    borderColor: { type: String, default: "#e2e8f0" },

    // Typography
    fontFamily: { type: String, default: "Inter" },
    baseFontSize: { type: Number, default: 14 },
    nameSize: { type: Number, default: 32 },
    nameBold: { type: Boolean, default: true },
    sectionTitleSize: { type: Number, default: 13 },
    sectionTitleBold: { type: Boolean, default: true },
    sectionTitleUppercase: { type: Boolean, default: true },
    sectionTitleLetterSpacing: { type: Number, default: 2 },

    // Spacing
    pagePadding: { type: Number, default: 32 },
    sectionGap: { type: Number, default: 8 },
    itemGap: { type: Number, default: 5 },

    // Decorators
    showDividers: { type: Boolean, default: true },
    dividerStyle: {
      type: String,
      enum: ["solid", "dashed", "dotted"],
      default: "solid",
    },
    headerStyle: {
      type: String,
      enum: ["none", "full-color", "left-accent", "bottom-border"],
      default: "none",
    },
    skillStyle: {
      type: String,
      enum: ["plain", "badge", "pill", "dot", "bar", "grid"],
      default: "plain",
    },
    skillBg: { type: String, default: "#d1fae5" },
    skillColor: { type: String, default: "#065f46" },
    bulletStyle: {
      type: String,
      enum: ["disc", "dash", "arrow", "none"],
      default: "disc",
    },

    // Extended layout options
    cardRadius: { type: Number, default: 8 },
    cardShadow: { type: Boolean, default: true },
    gradientSidebar: { type: Boolean, default: false },
    gradientFrom: { type: String, default: "#10b981" },
    gradientTo: { type: String, default: "#0d9488" },
    timelineDotSize: { type: Number, default: 8 },
    boxedBorderWidth: { type: Number, default: 1 },
  },
  { _id: false },
);

// ── Custom Section Field Definition Schema ────────────────────
const customFieldDefSchema = new mongoose.Schema(
  {
    fieldKey: { type: String, required: true },
    label: { type: String, required: true },
    placeholder: { type: String, default: "" },
    dummyData: { type: String, default: "" },
    fieldType: {
      type: String,
      enum: ["text", "textarea", "url", "date", "select"],
      default: "text",
    },
    options: { type: [String], default: [] },
    required: { type: Boolean, default: false },
  },
  { _id: false },
);

// ── Custom Section Definition Schema ─────────────────────────
const customSectionDefSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    fieldDefs: { type: [customFieldDefSchema], default: [] },
  },
  { _id: false },
);

// ── Main Template Schema ──────────────────────────────────────
const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    documentType: {
      type: String,
      enum: ["resume", "cv"],
      default: "resume",
      index: true,
    },
    category: {
      type: String,
      enum: ["professional", "modern", "minimal", "creative", "classic"],
      default: "professional",
    },
    globalStyle: { type: globalStyleSchema, default: () => ({}) },
    sections: { type: [sectionSchema], default: [] },
    customSectionDefs: { type: [customSectionDefSchema], default: [] },
    thumbnail: { type: String, default: "" },
    isPublished: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────
templateSchema.index({ isPublished: 1, sortOrder: 1 });
templateSchema.index({ documentType: 1, isPublished: 1 });

export default mongoose.model("Template", templateSchema);