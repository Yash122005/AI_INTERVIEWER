import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobTitle: { type: String, required: true, trim: true },
    skills: [{ type: String, trim: true }],
    experienceLevel: { type: String, enum: ["junior", "mid", "senior"], required: true },
    rounds: {
      type: [String],
      default: ["intro", "technical", "managerial"],
      validate: {
        validator: (v) => v.every((r) => ["intro", "technical", "managerial"].includes(r)),
        message: "Invalid round type",
      },
    },
    questionsPerRound: { type: Number, default: 3, min: 1, max: 10 },
    timeLimit: { type: Number, default: 30 },
    status: { type: String, enum: ["pending", "ongoing", "completed"], default: "pending" },
    shareableToken: { type: String, unique: true, required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    candidateName: { type: String, default: null },
    candidateProjects: { type: String, default: "" },
    proctoring: {
      tabSwitches: { type: Number, default: 0 },
      copyPasteAttempts: { type: Number, default: 0 },
      trustScore: { type: Number, default: 100 },
      isSuspicious: { type: Boolean, default: false },
      logs: [
        {
          event: String,
          timestamp: { type: Date, default: Date.now },
          frameImage: { type: String, default: null }
        },
      ],
    },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;
