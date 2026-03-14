import { nanoid } from "nanoid";
import Session from "../models/Session.model.js";
import Answer from "../models/Answer.model.js";
import Report from "../models/Report.model.js";

export const createSession = async (req, res) => {
  try {
    const { jobTitle, skills, experienceLevel, rounds, questionsPerRound, timeLimit } = req.body;
    if (!jobTitle || !skills || !experienceLevel) {
      return res.status(400).json({ message: "Job title, skills, and experience level are required" });
    }
    const shareableToken = nanoid(12);
    const session = await Session.create({
      recruiterId: req.user._id,
      jobTitle,
      skills: Array.isArray(skills) ? skills : skills.split(",").map((s) => s.trim()),
      experienceLevel,
      rounds: rounds || ["intro", "technical", "managerial"],
      questionsPerRound: questionsPerRound || 3,
      timeLimit: timeLimit || 30,
      shareableToken,
    });
    res.status(201).json(session);
  } catch (error) {
    console.error("Create session error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({ recruiterId: req.user._id })
      .populate("candidateId", "name email")
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error("Get sessions error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("recruiterId", "name email")
      .populate("candidateId", "name email");
    if (!session) return res.status(404).json({ message: "Session not found" });
    const answers = await Answer.find({ sessionId: session._id }).sort({ createdAt: 1 });
    const report = await Report.findOne({ sessionId: session._id });
    res.json({ session, answers, report });
  } catch (error) {
    console.error("Get session error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSessionByToken = async (req, res) => {
  try {
    const session = await Session.findOne({ shareableToken: req.params.token })
      .populate("recruiterId", "name");
    if (!session) return res.status(404).json({ message: "Invalid interview link" });
    res.json({
      _id: session._id,
      jobTitle: session.jobTitle,
      skills: session.skills,
      experienceLevel: session.experienceLevel,
      rounds: session.rounds,
      questionsPerRound: session.questionsPerRound,
      timeLimit: session.timeLimit,
      status: session.status,
      recruiterName: session.recruiterId?.name || "Recruiter",
    });
  } catch (error) {
    console.error("Get session by token error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const logProctoringEvent = async (req, res) => {
  try {
    const { sessionId, eventType, details } = req.body;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (!session.proctoring) {
      session.proctoring = { tabSwitches: 0, copyPasteAttempts: 0, trustScore: 100, isSuspicious: false, logs: [] };
    }

    let penalty = 0;
    if (eventType === "tab-switch") {
      session.proctoring.tabSwitches += 1;
      penalty = 5;
    } else if (eventType === "copy-paste") {
      session.proctoring.copyPasteAttempts += 1;
      penalty = 10;
    } else if (eventType === "face-event") {
      penalty = details.includes("Multiple") ? 20 : 10;
    }

    session.proctoring.trustScore = Math.max(0, session.proctoring.trustScore - penalty);
    if (session.proctoring.trustScore < 60) {
      session.proctoring.isSuspicious = true;
    }

    session.proctoring.logs.push({
      event: `${eventType}: ${details}`,
      timestamp: new Date(),
    });

    await session.save();
    res.json({ message: "Event logged", proctoring: session.proctoring });
  } catch (error) {
    console.error("Log proctoring event error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
