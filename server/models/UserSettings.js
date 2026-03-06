import mongoose from "mongoose";

const userSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },

  emailNotifications: { type: Boolean, default: true },
  aiSuggestions: { type: Boolean, default: true }

}, { timestamps: true });

export default mongoose.model("UserSettings", userSettingsSchema);
