import mongoose from "mongoose";

const trafficLogSchema = new mongoose.Schema({
  date: {
    type: String, // stored as "YYYY-MM-DD" for easy grouping
    required: true,
    index: true,
  },
  hour: {
    type: Number, // 0-23 for hourly breakdown
    required: true,
  },
  count: {
    type: Number,
    default: 1,
  },
  uniqueUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
}, { timestamps: true });

// Compound index for fast date+hour queries
trafficLogSchema.index({ date: 1, hour: 1 }, { unique: true });

export default mongoose.model("TrafficLog", trafficLogSchema);