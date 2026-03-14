import User from "../models/User.model.js";
import Session from "../models/Session.model.js";
import { nanoid } from "nanoid";

export const submitProfile = async (req, res) => {
  try {
    const { role, skills, projects, experience } = req.body;
    
    // Update candidate profile
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.profile = { role, skills, projects, experience };
    await user.save();

    // Create a personalized auto-session for this candidate
    const shareableToken = nanoid(12);
    
    // Map experience drop down to system logic
    const expMap = {
      entry: "junior",
      mid: "mid",
      senior: "senior"
    };

    const session = await Session.create({
      recruiterId: req.user._id, // Assigning self since they created it
      jobTitle: role,
      skills: skills.split(",").map(s => s.trim()),
      experienceLevel: expMap[experience] || "junior",
      rounds: ["intro", "technical"], // short profile gen
      questionsPerRound: 3,
      timeLimit: 30,
      shareableToken,
      candidateId: req.user._id,
      candidateName: req.user.name,
      candidateProjects: projects
    });

    res.status(200).json({ token: shareableToken, session });
  } catch (err) {
    console.error("Profile submit error", err);
    res.status(500).json({ message: "Server Error" });
  }
};
