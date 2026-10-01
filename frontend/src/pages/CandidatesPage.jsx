import { useState, useEffect } from "react";
import api from "../lib/axios";
import Navbar from "../components/Navbar";
import { Users, Mail, User, Search } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await api.get("/sessions/candidates");
      setCandidates(res.data);
    } catch (err) {
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
      <Navbar />
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="page-header">
            <div>
              <h1>Registered Candidates</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 13 }}>
                View and invite candidates to AI interview sessions
              </p>
            </div>
            <div style={{ position: "relative", minWidth: 280 }}>
              <Search
                size={16}
                style={{ position: "absolute", left: 14, top: 12, color: "var(--text-muted)" }}
              />
              <input
                className="input-field"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", paddingLeft: 40 }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {loading ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 60 }}>
                <div className="spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 60 }} className="card">
                <Users size={44} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No candidates found.</p>
              </div>
            ) : (
              filteredCandidates.map((c, i) => (
                <div
                  key={c._id || i}
                  className="card"
                  style={{
                    padding: 22,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "var(--radius)",
                        backgroundColor: "var(--accent-soft)",
                        border: "1px solid rgba(166, 124, 82, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--accent)",
                      }}
                    >
                      {c.name?.charAt(0).toUpperCase() || <User size={20} />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{c.name}</h3>
                      <div
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 2,
                        }}
                      >
                        <Mail size={12} color="var(--accent)" /> {c.email}
                      </div>
                    </div>
                  </div>

                  {c.profile?.skills && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {c.profile.skills.split(",").map((skill) => (
                        <span key={skill} className="skill-tag">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 14,
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Joined {new Date(c.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toast.success(`Candidate profile: ${c.name}`)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
