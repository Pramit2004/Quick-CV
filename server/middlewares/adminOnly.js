import User from "../models/User.js";

const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin only access" });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export default adminOnly;
