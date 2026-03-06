/**
 * useSocket.js
 * client/src/hooks/useSocket.js
 *
 * Central hook that:
 *   1. Connects the user socket when a token exists
 *   2. Listens for account:suspended and auto-logs out
 *   3. Exposes helpers for resume room events
 *
 * Use this hook ONCE in Layout.jsx so the connection is always alive
 * for authenticated users.
 */

import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import socketService from "../services/socketService";
import { logout } from "../app/features/authSlice";

const useSocket = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { token } = useSelector((s) => s.auth);

  // ── Connect / disconnect based on auth state ─────────────────────────────
  useEffect(() => {
    if (!token) {
      socketService.disconnectUser();
      return;
    }

    socketService.connectUser(token);

    // ── Suspension push: server kicks the user in real-time ──────────────
    const offSuspend = socketService.on("account:suspended", ({ message }) => {
      dispatch(logout());
      localStorage.removeItem("token");
      toast.error(message || "Your account has been suspended.");
      navigate("/login", { replace: true });
    });

    return () => {
      offSuspend();
      // Don't disconnect here — socket should persist across route changes
      // Disconnect only happens on logout (dispatched above)
    };
  }, [token, dispatch, navigate]);

  // ── Resume room helpers (used by ResumeBuilder) ──────────────────────────

  const joinResumeRoom = useCallback((resumeId) => {
    socketService.emit("resume:join", { resumeId });
  }, []);

  const leaveResumeRoom = useCallback((resumeId) => {
    socketService.emit("resume:leave", { resumeId });
  }, []);

  const emitResumeSaved = useCallback((resumeId, resume) => {
    socketService.emit("resume:saved", { resumeId, resume });
  }, []);

  const onResumeSaved = useCallback((resumeId, handler) => {
    const off = socketService.on("resume:saved", (data) => {
      if (data.resumeId === resumeId) handler(data.resume);
    });
    return off;
  }, []);

  return {
    joinResumeRoom,
    leaveResumeRoom,
    emitResumeSaved,
    onResumeSaved,
    socketService,
  };
};

export default useSocket;