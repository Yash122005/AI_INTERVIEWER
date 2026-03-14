import express from "express";
import { register, login, getMe, quickRegister, googleAuth } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/quick-register", quickRegister);
router.post("/google", googleAuth);

export default router;
