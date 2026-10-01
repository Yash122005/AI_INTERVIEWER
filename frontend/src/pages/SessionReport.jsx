import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/axios";
import Navbar from "../components/Navbar";
import ScoreRadarChart from "../components/ScoreRadarChart";
import useSocket from "../hooks/useSocket";
import { Download, User, Briefcase, Award, MessageSquare, TrendingUp, ChevronDown, ChevronUp, Clock } from "lucide-react";
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

  useEffect(() => {
    const unsub1 = onEvent("scoreUpdate", (update) => {
      setLiveUpdates((prev) => [...prev, update]);
    });
    const unsub2 = onEvent("interviewCompleted", () => {
      toast.success("Interview completed! Refreshing report...");
      setTimeout(() => window.location.reload(), 1500);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [onEvent]);

  const downloadPDF = () => {
    if (!data?.report) return;
    const { report, session } = data;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(166, 124, 82);
    doc.text("InterviewIQ Assessment Report", 20, 25);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Job Role: ${session.jobTitle}`, 20, 40);
    doc.text(`Candidate: ${report.candidateName || "N/A"}`, 20, 48);
    doc.text(`Experience Level: ${session.experienceLevel}`, 20, 56);
    doc.text(`Date: ${new Date(report.createdAt || Date.now()).toLocaleDateString()}`, 20, 64);

    doc.setFontSize(15);
    doc.setTextColor(30);
    doc.text(`Overall Score: ${report.overallScore}/100`, 20, 80);

    doc.setFontSize(12);
    doc.text("Dimension Scores:", 20, 95);
    doc.setFontSize(10);
    let y = 105;
    Object.entries(report.dimensionScores).forEach(([key, val]) => {
      doc.text(`  ${key.replace(/([A-Z])/g, " $1").trim()}: ${val}/10`, 20, y);
      y += 8;
    });

    y += 6;
    doc.setFontSize(12);
    doc.text("Recommendation:", 20, y);
    doc.setFontSize(14);
    y += 10;
    doc.setTextColor(
      report.recommendation === "hire" ? 52 : report.recommendation === "reject" ? 248 : 251,
      report.recommendation === "hire" ? 211 : report.recommendation === "reject" ? 113 : 191,
      report.recommendation === "hire" ? 153 : report.recommendation === "reject" ? 113 : 36
    );
    doc.text(report.recommendation.toUpperCase(), 20, y);

    y += 15;
    doc.setTextColor(30);
    doc.setFontSize(11);
    doc.text("AI Summary & Evaluation:", 20, y);
    y += 8;
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(report.aiSummary || "N/A", 170);
    doc.text(lines, 20, y);

    doc.save(`InterviewIQ_Report_${session.jobTitle.replace(/\s/g, "_")}.pdf`);
    toast.success("Report downloaded!");
  };

  if (loading)
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
        <Navbar />
        <div className="loading-screen">
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </div>
    );

  if (!data?.session)
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
        <Navbar />
        <div className="page-container">
          <p>Session not found</p>
        </div>
      </div>
    );

  const { session, answers, report } = data;
  const isOngoing = session.status === "ongoing";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 960 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 28,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Session Assessment Report</h1>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginTop: 6,
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  <Briefcase size={14} style={{ verticalAlign: "middle", marginRight: 4, color: "var(--accent)" }} />
                  {session.jobTitle}
                </span>
                <span>
                  <User size={14} style={{ verticalAlign: "middle", marginRight: 4, color: "var(--accent)" }} />
                  {session.candidateName || session.candidateId?.name || "Pending"}
                </span>
                <span className={`badge badge-${session.status}`}>{session.status}</span>
              </div>
            </div>
            {report && (
              <button onClick={downloadPDF} className="btn btn-primary">
                <Download size={15} /> Download PDF
              </button>
            )}
          </div>

          {/* Live Updates (if ongoing) */}
          {isOngoing && (
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 14,
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "var(--success)",
                    boxShadow: "0 0 6px var(--success)",
                  }}
                />
                Live — Interview in Progress
              </h3>
              {liveUpdates.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  Connected to session. Waiting for candidate answers...
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {liveUpdates.map((u, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 12,
                        borderRadius: "var(--radius)",
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
                          Q{u.totalAnswered}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--success)" }}>
                          Avg: {u.avgScore}/10
                        </span>
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
              {/* Score + Recommendation Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
                <div className="card" style={{ padding: 28, textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      letterSpacing: "0.8px",
                    }}
                  >
                    Overall Score
                  </p>
                  <p
                    style={{
                      fontSize: 52,
                      fontWeight: 900,
                      lineHeight: 1.1,
                      marginTop: 6,
                      color:
                        report.overallScore >= 70
                          ? "var(--success)"
                          : report.overallScore >= 50
                          ? "var(--warning)"
                          : "var(--danger)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {report.overallScore}
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>out of 100</p>
                </div>

                <div
                  className="card"
                  style={{
                    padding: 28,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      letterSpacing: "0.8px",
                      marginBottom: 12,
                    }}
                  >
                    AI Recommendation
                  </p>
                  <span
                    className={`badge badge-${report.recommendation}`}
                    style={{ fontSize: 15, padding: "8px 20px" }}
                  >
                    <Award size={16} style={{ marginRight: 6 }} />
                    {report.recommendation.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Dimension Analysis */}
              <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--text-primary)",
                  }}
                >
                  <TrendingUp size={16} color="var(--accent)" /> Dimension Breakdown
                </h3>
                <ScoreRadarChart scores={report.dimensionScores} size={280} />
              </div>

              {/* Proctoring & Integrity */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div className="card" style={{ padding: 24, textAlign: "center" }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 14 }}>
                    Integrity & Trust Score
                  </h3>
                  <div
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: "50%",
                      margin: "0 auto 12px",
                      border: `5px solid ${
                        session.proctoring?.trustScore >= 80
                          ? "var(--success)"
                          : session.proctoring?.trustScore >= 50
                          ? "var(--warning)"
                          : "var(--danger)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {session.proctoring?.trustScore ?? 100}%
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {session.proctoring?.isSuspicious ? "⚠️ Suspicious Activity Detected" : "✅ Normal Integrity Profile"}
                  </p>
                </div>

                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>
                    Proctoring Log
                  </h3>
                  <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Tab Switches:</span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          marginLeft: 6,
                          color: session.proctoring?.tabSwitches > 2 ? "var(--danger)" : "var(--text-primary)",
                        }}
                      >
                        {session.proctoring?.tabSwitches ?? 0}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Copy/Paste:</span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          marginLeft: 6,
                          color: session.proctoring?.copyPasteAttempts > 0 ? "var(--danger)" : "var(--text-primary)",
                        }}
                      >
                        {session.proctoring?.copyPasteAttempts ?? 0}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      maxHeight: 110,
                      overflowY: "auto",
                      fontSize: 11,
                      padding: 10,
                      backgroundColor: "var(--background)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {session.proctoring?.logs?.length > 0 ? (
                      session.proctoring.logs.map((log, i) => (
                        <div
                          key={i}
                          style={{
                            marginBottom: 4,
                            paddingBottom: 4,
                            borderBottom: "1px solid rgba(166, 124, 82, 0.08)",
                          }}
                        >
                          <span style={{ color: "var(--accent)" }}>
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>{" "}
                          {log.event}
                        </div>
                      ))
                    ) : (
                      <p style={{ color: "var(--text-muted)" }}>No integrity violations recorded.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div
                className="card"
                style={{
                  padding: 24,
                  marginBottom: 20,
                  borderLeft: "4px solid var(--accent)",
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
                  AI Summary & Recommendation Analysis
                </h3>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)", fontStyle: "italic" }}>
                  "{report.aiSummary}"
                </p>
              </div>
            </>
          )}

          {/* Q&A Accordion */}
          {answers && answers.length > 0 && (
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 16,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <MessageSquare size={16} color="var(--accent)" /> Interview Transcript ({answers.length} questions)
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {answers.map((a, i) => {
                  const avg = (
                    (a.scores.technicalRelevance +
                      a.scores.depth +
                      a.scores.clarity +
                      a.scores.accuracy) /
                    4
                  ).toFixed(1);
                  const isExpanded = expandedAnswer === i;
                  return (
                    <div
                      key={i}
                      style={{
                        borderRadius: "var(--radius)",
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        onClick={() => setExpandedAnswer(isExpanded ? null : i)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          cursor: "pointer",
                          transition: "var(--transition)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className={`badge badge-${a.round === "intro" ? "ongoing" : "completed"}`}>
                            {a.round}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                            Q{i + 1}: {a.questionText.slice(0, 50)}...
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Clock size={12} /> {a.timeTaken ?? 0}s
                          </span>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color:
                                avg >= 7 ? "var(--success)" : avg >= 4 ? "var(--warning)" : "var(--danger)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {avg}/10
                          </span>
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div
                          style={{
                            padding: "14px 16px",
                            borderTop: "1px solid var(--border)",
                            backgroundColor: "rgba(22, 33, 39, 0.5)",
                          }}
                        >
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--accent)",
                              marginBottom: 6,
                            }}
                          >
                            Question: {a.questionText}
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "var(--text-secondary)",
                              marginBottom: 10,
                              lineHeight: 1.6,
                            }}
                          >
                            Answer: {a.answerText}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 8,
                            }}
                          >
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                              {Object.entries(a.scores).map(([k, v]) => (
                                <div key={k} style={{ fontSize: 11 }}>
                                  <span style={{ color: "var(--text-muted)" }}>
                                    {k.replace(/([A-Z])/g, " $1")}:
                                  </span>{" "}
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      color:
                                        v >= 7 ? "var(--success)" : v >= 4 ? "var(--warning)" : "var(--danger)",
                                    }}
                                  >
                                    {v}/10
                                  </span>
                                </div>
                              ))}
                            </div>
                            {a.timeTaken < 5 && (
                              <span style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>
                                ⚠️ Suspiciously Fast Response
                              </span>
                            )}
                          </div>
                          {a.aiEvaluation && (
                            <p
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                                fontStyle: "italic",
                                marginTop: 8,
                              }}
                            >
                              {a.aiEvaluation}
                            </p>
                          )}
                        </div>
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
