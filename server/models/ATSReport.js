import mongoose from "mongoose";

// ── Single suggestion entry ───────────────────────────────────
const SuggestionSchema = new mongoose.Schema(
  {
    // How urgent to fix this
    priority: {
      type:    String,
      enum:    ["high", "medium", "low"],
      default: "medium",
    },

    // Which scoring category this belongs to
    category: {
      type:    String,
      enum:    ["content", "format", "keywords", "contact", "structure", "general"],
      default: "general",
    },

    // Human-readable explanation of the issue
    message: {
      type:    String,
      required: true,
    },

    // AI-suggested rewrite (null if not applicable)
    // Strict rule: never changes meaning, only improves phrasing
    rewrite: {
      type:    String,
      default: null,
    },

    // Original text that was flagged (for context)
    original: {
      type:    String,
      default: null,
    },
  },
  { _id: false }
);

// ── Keyword entry ─────────────────────────────────────────────
const KeywordEntrySchema = new mongoose.Schema(
  {
    word:    { type: String },
    count:   { type: Number, default: 0 },
    density: { type: Number, default: 0 }, // percentage
  },
  { _id: false }
);

// ── Main ATSReport schema ─────────────────────────────────────
const ATSReportSchema = new mongoose.Schema(
  {
    // ═══════════════════════════════════════════════
    // REFERENCES
    // ═══════════════════════════════════════════════
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },

    resumeId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Resume",
      required: true,
      index:    true,
    },

    // ═══════════════════════════════════════════════
    // SCORES  (all 0–100)
    // ═══════════════════════════════════════════════
    scores: {
      // Weighted average of all category scores
      overall:  { type: Number, default: 0, min: 0, max: 100 },

      // Quality, clarity, quantification of experience bullet points
      content:  { type: Number, default: 0, min: 0, max: 100 },

      // File format, sections present, length, no graphics that block parsing
      format:   { type: Number, default: 0, min: 0, max: 100 },

      // Relevant keyword density and placement
      keywords: { type: Number, default: 0, min: 0, max: 100 },

      // Only populated when jobDescription is provided
      jobMatch: { type: Number, default: null, min: 0, max: 100 },
    },

    // ═══════════════════════════════════════════════
    // PARSING ANALYSIS
    // ─────────────────────────────────────────────
    // What an ATS robot would extract from the resume
    // ═══════════════════════════════════════════════
    parsing: {
      // Sections the ATS successfully detected
      sectionsFound:   [{ type: String }],

      // Sections expected but missing
      sectionsMissing: [{ type: String }],

      // Whether contact info was found and parseable
      hasEmail:    { type: Boolean, default: false },
      hasPhone:    { type: Boolean, default: false },
      hasLocation: { type: Boolean, default: false },
      hasLinkedIn: { type: Boolean, default: false },

      // Bullet point check — ATS prefers bullet points for experience
      bulletPointsUsed:     { type: Boolean, default: false },
      experienceEntryCount: { type: Number,  default: 0 },
    },

    // ═══════════════════════════════════════════════
    // KEYWORD ANALYSIS
    // ═══════════════════════════════════════════════
    keywords: {
      // Keywords found in the resume
      found: [KeywordEntrySchema],

      // Keywords that should be in a resume of this type but aren't
      missing: [{ type: String }],

      // Total word count
      totalWords: { type: Number, default: 0 },
    },

    // ═══════════════════════════════════════════════
    // CONTENT ANALYSIS
    // ═══════════════════════════════════════════════
    content: {
      // Weak verbs detected (e.g. "worked", "helped", "did")
      weakVerbs: [{ type: String }],

      // How many bullet points have a number/percentage
      quantifiedBullets: { type: Number, default: 0 },
      totalBullets:      { type: Number, default: 0 },

      // Repeated words across bullet points
      repetitiveWords: [{ type: String }],

      // Estimated resume length in pages
      estimatedPages: { type: Number, default: 1 },
    },

    // ═══════════════════════════════════════════════
    // FORMAT ANALYSIS
    // ═══════════════════════════════════════════════
    format: {
      // Fonts detected (ATS prefers standard fonts)
      fontsUsed: [{ type: String }],

      // Whether layout has tables, columns, graphics that block ATS
      hasProblematicElements: { type: Boolean, default: false },
      problematicElements:    [{ type: String }],

      // Whether all standard sections are present
      hasSummary:    { type: Boolean, default: false },
      hasExperience: { type: Boolean, default: false },
      hasEducation:  { type: Boolean, default: false },
      hasSkills:     { type: Boolean, default: false },
    },

    // ═══════════════════════════════════════════════
    // SUGGESTIONS
    // ─────────────────────────────────────────────
    // Sorted by priority (high → medium → low) on read
    // ═══════════════════════════════════════════════
    suggestions: [SuggestionSchema],

    // ═══════════════════════════════════════════════
    // JOB DESCRIPTION MATCHING
    // ─────────────────────────────────────────────
    // Optional — only populated if user provided a JD
    // ═══════════════════════════════════════════════
    jobDescription: {
      type:    String,
      default: null,
    },

    jobMatchDetails: {
      // Keywords from JD found in resume
      matchedKeywords: [{ type: String }],

      // Keywords from JD missing from resume
      missingKeywords: [{ type: String }],

      // Required skills from JD
      requiredSkills: [{ type: String }],

      // Skills from JD that the resume has
      matchedSkills: [{ type: String }],
    },

    // ═══════════════════════════════════════════════
    // META
    // ═══════════════════════════════════════════════

    // Model/version used for this analysis (for admin analytics)
    modelVersion: {
      type:    String,
      default: "1.0",
    },
  },
  {
    timestamps: true,
  }
);

// ═══════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════
ATSReportSchema.index({ userId:   1, createdAt: -1 });
ATSReportSchema.index({ resumeId: 1, createdAt: -1 });
ATSReportSchema.index({ "scores.overall": -1 });

const ATSReport = mongoose.model("ATSReport", ATSReportSchema);
export default ATSReport;