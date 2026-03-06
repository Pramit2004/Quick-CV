/**
 * useAdminSocket.js
 * client/src/hooks/useAdminSocket.js
 *
 * Hook for the admin panel.
 * Connects the admin socket and subscribes to live dashboard stats.
 *
 * Usage in AdminDashboard.jsx:
 *   const { liveStats, isConnected } = useAdminSocket()
 *   // liveStats updates every 30s automatically
 */

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import socketService from "../services/socketService";

const useAdminSocket = () => {
  const { token } = useSelector((s) => s.auth);
  const [liveStats, setLiveStats]     = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Connect admin socket
    const socket = socketService.connectAdmin(token);
    if (!socket) return;

    const onConnect = () => {
      setIsConnected(true);
      // Subscribe to live stats stream
      socketService.emitAdmin("dashboard:subscribe");
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onStats = (stats) => {
      setLiveStats(stats);
    };

    socket.on("connect",          onConnect);
    socket.on("disconnect",       onDisconnect);
    socket.on("dashboard:stats",  onStats);

    // If already connected, subscribe immediately
    if (socket.connected) {
      setIsConnected(true);
      socketService.emitAdmin("dashboard:subscribe");
    }

    return () => {
      socketService.emitAdmin("dashboard:unsubscribe");
      socket.off("connect",         onConnect);
      socket.off("disconnect",      onDisconnect);
      socket.off("dashboard:stats", onStats);
      // Don't disconnect — admin might navigate between pages
    };
  }, [token]);

  return { liveStats, isConnected };
};

export default useAdminSocket;