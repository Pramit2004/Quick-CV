import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  getSettings,
  updateSettings,
  changePassword
} from "../controllers/settingsController.js";

const router = express.Router();

router.get("/", protect, getSettings);
router.put("/", protect, updateSettings);
router.put("/password", protect, changePassword);

export default router;
