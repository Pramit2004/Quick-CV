import React, { useEffect, useState } from "react";
import api from "../configs/api";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  BellIcon,
  SparklesIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  SaveIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
      checked ? "bg-emerald-500" : "bg-slate-200"
    }`}
  >
    <span
      className={`inline-block size-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const Settings = () => {
  const { token } = useSelector(s => s.auth);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    aiSuggestions: true,
  });

  const [pw, setPw] = useState({ oldPassword: "", newPassword: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/api/settings", {
        headers: { Authorization: token },
      });
      setSettings(data);
    } catch {
      toast.error("Failed to load settings");
    }
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      await api.put("/api/settings", settings, {
        headers: { Authorization: token },
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
    setSavingSettings(false);
  };

  const changePassword = async () => {
    if (!pw.oldPassword || !pw.newPassword) {
      toast.error("Please fill in both fields");
      return;
    }
    try {
      setSavingPw(true);
      await api.put("/api/settings/password", pw, {
        headers: { Authorization: token },
      });
      toast.success("Password changed");
      setPw({ oldPassword: "", newPassword: "" });
    } catch {
      toast.error("Failed to change password");
    }
    setSavingPw(false);
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm shadow-sm";
  const labelCls =
    "block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2";

  return (
    <div
      className="min-h-screen font-sans pb-24 relative overflow-hidden"
      style={{
        backgroundColor: "#F4F6F3",
        backgroundImage: `
          linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)
        `,
        backgroundSize: "32px 32px",
      }}
    >
      {/* ── Decorative blobs ── */}
      <div className="absolute top-[-80px] left-[-80px] size-[300px] rounded-full bg-emerald-200/25 blur-3xl pointer-events-none" />
      <div className="absolute top-[100px] left-[80px] size-[120px] rounded-full bg-green-200/20 blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-60px] size-[260px] rounded-full bg-teal-200/25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[200px] right-[100px] size-[90px] rounded-full bg-emerald-100/40 blur-xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 size-[180px] rounded-full bg-green-100/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 py-12">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-3">
            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[11px] font-bold text-emerald-700 tracking-widest uppercase">Configuration</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Manage your preferences and account security.</p>
        </div>

        {/* ── Preferences Card ── */}
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-5">
          <div className="h-[3px] w-full bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />

          {/* Inner decoration */}
          <div className="absolute -right-8 -top-8 size-40 rounded-full bg-emerald-50/50 pointer-events-none" />
          <div className="absolute -left-6 bottom-4 size-24 rounded-full bg-slate-50/70 pointer-events-none" />

          <div className="relative z-10 p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="size-8 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
                <SlidersHorizontalIcon className="size-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Preferences</h2>
                <p className="text-xs text-slate-400">Control your notification and AI settings.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                    <BellIcon className="size-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Email Notifications</p>
                    <p className="text-xs text-slate-400 mt-0.5">Receive updates and alerts via email</p>
                  </div>
                </div>
                <Toggle
                  checked={settings.emailNotifications}
                  onChange={val => setSettings({ ...settings, emailNotifications: val })}
                />
              </div>

              {/* AI Suggestions */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                    <SparklesIcon className="size-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">AI Suggestions</p>
                    <p className="text-xs text-slate-400 mt-0.5">Get smart resume improvement tips</p>
                  </div>
                </div>
                <Toggle
                  checked={settings.aiSuggestions}
                  onChange={val => setSettings({ ...settings, aiSuggestions: val })}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5"
            >
              <SaveIcon className="size-4" />
              {savingSettings ? "Saving…" : "Save Preferences"}
            </button>
          </div>
        </div>

        {/* ── Password Card ── */}
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="h-[3px] w-full bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300" />

          {/* Inner decoration */}
          <div className="absolute -right-6 top-6 size-36 rounded-full bg-slate-50/60 pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 size-32 rounded-full bg-emerald-50/40 pointer-events-none" />

          <div className="relative z-10 p-6 space-y-4">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="size-8 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                <ShieldCheckIcon className="size-4 text-slate-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Change Password</h2>
                <p className="text-xs text-slate-400">Update your account password securely.</p>
              </div>
            </div>

            {/* Old Password */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><LockIcon className="size-3" /> Current Password</span>
              </label>
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  placeholder="Enter current password"
                  value={pw.oldPassword}
                  onChange={e => setPw({ ...pw, oldPassword: e.target.value })}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showOld ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><LockIcon className="size-3" /> New Password</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  value={pw.newPassword}
                  onChange={e => setPw({ ...pw, newPassword: e.target.value })}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNew ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-10 px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Use a strong password with letters and numbers.</p>
            <button
              onClick={changePassword}
              disabled={savingPw}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md shadow-slate-200 transition-all hover:-translate-y-0.5"
            >
              <ShieldCheckIcon className="size-4" />
              {savingPw ? "Updating…" : "Update Password"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;