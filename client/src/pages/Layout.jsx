/**
 * Layout.jsx  —  UPDATED
 * client/src/pages/Layout.jsx
 *
 * Changes vs current:
 *   1. Calls useSocket() so the socket connects/disconnects with auth state
 *   2. Keeps heartbeat for lastActiveAt (unchanged)
 *   3. Everything else is identical
 */

import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../components/Loader";
import Login from "./Login";
import api from "../configs/api";
import { logout } from "../app/features/authSlice";
import toast from "react-hot-toast";
import useSocket from "../hooks/useSocket"; // ← NEW

const Layout = () => {
  const dispatch             = useDispatch();
  const { user, loading, token } = useSelector((state) => state.auth);

  // ── Socket connection + suspension listener (one line) ──────────────────
  useSocket(); // ← NEW — handles connect, disconnect, and push events

  // ── Heartbeat: keeps lastActiveAt fresh in DB ────────────────────────────
  useEffect(() => {
    if (!token || !user) return;

    const ping = async () => {
      try {
        await api.post(
          "/api/users/heartbeat",
          {},
          { headers: { Authorization: token } }
        );
      } catch (error) {
        if (error?.response?.status === 403) {
          dispatch(logout());
          localStorage.removeItem("token");
          toast.error(
            error?.response?.data?.message ||
              "Your account has been suspended."
          );
        }
      }
    };

    ping();
    const interval = setInterval(ping, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token, user, dispatch]);

  if (loading) return <Loader />;

  return (
    <div>
      {user ? (
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Outlet />
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
};

export default Layout;