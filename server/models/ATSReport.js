/**
 * ATSReport.js — Full ATS Report Mongoose Schema
 */
import mongoose from 'mongoose';

const ATSReportSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
    resumeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null},
    resumeTitle: { type: String, default: '' },
    source:      { type: String, enum: ['builder','upload'], default: 'builder' },

    scores: {
      overall:   { type: Number, default: 0, min: 0, max: 100 },
      structure: { type: Number, default: 0 },
      content:   { type: Number, default: 0 },
      writing:   { type: Number, default: 0 },
      ats:       { type: Number, default: 0 },
      advanced:  { type: Number, default: 0 },
      label:     { type: String, default: '' },
      breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

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

    keywords: {
      found:      { type: mongoose.Schema.Types.Mixed, default: [] },
      missing:    [String],
      totalWords: { type: Number, default: 0 },
      density:    { type: Number, default: 0 },
      domain:     { type: mongoose.Schema.Types.Mixed, default: {} },
      tfidf:      { type: mongoose.Schema.Types.Mixed, default: [] },
    },

    content: {
      weakVerbs:         [String],
      strongVerbs:       [String],
      verbDiversity:     { type: Number, default: 0 },
      quantifiedBullets: { type: Number, default: 0 },
      totalBullets:      { type: Number, default: 0 },
      repetitiveWords:   [String],
      estimatedPages:    { type: Number, default: 1 },
      fluffWords:        [String],
      readability:       { type: mongoose.Schema.Types.Mixed, default: {} },
      tenseConsistent:   { type: Boolean, default: true },
    },

    atsCompatibility: {
      simulation: { type: mongoose.Schema.Types.Mixed, default: {} },
      issues:     [String],
      warnings:   [String],
    },

    advanced:    { type: mongoose.Schema.Types.Mixed, default: {} },
    suggestions: { type: mongoose.Schema.Types.Mixed, default: [] },
    wordCount:   { type: Number, default: 0 },
    modelVersion:{ type: String, default: '2.0.0' },
  },
  { timestamps: true }
);

ATSReportSchema.index({ userId: 1, createdAt: -1 });
ATSReportSchema.index({ resumeId: 1 });
ATSReportSchema.index({ 'scores.overall': -1 });
ATSReportSchema.index({ source: 1, createdAt: -1 });

export default mongoose.model('ATSReport', ATSReportSchema);