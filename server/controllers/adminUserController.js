import User from "../models/User.js";
import Resume from "../models/Resume.js";

// ─────────────────────────────────────────────
// GET /api/admin/users
// List all users with search + filter + pagination
// ─────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",     // all | active | suspended
      sort = "newest",    // newest | oldest | name
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Search by name or email
    if (search.trim()) {
      query.$or = [
        { name:  { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Filter by status
    if (status === "active") {
      query.isSuspended = { $ne: true };
    } else if (status === "suspended") {
      query.isSuspended = true;
    }

    // Sort
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt:  1 },
      name:   { name:       1 },
    };
    const sortObj = sortMap[sort] || sortMap.newest;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select("-password")
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Attach resume count to each user
    const userIds = users.map((u) => u._id);
    const resumeCounts = await Resume.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 }, downloads: { $sum: "$downloadCount" } } },
    ]);

    const resumeMap = {};
    resumeCounts.forEach((r) => {
      resumeMap[r._id.toString()] = { count: r.count, downloads: r.downloads };
    });

    const enriched = users.map((u) => ({
      ...u,
      resumeCount: resumeMap[u._id.toString()]?.count    || 0,
      downloads:   resumeMap[u._id.toString()]?.downloads || 0,
    }));

    return res.status(200).json({
      users: enriched,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/users/:id
// Single user detail with their resumes
// ─────────────────────────────────────────────
export const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const resumes = await Resume.find({ userId: user._id })
      .select("title template downloadCount createdAt public")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ user, resumes });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/admin/users/:id/suspend
// Toggle suspend/unsuspend
// ─────────────────────────────────────────────
export const toggleSuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isSuspended = !user.isSuspended;
    await user.save();

    return res.status(200).json({
      message: user.isSuspended ? "User suspended" : "User unsuspended",
      isSuspended: user.isSuspended,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/users/:id
// Delete user + all their resumes
// ─────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete all resumes belonging to this user
    await Resume.deleteMany({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    return res.status(200).json({ message: "User and all their resumes deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};