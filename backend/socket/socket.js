import { Server } from "socket.io";

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
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
