/**
 * ATSReport.js — Full ATS Report Mongoose Schema
 * FIXED: scores stored as Mixed to preserve {score, max, breakdown} structure
 */
import mongoose from 'mongoose';

const ATSReportSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
    resumeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    resumeTitle: { type: String, default: '' },
    source:      { type: String, enum: ['builder','upload'], default: 'builder' },

    // Full scores object preserved as-is from the engine
    // Shape: { final, base, bonus, label, structure:{score,max}, content:{score,max},
    //          writing:{score,max}, ats:{score,max}, advanced:{score,max}, breakdown:{A,B,C,D,E} }
    scores: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Parsed structure info
    parsing: {
      sectionsFound:        [String],
      sectionsMissing:      [String],
      hasEmail:             { type: Boolean, default: false },
      hasPhone:             { type: Boolean, default: false },
      hasLocation:          { type: Boolean, default: false },
      hasLinkedIn:          { type: Boolean, default: false },
      bulletPointsUsed:     { type: Boolean, default: false },
      experienceEntryCount: { type: Number,  default: 0 },
    },

    // Raw parsed text content (for the "Parsed Content" tab)
    parsedContent: {
      rawText:              { type: String, default: '' },
      personalInfo:         { type: mongoose.Schema.Types.Mixed, default: {} },
      professionalSummary:  { type: String, default: '' },
      skills:               [String],
      experienceCount:      { type: Number, default: 0 },
      educationCount:       { type: Number, default: 0 },
      projectCount:         { type: Number, default: 0 },
      wordCount:            { type: Number, default: 0 },
    },

    keywords: {
      found:      { type: mongoose.Schema.Types.Mixed, default: [] },
      missing:    [String],
      totalWords: { type: Number, default: 0 },
      density:    { type: Number, default: 0 },
      domain:     { type: mongoose.Schema.Types.Mixed, default: {} },
      tfidf:      { type: mongoose.Schema.Types.Mixed, default: [] },
      totalFound: { type: Number, default: 0 },
    },

    contact: { type: mongoose.Schema.Types.Mixed, default: {} },
    experience: { type: mongoose.Schema.Types.Mixed, default: {} },
    education:  { type: mongoose.Schema.Types.Mixed, default: {} },
    skills:     { type: mongoose.Schema.Types.Mixed, default: {} },
    projects:   { type: mongoose.Schema.Types.Mixed, default: {} },
    summary:    { type: mongoose.Schema.Types.Mixed, default: {} },

    writing: { type: mongoose.Schema.Types.Mixed, default: {} },

    atsCompatibility: {
      simulation: { type: mongoose.Schema.Types.Mixed, default: {} },
      issues:     [String],
      warnings:   [String],
    },

    advanced:    { type: mongoose.Schema.Types.Mixed, default: {} },
    suggestions: { type: mongoose.Schema.Types.Mixed, default: [] },

    meta:         { type: mongoose.Schema.Types.Mixed, default: {} },
    wordCount:    { type: Number, default: 0 },
    modelVersion: { type: String, default: '2.0.0' },
  },
  { timestamps: true }
);

ATSReportSchema.index({ userId: 1, createdAt: -1 });
ATSReportSchema.index({ resumeId: 1 });
ATSReportSchema.index({ 'scores.final': -1 });
ATSReportSchema.index({ source: 1, createdAt: -1 });

export default mongoose.model('ATSReport', ATSReportSchema);