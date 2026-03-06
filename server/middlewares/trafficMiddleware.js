import jwt from "jsonwebtoken";  
import User from "../models/User.js";
import TrafficLog from "../models/TrafficLog.js";

const getDateString = (date) => date.toISOString().split("T")[0];

export const trackActivity = async (req, res, next) => {
  try {
    const now  = new Date();
    const date = getDateString(now);
    const hour = now.getHours();

    // Read userId from token directly — don't depend on other middleware
    let userId = null;
    const token = req.headers.authorization;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.userId) {
          userId = decoded.userId;
          await User.findByIdAndUpdate(userId, { lastActiveAt: now });
        }
      } catch (_) {}  // invalid token — just skip
    }

    // Log traffic
    const updateQuery = { $inc: { count: 1 } };
    if (userId) updateQuery.$addToSet = { uniqueUsers: userId };

    await TrafficLog.findOneAndUpdate(
      { date, hour },
      updateQuery,
      { upsert: true, new: true }
    );

  } catch (e) {
    console.error("Traffic tracking error:", e.message);
  }

  next();
};