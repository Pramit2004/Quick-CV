import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { analyzeJDMatch } from "../controllers/jdMatchController.js";

const router = express.Router();

router.post("/analyze", protect, analyzeJDMatch);

export default router;
