/**
 * socketService.js
 * client/src/services/socketService.js
 *
 * Singleton service that manages two Socket.IO connections:
 *   - userSocket   → /user namespace (authenticated users)
 *   - adminSocket  → /admin namespace (admin panel only)
 *
 * Usage:
 *   import socketService from '../services/socketService'
 *
 *   // Connect after login
 *   socketService.connectUser(token)
 *
 *   // Listen to events
 *   socketService.on('resume:saved', handler)
 *
 *   // Emit events
 *   socketService.emit('resume:join', { resumeId })
 *
 *   // Disconnect on logout
 *   socketService.disconnectUser()
 */

import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class SocketService {
  constructor() {
    this.userSocket  = null;
    this.adminSocket = null;
  }

  // ── User socket ────────────────────────────────────────────────────────────

  connectUser(token) {
    if (this.userSocket?.connected) return;

    this.userSocket = io(`${SERVER_URL}/user`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });

    this.userSocket.on("connect", () => {
      console.log("🔌 User socket connected:", this.userSocket.id);
    });

    this.userSocket.on("connect_error", (err) => {
      console.warn("⚠️  User socket error:", err.message);
    });

    this.userSocket.on("disconnect", (reason) => {
      console.log("🔌 User socket disconnected:", reason);
    });

    return this.userSocket;
  }

  disconnectUser() {
    if (this.userSocket) {
      this.userSocket.disconnect();
      this.userSocket = null;
    }
  }

  // ── Admin socket ───────────────────────────────────────────────────────────

  connectAdmin(token) {
    if (this.adminSocket?.connected) return;

    this.adminSocket = io(`${SERVER_URL}/admin`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });

    this.adminSocket.on("connect", () => {
      console.log("🔌 Admin socket connected:", this.adminSocket.id);
    });

    this.adminSocket.on("connect_error", (err) => {
      console.warn("⚠️  Admin socket error:", err.message);
    });

    return this.adminSocket;
  }

  disconnectAdmin() {
    if (this.adminSocket) {
      this.adminSocket.disconnect();
      this.adminSocket = null;
    }
  }

  // ── Generic helpers ────────────────────────────────────────────────────────

  /**
   * Listen to a user-namespace event.
   * Returns a cleanup function to remove the listener.
   */
  on(event, handler) {
    this.userSocket?.on(event, handler);
    return () => this.userSocket?.off(event, handler);
  }

  /**
   * Listen to an admin-namespace event.
   */
  onAdmin(event, handler) {
    this.adminSocket?.on(event, handler);
    return () => this.adminSocket?.off(event, handler);
  }

  /**
   * Emit to user namespace.
   */
  emit(event, data) {
    this.userSocket?.emit(event, data);
  }

  /**
   * Emit to admin namespace.
   */
  emitAdmin(event, data) {
    this.adminSocket?.emit(event, data);
  }

  get isUserConnected() {
    return this.userSocket?.connected ?? false;
  }

  get isAdminConnected() {
    return this.adminSocket?.connected ?? false;
  }
}

// Export as singleton
const socketService = new SocketService();
export default socketService;