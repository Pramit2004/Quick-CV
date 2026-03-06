import Feedback from "../models/Feedback.js";

// ─────────────────────────────────────────────
// GET /api/admin/feedback
// All feedback with filters + pagination
// ─────────────────────────────────────────────
export const getAllFeedback = async (req, res) => {
  try {
    const {
      category = "all",
      status   = "all",   // all | read | unread
      rating   = "all",   // all | 1 | 2 | 3 | 4 | 5
      sort     = "newest",
      page     = 1,
      limit    = 10,
    } = req.query;

    const query = {};

    if (category !== "all") query.category = category;
    if (status === "read")   query.isRead  = true;
    if (status === "unread") query.isRead  = false;
    if (rating !== "all")    query.rating  = Number(rating);

    const sortMap = {
      newest:        { createdAt: -1 },
      oldest:        { createdAt:  1 },
      highest_rating: { rating:   -1 },
      lowest_rating:  { rating:    1 },
    };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Feedback.countDocuments(query);

    const feedback = await Feedback.find(query)
      .populate("userId", "name email")
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Summary stats
    const [ratingStats, unreadCount, categoryStats] = await Promise.all([
      Feedback.aggregate([
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
      Feedback.countDocuments({ isRead: false }),
      Feedback.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Average rating
    const avgResult = await Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]);
    const averageRating = avgResult[0]?.avg
      ? Math.round(avgResult[0].avg * 10) / 10
      : 0;

    return res.status(200).json({
      feedback,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      stats: {
        ratingStats,
        unreadCount,
        categoryStats,
        averageRating,
        totalFeedback: await Feedback.countDocuments(),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/admin/feedback/:id/read
// Mark single feedback as read
// ─────────────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });

    return res.status(200).json({ message: "Marked as read", feedback });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/admin/feedback/mark-all-read
// Mark all unread as read
// ─────────────────────────────────────────────
export const markAllRead = async (req, res) => {
  try {
    await Feedback.updateMany({ isRead: false }, { isRead: true });
    return res.status(200).json({ message: "All feedback marked as read" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/feedback/:id
// ─────────────────────────────────────────────
export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });

    return res.status(200).json({ message: "Feedback deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};