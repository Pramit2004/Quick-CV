import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

  fullName: { type: String, default: "" },
  email: { type: String, default: "" },
  avatar: { type: String, default: "" },
  headline: { type: String, default: "" },
  bio: { type: String, default: "" },

}, { timestamps: true });

export default mongoose.model("UserProfile", userProfileSchema);
