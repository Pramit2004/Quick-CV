import Feedback from "../models/Feedback.js";

// POST /api/feedback
// User submits feedback
export const submitFeedback = async (req, res) => {
  try {
    const { rating, message, category } = req.body;
    const userId = req.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // One feedback per user per day limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Feedback.findOne({
      userId,
      createdAt: { $gte: today },
    });

    if (existing) {
      return res.status(400).json({
        message: "You have already submitted feedback today. Thank you!",
      });
    }

    const feedback = await Feedback.create({
      userId,
      rating,
      message: message?.trim() || "",
      category: category || "general",
    });

    return res.status(201).json({
      message: "Thank you for your feedback!",
      feedback,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};