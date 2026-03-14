import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { submitProfile } from "../controllers/candidate.controller.js";

const router = express.Router();

router.post("/profile", protect, submitProfile);

export default router;
