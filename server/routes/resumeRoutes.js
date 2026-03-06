import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  createResume,
  deleteResume,
  getPublicResumeById,
  getResumeById,
  updateResume,
  createResumeFromTemplate,
} from "../controllers/resumeController.js";
import upload from "../configs/multer.js";
import { exportResumePDF } from "../controllers/pdfController.js";

const resumeRouter = express.Router();

resumeRouter.post('/create',                    protect, createResume);
resumeRouter.put('/update',   upload.single('image'), protect, updateResume);
resumeRouter.delete('/delete/:resumeId',        protect, deleteResume);
resumeRouter.get('/get/:resumeId',              protect, getResumeById);
resumeRouter.get('/public/:resumeId',           getPublicResumeById);
resumeRouter.post('/create-from-template',      protect, createResumeFromTemplate);
resumeRouter.post('/export-pdf',                protect, exportResumePDF);

export default resumeRouter;