import React, { useEffect, useState, useCallback } from "react";
import {
  SearchIcon,
  FilterIcon,
  TrashIcon,
  ShieldOffIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  FileTextIcon,
  DownloadIcon,
  EyeIcon,
  XIcon,
} from "lucide-react";
import adminApi from "../../configs/adminApi";
import toast from "react-hot-toast";

// Add this helper at the top of AdminUsers.jsx (outside component)
const timeAgo = (date) => {
  if (!date) return "—";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ── User Detail Modal ─────────────────────────────────────────
const UserDetailModal = ({ userId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await adminApi.get(`/api/admin/users/${userId}`);
        setData(res);
      } catch {
        toast.error("Failed to load user details");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  if (loading)
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">User Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
              {data.user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-800">{data.user.name}</p>
              <p className="text-sm text-slate-500">{data.user.email}</p>
            </div>
            {data.user.isSuspended && (
              <span className="ml-auto text-xs bg-rose-100 text-rose-600 px-2 py-1 rounded-full font-semibold">
                Suspended
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Joined",
                value: new Date(data.user.createdAt).toLocaleDateString(),
              },
              {
                label: "Last Active",
                value: data.user.lastActiveAt
                  ? new Date(data.user.lastActiveAt).toLocaleDateString()
                  : "Never",
              },
              { label: "Total Resumes", value: data.resumes.length },
              {
                label: "Status",
                value: data.user.isSuspended ? "Suspended" : "Active",
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-slate-700">{value}</p>
              </div>
            ))}
          </div>

          {/* Resumes */}
          {data.resumes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Resumes
              </p>
              <div className="space-y-2">
                {data.resumes.map((r) => (
                  <div
                    key={r._id}
                    className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {r.title}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {r.template} template
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <DownloadIcon className="size-3" />
                      {r.downloadCount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/api/admin/users", {
        params: { search, status, sort, page, limit: 10 },
      });
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, status, sort, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, status, sort]);

  const handleSuspend = async (userId, currentStatus) => {
    try {
      const { data } = await adminApi.patch(
        `/api/admin/users/${userId}/suspend`,
      );
      toast.success(data.message);
      fetchUsers();
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const handleDelete = async (userId, userName) => {
    if (
      !window.confirm(
        `Delete ${userName} and ALL their resumes? This cannot be undone.`,
      )
    )
      return;
    try {
      await adminApi.delete(`/api/admin/users/${userId}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="space-y-5">
      {selectedUser && (
        <UserDetailModal
          userId={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
            <SearchIcon className="size-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <UserIcon className="size-10 mb-2 opacity-30" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold hidden md:table-cell">
                    Joined
                  </th>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold hidden lg:table-cell">
                    Last Active
                  </th>
                  <th className="text-center py-3 px-4 text-slate-500 font-semibold hidden sm:table-cell">
                    Resumes
                  </th>
                  <th className="text-center py-3 px-4 text-slate-500 font-semibold hidden sm:table-cell">
                    Downloads
                  </th>
                  <th className="text-center py-3 px-4 text-slate-500 font-semibold">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-slate-500 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="py-3 px-4 text-slate-500 hidden md:table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Last active */}
                    {/* Last active — replace existing one */}
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          user.lastActiveAt &&
                          new Date() - new Date(user.lastActiveAt) <
                            5 * 60 * 1000
                            ? "bg-emerald-100 text-emerald-700" // online now — green
                            : user.lastActiveAt &&
                                new Date() - new Date(user.lastActiveAt) <
                                  30 * 60 * 1000
                              ? "bg-yellow-100 text-yellow-700" // recently active — yellow
                              : "bg-slate-100 text-slate-500" // inactive — grey
                        }`}
                      >
                        {timeAgo(user.lastActiveAt)}
                      </span>
                    </td>

                    {/* Resumes */}
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <FileTextIcon className="size-3.5 text-slate-400" />
                        {user.resumeCount}
                      </span>
                    </td>

                    {/* Downloads */}
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <DownloadIcon className="size-3.5 text-slate-400" />
                        {user.downloads}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                          user.isSuspended
                            ? "bg-rose-100 text-rose-600"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {user.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <button
                          onClick={() => setSelectedUser(user._id)}
                          title="View details"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <EyeIcon className="size-4" />
                        </button>

                        {/* Suspend / Unsuspend */}
                        <button
                          onClick={() =>
                            handleSuspend(user._id, user.isSuspended)
                          }
                          title={user.isSuspended ? "Unsuspend" : "Suspend"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.isSuspended
                              ? "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                              : "text-slate-400 hover:text-orange-500 hover:bg-orange-50"
                          }`}
                        >
                          {user.isSuspended ? (
                            <ShieldCheckIcon className="size-4" />
                          ) : (
                            <ShieldOffIcon className="size-4" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          title="Delete user"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} — {total} users
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
