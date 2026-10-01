import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../lib/axios";
import ScoreRadarChart from "../components/ScoreRadarChart";
import { Trophy, MessageSquare, ArrowLeft } from "lucide-react";
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

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );

  if (!data?.report)
    return (
      <div className="loading-screen">
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          Assessment report is being processed. Please wait...
        </p>
      </div>
    );

  const { report, answers } = data;
  const scoreColor =
    report.overallScore >= 70
      ? "var(--success)"
      : report.overallScore >= 50
      ? "var(--warning)"
      : "var(--danger)";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Link to="/" style={{ display: "inline-block", marginBottom: 16 }}>
              <img
                src="/logo.png"
                alt="InterviewIQ Logo"
                style={{
                  height: 38,
                  width: "auto",
                  objectFit: "contain",
                  margin: "0 auto",
                  display: "block",
                }}
              />
            </Link>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "var(--radius-lg)",
                margin: "0 auto 16px",
                backgroundColor: "var(--accent-soft)",
                border: "1px solid rgba(166, 124, 82, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trophy size={28} color="var(--accent)" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Interview Complete
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
              Performance assessment for <strong style={{ color: "var(--text-primary)" }}>{report.jobTitle}</strong>
            </p>
          </div>

          {/* Overall Score Card */}
          <div className="card" style={{ padding: "36px 24px", textAlign: "center", marginBottom: 20 }}>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Overall Assessment Score
            </p>
            <p
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: scoreColor,
                lineHeight: 1.1,
                marginTop: 8,
                fontFamily: "var(--font-mono)",
              }}
            >
              {report.overallScore}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>out of 100</p>
          </div>

          {/* Dimension Breakdown & Radar */}
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
              Dimension Breakdown
            </h3>
            <ScoreRadarChart scores={report.dimensionScores} size={260} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                marginTop: 20,
              }}
            >
              {Object.entries(report.dimensionScores).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: "var(--radius)",
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "capitalize" }}>
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: val >= 7 ? "var(--success)" : val >= 4 ? "var(--warning)" : "var(--danger)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {val}/10
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Round-wise Performance */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
              Round-wise Performance
            </h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {Object.entries(report.roundScores).map(([round, score]) => (
                <div
                  key={round}
                  style={{
                    flex: 1,
                    minWidth: 140,
                    padding: "18px 14px",
                    borderRadius: "var(--radius)",
                    textAlign: "center",
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    style={{
                      textTransform: "capitalize",
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    {round}
                  </p>
                  <p
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: score >= 7 ? "var(--success)" : score >= 4 ? "var(--warning)" : "var(--danger)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {score}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>/ 10</p>
                </div>
              ))}
            </div>
          </div>

          {/* Transcript Preview */}
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
              <MessageSquare size={16} color="var(--accent)" /> Response Transcript
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {answers?.map((a, i) => {
                const avg = (
                  (a.scores.technicalRelevance +
                    a.scores.depth +
                    a.scores.clarity +
                    a.scores.accuracy) /
                  4
                ).toFixed(1);
                return (
                  <div
                    key={i}
                    style={{
                      padding: 16,
                      borderRadius: "var(--radius)",
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span className={`badge badge-${a.round === "intro" ? "ongoing" : "completed"}`}>
                        {a.round}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: avg >= 7 ? "var(--success)" : avg >= 4 ? "var(--warning)" : "var(--danger)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {avg}/10
                      </span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>
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

          <div style={{ textAlign: "center", paddingBottom: 24 }}>
            <Link to="/" className="btn btn-secondary">
              <ArrowLeft size={15} /> Return to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
