import mongoose from "mongoose";

const jdMatchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Inputs & Meta
  resumeText: { type: String, required: true },
  jdText: { type: String, required: true },
  resumeLength: { type: Number, default: 0 },
  jdLength: { type: Number, default: 0 },
  status: { type: String, enum: ["Success", "Invalid Input", "Failed"], default: "Success" },
  
  // Rich AI Results
  score: { type: Number, default: 0 },
  summary: { type: String },
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  experienceMatch: { type: String },
  impactAnalysis: { type: String },
  actionPlan: [{ type: String }]
}, { timestamps: true });

export default mongoose.model("JDMatch", jdMatchSchema);