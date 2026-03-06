import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  message: {
    type: String,
    trim: true,
    default: "",
  },
  category: {
    type: String,
    enum: ["general", "bug", "feature", "template", "other"],
    default: "general",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ isRead: 1 });

export default mongoose.model("Feedback", feedbackSchema);