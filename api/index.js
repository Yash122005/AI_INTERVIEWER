import express from "express";
import cors from "cors";
import connectDB from "../backend/config/db.js";
import authRoutes from "../backend/routes/auth.routes.js";
import candidateRoutes from "../backend/routes/candidate.routes.js";
import sessionRoutes from "../backend/routes/session.routes.js";
import interviewRoutes from "../backend/routes/interview.routes.js";

const app = express();

const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    process.env.CLIENT_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean)
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// Connect DB for serverless requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ MongoDB Connection Error in Vercel function:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Mount Express API routes
app.use("/api/auth", authRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/interview", interviewRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
