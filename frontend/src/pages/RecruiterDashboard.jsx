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

  const statusColors = { pending: "badge-pending", ongoing: "badge-ongoing", completed: "badge-completed" };

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="page-header">
            <div>
              <h1>Recruiter Dashboard</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
                Manage your interview sessions
              </p>
            </div>
            <Link to="/create-session" className="btn btn-primary">
              <Plus size={18} /> New Interview
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Total Sessions", value: sessions.length, icon: Briefcase, color: "#6C63FF" },
              { label: "Active", value: sessions.filter(s => s.status === "ongoing").length, icon: Clock, color: "#00D4FF" },
              { label: "Completed", value: sessions.filter(s => s.status === "completed").length, icon: Users, color: "#10B981" },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {stat.label}
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 800, marginTop: 4, color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <stat.icon size={24} color={stat.color} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sessions Table */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Interview Sessions</h2>
            </div>

            {loading ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <div className="spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <Briefcase size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>No sessions yet</p>
                <Link to="/create-session" className="btn btn-primary" style={{ marginTop: 16 }}>
                  <Plus size={16} /> Create Your First Interview
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      {["Job Title", "Skills", "Level", "Status", "Candidate", "Actions"].map((h) => (
                        <th key={h} style={{
                          padding: "14px 20px", textAlign: "left",
                          fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
                          textTransform: "uppercase", letterSpacing: "0.5px",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, idx) => (
                      <motion.tr key={session._id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                          borderBottom: "1px solid rgba(108, 99, 255, 0.08)",
                          transition: "background 0.2s",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(108, 99, 255, 0.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "16px 20px", fontWeight: 600 }}>{session.jobTitle}</td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {session.skills.slice(0, 3).map((s) => (
                              <span key={s} className="skill-tag">{s}</span>
                            ))}
                            {session.skills.length > 3 && <span className="skill-tag">+{session.skills.length - 3}</span>}
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px", textTransform: "capitalize", color: "var(--text-secondary)" }}>
                          {session.experienceLevel}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span className={`badge ${statusColors[session.status]}`}>
                            {session.status}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", color: "var(--text-secondary)" }}>
                          {session.candidateId?.name || session.candidateName || "—"}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => copyLink(session.shareableToken)} className="btn btn-secondary btn-sm" title="Copy Link">
                              <Copy size={14} />
                            </button>
                            <button onClick={() => openInviteModal(session)} className="btn btn-secondary btn-sm" title="Send via Email">
                              <Mail size={14} />
                            </button>
                            <Link to={`/report/${session._id}`} className="btn btn-secondary btn-sm" title="View Report">
                              <ExternalLink size={14} />
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
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
