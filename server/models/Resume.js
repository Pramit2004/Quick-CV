import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    // ═══════════════════════════════════════════════
    // OWNER
    // ═══════════════════════════════════════════════
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },

    // ═══════════════════════════════════════════════
    // DOCUMENT TYPE
    // ═══════════════════════════════════════════════
    documentType: {
      type:    String,
      enum:    ["resume", "cv"],
      default: "resume",
      index:   true,
    },

    // ═══════════════════════════════════════════════
    // TEMPLATE REFERENCE
    // ═══════════════════════════════════════════════
    templateId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "Template",
      default: null,
    },

    // ═══════════════════════════════════════════════
    // BASIC INFO
    // ═══════════════════════════════════════════════
    title: {
      type:    String,
      default: "Untitled Resume",
      trim:    true,
    },

    public: {
      type:    Boolean,
      default: false,
    },

    template: {
      type:    String,
      default: "classic",
      index:   true,
    },

    accent_color: {
      type:    String,
      default: "#3B82F6",
    },

    // ═══════════════════════════════════════════════
    // DYNAMIC TEMPLATE DATA
    // ─────────────────────────────────────────────
    // globalStyle is stored as Mixed (not a typed sub-schema)
    // so that new layout values and properties can be added
    // without migration. The DynamicResumeRenderer mergeGlobalStyle()
    // function supplies defaults for any missing keys.
    // ═══════════════════════════════════════════════
    globalStyle: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },

    sections: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ═══════════════════════════════════════════════
    // USER STYLING OVERRIDES
    // Per-resume user tweaks that layer over globalStyle.
    // Stored separately so template updates don't wipe preferences.
    // ═══════════════════════════════════════════════
    userStyling: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ═══════════════════════════════════════════════
    // USER CUSTOM SECTIONS (freetext, user-added)
    // Each: { id, label, content, isUserCustom: true }
    // ═══════════════════════════════════════════════
    userCustomSections: {
      type:    mongoose.Schema.Types.Mixed,
      default: [],
    },

    // ═══════════════════════════════════════════════
    // ADMIN CUSTOM SECTION DATA
    // Stores user's filled data for admin-defined custom sections.
    // Format: [{ id: "custom_xxx", fields: { fieldKey: value } }]
    // Matches what DynamicResumeRenderer reads via:
    //   sectionData?.fields?.[fd.fieldKey]
    // ═══════════════════════════════════════════════
    customSections: {
      type:    mongoose.Schema.Types.Mixed,
      default: [],
    },

    // ═══════════════════════════════════════════════
    // ATS
    // ═══════════════════════════════════════════════
    atsScore: {
      type:    Number,
      default: null,
      min:     0,
      max:     100,
    },

    atsReport: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "ATSReport",
      default: null,
    },

    // ═══════════════════════════════════════════════
    // ANALYTICS
    // ═══════════════════════════════════════════════
    downloadCount: {
      type:    Number,
      default: 0,
    },

    lastDownloadedAt: {
      type: Date,
    },

    // ═══════════════════════════════════════════════
    // CONTENT
    // ═══════════════════════════════════════════════
    professional_summary: {
      type:    String,
      default: "",
    },

    skills: [{ type: String, trim: true }],

    personal_info: {
      image:      { type: String, default: "" },
      full_name:  { type: String, default: "" },
      profession: { type: String, default: "" },
      email:      { type: String, default: "" },
      phone:      { type: String, default: "" },
      location:   { type: String, default: "" },
      linkedin:   { type: String, default: "" },
      website:    { type: String, default: "" },
    },

    experience: [
      {
        company:     { type: String },
        position:    { type: String },
        start_date:  { type: String },
        end_date:    { type: String },
        description: { type: String },
        is_current:  { type: Boolean },
      },
    ],

    project: [
      {
        name:        { type: String },
        type:        { type: String },
        description: { type: String },
        liveUrl:     { type: String, default: "" },
        githubUrl:   { type: String, default: "" },
      },
    ],

    education: [
      {
        institution:     { type: String },
        degree:          { type: String },
        field:           { type: String },
        graduation_date: { type: String },
        gpa:             { type: String },
      },
    ],

    // CV-specific
    publications: { type: mongoose.Schema.Types.Mixed, default: [] },
    grants:       { type: mongoose.Schema.Types.Mixed, default: [] },
    teaching:     { type: mongoose.Schema.Types.Mixed, default: [] },
    references:   { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  {
    timestamps: true,
    minimize:   false,
  }
);

ResumeSchema.index({ createdAt: -1 });
ResumeSchema.index({ template: 1, createdAt: -1 });
ResumeSchema.index({ documentType: 1, createdAt: -1 });
ResumeSchema.index({ userId: 1, documentType: 1 });

const Resume = mongoose.model("Resume", ResumeSchema);
export default Resume;

// import mongoose from "mongoose";

// const ResumeSchema = new mongoose.Schema({
//   // ======================
//   // OWNER
//   // ======================
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//     index: true,
//   },

//   // ======================
//   // BASIC INFO
//   // ======================
//   title: {
//     type: String,
//     default: "Untitled Resume",
//     trim: true,
//   },

//   public: {
//     type: Boolean,
//     default: false,
//   },

//   template: {
//     type: String,
//     default: "classic",
//     index: true, // used for admin template stats
//   },

//   accent_color: {
//     type: String,
//     default: "#3B82F6",
//   },

//   // ======================
//   // PHASE 6C — DYNAMIC TEMPLATE
//   // If globalStyle + sections exist → DynamicResumeRenderer is used
//   // If null → legacy ClassicTemplate / ModernTemplate etc.
//   // Fully backwards-compatible: existing resumes are unaffected
//   // ======================
//   globalStyle: {
//     type: mongoose.Schema.Types.Mixed,
//     default: null,
//   },

//   sections: {
//     type: mongoose.Schema.Types.Mixed,
//     default: null,
//   },

//   // ======================
//   // ATS / ANALYTICS
//   // ======================
//   downloadCount: {
//     type: Number,
//     default: 0,
//   },

//   lastDownloadedAt: {
//     type: Date,
//   },

//   // ======================
//   // CONTENT
//   // ======================
//   professional_summary: {
//     type: String,
//     default: "",
//   },

//   skills: [
//     {
//       type: String,
//       trim: true,
//     },
//   ],

//   personal_info: {
//     image:      { type: String, default: "" },
//     full_name:  { type: String, default: "" },
//     profession: { type: String, default: "" },
//     email:      { type: String, default: "" },
//     phone:      { type: String, default: "" },
//     location:   { type: String, default: "" },
//     linkedin:   { type: String, default: "" },
//     website:    { type: String, default: "" },
//   },

//   // ======================
//   // EXPERIENCE
//   // ======================
//   experience: [
//     {
//       company:     { type: String },
//       position:    { type: String },
//       start_date:  { type: String },
//       end_date:    { type: String },
//       description: { type: String },
//       is_current:  { type: Boolean },
//     },
//   ],

//   // ======================
//   // PROJECTS
//   // ======================
//   project: [
//     {
//       name:        { type: String },
//       type:        { type: String },
//       description: { type: String },
//     },
//   ],

//   // ======================
//   // EDUCATION
//   // ======================
//   education: [
//     {
//       institution:     { type: String },
//       degree:          { type: String },
//       field:           { type: String },
//       graduation_date: { type: String },
//       gpa:             { type: String },
//     },
//   ],
// },
// {
//   timestamps: true,
//   minimize: false,
// });

// // ======================
// // INDEXES FOR ADMIN ANALYTICS
// // ======================
// ResumeSchema.index({ createdAt: -1 });
// ResumeSchema.index({ template: 1, createdAt: -1 });

// const Resume = mongoose.model("Resume", ResumeSchema);
// export default Resume;