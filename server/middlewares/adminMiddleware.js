import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Must have adminId in payload (not userId)
    if (!decoded.adminId) {
      return res.status(403).json({ message: "Access denied. Not an admin token." });
    }

    // Check admin exists and is active in DB
    const admin = await Admin.findById(decoded.adminId).select("-password");
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Admin account is deactivated" });
    }

    // Attach admin to request
    req.admin = admin;
    req.adminId = admin._id;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

export default adminMiddleware;