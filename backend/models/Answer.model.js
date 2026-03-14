import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    questionText: { type: String, required: true },
    round: { type: String, enum: ["intro", "technical", "managerial"], required: true },
    questionType: { type: String, default: "general" },
    answerText: { type: String, required: true },
    scores: {
      technicalRelevance: { type: Number, min: 0, max: 10, default: 0 },
      depth: { type: Number, min: 0, max: 10, default: 0 },
      clarity: { type: Number, min: 0, max: 10, default: 0 },
      accuracy: { type: Number, min: 0, max: 10, default: 0 },
    },
    aiEvaluation: { type: String, default: "" },
    timeTaken: { type: Number, default: 0 }, // In seconds
  },
  { timestamps: true }
);

const Answer = mongoose.model("Answer", answerSchema);
export default Answer;
