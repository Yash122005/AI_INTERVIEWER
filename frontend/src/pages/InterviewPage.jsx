import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/axios";
import RoundProgress from "../components/RoundProgress";
import { Send, Bot, User, Loader2, Clock, Zap, ShieldCheck, ShieldAlert, Mic, MicOff, Volume2, XCircle } from "lucide-react";
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

  // Initialize Speech Recognition
  useEffect(() => {
    // Initialize FaceDetector
    const initializeFaceDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU"
          },
          runningMode: "VIDEO"
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
      recognitionRef.current.continuous = false; // More stable than continuous: true on some networks
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
          setInput(prev => (prev ? prev.trim() + " " : "") + finalTranscripts.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        if (event.error === "network") {
          setIsListening(false);
          toast.error("Speech recognition network error. This browser feature usually requires internet access.", { id: "mic-network-err", duration: 5000 });
        } else if(event.error !== "no-speech") {
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
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
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
      toast.success("Microphone active... Make sure to speak clearly!", { icon: "🎤" });
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
    setWarnings(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()} - ${type}: ${details}`]);
    setTrustScore(prev => Math.max(0, prev - scorePenalty));
    let frameData = null;
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      frameData = canvasRef.current.toDataURL('image/jpeg', 0.5);
    }
    
    try {
      await api.post("/sessions/log-event", {
        sessionId,
        eventType: type,
        details,
        scorePenalty,
        frameData
      });
    } catch (err) { console.error("Logging failed", err); }
  };

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);

      // Basic Audio Monitoring (noise level)
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

        // 1. Audio Activity Check
        analyser.getByteFrequencyData(dataArray);
        let audioSum = dataArray.reduce((acc, val) => acc + val, 0);
        let avgAudio = audioSum / bufferLength;
        // Simple background noise/talking check (threshold might vary in real-world)
        // We won't strictly penalize audio continuously without advanced multi-voice model, but we check if it's extremely loud
        
        // 2. Face Detection
        try {
          // ensure video is playing
          if(videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
             const startTimeMs = performance.now();
             const detections = faceDetectorRef.current.detectForVideo(videoRef.current, startTimeMs);
             
             // Check if detections object and detections.detections exist
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
                 // Basic "looking away" heuristic (bounding box position in frame)
                 const face = detections.detections[0].boundingBox;
                 const videoW = videoRef.current.videoWidth;
                 // If face is fully off-center significantly
                 if (face && (face.originX < -20 || (face.originX + face.width) > videoW + 20)) {
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
        } catch(e) { /* ignore tracking errors */ }
      }, 2000);

      return true;
    } catch (err) {
      toast.error("Camera & Microphone access is required for this interview.", { duration: 5000 });
      return false;
    }
  };

  // Re-attach stream to video if component re-renders
  useEffect(() => {
    // Need to constantly check since refs don't trigger re-renders
    const interval = setInterval(() => {
      if (cameraActive && streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    }, 500);
    return () => clearInterval(interval);
  }, [cameraActive]);
  
  useEffect(() => {
    // Need to constantly check since refs don't trigger re-renders
    const interval = setInterval(() => {
      if (cameraActive && streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    }, 500);
    return () => clearInterval(interval);
  }, [cameraActive]);
  
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive, sessionInfo, joining]);

  
  // Timer countdown
  useEffect(() => {
    if (!sessionId || isComplete || timeLeft === null) return;
    
    if (timeLeft <= 0) {
      // Auto-submit or end interview
      if (!isComplete) {
         toast.error("Time is up! Submitting your final state...", { duration: 5000, icon: "⏱️" });
         // We can gracefully close or simply flag it. We'll set isComplete to true to stop everything for now
         setIsComplete(true);
         // You might want to call the finish API here
         api.post(`/interview/complete/${sessionId}`).catch(() => {});
         setTimeout(() => navigate(`/summary/${sessionId}`), 2500);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 5 * 60) {
           toast.error("Only 5 minutes left!", { icon: "⏰", duration: 5000 });
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionId, isComplete, timeLeft, navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch session info on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/sessions/token/${token}`);
        setSessionInfo(res.data);
        if (res.data.status === "completed") {
          toast.error("This interview has already been completed");
          return;
        }
        if (!user) setShowNameModal(true);
        else setShowConsent(true); // Always show consent for transparency
      } catch (err) {
        toast.error("Invalid interview link");
        navigate("/");
      }
    };
    fetchSession();
  }, [token]);

  const joinInterview = async () => {
    // Attempt camera start first
    if (!cameraActive) {
      const allowed = await startMonitoring();
      if (!allowed) {
        return;
      }
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
      if (sessionInfo?.timeLimit) { setTimeLeft(sessionInfo.timeLimit * 60); }
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
      // After registering, join the interview
      setTimeout(() => joinInterview(), 200);
    } catch (err) {
      toast.error("Failed to register");
    }
  };

  const [tabSwitches, setTabSwitches] = useState(0);
  const questionStartTime = useRef(Date.now());

  // Proctoring: Tab Switching & Copy/Paste Detection
  useEffect(() => {
    if (!sessionId || isComplete || showConsent) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const newCount = tabSwitches + 1;
        setTabSwitches(newCount);
        logSuspiciousEvent("Tab Switch", `Candidate switched tabs (#${newCount})`, 5);
        toast.error(`Activity Monitored: Tab switch detected (-5 points).`, { icon: "⚠️" });
      }
    };

    const handleCopyPaste = async (e) => {
      e.preventDefault();
      logSuspiciousEvent("Copy/Paste", `Attempted to ${e.type}`, 10);
      toast.error(`${e.type.charAt(0).toUpperCase() + e.type.slice(1)} is disabled (-10 points).`, { icon: "🔒" });
    };

    const handleKeyboard = (e) => {
      // Prevent dev tools and typical shortcuts
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        logSuspiciousEvent("Keyboard Shortcut", "Attempted to open DevTools or forbidden shortcut", 5);
        toast.error("Developer tools are disabled.", { icon: "🔒" });
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error("Right-click is disabled.", { icon: "🔒" });
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
  }, [sessionId, isComplete, tabSwitches]);

  // Reset timer on new question
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentQuestion]);


  const handleCloseInterview = async () => {
    if (window.confirm("Are you sure you want to end the interview early? This will submit your current progress.")) {
      setIsComplete(true);
      if (sessionId) {
        try {
          await api.post(`/interview/complete/${sessionId}`);
          toast.success("Interview closed early. Forwarding to summary...");
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
      setTrustScore(prev => Math.max(0, prev - 10));
      toast.error("Suspicious: Extremely fast answer (-10 points).", { icon: "⚡" });
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
        timeTaken
      });

      // Show score feedback
      const s = res.data.answer.scores;
      const avgScore = ((s.technicalRelevance + s.depth + s.clarity + s.accuracy) / 4).toFixed(1);
      setMessages((prev) => [...prev, {
        type: "score", scores: s, evaluation: res.data.answer.aiEvaluation, avg: avgScore,
      }]);

      if (res.data.isInterviewComplete) {
        setIsComplete(true);
        try {
          await api.post(`/interview/complete/${sessionId}`);
          setMessages((prev) => [...prev, {
            type: "system", text: "🎉 Interview complete! Generating your report...",
          }]);
          setTimeout(() => navigate(`/summary/${sessionId}`), 2500);
        } catch {
          toast.error("Failed to generate report");
        }
      } else {
        setCurrentQuestion(res.data.nextQuestion);
        setCurrentRound(res.data.nextRound);
        setCurrentQuestionIndex(res.data.nextQuestionIndex);
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            type: "ai", text: res.data.nextQuestion, round: res.data.nextRound,
          }]);
          speakQuestion(res.data.nextQuestion);
        }, 600);
      }
    } catch (err) {
      toast.error("Failed to submit answer");
    } finally {
      setLoading(false);
    }
  };

  // Name modal for anonymous candidates
  if (showNameModal) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card" style={{ padding: 40, maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
            background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Register to Begin</h2>
          {sessionInfo && (
            <p style={{ color: "var(--accent-secondary)", fontWeight: 600, marginBottom: 4 }}>
              {sessionInfo.jobTitle}
            </p>
          )}
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
            Enter your name to start the interview session
          </p>
          <form onSubmit={handleNameSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input className="input-field" type="text" placeholder="Your full name"
              value={candidateName} onChange={(e) => setCandidateName(e.target.value)}
              required autoFocus style={{ textAlign: "center", fontSize: 16 }} />
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
              Continue
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (showConsent) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card" style={{ padding: 40, maxWidth: 500, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <ShieldCheck size={32} color="var(--accent-primary)" />
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Proctoring Consent</h2>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
            To ensure a fair evaluation, this session uses AI proctoring. By continuing, you agree to:
          </p>
          <ul style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <li style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", marginTop: 6 }} />
              <strong>Tab Monitoring:</strong> Switching tabs or windows will be logged.
            </li>
            <li style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", marginTop: 6 }} />
              <strong>Camera & Audio:</strong> Continuous monitoring for identity and noise.
            </li>
            <li style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", marginTop: 6 }} />
              <strong>Anti-Cheating:</strong> Copy/Paste, DevTools, and right-click are disabled.
            </li>
            <li style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", marginTop: 6 }} />
              <strong>Timing Analysis:</strong> Answer speed is tracked for anomaly detection.
            </li>
          </ul>
          <div style={{ padding: 16, background: "rgba(108, 99, 255, 0.05)", borderRadius: 12, marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
              Note: This data is only used for trust assessment. You will not be automatically disqualified.
            </p>
          </div>
          <button onClick={joinInterview} className="btn btn-primary btn-lg" style={{ width: "100%" }}>
            I Agree, Start Interview
          </button>
        </motion.div>
      </div>
    );
  }

  if (!sessionInfo && !joining) {
    return (
      <div className="loading-screen" style={{ flexDirection: "column", gap: 20 }}>
        <ShieldAlert size={48} color="rgba(239, 68, 68, 0.8)" />
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Link Not Found</h2>
        <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>This interview link is invalid or has been deactivated.</p>
        <button onClick={() => navigate("/")} className="btn btn-secondary">Go to Homepage</button>
      </div>
    );
  }

  if (joining) {
    return (
      <div className="loading-screen">
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: "var(--text-secondary)" }}>Preparing your interview...</p>
      </div>
    );
  }

  const roundLabels = { intro: "Introduction", technical: "Technical", managerial: "Managerial" };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      {/* Top Bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        background: "rgba(10, 10, 26, 0.95)", borderBottom: "1px solid var(--border-color)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: "var(--accent-gradient)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{sessionInfo?.jobTitle || "Interview"}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Q{currentQuestionIndex + 1}/{questionsPerRound} · {roundLabels[currentRound] || currentRound} Round
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {timeLeft !== null && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", borderRadius: 8,
              background: timeLeft <= 300 ? "rgba(239, 68, 68, 0.1)" : "rgba(108, 99, 255, 0.1)",
              border: `1px solid ${timeLeft <= 300 ? "rgba(239, 68, 68, 0.2)" : "rgba(108, 99, 255, 0.2)"}`
            }}>
              <Clock size={14} color={timeLeft <= 300 ? "var(--danger)" : "var(--accent-primary)"} />
              <span style={{ fontSize: 13, fontWeight: 700, color: timeLeft <= 300 ? "var(--danger)" : "var(--accent-primary)", fontVariantNumeric: "tabular-nums" }}>
                {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {rounds.length > 0 && <RoundProgress rounds={rounds} currentRound={currentRound} />}
          <div style={{ 
            display: "flex", alignItems: "center", gap: 8, 
            padding: "6px 12px", borderRadius: 8, 
            background: trustScore >= 60 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${trustScore >= 60 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`
          }}>
            <ShieldCheck size={14} color={trustScore >= 60 ? "var(--success)" : "var(--danger)"} />
            <span style={{ fontSize: 13, fontWeight: 700, color: trustScore >= 60 ? "var(--success)" : "var(--danger)" }}>
              {trustScore}% Trust
            </span>
          </div>
          
          
          
          {cameraActive && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--danger)", animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: 12, color: "var(--danger)", fontWeight: 'bold' }}>MONITORING ACTIVE</span>
            </div>
          )}
          <button 
            onClick={handleCloseInterview}
            style={{
              padding: "6px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6,
              background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--danger)", cursor: "pointer", transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--danger)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
            onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--danger)"}
          >
            <XCircle size={14} /> <span style={{ fontSize: 13, fontWeight: "bold" }}>End Interview</span>
          </button>

        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Side: Chat Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex", justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-start", gap: 12,
              }}
            >
              {msg.type === "ai" && (
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot size={18} color="#fff" />
                </div>
              )}
              <div style={{
                maxWidth: "70%", padding: "14px 18px", borderRadius: 16,
                ...(msg.type === "ai" ? {
                  background: "var(--bg-card)", border: "1px solid var(--border-color)",
                  borderTopLeftRadius: 4,
                } : msg.type === "user" ? {
                  background: "var(--accent-primary)", color: "#fff", borderTopRightRadius: 4,
                } : msg.type === "score" ? {
                  background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: 12, width: "100%", maxWidth: "80%",
                } : {
                  background: "rgba(108, 99, 255, 0.08)", border: "1px solid rgba(108, 99, 255, 0.2)",
                  borderRadius: 12, textAlign: "center", width: "100%",
                }),
              }}>
                {msg.type === "ai" && (
                  <>
                    <div style={{ fontSize: 10, color: "var(--accent-secondary)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>
                      {roundLabels[msg.round]} Round
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.6 }}>{msg.text}</div>
                  </>
                )}
                {msg.type === "user" && <div style={{ fontSize: 15, lineHeight: 1.6 }}>{msg.text}</div>}
                {msg.type === "score" && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--success)", marginBottom: 8 }}>
                      Score: {msg.avg}/10
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                      {Object.entries(msg.scores).map(([k, v]) => (
                        <div key={k} style={{ fontSize: 11 }}>
                          <span style={{ color: "var(--text-muted)", textTransform: "capitalize" }}>
                            {k.replace(/([A-Z])/g, " $1").trim()}:
                          </span>{" "}
                          <span style={{ fontWeight: 700, color: v >= 7 ? "var(--success)" : v >= 4 ? "var(--warning)" : "var(--danger)" }}>
                            {v}/10
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>
                      {msg.evaluation}
                    </div>
                  </div>
                )}
                {msg.type === "system" && (
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--accent-primary)" }}>{msg.text}</div>
                )}
              </div>
              {msg.type === "user" && (
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "rgba(108, 99, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <User size={18} color="var(--accent-primary)" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bot size={18} color="#fff" />
              </div>
              <div className="glass-card" style={{ padding: "14px 18px", borderTopLeftRadius: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}>
                  <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: 14 }}>AI is evaluating your answer...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Right Side: Monitoring Panel */}
        <div style={{ width: 280, borderLeft: "1px solid var(--border-color)", background: "rgba(10, 10, 26, 0.4)", display: "flex", flexDirection: "column", padding: "16px" }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: "bold", color: "var(--text-secondary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={16} /> Live Proctoring
            </h3>
            <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-color)", background: "#000", aspectRatio: "4/3" }}>
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} 
              />
              {/* Hidden canvas for capturing frames */}
              <canvas ref={canvasRef} style={{ display: "none" }} width={640} height={480} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            <h3 style={{ fontSize: 14, fontWeight: "bold", color: "var(--text-secondary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldAlert size={16} /> Warnings Log
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {warnings.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                  No suspicious activity detected.
                </div>
              ) : (
                warnings.map((w, i) => (
                  <div key={i} style={{ fontSize: 12, padding: "8px 10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 6, color: "var(--danger)" }}>
                    {w}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      {!isComplete && (
        <div style={{
          padding: "16px 24px", borderTop: "1px solid var(--border-color)",
          background: "rgba(10, 10, 26, 0.95)", backdropFilter: "blur(20px)",
        }}>
          <div style={{ paddingBottom: "12px", display: "flex", gap: 12, maxWidth: 800, margin: "0 auto", justifyContent: "flex-end" }}>
            <button 
              onClick={() => speakQuestion(currentQuestion)} 
              disabled={loading || isComplete}
              style={{ padding: "8px 14px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-color)", cursor: "pointer" }}
            >
              <Volume2 size={16} /> Listen Question
            </button>
            <button 
              onClick={toggleListening} 
              disabled={loading || isComplete}
              style={{ padding: "8px 14px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, background: isListening ? "rgba(239, 68, 68, 0.1)" : "rgba(108, 99, 255, 0.1)", color: isListening ? "var(--danger)" : "var(--accent-primary)", border: `1px solid ${isListening ? "rgba(239, 68, 68, 0.2)" : "rgba(108, 99, 255, 0.2)"}`, cursor: "pointer" }}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />} 
              {isListening ? 'Stop Speaking...' : 'Start Speaking'}
            </button>
          </div>
          <div style={{ display: "flex", gap: 12, maxWidth: 800, margin: "0 auto" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
              placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
              disabled={loading || isComplete}
              rows={2}
              style={{
                flex: 1, resize: "none", padding: "14px 18px",
                background: "rgba(15, 15, 30, 0.8)", border: "1px solid var(--border-color)",
                borderRadius: 14, color: "var(--text-primary)", fontFamily: "'Inter'",
                fontSize: 14, lineHeight: 1.5, outline: "none",
                transition: "border-color 0.3s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent-primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
            />
            <button onClick={submitAnswer} disabled={!input.trim() || loading}
              className="btn btn-primary" style={{ alignSelf: "flex-end", padding: "14px 20px", borderRadius: 14 }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
