import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import Navbar from "../components/Navbar";
import { Briefcase, Code, BarChart3, Clock, X, Plus, Copy, Check, ArrowRight, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function CreateSessionPage() {
  const [step, setStep] = useState(1);
  const [jobTitle, setJobTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [rounds, setRounds] = useState(["intro", "technical", "managerial"]);
  const [questionsPerRound, setQuestionsPerRound] = useState(3);
  const [timeLimit, setTimeLimit] = useState(30);
  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput("");
    }
  };

  const toggleRound = (r) => {
    setRounds((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  };

  const handleSubmit = async () => {
    if (!jobTitle.trim()) return toast.error("Job title is required");
    if (skills.length === 0) return toast.error("Add at least one skill");
    if (rounds.length === 0) return toast.error("Select at least one round");
    setLoading(true);
    try {
      const res = await api.post("/sessions", { jobTitle, skills, experienceLevel, rounds, questionsPerRound, timeLimit });
      setCreatedToken(res.data.shareableToken);
      toast.success("Interview session created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/interview/${createdToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdToken) {
    const link = `${window.location.origin}/interview/${createdToken}`;
    return (
      <div>
        <Navbar />
        <div className="page-container" style={{ maxWidth: 600, marginTop: 60 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card" style={{ padding: 48, textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: "0 auto 24px",
              background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check size={36} color="#10B981" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Interview Created!</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>Share this link with your candidate</p>
            <div style={{
              display: "flex", gap: 8, padding: 4, borderRadius: 12,
              background: "rgba(15, 15, 30, 0.8)", border: "1px solid var(--border-color)",
            }}>
              <input readOnly value={link} className="input-field" style={{
                flex: 1, border: "none", background: "transparent", fontSize: 13,
              }} />
              <button onClick={copyLink} className="btn btn-primary btn-sm">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <button onClick={() => navigate("/dashboard")} className="btn btn-secondary" style={{ marginTop: 24, width: "100%" }}>
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 600, marginTop: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Create Interview Session
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 14 }}>
          Step {step} of 3 — Configure your AI interview
        </p>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? "var(--accent-primary)" : "var(--border-color)",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}
            className="glass-card" style={{ padding: 32 }}
          >
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <Briefcase size={24} color="var(--accent-primary)" />
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>Job Details</h2>
                </div>
                <div className="input-group">
                  <label>Job Title</label>
                  <input className="input-field" type="text" placeholder="e.g. Backend Engineer"
                    value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Experience Level</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["junior", "mid", "senior"].map((l) => (
                      <button key={l} type="button" onClick={() => setExperienceLevel(l)}
                        style={{
                          flex: 1, padding: "12px", borderRadius: 10, border: "1px solid",
                          borderColor: experienceLevel === l ? "var(--accent-primary)" : "var(--border-color)",
                          background: experienceLevel === l ? "rgba(108, 99, 255, 0.15)" : "transparent",
                          color: experienceLevel === l ? "#fff" : "var(--text-secondary)",
                          cursor: "pointer", fontFamily: "'Inter'", fontWeight: 600, fontSize: 14,
                          textTransform: "capitalize", transition: "all 0.2s",
                        }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <Code size={24} color="var(--accent-secondary)" />
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>Required Skills</h2>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input-field" type="text" placeholder="Type a skill and press Enter"
                    value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    style={{ flex: 1 }} />
                  <button onClick={addSkill} className="btn btn-secondary" type="button"><Plus size={18} /></button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 40 }}>
                  {skills.map((s) => (
                    <span key={s} className="skill-tag" style={{ cursor: "pointer" }}
                      onClick={() => setSkills(skills.filter((x) => x !== s))}>
                      {s} <X size={12} />
                    </span>
                  ))}
                  {skills.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No skills added yet</p>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <BarChart3 size={24} color="#10B981" />
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>Interview Config</h2>
                </div>
                <div className="input-group">
                  <label>Interview Rounds</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ key: "intro", label: "🤝 Intro" }, { key: "technical", label: "💻 Technical" }, { key: "managerial", label: "👔 Managerial" }].map((r) => (
                      <button key={r.key} type="button" onClick={() => toggleRound(r.key)}
                        style={{
                          flex: 1, padding: "12px 8px", borderRadius: 10,
                          border: "1px solid", fontSize: 13, fontWeight: 600, fontFamily: "'Inter'",
                          borderColor: rounds.includes(r.key) ? "var(--accent-primary)" : "var(--border-color)",
                          background: rounds.includes(r.key) ? "rgba(108, 99, 255, 0.15)" : "transparent",
                          color: rounds.includes(r.key) ? "#fff" : "var(--text-secondary)",
                          cursor: "pointer", transition: "all 0.2s",
                        }}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="input-group">
                    <label>Questions per Round</label>
                    <input className="input-field" type="number" min="1" max="10"
                      value={questionsPerRound} onChange={(e) => setQuestionsPerRound(Number(e.target.value))} />
                  </div>
                  <div className="input-group">
                    <label>Time Limit (min)</label>
                    <input className="input-field" type="number" min="5" max="120"
                      value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="btn btn-secondary"><ArrowLeft size={16} /> Back</button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="btn btn-primary">Next <ArrowRight size={16} /></button>
          ) : (
            <button onClick={handleSubmit} className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <div className="spinner" /> : "Create Interview"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
