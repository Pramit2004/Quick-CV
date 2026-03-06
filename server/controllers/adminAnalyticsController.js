import User from "../models/User.js";
import Resume from "../models/Resume.js";
import TrafficLog from "../models/TrafficLog.js";
import Feedback from "../models/Feedback.js";

// Helper — date N days ago
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper — format date as YYYY-MM-DD
const dateString = (date) => date.toISOString().split("T")[0];

// ─────────────────────────────────────────────
// GET /api/admin/analytics/overview
// Main dashboard stats
// ─────────────────────────────────────────────
export const getOverview = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = daysAgo(30);
    const sevenDaysAgo = daysAgo(7);
    const todayStart = daysAgo(0);

    const [
      totalUsers,
      newUsersThisMonth,
      activeUsersThisMonth,
      totalResumes,
      totalDownloads,
      newUsersToday,
      resumesThisMonth,
      unreadFeedback,
    ] = await Promise.all([
      // Total users ever
      User.countDocuments(),

      // New users in last 30 days
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

      // Active users in last 30 days
      User.countDocuments({ lastActiveAt: { $gte: thirtyDaysAgo } }),

      // Total resumes ever
      Resume.countDocuments(),

      // Total downloads across all resumes
      Resume.aggregate([
        { $group: { _id: null, total: { $sum: "$downloadCount" } } },
      ]),

      // New users today
      User.countDocuments({ createdAt: { $gte: todayStart } }),

      // Resumes created in last 30 days
      Resume.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

      // Unread feedback count
      Feedback.countDocuments({ isRead: false }),
    ]);

    // Weekly active users
    const weeklyActiveUsers = await User.countDocuments({
      lastActiveAt: { $gte: sevenDaysAgo },
    });

    return res.status(200).json({
      totalUsers,
      newUsersThisMonth,
      activeUsersThisMonth,
      weeklyActiveUsers,
      newUsersToday,
      totalResumes,
      resumesThisMonth,
      totalDownloads: totalDownloads[0]?.total || 0,
      unreadFeedback,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/analytics/users-chart
// New users per day for last 30 days
// ─────────────────────────────────────────────
export const getUsersChart = async (req, res) => {
  try {
    const thirtyDaysAgo = daysAgo(30);

    const data = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i);
      const key = dateString(d);
      const found = data.find((x) => x._id === key);
      result.push({ date: key, count: found ? found.count : 0 });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/analytics/traffic-chart
// Hourly traffic for today + daily for last 30 days
// ─────────────────────────────────────────────
export const getTrafficChart = async (req, res) => {
  try {
    const today = dateString(new Date());
    const thirtyDaysAgo = daysAgo(30);
    const thirtyDaysAgoStr = dateString(thirtyDaysAgo);

    // Today's hourly traffic
    const hourlyRaw = await TrafficLog.find({ date: today })
      .select("hour count")
      .lean();

    const hourly = Array.from({ length: 24 }, (_, i) => {
      const found = hourlyRaw.find((x) => x.hour === i);
      return { hour: `${String(i).padStart(2, "0")}:00`, count: found ? found.count : 0 };
    });

    // Last 30 days daily traffic
    const dailyRaw = await TrafficLog.aggregate([
      { $match: { date: { $gte: thirtyDaysAgoStr } } },
      {
        $group: {
          _id: "$date",
          count: { $sum: "$count" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const daily = [];
    for (let i = 29; i >= 0; i--) {
      const key = dateString(daysAgo(i));
      const found = dailyRaw.find((x) => x._id === key);
      daily.push({ date: key, count: found ? found.count : 0 });
    }

    return res.status(200).json({ hourly, daily });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/analytics/resume-stats
// Template usage + download stats
// ─────────────────────────────────────────────
export const getResumeStats = async (req, res) => {
  try {
    const thirtyDaysAgo = daysAgo(30);

    const [templateUsage, downloadsOverTime, resumesOverTime] = await Promise.all([
      // Template usage count
      Resume.aggregate([
        { $group: { _id: "$template", count: { $sum: 1 }, downloads: { $sum: "$downloadCount" } } },
        { $sort: { count: -1 } },
      ]),

      // Downloads per day last 30 days
      Resume.aggregate([
        { $match: { lastDownloadedAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$lastDownloadedAt" },
            },
            count: { $sum: "$downloadCount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Resumes created per day last 30 days
      Resume.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return res.status(200).json({
      templateUsage,
      downloadsOverTime,
      resumesOverTime,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// GET /api/admin/analytics/active-now
// Users active in last 1 minutes = "online now"
export const getActiveNow = async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 1 * 60 * 1000);
    const count = await User.countDocuments({
      lastActiveAt: { $gte: fiveMinutesAgo }
    });
    const users = await User.find({
      lastActiveAt: { $gte: fiveMinutesAgo }
    }).select('name email lastActiveAt').lean();

    return res.status(200).json({ count, users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/analytics/monthly-users
// MAU for last 6 months
// ─────────────────────────────────────────────
export const getMonthlyUsers = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [newUsers, activeUsers] = await Promise.all([
      // New users per month
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Active users per month
      User.aggregate([
        { $match: { lastActiveAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$lastActiveAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Build last 6 months labels
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().substring(0, 7); // YYYY-MM
      const label = d.toLocaleString("default", { month: "short", year: "numeric" });
      const newCount = newUsers.find((x) => x._id === key)?.count || 0;
      const activeCount = activeUsers.find((x) => x._id === key)?.count || 0;
      months.push({ month: key, label, newUsers: newCount, activeUsers: activeCount });
    }

    return res.status(200).json(months);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};