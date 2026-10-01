import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/axios";
import RoundProgress from "../components/RoundProgress";
import { Send, Bot, User, Loader2, Clock, ShieldCheck, ShieldAlert, Mic, MicOff, Volume2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export default function InterviewPage() {
  const { token } = useParams();
  const { user, quickRegister } = useAuth();
  const navigate = useNavigate();

  const [sessionInfo, setSessionInfo] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [currentRound, setCurrentRound] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [rounds, setRounds] = useState([]);
  const [questionsPerRound, setQuestionsPerRound] = useState(3);
  const [showConsent, setShowConsent] = useState(false);
  const [trustScore, setTrustScore] = useState(100);
  const [isListening, setIsListening] = useState(false);

  // Monitoring States
  const [cameraActive, setCameraActive] = useState(false);
  const [warnings, setWarnings] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const monitoringIntervalRef = useRef(null);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const questionStartTime = useRef(Date.now());
  const [tabSwitches, setTabSwitches] = useState(0);

  // Initialize Speech Recognition & FaceDetector
  useEffect(() => {
    const initializeFaceDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
        });
      } catch (err) {
        console.error("Failed to load FaceDetector", err);
      }
    };
    initializeFaceDetector();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let finalTranscripts = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscripts += transcript + " ";
          }
        }
        if (finalTranscripts) {
          setInput((prev) => (prev ? prev.trim() + " " : "") + finalTranscripts.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        if (event.error === "network") {
          setIsListening(false);
          toast.error("Speech recognition network error. Please check your internet connection.", {
            id: "mic-network-err",
            duration: 5000,
          });
        } else if (event.error !== "no-speech") {
          setIsListening(false);
          toast.error("Microphone error: " + event.error, { id: "mic-err" });
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in your browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.success("Microphone active... Speak your response clearly.");
    }
  };

  const speakQuestion = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  };

  const logSuspiciousEvent = async (type, details, scorePenalty) => {
    setWarnings((prev) => [...prev.slice(-4), `${new Date().toLocaleTimeString()} - ${type}: ${details}`]);
    setTrustScore((prev) => Math.max(0, prev - scorePenalty));
    let frameData = null;
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      frameData = canvasRef.current.toDataURL("image/jpeg", 0.5);
    }

    try {
      await api.post("/sessions/log-event", {
        sessionId,
        eventType: type,
        details,
        scorePenalty,
        frameData,
      });
    } catch (err) {
      console.error("Logging failed", err);
    }
  };

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContextRef.current.createAnalyser();
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastLookAwayTime = 0;
      let checkCount = 0;

      monitoringIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || !faceDetectorRef.current || isComplete) return;

        analyser.getByteFrequencyData(dataArray);

        try {
          if (videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
            const startTimeMs = performance.now();
            const detections = faceDetectorRef.current.detectForVideo(videoRef.current, startTimeMs);

            if (detections && detections.detections) {
              if (detections.detections.length === 0) {
                checkCount++;
                if (checkCount > 2) {
                  logSuspiciousEvent("Face Not Detected", "Candidate not visible in frame", 3);
                  checkCount = 0;
                }
              } else if (detections.detections.length > 1) {
                logSuspiciousEvent("Multiple Faces", "More than one person detected in frame", 5);
              } else {
                checkCount = 0;
                const face = detections.detections[0].boundingBox;
                const videoW = videoRef.current.videoWidth;
                if (face && (face.originX < -20 || face.originX + face.width > videoW + 20)) {
                  if (!lastLookAwayTime) lastLookAwayTime = Date.now();
                  else if (Date.now() - lastLookAwayTime > 3000) {
                    logSuspiciousEvent("Looking Away", "Candidate appears to be looking off-screen", 2);
                    lastLookAwayTime = 0;
                  }
                } else {
                  lastLookAwayTime = 0;
                }
              }
            }
          }
        } catch (e) {}
      }, 2000);

      return true;
    } catch (err) {
      toast.error("Camera & Microphone access is required for this interview.", { duration: 5000 });
      return false;
    }
  };

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive, sessionInfo, joining]);

  // Timer countdown
  useEffect(() => {
    if (!sessionId || isComplete || timeLeft === null) return;

    if (timeLeft <= 0) {
      if (!isComplete) {
        toast.error("Time limit reached. Submitting final responses...", { duration: 5000 });
        setIsComplete(true);
        api.post(`/interview/complete/${sessionId}`).catch(() => {});
        setTimeout(() => navigate(`/summary/${sessionId}`), 2500);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 5 * 60) {
          toast.error("Only 5 minutes remaining in session.", { duration: 5000 });
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionId, isComplete, timeLeft, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/sessions/token/${token}`);
        setSessionInfo(res.data);
        if (res.data.status === "completed") {
          toast.error("This interview has already been completed.");
          return;
        }
        if (!user) setShowNameModal(true);
        else setShowConsent(true);
      } catch (err) {
        toast.error("Invalid or expired interview link");
        navigate("/");
      }
    };
    fetchSession();
  }, [token]);

  const joinInterview = async () => {
    if (!cameraActive) {
      const allowed = await startMonitoring();
      if (!allowed) return;
    }

    setJoining(true);
    setShowConsent(false);
    try {
      const res = await api.post(`/interview/join/${token}`);
      setSessionId(res.data.sessionId);
      setCurrentRound(res.data.currentRound);
      setCurrentQuestionIndex(res.data.currentQuestionIndex);
      setCurrentQuestion(res.data.question);
      setRounds(res.data.rounds);
      setQuestionsPerRound(res.data.questionsPerRound);
      if (sessionInfo?.timeLimit) {
        setTimeLeft(sessionInfo.timeLimit * 60);
      }
      setMessages([{ type: "ai", text: res.data.question, round: res.data.currentRound }]);
      speakQuestion(res.data.question);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("interviewiq_token");
        localStorage.removeItem("interviewiq_user");
        toast.error("Session expired. Please enter your name to join.");
        setShowNameModal(true);
      } else {
        toast.error(err.response?.data?.message || "Failed to join interview");
      }
    } finally {
      setJoining(false);
    }
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (!candidateName.trim()) return;
    try {
      await quickRegister(candidateName.trim());
      setShowNameModal(false);
      setTimeout(() => joinInterview(), 200);
    } catch (err) {
      toast.error("Failed to register");
    }
  };

  // Proctoring tab and copy/paste handling
  useEffect(() => {
    if (!sessionId || isComplete || showConsent) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const newCount = tabSwitches + 1;
        setTabSwitches(newCount);
        logSuspiciousEvent("Tab Switch", `Candidate switched tabs (#${newCount})`, 5);
        toast.error(`Activity Monitored: Tab switch detected (-5 points).`);
      }
    };

    const handleCopyPaste = async (e) => {
      e.preventDefault();
      logSuspiciousEvent("Copy/Paste", `Attempted to ${e.type}`, 10);
      toast.error(`${e.type.charAt(0).toUpperCase() + e.type.slice(1)} is disabled (-10 points).`);
    };

    const handleKeyboard = (e) => {
      if (
        (e.ctrlKey && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) ||
        (e.ctrlKey && ["u", "U"].includes(e.key)) ||
        e.key === "F12"
      ) {
        e.preventDefault();
        logSuspiciousEvent("Keyboard Shortcut", "Attempted to open DevTools or forbidden shortcut", 5);
        toast.error("Developer tools are disabled.");
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error("Right-click is disabled.");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("keydown", handleKeyboard);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("keydown", handleKeyboard);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [sessionId, isComplete, tabSwitches, showConsent]);

  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentQuestion]);

  const handleCloseInterview = async () => {
    if (
      window.confirm(
        "Are you sure you want to end the interview early? This will submit your current progress for evaluation."
      )
    ) {
      setIsComplete(true);
      if (sessionId) {
        try {
          await api.post(`/interview/complete/${sessionId}`);
          toast.success("Interview finished. Loading summary report...");
          setTimeout(() => navigate(`/summary/${sessionId}`), 1500);
        } catch (err) {
          toast.error("Failed to complete interview properly.");
        }
      } else {
        navigate("/");
      }
    }
  };

  const submitAnswer = async () => {
    if (!input.trim() || loading) return;

    const timeTaken = Math.round((Date.now() - questionStartTime.current) / 1000);
    const answer = input.trim();

    if (timeTaken < 2) {
      setTrustScore((prev) => Math.max(0, prev - 10));
      toast.error("Suspicious: Extremely fast answer submission (-10 points).");
    }

    setInput("");
    setMessages((prev) => [...prev, { type: "user", text: answer }]);
    setLoading(true);

    try {
      const res = await api.post("/interview/answer", {
        sessionId,
        questionText: currentQuestion,
        answerText: answer,
        round: currentRound,
        questionType: "general",
        timeTaken,
      });

      const s = res.data.answer.scores;
      const avgScore = ((s.technicalRelevance + s.depth + s.clarity + s.accuracy) / 4).toFixed(1);
      setMessages((prev) => [
        ...prev,
        {
          type: "score",
          scores: s,
          evaluation: res.data.answer.aiEvaluation,
          avg: avgScore,
        },
      ]);

      if (res.data.isInterviewComplete) {
        setIsComplete(true);
        try {
          await api.post(`/interview/complete/${sessionId}`);
          setMessages((prev) => [
            ...prev,
            {
              type: "system",
              text: "🎉 Interview complete! Preparing your evaluation summary...",
            },
          ]);
          setTimeout(() => navigate(`/summary/${sessionId}`), 2500);
        } catch {
          toast.error("Failed to generate report");
        }
      } else {
        setCurrentQuestion(res.data.nextQuestion);
        setCurrentRound(res.data.nextRound);
        setCurrentQuestionIndex(res.data.nextQuestionIndex);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              type: "ai",
              text: res.data.nextQuestion,
              round: res.data.nextRound,
            },
          ]);
          speakQuestion(res.data.nextQuestion);
        }, 600);
      }
    } catch (err) {
      toast.error("Failed to submit answer");
    } finally {
      setLoading(false);
    }
  };

  const roundLabels = {
    intro: "Introductory",
    technical: "Technical",
    managerial: "Managerial",
  };

  // Name Modal
  if (showNameModal) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: "var(--background)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
          style={{ padding: "36px 32px", maxWidth: 420, width: "100%", textAlign: "center" }}
        >
          <img
            src="/logo.png"
            alt="InterviewIQ Logo"
            style={{
              height: 40,
              width: "auto",
              objectFit: "contain",
              margin: "0 auto 16px",
              display: "block",
            }}
          />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            Join Interview Session
          </h2>
          {sessionInfo && (
            <p style={{ color: "var(--accent)", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
              {sessionInfo.jobTitle}
            </p>
          )}
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24 }}>
            Enter your name to begin your assessment
          </p>
          <form onSubmit={handleNameSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              className="input-field"
              type="text"
              placeholder="Your full name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              required
              autoFocus
              style={{ textAlign: "center", fontSize: 15 }}
            />
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
              Continue to Consent
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Proctoring Consent Modal
  if (showConsent) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: "var(--background)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ padding: "36px 32px", maxWidth: 520, width: "100%" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <ShieldCheck size={28} color="var(--accent)" />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
              Interview Environment & Consent
            </h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.6 }}>
            To guarantee assessment integrity, this session employs AI verification. By proceeding, you confirm:
          </p>
          <ul
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginBottom: 24,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              listStyle: "none",
            }}
          >
            <li style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <span>
                <strong style={{ color: "var(--text-primary)" }}>Tab & Window Focus:</strong> Leaving the interview
                window will log a focus penalty.
              </span>
            </li>
            <li style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <span>
                <strong style={{ color: "var(--text-primary)" }}>Camera & Face Detection:</strong> Continuous local
                verification ensures candidate presence.
              </span>
            </li>
            <li style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <span>
                <strong style={{ color: "var(--text-primary)" }}>Clipboard Protection:</strong> Copying, pasting, and
                keyboard shortcuts are restricted.
              </span>
            </li>
          </ul>
          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              marginBottom: 24,
              fontSize: 12,
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            Camera verification runs locally in your browser. Audio & video are used strictly for trust scoring.
          </div>
          <button onClick={joinInterview} className="btn btn-primary btn-lg" style={{ width: "100%" }}>
            I Agree, Start Session
          </button>
        </motion.div>
      </div>
    );
  }

  if (!sessionInfo && !joining) {
    return (
      <div className="loading-screen" style={{ flexDirection: "column", gap: 16 }}>
        <ShieldAlert size={44} color="var(--danger)" />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Link Not Found</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center" }}>
          This interview link is invalid or has already expired.
        </p>
        <Link to="/" className="btn btn-secondary btn-sm">
          Return Home
        </Link>
      </div>
    );
  }

  if (joining) {
    return (
      <div className="loading-screen">
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Initializing AI Interviewer...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--background)",
        color: "var(--text-primary)",
      }}
    >
      {/* ── Top Bar ────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          zIndex: 50,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/logo.png"
            alt="InterviewIQ"
            style={{
              height: 28,
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
              {sessionInfo?.jobTitle || "Live Interview"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Question {currentQuestionIndex + 1} of {questionsPerRound} • {roundLabels[currentRound] || currentRound} Round
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {timeLeft !== null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: "var(--radius)",
                backgroundColor: timeLeft <= 300 ? "var(--danger-soft)" : "var(--background)",
                border: `1px solid ${timeLeft <= 300 ? "rgba(248, 113, 113, 0.3)" : "var(--border)"}`,
              }}
            >
              <Clock size={13} color={timeLeft <= 300 ? "var(--danger)" : "var(--accent)"} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: timeLeft <= 300 ? "var(--danger)" : "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {Math.floor(timeLeft / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}

          {rounds.length > 0 && <RoundProgress rounds={rounds} currentRound={currentRound} />}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: "var(--radius)",
              backgroundColor: trustScore >= 60 ? "var(--success-soft)" : "var(--danger-soft)",
              border: `1px solid ${
                trustScore >= 60 ? "rgba(52, 211, 153, 0.3)" : "rgba(248, 113, 113, 0.3)"
              }`,
            }}
          >
            <ShieldCheck size={13} color={trustScore >= 60 ? "var(--success)" : "var(--danger)"} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: trustScore >= 60 ? "var(--success)" : "var(--danger)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {trustScore}% Trust
            </span>
          </div>

          <button
            onClick={handleCloseInterview}
            className="btn btn-danger btn-sm"
            title="End Interview Early"
          >
            <XCircle size={14} /> End Interview
          </button>
        </div>
      </header>

      {/* ── Main Content Area ──────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Side: Question & Transcript Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: "flex",
                  justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                {msg.type === "ai" && (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius)",
                      flexShrink: 0,
                      backgroundColor: "var(--accent-soft)",
                      border: "1px solid rgba(166, 124, 82, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Bot size={18} color="var(--accent)" />
                  </div>
                )}

                <div
                  style={{
                    maxWidth: "75%",
                    padding: "16px 20px",
                    borderRadius: "var(--radius-lg)",
                    ...(msg.type === "ai"
                      ? {
                          backgroundColor: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderTopLeftRadius: "var(--radius-sm)",
                        }
                      : msg.type === "user"
                      ? {
                          backgroundColor: "var(--accent)",
                          color: "#0C1519",
                          borderTopRightRadius: "var(--radius-sm)",
                          fontWeight: 500,
                        }
                      : msg.type === "score"
                      ? {
                          backgroundColor: "var(--surface)",
                          border: "1px solid rgba(166, 124, 82, 0.25)",
                          borderRadius: "var(--radius)",
                          width: "100%",
                          maxWidth: "85%",
                        }
                      : {
                          backgroundColor: "var(--accent-soft)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          textAlign: "center",
                          width: "100%",
                        }),
                  }}
                >
                  {msg.type === "ai" && (
                    <>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--accent)",
                          fontWeight: 700,
                          marginBottom: 6,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {roundLabels[msg.round] || msg.round} Question
                      </div>
                      <div style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-primary)" }}>
                        {msg.text}
                      </div>
                    </>
                  )}

                  {msg.type === "user" && (
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "#0C1519", fontWeight: 500 }}>
                      {msg.text}
                    </div>
                  )}

                  {msg.type === "score" && (
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--accent)",
                          marginBottom: 8,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Response Assessment</span>
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--success)" }}>
                          Avg Score: {msg.avg}/10
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                        {Object.entries(msg.scores).map(([k, v]) => (
                          <div key={k} style={{ fontSize: 11 }}>
                            <span style={{ color: "var(--text-muted)", textTransform: "capitalize" }}>
                              {k.replace(/([A-Z])/g, " $1").trim()}:
                            </span>{" "}
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  v >= 7
                                    ? "var(--success)"
                                    : v >= 4
                                    ? "var(--warning)"
                                    : "var(--danger)",
                              }}
                            >
                              {v}/10
                            </span>
                          </div>
                        ))}
                      </div>
                      {msg.evaluation && (
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>
                          {msg.evaluation}
                        </div>
                      )}
                    </div>
                  )}

                  {msg.type === "system" && (
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>{msg.text}</div>
                  )}
                </div>

                {msg.type === "user" && (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius)",
                      flexShrink: 0,
                      backgroundColor: "var(--coffee-soft)",
                      border: "1px solid var(--accent-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={18} color="var(--text-primary)" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius)",
                  backgroundColor: "var(--accent-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bot size={18} color="var(--accent)" />
              </div>
              <div
                className="card"
                style={{
                  padding: "12px 18px",
                  borderTopLeftRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--text-secondary)",
                }}
              >
                <Loader2 size={15} className="animate-spin" />
                <span style={{ fontSize: 13 }}>AI is analyzing your response...</span>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Right Side: Proctoring & Verification Panel */}
        <div
          style={{
            width: 280,
            borderLeft: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
            display: "flex",
            flexDirection: "column",
            padding: "20px",
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <h3
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ShieldCheck size={14} color="var(--accent)" /> Verification Feed
            </h3>
            <div
              style={{
                position: "relative",
                width: "100%",
                borderRadius: "var(--radius)",
                overflow: "hidden",
                border: "1px solid var(--border)",
                backgroundColor: "#000",
                aspectRatio: "4/3",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} width={640} height={480} />
            </div>
            {cameraActive && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 8,
                  fontSize: 11,
                  color: "var(--success)",
                  fontWeight: 600,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "var(--success)",
                  }}
                />
                Live Verification Active
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            <h3
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ShieldAlert size={14} color="var(--accent)" /> Activity Log
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {warnings.length === 0 ? (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                    textAlign: "center",
                    padding: "16px 0",
                  }}
                >
                  All integrity checks nominal.
                </div>
              ) : (
                warnings.map((w, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 11,
                      padding: "8px 10px",
                      backgroundColor: "var(--danger-soft)",
                      border: "1px solid rgba(248, 113, 113, 0.25)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--danger)",
                    }}
                  >
                    {w}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Response Controls & Input Bar ──────────────────── */}
      {!isComplete && (
        <footer
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
          }}
        >
          <div
            style={{
              paddingBottom: "10px",
              display: "flex",
              gap: 10,
              maxWidth: 860,
              margin: "0 auto",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => speakQuestion(currentQuestion)}
              disabled={loading || isComplete}
              className="btn btn-secondary btn-sm"
            >
              <Volume2 size={14} /> Listen to Question
            </button>
            <button
              onClick={toggleListening}
              disabled={loading || isComplete}
              className={`btn btn-sm ${isListening ? "btn-danger" : "btn-secondary"}`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              {isListening ? "Stop Speech Input" : "Speak Response"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, maxWidth: 860, margin: "0 auto" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitAnswer();
                }
              }}
              placeholder="Type your response... (Press Enter to submit, Shift+Enter for new line)"
              disabled={loading || isComplete}
              rows={2}
              className="input-field"
              style={{
                flex: 1,
                resize: "none",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={submitAnswer}
              disabled={!input.trim() || loading}
              className="btn btn-primary"
              style={{ alignSelf: "flex-end", height: 46, padding: "0 20px" }}
            >
              <Send size={16} />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
