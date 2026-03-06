import User from "../models/User.js";
import Resume from "../models/Resume.js";

export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalResumes = await Resume.countDocuments();
    const publicResumes = await Resume.countDocuments({ public: true });

    const downloads = await Resume.aggregate([
      { $group: { _id: null, total: { $sum: "$downloadCount" } } }
    ]);

    res.json({
      totalUsers,
      totalResumes,
      publicResumes,
      totalDownloads: downloads[0]?.total || 0
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
