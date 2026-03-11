/**
 * atsController.js
 * ─────────────────────────────────────────────────────────────
 * ATS Checker API handlers.
 *
 * Endpoints:
 *   POST /api/ats/analyze/:resumeId   — analyze stored Quick-CV resume
 *   POST /api/ats/analyze/upload      — analyze uploaded PDF/DOCX
 *   GET  /api/ats/report/:reportId    — get a stored ATS report
 *   GET  /api/ats/history             — user's ATS history
 *   GET  /api/ats/admin/overview      — admin aggregate analytics
 *   GET  /api/ats/admin/score-dist    — admin score distribution
 *   GET  /api/ats/admin/common-issues — admin common issues analysis
 *   GET  /api/ats/admin/user/:userId  — admin per-user ATS data
 * ─────────────────────────────────────────────────────────────
 */

import Resume    from '../models/Resume.js';
import ATSReport from '../models/ATSReport.js';
import { analyzeResume }          from '../services/atsEngine.js';
import { extractTextFromBuffer, textToResumeData, validateFile } from '../services/documentParser.js';

// ─────────────────────────────────────────────────────────────
// analyzeStoredResume
// POST /api/ats/analyze/:resumeId
// Analyzes a resume that already exists in the DB
// ─────────────────────────────────────────────────────────────
export const analyzeStoredResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId       = req.userId;
    const forceRefresh = req.query.refresh === 'true';

    // Load resume — verify ownership
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // Return cached report if fresh (< 1 hour old) and not forcing refresh
    if (!forceRefresh && resume.atsReport) {
      const existing = await ATSReport.findById(resume.atsReport);
      if (existing) {
        const ageMs = Date.now() - existing.updatedAt;
        if (ageMs < 60 * 60 * 1000) { // 1 hour cache
          return res.json({ report: existing, cached: true });
        }
      }
    }

    // Build resumeData from stored Resume fields
    const resumeData = {
      personal_info:         resume.personal_info || {},
      professional_summary:  resume.professional_summary || '',
      skills:                resume.skills || [],
      experience:            resume.experience || [],
      education:             resume.education  || [],
      project:               resume.project    || [],
    };

    // Run analysis
    const analysis = await analyzeResume(resumeData, 'builder');

    // Persist report
    const report = await saveATSReport(userId, resume._id, analysis, 'builder', resume.title);

    // Update resume with latest ATS score
    await Resume.findByIdAndUpdate(resumeId, {
      atsScore:  analysis.scores.final,
      atsReport: report._id,
    });

    res.json({ report, cached: false });

  } catch (err) {
    console.error('ATS analyze error:', err);
    res.status(500).json({ message: 'ATS analysis failed', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// analyzeUploadedResume
// POST /api/ats/analyze/upload
// Parses and analyzes a raw PDF/DOCX/TXT file upload
// ─────────────────────────────────────────────────────────────
export const analyzeUploadedResume = async (req, res) => {
  try {
    const userId = req.userId;
    const file   = req.file;

    // Validate
    const validation = validateFile(file);
    if (!validation.valid) return res.status(400).json({ message: validation.error });

    // Extract text
    let rawText;
    try {
      rawText = await extractTextFromBuffer(file.buffer, file.mimetype);
    } catch (parseErr) {
      return res.status(422).json({ message: `Could not read file: ${parseErr.message}` });
    }

    if (!rawText || rawText.trim().length < 100) {
      return res.status(422).json({ message: 'Could not extract enough text from the file. Please check it is not password-protected or image-only.' });
    }

    // Parse to resume data structure
    let resumeData;
    try {
      resumeData = textToResumeData(rawText);
    } catch (parseErr) {
      return res.status(422).json({ message: `Document parsing failed: ${parseErr.message}` });
    }

    // Run analysis
    const analysis = await analyzeResume(resumeData, 'upload');

    // Save report (no resumeId link for uploads)
    const report = await saveATSReport(userId, null, analysis, 'upload', file.originalname);

    res.json({
      report,
      parsed: {
        name:          resumeData.personal_info?.full_name || 'Unknown',
        sectionsFound: resumeData._sectionsFound || [],
        wordCount:     analysis.meta.wordCount,
        textLength:    rawText.length,
      },
    });

  } catch (err) {
    console.error('ATS upload analyze error:', err);
    res.status(500).json({ message: 'ATS analysis failed', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// saveATSReport — upserts the ATSReport document in MongoDB
// ─────────────────────────────────────────────────────────────
async function saveATSReport(userId, resumeId, analysis, source, title = '') {
  const a = analysis;

  const reportData = {
    userId,
    resumeId:  resumeId || null,
    resumeTitle: title,
    source,

    // ── Scores ────────────────────────────────────────────
    scores: {
      overall:   a.scores.final,
      structure: a.scores.structure.score,
      content:   a.scores.content.score,
      writing:   a.scores.writing.score,
      ats:       a.scores.ats.score,
      advanced:  a.scores.advanced.score,
      label:     a.scores.label.label,

      breakdown: a.scores.breakdown,
    },

    // ── Parsing / Structure ───────────────────────────────
    parsing: {
      sectionsFound:   [],
      sectionsMissing: a.scores.breakdown.A ? [] : [],
      hasEmail:        a.contact.hasEmail,
      hasPhone:        a.contact.hasPhone,
      hasLocation:     a.contact.hasLocation,
      hasLinkedIn:     a.contact.hasLinkedIn,
      bulletPointsUsed:     (a.experience.totalBullets || 0) > 0,
      experienceEntryCount: a.experience.entryCount || 0,
    },

    // ── Keywords ──────────────────────────────────────────
    keywords: {
      found:      a.keywords.found,
      missing:    a.keywords.missing,
      totalWords: a.meta.wordCount,
      density:    a.keywords.density,
      domain:     a.keywords.domain,
      tfidf:      a.keywords.tfidf,
    },

    // ── Content ───────────────────────────────────────────
    content: {
      weakVerbs:         a.writing.actionVerbs.weakSamples?.map(w => w.verb).filter(Boolean) || [],
      strongVerbs:       a.writing.actionVerbs.strong,
      verbDiversity:     a.writing.actionVerbs.diversity,
      quantifiedBullets: a.writing.quantification.count,
      totalBullets:      a.experience.totalBullets,
      repetitiveWords:   a.writing.repetition.words.map(r => r.word),
      estimatedPages:    Math.ceil((a.meta.wordCount || 0) / 400),
      fluffWords:        a.writing.fluff.found,
      readability:       a.writing.readability,
      tenseConsistent:   a.writing.tenseConsistency.consistent,
    },

    // ── ATS Compatibility ─────────────────────────────────
    atsCompatibility: {
      simulation: a.atsCompatibility.simulation,
      issues:     a.atsCompatibility.format.issues,
      warnings:   a.atsCompatibility.format.warnings,
    },

    // ── Advanced ──────────────────────────────────────────
    advanced: {
      domainInference: a.advanced.domainInference,
      hotSkillMatches: a.advanced.hotSkillMatches,
      hasLinkedIn:     a.advanced.hasLinkedIn,
      hasGitHub:       a.advanced.hasGitHub,
    },

    // ── Suggestions ───────────────────────────────────────
    suggestions: a.suggestions,

    // ── Meta ──────────────────────────────────────────────
    modelVersion: a.meta.engineVersion,
    wordCount:    a.meta.wordCount,
  };

  // Upsert: if a report exists for this resume, replace it
  if (resumeId) {
    const existing = await ATSReport.findOne({ resumeId });
    if (existing) {
      Object.assign(existing, reportData);
      return existing.save();
    }
  }

  return ATSReport.create(reportData);
}

// ─────────────────────────────────────────────────────────────
// getReport
// GET /api/ats/report/:reportId
// ─────────────────────────────────────────────────────────────
export const getReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await ATSReport.findOne({ _id: reportId, userId: req.userId });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// getUserHistory
// GET /api/ats/history
// Returns paginated ATS reports for the current user
// ─────────────────────────────────────────────────────────────
export const getUserHistory = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      ATSReport.find({ userId: req.userId })
        .select('resumeTitle source scores.overall scores.label createdAt updatedAt resumeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ATSReport.countDocuments({ userId: req.userId }),
    ]);

    res.json({
      reports,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS
// All require adminMiddleware (added in route file)
// ─────────────────────────────────────────────────────────────

// GET /api/ats/admin/overview
export const adminOverview = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalReports,
      reportsThisMonth,
      avgScoreResult,
      builderCount,
      uploadCount,
      highScoreCount,
      lowScoreCount,
    ] = await Promise.all([
      ATSReport.countDocuments(),
      ATSReport.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      ATSReport.aggregate([{ $group: { _id: null, avg: { $avg: '$scores.overall' } } }]),
      ATSReport.countDocuments({ source: 'builder' }),
      ATSReport.countDocuments({ source: 'upload' }),
      ATSReport.countDocuments({ 'scores.overall': { $gte: 75 } }),
      ATSReport.countDocuments({ 'scores.overall': { $lt: 45 } }),
    ]);

    const avgScore = avgScoreResult[0]?.avg || 0;

    // Score trend over last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyScores = await ATSReport.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id:      { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avgScore: { $avg: '$scores.overall' },
          count:    { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalReports,
      reportsThisMonth,
      avgScore:        Math.round(avgScore * 10) / 10,
      builderCount,
      uploadCount,
      highScoreCount,
      lowScoreCount,
      passRate:        totalReports > 0 ? Math.round((highScoreCount / totalReports) * 100) : 0,
      dailyScores,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/ats/admin/score-distribution
export const adminScoreDistribution = async (req, res) => {
  try {
    const distribution = await ATSReport.aggregate([
      {
        $bucket: {
          groupBy:    '$scores.overall',
          boundaries: [0, 20, 40, 60, 75, 90, 101],
          default:    'other',
          output:     { count: { $sum: 1 }, avgScore: { $avg: '$scores.overall' } },
        },
      },
    ]);

    const labels = ['0–19', '20–39', '40–59', '60–74', '75–89', '90–100'];
    const formatted = distribution.map((d, i) => ({
      range:    labels[i] || 'other',
      count:    d.count,
      avgScore: Math.round((d.avgScore || 0) * 10) / 10,
    }));

    // Category average scores
    const categoryAvgs = await ATSReport.aggregate([
      {
        $group: {
          _id:       null,
          structure: { $avg: '$scores.structure' },
          content:   { $avg: '$scores.content' },
          writing:   { $avg: '$scores.writing' },
          ats:       { $avg: '$scores.ats' },
          advanced:  { $avg: '$scores.advanced' },
        },
      },
    ]);

    const avgs = categoryAvgs[0] || {};

    res.json({
      distribution: formatted,
      categoryAverages: {
        structure: Math.round((avgs.structure || 0) * 10) / 10,
        content:   Math.round((avgs.content   || 0) * 10) / 10,
        writing:   Math.round((avgs.writing   || 0) * 10) / 10,
        ats:       Math.round((avgs.ats       || 0) * 10) / 10,
        advanced:  Math.round((avgs.advanced  || 0) * 10) / 10,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/ats/admin/common-issues
export const adminCommonIssues = async (req, res) => {
  try {
    // Most common missing keywords
    const missingKW = await ATSReport.aggregate([
      { $unwind: '$keywords.missing' },
      { $group: { _id: '$keywords.missing', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    // Most common weak verbs
    const weakVerbs = await ATSReport.aggregate([
      { $unwind: '$content.weakVerbs' },
      { $match: { 'content.weakVerbs': { $ne: null, $ne: '' } } },
      { $group: { _id: '$content.weakVerbs', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Most common fluff words
    const fluffWords = await ATSReport.aggregate([
      { $unwind: '$content.fluffWords' },
      { $group: { _id: '$content.fluffWords', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // % of resumes missing key sections
    const total = await ATSReport.countDocuments();
    const missingContact  = await ATSReport.countDocuments({ 'parsing.hasEmail': false });
    const missingPhone    = await ATSReport.countDocuments({ 'parsing.hasPhone': false });
    const missingLinkedIn = await ATSReport.countDocuments({ 'parsing.hasLinkedIn': false });
    const lowQuantified   = await ATSReport.countDocuments({ 'content.quantifiedBullets': { $lt: 2 } });

    // Most common domains
    const domains = await ATSReport.aggregate([
      { $group: { _id: '$keywords.domain.domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      missingKeywords: missingKW.map(k => ({ keyword: k._id, count: k.count })),
      weakVerbs:       weakVerbs.map(v => ({ verb: v._id, count: v.count })),
      fluffWords:      fluffWords.map(f => ({ word: f._id, count: f.count })),
      sectionIssues: {
        missingEmail:    total > 0 ? Math.round((missingContact  / total) * 100) : 0,
        missingPhone:    total > 0 ? Math.round((missingPhone    / total) * 100) : 0,
        missingLinkedIn: total > 0 ? Math.round((missingLinkedIn / total) * 100) : 0,
        lowQuantification: total > 0 ? Math.round((lowQuantified / total) * 100) : 0,
      },
      topDomains: domains.map(d => ({ domain: d._id || 'general', count: d.count })),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/ats/admin/users
export const adminUsersList = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      ATSReport.aggregate([
        {
          $group: {
            _id:          '$userId',
            reportCount:  { $sum: 1 },
            avgScore:     { $avg: '$scores.overall' },
            bestScore:    { $max: '$scores.overall' },
            lastAnalyzed: { $max: '$createdAt' },
          },
        },
        { $sort: { lastAnalyzed: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from:         'users',
            localField:   '_id',
            foreignField: '_id',
            as:           'user',
          },
        },
        {
          $project: {
            userId:       '$_id',
            name:         { $arrayElemAt: ['$user.name', 0] },
            email:        { $arrayElemAt: ['$user.email', 0] },
            reportCount:  1,
            avgScore:     { $round: ['$avgScore', 1] },
            bestScore:    1,
            lastAnalyzed: 1,
          },
        },
      ]),
      ATSReport.distinct('userId').then(ids => ids.length),
    ]);

    res.json({ users, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/ats/admin/user/:userId
export const adminUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = await ATSReport.find({ userId })
      .select('resumeTitle source scores createdAt keywords.domain atsCompatibility.simulation')
      .sort({ createdAt: -1 })
      .limit(20);

    if (!reports.length) return res.status(404).json({ message: 'No ATS reports found for this user' });

    const scores = reports.map(r => r.scores.overall);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    res.json({
      reports,
      summary: {
        totalReports: reports.length,
        avgScore:     Math.round(avgScore * 10) / 10,
        bestScore:    Math.max(...scores),
        latestScore:  scores[0],
        trend:        scores.length >= 2 ? scores[0] - scores[scores.length - 1] : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};