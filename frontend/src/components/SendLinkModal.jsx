import { useState, useEffect } from "react";
import { X, Send, Mail, User, Search, Loader2 } from "lucide-react";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function SendLinkModal({ isOpen, onClose, session }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCandidates();
    }
  }, [isOpen]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sessions/candidates");
      setCandidates(res.data);
    } catch (err) {
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (candidate) => {
    setSending(candidate._id);
    try {
      const interviewLink = `${window.location.origin}/interview/${session.shareableToken}`;
      await api.post("/sessions/send-link", {
        email: candidate.email,
        candidateName: candidate.name,
        jobTitle: session.jobTitle,
        interviewLink,
      });
      toast.success(`Invite sent to ${candidate.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send email");
    } finally {
      setSending(null);
    }
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="card"
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "var(--surface)",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Invite Candidates</h2>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              Sharing link for: {session?.jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "16px 24px" }}>
          <div style={{ position: "relative" }}>
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

        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div className="spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 13 }}>
              No candidates found.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredCandidates.map((c) => (
                <div
                  key={c._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "var(--radius)",
                        backgroundColor: "var(--accent-soft)",
                        border: "1px solid rgba(166, 124, 82, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--accent)",
                      }}
                    >
                      {c.name?.charAt(0).toUpperCase() || <User size={16} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                        {c.name}
                      </div>
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Mail size={11} color="var(--accent)" /> {c.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSend(c)}
                    disabled={sending === c._id}
                    className="btn btn-primary btn-sm"
                    style={{ minWidth: 90 }}
                  >
                    {sending === c._id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={13} /> Send
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
