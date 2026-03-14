import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String }, // Optional for Google users
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["recruiter", "candidate"], required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
