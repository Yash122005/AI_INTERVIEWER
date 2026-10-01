import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/axios";
import Navbar from "../components/Navbar";
import { Plus, Users, Briefcase, Clock, ExternalLink, Copy, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import SendLinkModal from "../components/SendLinkModal";

export default function RecruiterDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/sessions");
      setSessions(res.data);
    } catch (err) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (token) => {
    const link = `${window.location.origin}/interview/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Interview link copied!");
  };

  const openInviteModal = (session) => {
    setSelectedSession(session);
    setModalOpen(true);
  };

  const statusColors = {
    pending: "badge-pending",
    ongoing: "badge-ongoing",
    completed: "badge-completed",
  };

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === "ongoing").length;
  const completedSessions = sessions.filter((s) => s.status === "completed").length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
      <Navbar />
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {/* Header */}
          <div className="page-header">
            <div>
              <h1>Recruiter Dashboard</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 13 }}>
                Monitor candidates, configure sessions, and review evaluation reports
              </p>
            </div>
            <Link to="/create-session" className="btn btn-primary">
              <Plus size={16} /> New Interview
            </Link>
          </div>

          {/* Statistics Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 28,
            }}
          >
            {[
              {
                label: "Total Sessions",
                value: totalSessions,
                icon: Briefcase,
                accent: "var(--accent)",
              },
              {
                label: "Active Sessions",
                value: activeSessions,
                icon: Clock,
                accent: "var(--text-primary)",
              },
              {
                label: "Completed Sessions",
                value: completedSessions,
                icon: Users,
                accent: "var(--success)",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {stat.label}
                  </p>
                  <p
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      marginTop: 4,
                      color: stat.accent,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "var(--radius)",
                    backgroundColor: "var(--accent-soft)",
                    border: "1px solid rgba(166, 124, 82, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <stat.icon size={20} color="var(--accent)" />
                </div>
              </div>
            ))}
          </div>

          {/* Sessions Table Card */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                Interview Sessions
              </h2>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
              </span>
            </div>

            {loading ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <div className="spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : sessions.length === 0 ? (
              /* Empty State */
              <div style={{ padding: "64px 24px", textAlign: "center" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "var(--accent-soft)",
                    border: "1px solid rgba(166, 124, 82, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Briefcase size={26} color="var(--accent)" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  No interviews yet
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, maxWidth: 360, margin: "0 auto 20px" }}>
                  Start your first AI-powered interview and see candidate performance analytics.
                </p>
                <Link to="/create-session" className="btn btn-primary btn-sm">
                  <Plus size={15} /> Create Interview
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(12, 21, 25, 0.4)" }}>
                      {["Job Title", "Skills", "Level", "Status", "Candidate", "Actions"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 20px",
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, idx) => (
                      <tr
                        key={session._id}
                        style={{
                          borderBottom: "1px solid rgba(166, 124, 82, 0.08)",
                          transition: "var(--transition)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "16px 20px", fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                          {session.jobTitle}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {session.skills.slice(0, 3).map((s) => (
                              <span key={s} className="skill-tag">
                                {s}
                              </span>
                            ))}
                            {session.skills.length > 3 && (
                              <span className="skill-tag">+{session.skills.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "16px 20px",
                            textTransform: "capitalize",
                            color: "var(--text-secondary)",
                            fontSize: 13,
                          }}
                        >
                          {session.experienceLevel}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span className={`badge ${statusColors[session.status] || "badge-pending"}`}>
                            {session.status}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", color: "var(--text-secondary)", fontSize: 13 }}>
                          {session.candidateId?.name || session.candidateName || "—"}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => copyLink(session.shareableToken)}
                              className="btn btn-secondary btn-sm"
                              title="Copy Link"
                              style={{ padding: "6px 10px" }}
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={() => openInviteModal(session)}
                              className="btn btn-secondary btn-sm"
                              title="Send Invite Email"
                              style={{ padding: "6px 10px" }}
                            >
                              <Mail size={13} />
                            </button>
                            <Link
                              to={`/report/${session._id}`}
                              className="btn btn-secondary btn-sm"
                              title="View Report"
                              style={{ padding: "6px 10px" }}
                            >
                              <ExternalLink size={13} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <SendLinkModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        session={selectedSession}
      />
    </div>
  );
}
