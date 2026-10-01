import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Briefcase, Code, FileText, Send } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/axios";

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: "",
    skills: "",
    projects: "",
    experience: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/candidate/profile", formData);
      toast.success("Profile submitted! Generating your interview...");

      if (res.data?.token || res.data?.shareableToken) {
        navigate(`/interview/${res.data.token || res.data.shareableToken}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to submit profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundColor: "var(--background)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ padding: "36px 32px", maxWidth: "580px", width: "100%" }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link to="/" style={{ display: "inline-block", marginBottom: 14 }}>
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Candidate Profile
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            Enter your background to customize your AI interview simulation
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="input-group">
            <label>Target Role</label>
            <div style={{ position: "relative" }}>
              <Briefcase size={16} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 13 }} />
              <input
                className="input-field"
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="e.g. Frontend Engineer, ML Engineer"
                style={{ paddingLeft: 40, width: "100%" }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Core Skills (comma separated)</label>
            <div style={{ position: "relative" }}>
              <Code size={16} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 13 }} />
              <input
                className="input-field"
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g. React, Node.js, PostgreSQL"
                style={{ paddingLeft: 40, width: "100%" }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Notable Projects or Experience</label>
            <div style={{ position: "relative" }}>
              <FileText size={16} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 13 }} />
              <textarea
                className="input-field"
                name="projects"
                value={formData.projects}
                onChange={handleChange}
                placeholder="Briefly describe key projects or technologies you've built with..."
                style={{ paddingLeft: 40, width: "100%", minHeight: "84px", resize: "vertical" }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Experience Level</label>
            <select
              className="input-field"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              style={{ width: "100%", cursor: "pointer" }}
              required
            >
              <option value="" disabled>
                Select your experience level
              </option>
              <option value="entry">Entry Level (0-2 years)</option>
              <option value="mid">Mid Level (3-5 years)</option>
              <option value="senior">Senior Level (5+ years)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <div className="spinner" /> : <><Send size={16} /> Generate & Start Interview</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
