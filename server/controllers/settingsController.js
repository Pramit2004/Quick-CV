import User from "../models/User.js";
import UserSettings from "../models/UserSettings.js";
import bcrypt from "bcryptjs";


// GET SETTINGS
export const getSettings = async (req, res) => {
  try {
    const userId = req.userId;

    let settings = await UserSettings.findOne({ userId });

    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    res.json(settings);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// UPDATE SETTINGS
export const updateSettings = async (req, res) => {
  try {
    const userId = req.userId;
    const updates = req.body;

    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      updates,
      { new: true, upsert: true }
    );

    res.json(settings);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
