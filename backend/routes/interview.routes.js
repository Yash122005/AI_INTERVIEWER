import express from "express";
import { joinSession, submitAnswer, completeInterview } from "../controllers/interview.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/join/:token", protect, joinSession);
router.post("/answer", protect, submitAnswer);
router.post("/complete/:sessionId", protect, completeInterview);

export default router;
