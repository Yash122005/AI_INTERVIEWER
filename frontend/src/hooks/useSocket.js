import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const getSocketURL = () => {
  const configured = import.meta.env.VITE_SOCKET_URL?.trim();
  if (configured) return configured;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
};

const SOCKET_URL = getSocketURL();

export default function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const joinRecruiterRoom = useCallback((sessionId) => {
    socketRef.current?.emit("joinRecruiterRoom", sessionId);
  }, []);

  const joinCandidateRoom = useCallback((sessionId) => {
    socketRef.current?.emit("joinCandidateRoom", sessionId);
  }, []);

  const onEvent = useCallback((event, callback) => {
    socketRef.current?.on(event, callback);
    return () => socketRef.current?.off(event, callback);
  }, []);

  return { socket: socketRef, joinRecruiterRoom, joinCandidateRoom, onEvent };
}
