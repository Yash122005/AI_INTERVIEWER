import { useState, useEffect } from "react";
import api from "../lib/axios";
import Navbar from "../components/Navbar";
import { Users, Mail, User, Search, Briefcase } from "lucide-react";
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

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="page-header">
            <div>
              <h1>Registered Candidates</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
                View and manage participants interested in interviews
              </p>
            </div>
            <div style={{ position: "relative", minWidth: 300 }}>
              <Search size={18} style={{ position: "absolute", left: 14, top: 13, color: "var(--text-muted)" }} />
              <input 
                className="input-field" 
                placeholder="Search candidates..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", paddingLeft: 42 }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {loading ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 60 }}>
                <div className="spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 60 }}>
                <Users size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                <p style={{ color: "var(--text-secondary)" }}>No candidates found.</p>
              </div>
            ) : (
              filteredCandidates.map((c, i) => (
                <motion.div 
                  key={c._id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card" 
                  style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ 
                      width: 56, height: 56, borderRadius: 16, 
                      background: "var(--accent-gradient)", 
                      display: "flex", alignItems: "center", justifyContent: "center" 
                    }}>
                      <User size={28} color="#fff" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 700 }}>{c.name}</h3>
                      <div style={{ color: "var(--text-muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={14} /> {c.email}
                      </div>
                    </div>
                  </div>

                  {c.profile?.skills && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {c.profile.skills.split(",").map(skill => (
                        <span key={skill} className="skill-tag">{skill.trim()}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: "auto", pt: 16, borderTop: "1px solid var(--border-color)", pt: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Registered: {new Date(c.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => toast("Feature coming soon: View Profile")}>
                      View Profile
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
