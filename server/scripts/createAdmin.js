import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Change these values before running
    const adminData = {
      name: "Super Admin",
      email: "admin@resumebuilder.com",
      password: "Admin@123456",  // ← CHANGE THIS
    };

    // Check if admin already exists
    const existing = await Admin.findOne({ email: adminData.email });
    if (existing) {
      console.log("⚠️  Admin already exists with this email:", adminData.email);
      process.exit(0);
    }

    const admin = await Admin.create(adminData);
    console.log("🎉 Admin created successfully!");
    console.log("   Email   :", admin.email);
    console.log("   Password: Admin@123456  ← (change this after first login)");
    console.log("   ID      :", admin._id);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();