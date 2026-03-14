import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/axios";
import Navbar from "../components/Navbar";
import ScoreRadarChart from "../components/ScoreRadarChart";
import useSocket from "../hooks/useSocket";
import { Download, User, Briefcase, Award, MessageSquare, TrendingUp, ChevronDown, ChevronUp, Clock, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";

export default function SessionReport() {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAnswer, setExpandedAnswer] = useState(null);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const { joinRecruiterRoom, onEvent } = useSocket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/sessions/${sessionId}`);
        setData(res.data);
        // Join Socket.IO room for live updates
        if (res.data.session.status === "ongoing") {
          joinRecruiterRoom(sessionId);
        }
      } catch {
        toast.error("Failed to load session");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sessionId]);

  // Listen for live updates
  useEffect(() => {
    const unsub1 = onEvent("scoreUpdate", (update) => {
      setLiveUpdates((prev) => [...prev, update]);
    });
    const unsub2 = onEvent("interviewCompleted", () => {
      toast.success("Interview completed! Refreshing report...");
      setTimeout(() => window.location.reload(), 1500);
    });
    return () => { unsub1(); unsub2(); };
  }, [onEvent]);

  const downloadPDF = () => {
    if (!data?.report) return;
    const { report, session } = data;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(108, 99, 255);
    doc.text("InterviewIQ Report", 20, 25);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Job: ${session.jobTitle}`, 20, 40);
    doc.text(`Candidate: ${report.candidateName || "N/A"}`, 20, 48);
    doc.text(`Level: ${session.experienceLevel}`, 20, 56);
    doc.text(`Date: ${new Date(report.createdAt || Date.now()).toLocaleDateString()}`, 20, 64);

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(`Overall Score: ${report.overallScore}/100`, 20, 80);

    doc.setFontSize(12);
    doc.text("Dimension Scores:", 20, 95);
    doc.setFontSize(10);
    let y = 105;
    Object.entries(report.dimensionScores).forEach(([key, val]) => {
      doc.text(`  ${key.replace(/([A-Z])/g, " $1").trim()}: ${val}/10`, 20, y);
      y += 8;
    });

    y += 5;
    doc.setFontSize(12);
    doc.text("Recommendation:", 20, y);
    doc.setFontSize(14);
    y += 10;
    doc.setTextColor(report.recommendation === "hire" ? 16 : report.recommendation === "reject" ? 239 : 245,
      report.recommendation === "hire" ? 185 : report.recommendation === "reject" ? 68 : 158,
      report.recommendation === "hire" ? 129 : report.recommendation === "reject" ? 68 : 11);
    doc.text(report.recommendation.toUpperCase(), 20, y);

    y += 15;
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text("AI Summary:", 20, y);
    y += 8;
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(report.aiSummary || "N/A", 170);
    doc.text(lines, 20, y);

    doc.save(`InterviewIQ_Report_${session.jobTitle.replace(/\s/g, "_")}.pdf`);
    toast.success("Report downloaded!");
  };

  if (loading) return (
    <div><Navbar /><div className="loading-screen"><div className="spinner" style={{ width: 40, height: 40 }} /></div></div>
  );

  if (!data?.session) return <div><Navbar /><div className="page-container"><p>Session not found</p></div></div>;

  const { session, answers, report } = data;
  const isOngoing = session.status === "ongoing";

  return (
    <div>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 900 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <div>
              <h1 style={{
                fontSize: 28, fontWeight: 800,
                background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Session Report</h1>
              <div style={{ display: "flex", gap: 16, marginTop: 8, color: "var(--text-secondary)", fontSize: 14 }}>
                <span><Briefcase size={14} style={{ verticalAlign: "middle" }} /> {session.jobTitle}</span>
                <span><User size={14} style={{ verticalAlign: "middle" }} /> {session.candidateName || session.candidateId?.name || "Pending"}</span>
                <span className={`badge badge-${session.status}`}>{session.status}</span>
              </div>
            </div>
            {report && (
              <button onClick={downloadPDF} className="btn btn-primary">
                <Download size={16} /> Download PDF
              </button>
            )}
          </div>

          {/* Live Updates (if ongoing) */}
          {isOngoing && (
            <div className="glass-card animate-pulse-glow" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--accent-secondary)" }}>
                🔴 Live — Interview in Progress
              </h3>
              {liveUpdates.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Waiting for candidate responses...</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {liveUpdates.map((u, i) => (
                    <div key={i} style={{ padding: 12, borderRadius: 10, background: "rgba(15, 15, 30, 0.5)", border: "1px solid var(--border-color)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-primary)" }}>Q{u.totalAnswered}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--success)" }}>Avg: {u.avgScore}/10</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{u.evaluation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Report Data */}
          {report && (
            <>
              {/* Score + Recommendation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                <div className="glass-card" style={{ padding: 32, textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: 1 }}>
                    Overall Score
                  </p>
                  <p style={{
                    fontSize: 56, fontWeight: 900, lineHeight: 1, marginTop: 8,
                    color: report.overallScore >= 70 ? "var(--success)" : report.overallScore >= 50 ? "var(--warning)" : "var(--danger)",
                  }}>{report.overallScore}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>out of 100</p>
                </div>
                <div className="glass-card" style={{ padding: 32, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: 1, marginBottom: 12 }}>
                    AI Recommendation
                  </p>
                  <span className={`badge badge-${report.recommendation}`} style={{ fontSize: 18, padding: "8px 24px" }}>
                    <Award size={18} style={{ marginRight: 6 }} />
                    {report.recommendation.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Radar */}
              <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                  <TrendingUp size={18} style={{ verticalAlign: "middle", marginRight: 8 }} /> Dimension Analysis
                </h3>
                <ScoreRadarChart scores={report.dimensionScores} size={300} />
              </div>

              {/* Proctoring Analysis */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 24 }}>
                <div className="glass-card" style={{ padding: 24, textAlign: "center" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 16 }}>Trust Score</h3>
                  <div style={{
                    width: 100, height: 100, borderRadius: "50%", margin: "0 auto 12px",
                    border: `6px solid ${session.proctoring?.trustScore >= 80 ? "var(--success)" : session.proctoring?.trustScore >= 50 ? "var(--warning)" : "var(--danger)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800
                  }}>
                    {session.proctoring?.trustScore ?? 100}%
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {session.proctoring?.isSuspicious ? "🚩 High Risk Activity" : "✅ Normal Behavior"}
                  </p>
                </div>
                <div className="glass-card" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>Proctoring Logs</h3>
                  <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                    <div>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Tab Switches:</span>
                      <span style={{ fontSize: 14, fontWeight: 700, marginLeft: 8, color: (session.proctoring?.tabSwitches > 2 ? "var(--danger)" : "var(--text-primary)") }}>
                        {session.proctoring?.tabSwitches ?? 0}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Copy/Paste:</span>
                      <span style={{ fontSize: 14, fontWeight: 700, marginLeft: 8, color: (session.proctoring?.copyPasteAttempts > 0 ? "var(--danger)" : "var(--text-primary)") }}>
                        {session.proctoring?.copyPasteAttempts ?? 0}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    maxHeight: 120, overflowY: "auto", fontSize: 11,
                    padding: 8, background: "rgba(0,0,0,0.2)", borderRadius: 8, border: "1px solid var(--border-color)"
                  }}>
                    {session.proctoring?.logs?.length > 0 ? session.proctoring.logs.map((log, i) => (
                      <div key={i} style={{ marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ color: "var(--accent-secondary)" }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.event}
                      </div>
                    )) : <p style={{ color: "var(--text-muted)" }}>No suspicious events recorded.</p>}
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="glass-card" style={{ padding: 24, marginBottom: 24, borderLeft: "3px solid var(--accent-primary)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>AI Summary</h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)", fontStyle: "italic" }}>
                  "{report.aiSummary}"
                </p>
              </div>
            </>
          )}

          {/* Q&A Accordion */}
          {answers && answers.length > 0 && (
            <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                <MessageSquare size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
                Interview Transcript ({answers.length} questions)
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {answers.map((a, i) => {
                  const avg = ((a.scores.technicalRelevance + a.scores.depth + a.scores.clarity + a.scores.accuracy) / 4).toFixed(1);
                  const isExpanded = expandedAnswer === i;
                  return (
                    <div key={i} style={{
                      borderRadius: 12, background: "rgba(15, 15, 30, 0.5)",
                      border: "1px solid var(--border-color)", overflow: "hidden",
                    }}>
                      <div onClick={() => setExpandedAnswer(isExpanded ? null : i)}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "14px 16px", cursor: "pointer", transition: "background 0.2s",
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span className={`badge badge-${a.round === "intro" ? "ongoing" : a.round === "technical" ? "pending" : "completed"}`}>
                            {a.round}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>Q{i + 1}: {a.questionText.slice(0, 50)}...</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={12} /> {a.timeTaken ?? 0}s
                          </span>
                          <span style={{
                            fontWeight: 700, fontSize: 13,
                            color: avg >= 7 ? "var(--success)" : avg >= 4 ? "var(--warning)" : "var(--danger)",
                          }}>{avg}/10</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border-color)" }}>
                          <div style={{ marginTop: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-secondary)", marginBottom: 8 }}>
                              Question: {a.questionText}
                            </p>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>
                              Answer: {a.answerText}
                            </p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                {Object.entries(a.scores).map(([k, v]) => (
                                  <div key={k} style={{ fontSize: 12 }}>
                                    <span style={{ color: "var(--text-muted)" }}>{k.replace(/([A-Z])/g, " $1")}:</span>{" "}
                                    <span style={{ fontWeight: 700, color: v >= 7 ? "var(--success)" : v >= 4 ? "var(--warning)" : "var(--danger)" }}>{v}/10</span>
                                  </div>
                                ))}
                              </div>
                              <span style={{ fontSize: 12, color: a.timeTaken < 5 ? "var(--danger)" : "var(--text-muted)", fontWeight: 600 }}>
                                {a.timeTaken < 5 && "⚠️ Suspiciously Fast"}
                              </span>
                            </div>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>{a.aiEvaluation}</p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
