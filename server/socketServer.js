/**
 * socketServer.js
 *
 * Initializes Socket.IO on top of the existing Express HTTP server.
 * Handles all real-time events for the resume builder app:
 *
 *   USER NAMESPACE  (/user)
 *   - authenticate  → validate JWT, join personal room
 *   - resume:update → broadcast live resume edits to same-resume viewers
 *   - resume:save   → confirm save to all connected sessions for that user
 *
 *   ADMIN NAMESPACE (/admin)
 *   - authenticate  → validate admin JWT, join admin room
 *   - dashboard:subscribe  → stream live stat updates every 30s
 *   - user:suspend  → push suspension event to that user's socket
 *
 * HOW TO USE:
 *   In server.js, replace:
 *     app.listen(PORT, ...)
 *   With:
 *     const { createServer } = await import('http')
 *     const httpServer = createServer(app)
 *     initSocket(httpServer)
 *     httpServer.listen(PORT, ...)
 */

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../server/models/User.js";

let io; // exported so controllers can emit events

// ─────────────────────────────────────────────────────────────────────────────
// JWT auth middleware for socket handshake
// ─────────────────────────────────────────────────────────────────────────────
const authMiddleware = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization;

    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .select("_id name email role isSuspended")
      .lean();

    if (!user) return next(new Error("User not found"));
    if (user.isSuspended) return next(new Error("Account suspended"));

    socket.user = user; // attach to socket for use in handlers
    next();
  } catch {
    next(new Error("Authentication failed"));
  }
};

const adminAuthMiddleware = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization;

    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .select("_id name email role")
      .lean();

    if (!user) return next(new Error("User not found"));
    if (user.role !== "admin") return next(new Error("Admin only"));

    socket.user = user;
    next();
  } catch {
    next(new Error("Admin authentication failed"));
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// initSocket — call once in server.js after creating httpServer
// ─────────────────────────────────────────────────────────────────────────────
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── USER NAMESPACE (/user) ────────────────────────────────────────────────
  const userNS = io.of("/user");
  userNS.use(authMiddleware);

  userNS.on("connection", (socket) => {
    const userId = socket.user._id.toString();

    // Every user joins their personal room  →  "user:<userId>"
    socket.join(`user:${userId}`);

    // ── Resume collaboration room ────────────────────────────────────────
    // Client emits: { resumeId }
    socket.on("resume:join", ({ resumeId }) => {
      if (!resumeId) return;
      socket.join(`resume:${resumeId}`);
    });

    socket.on("resume:leave", ({ resumeId }) => {
      if (!resumeId) return;
      socket.leave(`resume:${resumeId}`);
    });

    /**
     * resume:editing
     * Fired while user is typing so the preview page (public view)
     * or a second tab stays live without saving.
     * Payload: { resumeId, field, value }
     * Broadcast to everyone else in that resume room.
     */
    socket.on("resume:editing", ({ resumeId, field, value }) => {
      if (!resumeId) return;
      socket.to(`resume:${resumeId}`).emit("resume:editing", {
        resumeId,
        field,
        value,
        by: userId,
      });
    });

    /**
     * resume:saved
     * Fired after a successful save so all tabs / the public view reload.
     * Payload: { resumeId, resume }
     */
    socket.on("resume:saved", ({ resumeId, resume }) => {
      if (!resumeId) return;
      // Broadcast to everyone in the room including sender's other tabs
      userNS.to(`resume:${resumeId}`).emit("resume:saved", {
        resumeId,
        resume,
      });
    });

    // ── Suspension push ──────────────────────────────────────────────────
    // Handled by emitSuspend() below — no client handler needed here

    socket.on("disconnect", () => {
      // rooms are cleaned up automatically by socket.io
    });
  });

  // ── ADMIN NAMESPACE (/admin) ──────────────────────────────────────────────
  const adminNS = io.of("/admin");
  adminNS.use(adminAuthMiddleware);

  adminNS.on("connection", (socket) => {
    // All admins share one room for broadcasts
    socket.join("admins");

    // ── Live dashboard stats ─────────────────────────────────────────────
    // Admin page subscribes and gets a push every 30s
    let statsInterval = null;

    socket.on("dashboard:subscribe", async () => {
      if (statsInterval) return; // already running

      const pushStats = async () => {
        try {
          const stats = await computeLiveStats();
          socket.emit("dashboard:stats", stats);
        } catch { /* silent */ }
      };

      await pushStats(); // send immediately on subscribe
      statsInterval = setInterval(pushStats, 30_000);
    });

    socket.on("dashboard:unsubscribe", () => {
      clearInterval(statsInterval);
      statsInterval = null;
    });

    socket.on("disconnect", () => {
      clearInterval(statsInterval);
    });
  });

  console.log("✅  Socket.IO initialized (namespaces: /user, /admin)");
  return io;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: compute live stats for admin dashboard push
// ─────────────────────────────────────────────────────────────────────────────
const computeLiveStats = async () => {
  // Import here to avoid circular dependency at module load time
  const [User, Resume] = await Promise.all([
    import("../models/User.js").then((m) => m.default),
    import("../models/Resume.js").then((m) => m.default),
  ]);

  const now = new Date();
  const fiveMin  = new Date(now - 5 * 60 * 1000);
  const today    = new Date(now.setHours(0, 0, 0, 0));

  const [
    totalUsers,
    activeNow,
    newToday,
    totalResumes,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastActiveAt: { $gte: fiveMin } }),
    User.countDocuments({ createdAt: { $gte: today } }),
    Resume.countDocuments(),
  ]);

  return { totalUsers, activeNow, newToday, totalResumes, ts: Date.now() };
};

// ─────────────────────────────────────────────────────────────────────────────
// Exported helpers — call from controllers to push events
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Push a suspension event to a specific user.
 * Called from admin suspend controller after DB update.
 */
export const emitSuspend = (userId) => {
  if (!io) return;
  io.of("/user")
    .to(`user:${userId}`)
    .emit("account:suspended", {
      message: "Your account has been suspended. Please contact support.",
    });
};

/**
 * Push a "resume saved" event to everyone viewing a specific resume.
 * Called from resumeController.updateResume after successful save.
 */
export const emitResumeSaved = (resumeId, resume) => {
  if (!io) return;
  io.of("/user")
    .to(`resume:${resumeId}`)
    .emit("resume:saved", { resumeId, resume });
};

/**
 * Broadcast admin stats to all connected admins.
 * Optional: call after a big event (new user signup etc.)
 */
export const emitAdminStats = async () => {
  if (!io) return;
  try {
    const stats = await computeLiveStats();
    io.of("/admin").to("admins").emit("dashboard:stats", stats);
  } catch { /* silent */ }
};

export default () => io;