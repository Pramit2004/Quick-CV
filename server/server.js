import express from "express";
import cors from "cors";
import "dotenv/config";                          // ← keep original style
import { createServer } from "http";             // ← NEW
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import resumeRouter from "./routes/resumeRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import jdMatchRouter from "./routes/jdMatchRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { trackActivity } from "./middlewares/trafficMiddleware.js";
import adminRouter from "./routes/adminRoutes.js";
import { initSocket } from "./socketServer.js";  // ← NEW
import atsRouter from "./routes/atsRoutes.js";

const app        = express();
const PORT       = process.env.PORT || 3000;
const httpServer = createServer(app);            // ← NEW

await connectDB();

app.use(express.json({ limit: "5mb" }));
app.use(cors());
app.use(trackActivity);

app.get("/", (req, res) => res.send("Server is live..."));

app.use("/api/users",    userRouter);
app.use("/api/profile",  profileRoutes);
app.use("/api/resumes",  resumeRouter);
app.use("/api/ai",       aiRouter);
app.use("/api/jd-match", jdMatchRouter);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin",    adminRouter);
app.use("/api/ats",      atsRouter);

initSocket(httpServer);                          // ← NEW

httpServer.listen(PORT, () => {                  // ← CHANGED
  console.log(`Server is running on port ${PORT}`);
});