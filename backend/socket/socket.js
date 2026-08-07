import { Server } from "socket.io";

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

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Socket CORS blocked origin: ${origin}`));
      },
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Recruiter joins their session room
    socket.on("joinRecruiterRoom", (sessionId) => {
      socket.join(`recruiter-${sessionId}`);
      console.log(`👔 Recruiter joined room: recruiter-${sessionId}`);
    });

    // Candidate joins their session room
    socket.on("joinCandidateRoom", (sessionId) => {
      socket.join(`session-${sessionId}`);
      console.log(`🎓 Candidate joined room: session-${sessionId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
