import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  ShieldCheck,
  BarChart3,
  Clock,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  Mic,
  Layers,
  Award,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Interviews",
    description:
      "Practice realistic, dynamic interviews generated on the fly for any engineering or product role.",
  },
  {
    icon: Sparkles,
    title: "Real-Time Interaction",
    description:
      "Experience natural, adaptive conversations with speech recognition and instant contextual follow-ups.",
  },
  {
    icon: BarChart3,
    title: "Performance Analysis",
    description:
      "Understand your strengths and blindspots across technical depth, communication, and clarity.",
  },
  {
    icon: Award,
    title: "Personalized Feedback",
    description:
      "Receive actionable, constructive coaching points with model answer comparisons after every response.",
  },
  {
    icon: Layers,
    title: "Interview Reports",
    description:
      "Review comprehensive hiring-grade assessment summaries with radar charts and downloadable PDFs.",
  },
  {
    icon: ShieldCheck,
    title: "Multiple Interview Types",
    description:
      "Master technical coding, system design, behavioral HR, and managerial leadership rounds.",
  },
];

const steps = [
  {
    step: "01",
    title: "Configure Session",
    desc: "Choose the target role, experience level, required skills, and interview rounds.",
  },
  {
    step: "02",
    title: "Take the Live Interview",
    desc: "Engage with the AI interviewer using voice or text in a focused, proctored environment.",
  },
  {
    step: "03",
    title: "Get Actionable Reports",
    desc: "Review detailed dimension breakdowns, scores, and specific improvement strategies.",
  },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", color: "var(--text-primary)" }}>
      {/* ── 1. Minimal Navbar ─────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(12, 21, 25, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(166, 124, 82, 0.15)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}
          >
            <img
              src="/logo.png"
              alt="InterviewIQ Logo"
              style={{
                height: 32,
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="landing-nav-desktop">
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <button
                onClick={() => scrollToSection("features")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "var(--transition)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "var(--transition)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("product-preview")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "var(--transition)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                Product
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="mobile-only">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-secondary btn-sm"
              style={{ padding: "8px", borderRadius: "var(--radius)" }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                backgroundColor: "rgba(16, 26, 31, 0.98)",
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <button
                onClick={() => scrollToSection("features")}
                className="btn btn-ghost"
                style={{ justifyContent: "flex-start", width: "100%", fontSize: 14 }}
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="btn btn-ghost"
                style={{ justifyContent: "flex-start", width: "100%", fontSize: 14 }}
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("product-preview")}
                className="btn btn-ghost"
                style={{ justifyContent: "flex-start", width: "100%", fontSize: 14 }}
              >
                Product Preview
              </button>

              <div style={{ height: 1, backgroundColor: "var(--border)", margin: "4px 0" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-secondary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── 2. Hero Section ───────────────────────────────────── */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 20px 40px", textAlign: "center" }}>
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {/* Eyebrow */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--accent-soft)",
              border: "1px solid rgba(166, 124, 82, 0.25)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            <Brain size={14} /> AI-POWERED INTERVIEW PRACTICE
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            variants={fadeUp}
            style={{
              fontSize: "clamp(32px, 5.5vw, 56px)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: 18,
            }}
          >
            Practice Smarter.
            <br />
            <span style={{ color: "var(--accent)" }}>Interview Better.</span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            variants={fadeUp}
            style={{
              fontSize: "clamp(14px, 2vw, 17px)",
              lineHeight: 1.65,
              color: "var(--text-secondary)",
              maxWidth: 620,
              margin: "0 auto 32px",
            }}
          >
            InterviewIQ simulates realistic interviews with AI, analyzes your responses, and gives you actionable
            feedback to help you prepare with confidence.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            variants={fadeUp}
            style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link to="/register" className="btn btn-primary btn-lg" style={{ minWidth: 180 }}>
              Start Practicing <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => scrollToSection("product-preview")}
              className="btn btn-secondary btn-lg"
              style={{ minWidth: 180 }}
            >
              Explore Demo
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── 3. Realistic Product Preview Visual ────────────────── */}
      <section
        id="product-preview"
        style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 16px 64px" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="demo-preview-card"
        >
          {/* Mock Header */}
          <div className="demo-preview-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "var(--success)",
                  boxShadow: "0 0 8px rgba(52, 211, 153, 0.4)",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                Live Session • Senior Full Stack Engineer
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 4,
                  backgroundColor: "var(--accent-soft)",
                  color: "var(--accent)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Round 2 of 3 (Technical)
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <Clock size={14} color="var(--accent)" /> 24:30 remaining
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--success)",
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={14} /> Trust Score 98%
              </div>
            </div>
          </div>

          {/* Mock Content Body */}
          <div className="demo-preview-grid">
            {/* Left: Interactive Q&A */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Question Bubble */}
              <div
                className="demo-bubble"
                style={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius)",
                    backgroundColor: "var(--accent-soft)",
                    border: "1px solid rgba(166, 124, 82, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={18} color="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", marginBottom: 4 }}>
                    AI Interviewer • Question 3 of 5
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)" }}>
                    "How would you handle database connection pooling in a distributed Node.js microservices architecture to prevent connection saturation during traffic spikes?"
                  </p>
                </div>
              </div>

              {/* Candidate Response Bubble */}
              <div
                className="demo-bubble"
                style={{
                  backgroundColor: "rgba(22, 33, 39, 0.8)",
                  border: "1px solid rgba(166, 124, 82, 0.2)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius)",
                    backgroundColor: "var(--coffee-soft)",
                    border: "1px solid var(--accent-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User size={18} color="var(--text-primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>
                    Your Response (Speech-to-Text)
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)" }}>
                    "I would place a centralized connection proxy like PgBouncer in transaction pooling mode between the microservice instances and the PostgreSQL cluster. Each replica maintains a small local pool, while PgBouncer handles client reuse and graceful queueing during spikes..."
                  </p>
                </div>
              </div>

              {/* Live Input Controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  backgroundColor: "var(--background)",
                  borderRadius: "var(--radius)",
                  border: "1px solid rgba(166, 124, 82, 0.25)",
                }}
              >
                <Mic size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Listening... Continue speaking or type answer
                </span>
                <span className="badge badge-ongoing" style={{ fontSize: 10, flexShrink: 0 }}>Active</span>
              </div>
            </div>

            {/* Right: Live Assessment Scores */}
            <div
              style={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "18px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Real-Time Analysis
              </div>

              {/* Metrics */}
              {[
                { label: "Technical Depth", score: 8.8, max: 10 },
                { label: "Communication Clarity", score: 9.2, max: 10 },
                { label: "Problem Solving", score: 8.5, max: 10 },
                { label: "Confidence", score: 9.0, max: 10 },
              ].map((m, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{m.label}</span>
                    <span style={{ color: "var(--accent)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                      {m.score}/{m.max}
                    </span>
                  </div>
                  <div style={{ height: 5, backgroundColor: "var(--surface)", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(m.score / m.max) * 100}%`,
                        backgroundColor: "var(--accent)",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}

              <div
                style={{
                  marginTop: "auto",
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: "var(--text-secondary)",
                }}
              >
                <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: 2 }}>
                  AI Feedback
                </strong>
                Strong architectural reasoning. Clear explanation of connection pooling tradeoffs.
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 4. Features Section ───────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 72px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Comprehensive Capabilities
          </div>
          <h2
            style={{
              fontSize: "clamp(22px, 3.5vw, 32px)",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Built for serious interview preparation
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="card"
              style={{
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "var(--radius)",
                  backgroundColor: "var(--accent-soft)",
                  border: "1px solid rgba(166, 124, 82, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <f.icon size={18} color="var(--accent)" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{f.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 5. How It Works Section ───────────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 72px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Workflow
          </div>
          <h2
            style={{
              fontSize: "clamp(22px, 3.5vw, 32px)",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            How InterviewIQ works
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {steps.map((st, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: "28px 24px",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: "var(--accent)",
                  opacity: 0.6,
                  fontFamily: "var(--font-mono)",
                  marginBottom: 10,
                }}
              >
                {st.step}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                {st.title}
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Bottom CTA Section ─────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 72px" }}>
        <div
          className="card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            backgroundColor: "var(--surface)",
            border: "1px solid rgba(166, 124, 82, 0.25)",
          }}
        >
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
            Ready to master your technical interviews?
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 14,
              maxWidth: 520,
              margin: "0 auto 28px",
              lineHeight: 1.6,
            }}
          >
            Join recruiters and candidates preparing with AI-powered assessment simulations today.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Practicing Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Official Responsive Footer ─────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img
              src="/logo.png"
              alt="InterviewIQ Logo"
              style={{
                height: 26,
                width: "auto",
                objectFit: "contain",
              }}
            />
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              © {new Date().getFullYear()} InterviewIQ. All rights reserved.
            </span>
          </div>

          <div className="footer-links">
            <Link to="/login" style={{ color: "var(--text-secondary)", textDecoration: "none", padding: "4px 8px" }}>
              Sign In
            </Link>
            <Link to="/register" style={{ color: "var(--text-secondary)", textDecoration: "none", padding: "4px 8px" }}>
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

