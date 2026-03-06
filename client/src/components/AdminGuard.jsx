// // ═══════════════════════════════════════════════════════════════
// // components/AdminGuard.jsx
// // Protects all /admin/* routes — redirects non-admins to /app
// // ═══════════════════════════════════════════════════════════════

// import React, { useEffect, useState } from "react";
// import { Outlet, Navigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import api from "../configs/api";

// const AdminGuard = () => {
//   const { token } = useSelector(s => s.auth);
//   const [status, setStatus] = useState("loading"); // "loading" | "admin" | "denied"

//   useEffect(() => {
//     const check = async () => {
//       try {
//         await api.get("/api/users/me", { headers: { Authorization: token } });
//         // The me endpoint returns user — if isAdmin is false the server
//         // returns 403 on any /api/templates/all call anyway.
//         // Here we just verify the token is valid. Real admin check is backend.
//         setStatus("admin");
//       } catch {
//         setStatus("denied");
//       }
//     };
//     if (token) check();
//     else setStatus("denied");
//   }, [token]);

//   if (status === "loading") return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-50">
//       <div className="text-center">
//         <div className="size-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
//         <p className="text-sm text-slate-500">Verifying access...</p>
//       </div>
//     </div>
//   );

//   if (status === "denied") return <Navigate to="/app" replace />;

//   return <Outlet />;
// };

// export default AdminGuard;