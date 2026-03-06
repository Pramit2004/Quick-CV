import express from "express";
import { getUserById, getUserResumes, loginUser, registerUser } from "../controllers/userController.js";
import protect from "../middlewares/authMiddleware.js";
import { heartbeat } from "../controllers/userController.js"; // add to existing imports
// Add import
import { submitFeedback } from "../controllers/feedbackController.js";

// Add route (protected)


const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/data', protect, getUserById);
userRouter.get('/resumes', protect, getUserResumes)
userRouter.post("/heartbeat", protect, heartbeat); // add with other protected routes
userRouter.post("/feedback", protect, submitFeedback);

export default userRouter;