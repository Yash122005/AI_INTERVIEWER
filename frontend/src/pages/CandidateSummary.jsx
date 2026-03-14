import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../lib/axios";
import ScoreRadarChart from "../components/ScoreRadarChart";
import { Trophy, Star, ArrowRight, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function CandidateSummary() {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/sessions/${sessionId}`);
        setData(res.data);
      } catch {
        console.error("Failed to fetch report");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  if (loading) return <div className="loading-screen"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  if (!data?.report) return (
    <div className="loading-screen">
      <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>Report not ready yet. Please wait...</p>
    </div>
  );

  const { report, answers } = data;
  const scoreColor = report.overallScore >= 70 ? "var(--success)" : report.overallScore >= 50 ? "var(--warning)" : "var(--danger)";

  return (
    <div style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 40, marginTop: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px",
              background: "rgba(108, 99, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Trophy size={36} color="var(--accent-primary)" />
            </div>
            <h1 style={{
              fontSize: 32, fontWeight: 800, marginBottom: 4,
              background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Interview Complete!</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
              Here's your performance summary for <strong style={{ color: "var(--text-primary)" }}>{report.jobTitle}</strong>
            </p>
          </div>

          {/* Overall Score */}
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }} className="glass-card animate-pulse-glow"
            style={{ padding: 40, textAlign: "center", marginBottom: 24 }}>
            <p style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
              Overall Score
            </p>
            <p style={{ fontSize: 72, fontWeight: 900, color: scoreColor, lineHeight: 1, marginTop: 8 }}>
              {report.overallScore}
            </p>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: 4 }}>out of 100</p>
          </motion.div>

          {/* Radar Chart */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>Dimension Breakdown</h3>
            <ScoreRadarChart scores={report.dimensionScores} size={280} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              {Object.entries(report.dimensionScores).map(([key, val]) => (
                <div key={key} style={{
                  display: "flex", justifyContent: "space-between", padding: "10px 14px",
                  borderRadius: 10, background: "rgba(15, 15, 30, 0.5)",
                }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", textTransform: "capitalize" }}>
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: val >= 7 ? "var(--success)" : val >= 4 ? "var(--warning)" : "var(--danger)",
                  }}>{val}/10</span>
                </div>
              ))}
            </div>
          </div>

          {/* Round Scores */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Round-wise Performance</h3>
            <div style={{ display: "flex", gap: 12 }}>
              {Object.entries(report.roundScores).map(([round, score]) => (
                <div key={round} style={{
                  flex: 1, padding: 20, borderRadius: 12, textAlign: "center",
                  background: "rgba(15, 15, 30, 0.5)", border: "1px solid var(--border-color)",
                }}>
                  <p style={{ textTransform: "capitalize", fontSize: 13, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>
                    {round}
                  </p>
                  <p style={{
                    fontSize: 28, fontWeight: 800,
                    color: score >= 7 ? "var(--success)" : score >= 4 ? "var(--warning)" : "var(--danger)",
                  }}>{score}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>/ 10</p>
                </div>
              ))}
            </div>
          </div>

          {/* Q&A History */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              <MessageSquare size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
              Interview Transcript
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {answers?.map((a, i) => {
                const avg = ((a.scores.technicalRelevance + a.scores.depth + a.scores.clarity + a.scores.accuracy) / 4).toFixed(1);
                return (
                  <div key={i} style={{ padding: 16, borderRadius: 12, background: "rgba(15, 15, 30, 0.5)", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span className={`badge badge-${a.round === "intro" ? "ongoing" : a.round === "technical" ? "pending" : "completed"}`}>
                        {a.round}
                      </span>
                      <span style={{
                        fontWeight: 700, fontSize: 13,
                        color: avg >= 7 ? "var(--success)" : avg >= 4 ? "var(--warning)" : "var(--danger)",
                      }}>{avg}/10</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--accent-secondary)" }}>
                      Q: {a.questionText}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      A: {a.answerText}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              ✨ Your recruiter will review your results shortly
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
