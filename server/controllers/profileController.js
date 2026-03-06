import UserProfile from "../models/UserProfile.js";
import User from "../models/User.js";
import Resume from "../models/Resume.js";
import imagekit from "../configs/imageKit.js";
import fs from "fs";


// =============================
// GET PROFILE
// =============================
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    let profile = await UserProfile.findOne({ userId });

    // create if not exists
    if (!profile) {
      const user = await User.findById(userId);

      profile = await UserProfile.create({
        userId,
        fullName: user.name,
        email: user.email,
      });
    }

    res.json({ profile });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// =============================
// UPDATE PROFILE
// =============================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { fullName, headline, bio } = req.body;
    const file = req.file;

    let update = { fullName, headline, bio };

    // avatar upload
    if (file) {
      const stream = fs.createReadStream(file.path);

      const uploaded = await imagekit.files.upload({
        file: stream,
        fileName: "avatar.png",
        folder: "avatars"
      });

      update.avatar = uploaded.url;
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      update,
      { new: true, upsert: true }
    );

    res.json({ message: "Profile updated", profile });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// =============================
// TRACK RESUME DOWNLOAD
// =============================
// Call this from your PDF export route
export const trackDownload = async (req, res) => {
  try {
    const { resumeId } = req.body;

    if (resumeId) {
      await Resume.findByIdAndUpdate(resumeId, {
        $inc: { downloadCount: 1 }
      });
    }

    res.json({ message: "Download tracked" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
