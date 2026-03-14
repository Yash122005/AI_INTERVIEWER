import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, Code, FileText, Send, Zap } from "lucide-react";
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
      // Send candidate information to the backend
      const res = await api.post("/candidate/profile", formData);
      toast.success("Profile submitted! Generating your interview...");
      
      // If backend returns a session token, redirect to interview
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
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
      background: "var(--bg-primary)"
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{ padding: "40px", maxWidth: "600px", width: "100%" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: "var(--accent-gradient)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Candidate Dashboard</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Enter your details to generate your AI interview</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              Role Applied For
            </label>
            <div style={{ position: "relative" }}>
              <Briefcase size={18} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 14 }} />
              <input 
                className="input-field" 
                type="text" 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                placeholder="e.g. Frontend Developer, Data Scientist" 
                style={{ paddingLeft: 44, width: "100%" }} 
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              Skills (comma separated)
            </label>
            <div style={{ position: "relative" }}>
              <Code size={18} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 14 }} />
              <input 
                className="input-field" 
                type="text" 
                name="skills" 
                value={formData.skills} 
                onChange={handleChange} 
                placeholder="e.g. React, Node.js, Python" 
                style={{ paddingLeft: 44, width: "100%" }} 
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              Projects
            </label>
            <div style={{ position: "relative" }}>
              <FileText size={18} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 14 }} />
              <textarea 
                className="input-field" 
                name="projects" 
                value={formData.projects} 
                onChange={handleChange} 
                placeholder="Describe your key projects..." 
                style={{ paddingLeft: 44, width: "100%", minHeight: "80px", resize: "vertical" }} 
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              Experience Level
            </label>
            <select 
              className="input-field" 
              name="experience" 
              value={formData.experience} 
              onChange={handleChange} 
              style={{ width: "100%", appearance: "none", cursor: "pointer" }} 
              required
            >
              <option value="" disabled>Select your experience level</option>
              <option value="entry">Entry Level (0-2 years)</option>
              <option value="mid">Mid Level (3-5 years)</option>
              <option value="senior">Senior Level (5+ years)</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: "100%", marginTop: 12, padding: "14px", display: "flex", justifyContent: "center", gap: 10 }}
            disabled={loading}
          >
            {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><Send size={18} /> Submit Application</>}
          </button>

        </form>
      </motion.div>
    </div>
  );
}
