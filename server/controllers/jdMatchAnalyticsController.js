// server/controllers/jdMatchAnalyticsController.js
// Admin-only analytics for JD Match feature
// Add these routes to your adminRoutes.js

import JDMatch from "../models/JDMatch.js";

// GET /api/admin/jd-match/overview
export const getJDMatchOverview = async (req, res) => {
  try {
    const [total, successful, avgScoreRes, todayCount] = await Promise.all([
      JDMatch.countDocuments(),
      JDMatch.countDocuments({ status: "Success" }),
      JDMatch.aggregate([
        { $match: { status: "Success" } },
        { $group: { _id: null, avg: { $avg: "$score" } } },
      ]),
      JDMatch.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    res.json({
      total,
      successful,
      failed: total - successful,
      avgScore: avgScoreRes[0] ? Math.round(avgScoreRes[0].avg) : 0,
      todayCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/jd-match/score-distribution
// Returns count of analyses bucketed by score range
export const getScoreDistribution = async (req, res) => {
  try {
    const buckets = await JDMatch.aggregate([
      { $match: { status: "Success" } },
      {
        $bucket: {
          groupBy: "$score",
          boundaries: [0, 20, 40, 60, 80, 101],
          default: "Other",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    // Map to readable labels
    const labelMap = {
      0:   "0–19",
      20:  "20–39",
      40:  "40–59",
      60:  "60–79",
      80:  "80–100",
    };

    const result = buckets.map((b) => ({
      range: labelMap[b._id] || String(b._id),
      count: b.count,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/jd-match/missing-skills
// Top N most commonly missing skills across all analyses
export const getTopMissingSkills = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await JDMatch.aggregate([
      { $match: { status: "Success", missingSkills: { $exists: true, $ne: [] } } },
      { $unwind: "$missingSkills" },
      {
        $group: {
          _id: { $toLower: "$missingSkills" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { skill: "$_id", count: 1, _id: 0 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/jd-match/chart
// Daily analysis count — last 30 days
export const getJDMatchChart = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const raw = await JDMatch.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          avgScore: { $avg: "$score" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill gaps with 0s
    const map = Object.fromEntries(raw.map((r) => [r._id, r]));
    const result = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({
        date: key,
        count: map[key]?.count || 0,
        avgScore: map[key] ? Math.round(map[key].avgScore) : 0,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/jd-match/recent
// Last 20 analyses with user info
export const getRecentJDMatches = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const results = await JDMatch.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email")
      .select("userId score status summary createdAt resumeLength jdLength");

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};