/**
 * atsController.js — FIXED VERSION
 * Key fixes:
 *  1. Route ordering: /analyze/upload registered before /analyze/:resumeId
 *  2. saveATSReport stores the FULL analysis object (Mixed schema)
 *  3. History returns correct score field (scores.final not scores.overall)
 *  4. parsedContent stored so user can verify parsing
 *  5. Admin per-user detail returns full reports with all fields
 *  6. AI enhance endpoint added
 */

import Resume    from '../models/Resume.js';
import ATSReport from '../models/ATSReport.js';
import ai        from '../configs/ai.js';
import { analyzeResume }          from '../services/atsEngine.js';
import { extractTextFromBuffer, textToResumeData, validateFile } from '../services/documentParser.js';

// ─────────────────────────────────────────────────────────────
// saveATSReport — stores the FULL analysis in MongoDB
// The entire `analysis` object goes in as Mixed fields
// ─────────────────────────────────────────────────────────────
async function saveATSReport(userId, resumeId, analysis, source, title = '', rawText = '', resumeData = {}) {
  const a = analysis;

  const reportData = {
    userId,
    resumeId:    resumeId || null,
    resumeTitle: title,
    source,

    // ── Full scores object preserved (Mixed) ──────────────
    // Client reads: s.final, s.structure.score, s.breakdown.A.A1 etc.
    scores: a.scores,

    // ── Parsing metadata ──────────────────────────────────
    parsing: {
      sectionsFound:        resumeData._sectionsFound || a.meta?.sectionsFound || [],
      sectionsMissing:      a.meta?.missingSections   || [],
      hasEmail:             a.contact?.hasEmail    || false,
      hasPhone:             a.contact?.hasPhone    || false,
      hasLocation:          a.contact?.hasLocation || false,
      hasLinkedIn:          a.contact?.hasLinkedIn || false,
      hasLinkedInWord:      a.contact?.hasLinkedInWord || false,
      bulletPointsUsed:     (a.experience?.totalBullets || 0) > 0 || (resumeData.project?.length || 0) > 0,
      experienceEntryCount: a.experience?.entryCount || 0,
      careerLevel:          a.meta?.careerLevel || 'unknown',
    },

    // ── Raw parsed content (for "Parsed Content" tab) ─────
    parsedContent: {
      rawText:             rawText.substring(0, 8000),
      personalInfo:        a.contact || {},
      professionalSummary: resumeData.professional_summary || '',
      skills:              resumeData.skills || a.skills?.topSkills || [],
      experienceCount:     a.experience?.entryCount || 0,
      educationCount:      a.education?.entryCount  || 0,
      projectCount:        a.projects?.count        || resumeData.project?.length || 0,
      wordCount:           a.meta?.wordCount        || 0,
      careerLevel:         a.meta?.careerLevel      || 'unknown',
      sectionsFound:       resumeData._sectionsFound || [],
    },

    // ── Full analysis sub-objects ─────────────────────────
    keywords: {
      found:      a.keywords?.found      || [],
      missing:    a.keywords?.missing    || [],
      totalWords: a.meta?.wordCount      || 0,
      density:    a.keywords?.density    || 0,
      domain:     a.keywords?.domain     || {},
      tfidf:      a.keywords?.tfidf      || [],
      totalFound: a.keywords?.totalFound || 0,
    },

    contact:    a.contact    || {},
    experience: a.experience || {},
    education:  a.education  || {},
    skills:     a.skills     || {},
    projects:   a.projects   || {},
    summary:    a.summary    || {},

    writing:    a.writing    || {},

    atsCompatibility: {
      simulation: a.atsCompatibility?.simulation || {},
      issues:     a.atsCompatibility?.format?.issues   || [],
      warnings:   a.atsCompatibility?.format?.warnings || [],
    },

    advanced:    a.advanced    || {},
    suggestions: a.suggestions || [],

    meta:         a.meta         || {},
    wordCount:    a.meta?.wordCount || 0,
    modelVersion: a.meta?.engineVersion || '2.0.0',
  };

  // Upsert: if a report exists for this resume, replace it
  if (resumeId) {
    const existing = await ATSReport.findOne({ resumeId });
    if (existing) {
      Object.assign(existing, reportData);
      existing.markModified('scores');
      existing.markModified('writing');
      existing.markModified('keywords');
      existing.markModified('atsCompatibility');
      existing.markModified('advanced');
      existing.markModified('suggestions');
      existing.markModified('parsedContent');
      return existing.save();
    }
  }

  return ATSReport.create(reportData);
}

// ─────────────────────────────────────────────────────────────
// analyzeStoredResume
// POST /api/ats/analyze/:resumeId
// ─────────────────────────────────────────────────────────────
export const analyzeStoredResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId       = req.userId;
    const forceRefresh = req.query.refresh === 'true';

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // Cache: return existing fresh report (< 1h old) unless forced
    if (!forceRefresh && resume.atsReport) {
      const existing = await ATSReport.findById(resume.atsReport);
      if (existing) {
        const ageMs = Date.now() - new Date(existing.updatedAt).getTime();
        if (ageMs < 60 * 60 * 1000) {
          return res.json({ report: existing, cached: true });
        }
      }
    }

    const resumeData = {
      personal_info:        resume.personal_info        || {},
      professional_summary: resume.professional_summary || '',
      skills:               resume.skills               || [],
      experience:           resume.experience           || [],
      education:            resume.education            || [],
      project:              resume.project              || [],
    };

    const analysis = await analyzeResume(resumeData, 'builder');
    const report   = await saveATSReport(userId, resume._id, analysis, 'builder', resume.title || 'Untitled', '', resumeData);

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
// ─────────────────────────────────────────────────────────────
export const analyzeUploadedResume = async (req, res) => {
  try {
    const userId = req.userId;
    const file   = req.file;

    const validation = validateFile(file);
    if (!validation.valid) return res.status(400).json({ message: validation.error });

    let rawText;
    try {
      rawText = await extractTextFromBuffer(file.buffer, file.mimetype);
    } catch (parseErr) {
      return res.status(422).json({ message: `Could not read file: ${parseErr.message}` });
    }

    if (!rawText || rawText.trim().length < 50) {
      return res.status(422).json({
        message: 'Could not extract enough text. Please ensure the file is not image-only or password-protected.',
      });
    }

    let resumeData;
    try {
      resumeData = textToResumeData(rawText);
    } catch (parseErr) {
      return res.status(422).json({ message: `Document parsing failed: ${parseErr.message}` });
    }

    const analysis = await analyzeResume(resumeData, 'upload');
    const report   = await saveATSReport(
      userId, null, analysis, 'upload',
      file.originalname || 'Uploaded Resume',
      rawText,
      resumeData
    );

    res.json({
      report,
      parsed: {
        name:          resumeData.personal_info?.full_name || 'Unknown',
        sectionsFound: resumeData._sectionsFound || [],
        wordCount:     analysis.meta.wordCount,
        textLength:    rawText.length,
        rawText:       rawText.substring(0, 2000), // preview
      },
    });
  } catch (err) {
    console.error('ATS upload analyze error:', err);
    res.status(500).json({ message: 'ATS analysis failed', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// getReport — GET /api/ats/report/:reportId
// ─────────────────────────────────────────────────────────────
export const getReport = async (req, res) => {
  try {
    const report = await ATSReport.findOne({ _id: req.params.reportId, userId: req.userId });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// getUserHistory — GET /api/ats/history
// ─────────────────────────────────────────────────────────────
export const getUserHistory = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      ATSReport.find({ userId: req.userId })
        .select('resumeTitle source scores parsedContent.wordCount createdAt updatedAt resumeId')
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
// enhanceWithAI — POST /api/ats/enhance
// AI improves resume content based on ATS suggestions
// Does NOT add false info — only improves existing content
// ─────────────────────────────────────────────────────────────
export const enhanceWithAI = async (req, res) => {
  try {
    const { reportId, section, content } = req.body;
    if (!content) return res.status(400).json({ message: 'No content provided' });

    const systemPrompt = `You are an expert ATS resume optimizer. Your STRICT rules:
1. NEVER invent, fabricate, or add false information
2. ONLY improve/rephrase existing content
3. Add quantifiers ONLY if implied (e.g., "managed team" → "managed team of 3-5 engineers" is NOT allowed unless team size is mentioned)
4. Replace weak verbs with strong action verbs
5. Make content more ATS-friendly with relevant keywords from the existing context
6. Keep the same meaning, just stronger phrasing
7. Return ONLY the improved text, no explanations

Section being improved: ${section || 'general'}`;

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: `Improve this resume content:\n\n${content}` },
      ],
      max_tokens: 500,
    });

    res.json({ enhanced: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────────────────────────────────────

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
      ATSReport.aggregate([{ $group: { _id: null, avg: { $avg: '$scores.final' } } }]),
      ATSReport.countDocuments({ source: 'builder' }),
      ATSReport.countDocuments({ source: 'upload' }),
      ATSReport.countDocuments({ 'scores.final': { $gte: 75 } }),
      ATSReport.countDocuments({ 'scores.final': { $lt: 45 } }),
    ]);

    const avgScore = avgScoreResult[0]?.avg || 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyScores = await ATSReport.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id:      { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avgScore: { $avg: '$scores.final' },
          count:    { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalReports,
      reportsThisMonth,
      avgScore:       Math.round(avgScore * 10) / 10,
      builderCount,
      uploadCount,
      highScoreCount,
      lowScoreCount,
      passRate:       totalReports > 0 ? Math.round((highScoreCount / totalReports) * 100) : 0,
      dailyScores,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const adminScoreDistribution = async (req, res) => {
  try {
    const distribution = await ATSReport.aggregate([
      {
        $bucket: {
          groupBy:    '$scores.final',
          boundaries: [0, 20, 40, 60, 75, 90, 101],
          default:    'other',
          output:     { count: { $sum: 1 }, avgScore: { $avg: '$scores.final' } },
        },
      },
    ]);

    const labels = ['0–19', '20–39', '40–59', '60–74', '75–89', '90–100'];
    const formatted = distribution.map((d, i) => ({
      range:    labels[i] || 'other',
      count:    d.count,
      avgScore: Math.round((d.avgScore || 0) * 10) / 10,
    }));

    res.json({ distribution: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const adminCommonIssues = async (req, res) => {
  try {
    const [missingKW, weakVerbs, fluffWords, total] = await Promise.all([
      ATSReport.aggregate([
        { $unwind: '$keywords.missing' },
        { $group: { _id: '$keywords.missing', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      ATSReport.aggregate([
        { $unwind: '$writing.actionVerbs.weakSamples' },
        { $match: { 'writing.actionVerbs.weakSamples.verb': { $ne: null, $ne: '' } } },
        { $group: { _id: '$writing.actionVerbs.weakSamples.verb', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ATSReport.aggregate([
        { $unwind: '$writing.fluff.found' },
        { $group: { _id: '$writing.fluff.found', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ATSReport.countDocuments(),
    ]);

    res.json({
      missingKeywords: missingKW.map(k => ({ keyword: k._id, count: k.count })),
      weakVerbs:       weakVerbs.map(v => ({ verb: v._id, count: v.count })),
      fluffWords:      fluffWords.map(f => ({ word: f._id, count: f.count })),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
            avgScore:     { $avg: '$scores.final' },
            bestScore:    { $max: '$scores.final' },
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
            name:         { $arrayElemAt: ['$user.name',  0] },
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

// GET /api/ats/admin/user/:userId — full detail per user with all reports
export const adminUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    const reports = await ATSReport
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    if (!reports.length) return res.status(404).json({ message: 'No ATS reports found for this user' });

    const scores  = reports.map(r => r.scores?.final || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Lookup user info
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId).select('name email').lean();

    res.json({
      user,
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