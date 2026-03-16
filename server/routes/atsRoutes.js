/**
 * atsRoutes.js — FIXED
 * Base: /api/ats
 * FIX: /analyze/upload MUST come before /analyze/:resumeId
 */

import express       from 'express';
import multer        from 'multer';
import protect       from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

import {
  analyzeStoredResume,
  analyzeUploadedResume,
  getReport,
  getUserHistory,
  enhanceWithAI,
  adminOverview,
  adminScoreDistribution,
  adminCommonIssues,
  adminUsersList,
  adminUserDetail,
} from '../controllers/atsController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
  },
});

// ── User endpoints ────────────────────────────────────────────
// CRITICAL: /analyze/upload MUST be before /analyze/:resumeId
// Otherwise Express matches "upload" as a resumeId → CastError
router.post('/analyze/upload',    protect, upload.single('resume'), analyzeUploadedResume);
router.post('/analyze/:resumeId', protect, analyzeStoredResume);
router.get('/report/:reportId',   protect, getReport);
router.get('/history',            protect, getUserHistory);
router.post('/enhance',           protect, enhanceWithAI);

// ── Admin endpoints ───────────────────────────────────────────
router.get('/admin/overview',     adminMiddleware, adminOverview);
router.get('/admin/score-dist',   adminMiddleware, adminScoreDistribution);
router.get('/admin/common-issues',adminMiddleware, adminCommonIssues);
router.get('/admin/users',        adminMiddleware, adminUsersList);
router.get('/admin/user/:userId', adminMiddleware, adminUserDetail);

export default router;