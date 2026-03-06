import User from "../models/User.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Resume from "../models/Resume.js";

const generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
  return token;
}

// POST: /api/users/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const user = await User.findOne({ email })
    if (user) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await User.create({ name, email, password: hashedPassword })

    const token = generateToken(newUser._id)
    newUser.password = undefined;

    return res.status(201).json({ message: 'User created successfully', token, user: newUser })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

// POST: /api/users/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    // ── Block suspended users at login ─────────────────────
    if (user.isSuspended) {
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact support.'
      })
    }

    if (!user.comparePassword(password)) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    const token = generateToken(user._id)
    user.password = undefined;

    return res.status(200).json({ message: 'Login successful', token, user })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

// GET: /api/users/data
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    // ── Also block suspended users from fetching their data ─
    if (user.isSuspended) {
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact support.'
      })
    }
    user.password = undefined;
    return res.status(200).json({ user })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

// GET: /api/users/resumes
export const getUserResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId })
    return res.status(200).json({ resumes })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

// POST /api/users/heartbeat
export const heartbeat = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      lastActiveAt: new Date()
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};