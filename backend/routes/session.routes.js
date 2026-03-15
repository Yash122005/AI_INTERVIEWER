import express from "express";
import { 
  createSession, getMySessions, getSession, getSessionByToken, logProctoringEvent, 
  getAllCandidates, sendInterviewEmail 
} from "../controllers/session.controller.js";
import { protect, recruiterOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, recruiterOnly, createSession);
router.get("/", protect, recruiterOnly, getMySessions);
router.get("/candidates", protect, recruiterOnly, getAllCandidates);
router.post("/send-link", protect, recruiterOnly, sendInterviewEmail);
router.get("/token/:token", getSessionByToken);
router.post("/log-event", protect, logProctoringEvent);
router.get("/:id", protect, getSession);

export default router;
