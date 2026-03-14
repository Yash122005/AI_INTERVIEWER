import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const googleAuth = async (req, res) => {
  try {
    const { idToken, role } = req.body;
    if (!idToken) return res.status(400).json({ message: "ID Token is required" });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ 
      $or: [{ googleId }, { email }] 
    });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        name,
        email,
        googleId,
        role: role || "recruiter", // Default to recruiter if not specified
      });
    } else if (!user.googleId) {
      // Link Google ID if existing email user logs in via Google
      user.googleId = googleId;
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      picture
    });
  } catch (error) {
    console.error("Google Auth Error:", error.message);
    res.status(401).json({ message: "Google authentication failed" });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!["recruiter", "candidate"].includes(role)) {
      return res.status(400).json({ message: "Role must be recruiter or candidate" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, passwordHash, role });
    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role, token,
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    const token = generateToken(user._id);
    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role, token,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  res.json(req.user);
};

// Quick register for candidates joining via interview link
export const quickRegister = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const email = `candidate_${Date.now()}@interviewiq.local`;
    const passwordHash = await bcrypt.hash("guest_" + Date.now(), 10);
    const user = await User.create({ name, email, passwordHash, role: "candidate" });
    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role, token,
    });
  } catch (error) {
    console.error("Quick register error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
