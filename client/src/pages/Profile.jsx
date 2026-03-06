import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../configs/api";
import toast from "react-hot-toast";
import { CameraIcon, MailIcon, UserIcon, FileTextIcon, AlignLeftIcon, SaveIcon, LoaderCircleIcon } from "lucide-react";

const Profile = () => {
  const { token } = useSelector(s => s.auth);

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    headline: "",
    bio: "",
    avatar: ""
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    try {
      const { data } = await api.get("/api/profile", {
        headers: { Authorization: token }
      });
      setProfile(data.profile);
    } catch (e) {
      toast.error("Failed to load profile");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("fullName", profile.fullName);
      fd.append("headline", profile.headline);
      fd.append("bio", profile.bio);
      if (avatarFile) fd.append("avatar", avatarFile);

      const { data } = await api.put("/api/profile", fd, {
        headers: { Authorization: token }
      });

      setProfile(data.profile);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Profile updated");
    } catch (e) {
      toast.error("Save failed");
    }
    setLoading(false);
  };

  const displayAvatar = avatarPreview || profile.avatar;
  const initials = profile.fullName
    ? profile.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const inputCls = "w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm shadow-sm";
  const labelCls = "block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2";

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
      {/* ── Decorative background blobs ── */}
      <div className="absolute top-[-80px] right-[-80px] size-[340px] rounded-full bg-emerald-300/30 blur-3xl pointer-events-none" />
      <div className="absolute top-[120px] right-[60px] size-[160px] rounded-full bg-green-400/20 blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] size-[280px] rounded-full bg-teal-300/25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[180px] left-[80px] size-[100px] rounded-full bg-emerald-200/40 blur-xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 size-[200px] rounded-full bg-green-200/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 py-12">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-3">
            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[11px] font-bold text-emerald-700 tracking-widest uppercase">Account</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Manage your personal information and account details.</p>
        </div>

        {/* ── Avatar Card ── */}
        <div className="relative bg-white border border-slate-200 rounded-2xl p-6 mb-5 shadow-sm overflow-hidden">
          {/* Card inner decoration */}
          <div className="absolute -right-8 -top-8 size-36 rounded-full bg-emerald-300/40 pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 size-24 rounded-full bg-slate-300/60 pointer-events-none" />
          <div className="absolute right-16 bottom-2 size-12 rounded-full bg-green-300/30 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="size-20 rounded-2xl border-2 border-emerald-200 overflow-hidden shadow-md shadow-emerald-100">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              {/* Camera button */}
              <label htmlFor="avatar-input" className="absolute -bottom-2 -right-2 size-7 bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center cursor-pointer shadow-md shadow-emerald-200 transition-colors">
                <CameraIcon className="size-3.5 text-white" />
              </label>
              <input id="avatar-input" type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </div>

            {/* Info */}
            <div>
              <p className="text-base font-bold text-slate-800">{profile.fullName || "Your Name"}</p>
              <p className="text-sm text-slate-400 mt-0.5">{profile.headline || "Add a headline"}</p>
              <p className="text-xs text-emerald-600 mt-2 font-medium cursor-pointer hover:underline">
                <label htmlFor="avatar-input" className="cursor-pointer">Click camera icon to change photo</label>
              </p>
            </div>
          </div>
        </div>

        {/* ── Form Card ── */}
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Green top bar */}
          <div className="h-[3px] w-full bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />

          {/* Card inner decoration */}
          <div className="absolute -right-10 top-10 size-48 rounded-full bg-emerald-200/60 pointer-events-none" />
          <div className="absolute -left-8 bottom-20 size-32 rounded-full bg-slate-200/80 pointer-events-none" />
          <div className="absolute right-20 bottom-8 size-16 rounded-full bg-green-200/50 pointer-events-none" />

          <div className="relative z-10 p-6 space-y-5">

            {/* Full Name */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><UserIcon className="size-3" /> Full Name</span>
              </label>
              <input
                className={inputCls}
                placeholder="e.g. John Doe"
                value={profile.fullName}
                onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
              />
            </div>

            {/* Email — readonly */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><MailIcon className="size-3" /> Email Address</span>
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-sm outline-none cursor-not-allowed"
                  value={profile.email}
                  disabled
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  Read only
                </span>
              </div>
            </div>

            {/* Headline */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><FileTextIcon className="size-3" /> Headline</span>
              </label>
              <input
                className={inputCls}
                placeholder="e.g. Senior Frontend Developer"
                value={profile.headline}
                onChange={e => setProfile(p => ({ ...p, headline: e.target.value }))}
              />
            </div>

            {/* Bio */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><AlignLeftIcon className="size-3" /> Short Bio</span>
              </label>
              <textarea
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder="Tell us a little about yourself..."
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              />
            </div>

          </div>

          {/* Footer */}
          <div className="relative z-10 px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Changes are saved to your account.</p>
            <button
              onClick={saveProfile}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5"
            >
              {loading ? (
                <><LoaderCircleIcon className="animate-spin size-4" /> Saving…</>
              ) : (
                <><SaveIcon className="size-4" /> Save Profile</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;