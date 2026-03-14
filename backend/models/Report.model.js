import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true, unique: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    candidateName: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    roundScores: {
      intro: { type: Number, default: 0 },
      technical: { type: Number, default: 0 },
      managerial: { type: Number, default: 0 },
    },
    dimensionScores: {
      technicalRelevance: { type: Number, default: 0 },
      depth: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
    },
    aiSummary: { type: String, default: "" },
    recommendation: { type: String, enum: ["hire", "hold", "reject"], default: "hold" },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
