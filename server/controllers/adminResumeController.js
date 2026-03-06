import Resume from "../models/Resume.js";
import User from "../models/User.js";

// ─────────────────────────────────────────────
// GET /api/admin/resumes
// All resumes with pagination + search
// ─────────────────────────────────────────────
export const getAllResumes = async (req, res) => {
  try {
    const {
      search = "",
      template = "all",
      sort = "newest",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search.trim()) {
      query["personal_info.full_name"] = { $regex: search.trim(), $options: "i" };
    }

    if (template !== "all") {
      query.template = template;
    }

    const sortMap = {
      newest:    { createdAt: -1 },
      oldest:    { createdAt:  1 },
      downloads: { downloadCount: -1 },
    };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Resume.countDocuments(query);

    const resumes = await Resume.find(query)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(Number(limit))
      .populate("userId", "name email")
      .lean();

    return res.status(200).json({
      resumes,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/resumes/stats
// Template performance stats
// ─────────────────────────────────────────────
export const getResumeStats = async (req, res) => {
  try {
    const [
      templateStats,
      topDownloaded,
      recentResumes,
      totalResumes,
      totalDownloads,
      publicResumes,
    ] = await Promise.all([
      // Per-template breakdown
      Resume.aggregate([
        {
          $group: {
            _id: "$template",
            count:     { $sum: 1 },
            downloads: { $sum: "$downloadCount" },
            public:    { $sum: { $cond: ["$public", 1, 0] } },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Top 5 most downloaded resumes
      Resume.find()
        .sort({ downloadCount: -1 })
        .limit(5)
        .populate("userId", "name email")
        .select("title template downloadCount personal_info.full_name userId")
        .lean(),

      // Last 5 resumes created
      Resume.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .select("title template createdAt personal_info.full_name userId")
        .lean(),

      // Total count
      Resume.countDocuments(),

      // Total downloads
      Resume.aggregate([
        { $group: { _id: null, total: { $sum: "$downloadCount" } } },
      ]),

      // Public resumes count
      Resume.countDocuments({ public: true }),
    ]);

    return res.status(200).json({
      templateStats,
      topDownloaded,
      recentResumes,
      totalResumes,
      totalDownloads: totalDownloads[0]?.total || 0,
      publicResumes,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/resumes/:id
// Admin delete any resume
// ─────────────────────────────────────────────
export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    await Resume.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};