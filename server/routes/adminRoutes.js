import express from "express";
import { adminLogin, getAdminMe } from "../controllers/adminAuthController.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import {
  getOverview,
  getUsersChart,
  getTrafficChart,
  getResumeStats,
  getMonthlyUsers,
  getActiveNow,
} from "../controllers/adminAnalyticsController.js";
import {
  getAllUsers,
  getUserDetail,
  toggleSuspendUser,
  deleteUser,
} from "../controllers/adminUserController.js";
import {
  getAllResumes,
  getResumeStats as getAdminResumeStats,
  deleteResume,
} from "../controllers/adminResumeController.js";
import {
  getPublishedTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  publishTemplate,    // ← replaces old togglePublish for builder
  unpublishTemplate,  // ← new separate unpublish
  togglePublish,      // ← kept for AdminTemplates card button
} from "../controllers/adminTemplateController.js";
import {
  getAllFeedback,
  markAsRead,
  markAllRead,
  deleteFeedback,
} from "../controllers/adminFeedbackController.js";
import {
  getJDMatchOverview,
  getScoreDistribution,
  getTopMissingSkills,
  getJDMatchChart,
  getRecentJDMatches,
} from "../controllers/jdMatchAnalyticsController.js";

const router = express.Router();

// ─── AUTH ─────────────────────────────────────────────────────
router.post("/login",  adminLogin);
router.get("/me",      adminMiddleware, getAdminMe);

// ─── ANALYTICS ────────────────────────────────────────────────
router.get("/analytics/overview",      adminMiddleware, getOverview);
router.get("/analytics/users-chart",   adminMiddleware, getUsersChart);
router.get("/analytics/traffic-chart", adminMiddleware, getTrafficChart);
router.get("/analytics/resume-stats",  adminMiddleware, getResumeStats);
router.get("/analytics/monthly-users", adminMiddleware, getMonthlyUsers);
router.get("/analytics/active-now",    adminMiddleware, getActiveNow);

// ─── USER MANAGEMENT ──────────────────────────────────────────
router.get("/users",              adminMiddleware, getAllUsers);
router.get("/users/:id",          adminMiddleware, getUserDetail);
router.patch("/users/:id/suspend",adminMiddleware, toggleSuspendUser);
router.delete("/users/:id",       adminMiddleware, deleteUser);

// ─── RESUME MANAGEMENT ────────────────────────────────────────
router.get("/resumes",       adminMiddleware, getAllResumes);
router.get("/resumes/stats", adminMiddleware, getAdminResumeStats);
router.delete("/resumes/:id",adminMiddleware, deleteResume);

// ─── TEMPLATE MANAGEMENT ──────────────────────────────────────
// Public route MUST be before /:id
router.get("/templates/published",           getPublishedTemplates);
router.get("/templates",                     adminMiddleware, getPublishedTemplates);
router.get("/templates/:id",                 adminMiddleware, getTemplateById);
router.post("/templates",                    adminMiddleware, createTemplate);
router.put("/templates/:id",                 adminMiddleware, updateTemplate);
router.delete("/templates/:id",              adminMiddleware, deleteTemplate);

// ── Publish routes (FIXED) ────────────────────────────────────
// /publish      → always sets isPublished = true  (used by builder "Save & Publish")
// /unpublish    → always sets isPublished = false
// /toggle-publish → flips state (used by AdminTemplates card button)
router.patch("/templates/:id/publish",        adminMiddleware, publishTemplate);
router.patch("/templates/:id/unpublish",      adminMiddleware, unpublishTemplate);
router.patch("/templates/:id/toggle-publish", adminMiddleware, togglePublish);

// ─── FEEDBACK ─────────────────────────────────────────────────
router.get("/feedback",               adminMiddleware, getAllFeedback);
router.patch("/feedback/mark-all-read",adminMiddleware, markAllRead);
router.patch("/feedback/:id/read",    adminMiddleware, markAsRead);
router.delete("/feedback/:id",        adminMiddleware, deleteFeedback);

// ─── JD MATCH ANALYTICS ───────────────────────────────────────
router.get("/jd-match/overview",           adminMiddleware, getJDMatchOverview);
router.get("/jd-match/score-distribution", adminMiddleware, getScoreDistribution);
router.get("/jd-match/missing-skills",     adminMiddleware, getTopMissingSkills);
router.get("/jd-match/chart",              adminMiddleware, getJDMatchChart);
router.get("/jd-match/recent",             adminMiddleware, getRecentJDMatches);

export default router;