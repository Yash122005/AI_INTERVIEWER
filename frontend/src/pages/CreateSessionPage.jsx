import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import Navbar from "../components/Navbar";
import { Briefcase, Code, BarChart3, X, Plus, Copy, Check, ArrowRight, ArrowLeft } from "lucide-react";
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
    setRounds((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const handleSubmit = async () => {
    if (!jobTitle.trim()) return toast.error("Job title is required");
    if (skills.length === 0) return toast.error("Add at least one skill");
    if (rounds.length === 0) return toast.error("Select at least one round");
    setLoading(true);
    try {
      const res = await api.post("/sessions", {
        jobTitle,
        skills,
        experienceLevel,
        rounds,
        questionsPerRound,
        timeLimit,
      });
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
      <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
        <Navbar />
        <div className="page-container" style={{ maxWidth: 540, marginTop: 40 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card"
            style={{ padding: 40, textAlign: "center" }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "var(--radius-lg)",
                margin: "0 auto 20px",
                backgroundColor: "var(--success-soft)",
                border: "1px solid rgba(52, 211, 153, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={32} color="var(--success)" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Interview Created!
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24 }}>
              Share this unique invitation link with your candidate to begin
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: 6,
                borderRadius: "var(--radius)",
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
              }}
            >
              <input
                readOnly
                value={link}
                className="input-field"
                style={{
                  flex: 1,
                  border: "none",
                  backgroundColor: "transparent",
                  fontSize: 13,
                  padding: "6px 10px",
                }}
              />
              <button onClick={copyLink} className="btn btn-primary btn-sm">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn btn-secondary"
              style={{ marginTop: 24, width: "100%" }}
            >
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 620 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            Create Interview Session
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            Step {step} of 3 — Configure role requirements, skills, and assessment structure
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: s <= step ? "var(--accent)" : "rgba(166, 124, 82, 0.15)",
                transition: "var(--transition)",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="card"
            style={{ padding: 32 }}
          >
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <Briefcase size={20} color="var(--accent)" />
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Role Details</h2>
                </div>

                <div className="input-group">
                  <label>Target Job Title</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="e.g. Senior Backend Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Experience Level</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["junior", "mid", "senior"].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setExperienceLevel(l)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: "var(--radius)",
                          border: "1px solid",
                          borderColor: experienceLevel === l ? "var(--accent)" : "var(--border)",
                          backgroundColor: experienceLevel === l ? "var(--accent-soft)" : "transparent",
                          color: experienceLevel === l ? "var(--text-primary)" : "var(--text-secondary)",
                          cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                          fontWeight: 600,
                          fontSize: 13,
                          textTransform: "capitalize",
                          transition: "var(--transition)",
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <Code size={20} color="var(--accent)" />
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
                    Required Technical Skills
                  </h2>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="e.g. TypeScript, React, PostgreSQL"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button onClick={addSkill} className="btn btn-secondary" type="button">
                    <Plus size={16} /> Add
                  </button>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 48 }}>
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="skill-tag"
                      style={{ cursor: "pointer", padding: "6px 10px" }}
                      onClick={() => setSkills(skills.filter((x) => x !== s))}
                      title="Click to remove"
                    >
                      {s} <X size={12} style={{ marginLeft: 4 }} />
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <p style={{ color: "var(--text-muted)", fontSize: 13, alignSelf: "center" }}>
                      No skills added yet. Add key technical competencies.
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <BarChart3 size={20} color="var(--accent)" />
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
                    Interview Format & Settings
                  </h2>
                </div>

                <div className="input-group">
                  <label>Selected Rounds</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { key: "intro", label: "Introductory" },
                      { key: "technical", label: "Technical" },
                      { key: "managerial", label: "Managerial" },
                    ].map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => toggleRound(r.key)}
                        style={{
                          flex: 1,
                          padding: "10px 8px",
                          borderRadius: "var(--radius)",
                          border: "1px solid",
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "var(--font-sans)",
                          borderColor: rounds.includes(r.key) ? "var(--accent)" : "var(--border)",
                          backgroundColor: rounds.includes(r.key) ? "var(--accent-soft)" : "transparent",
                          color: rounds.includes(r.key) ? "var(--text-primary)" : "var(--text-secondary)",
                          cursor: "pointer",
                          transition: "var(--transition)",
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="input-group">
                    <label>Questions per Round</label>
                    <input
                      className="input-field"
                      type="number"
                      min="1"
                      max="10"
                      value={questionsPerRound}
                      onChange={(e) => setQuestionsPerRound(Number(e.target.value))}
                    />
                  </div>
                  <div className="input-group">
                    <label>Time Limit (Minutes)</label>
                    <input
                      className="input-field"
                      type="number"
                      min="5"
                      max="120"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Step Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="btn btn-primary">
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <div className="spinner" /> : "Create Interview Session"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
