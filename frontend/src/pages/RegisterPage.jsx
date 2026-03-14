import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserPlus, Mail, Lock, User, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("recruiter");
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const user = await loginWithGoogle(credentialResponse.credential, role);
      toast.success(`Welcome, ${user.name}!`);
      navigate(user.role === "recruiter" ? "/dashboard" : "/");
    } catch (err) {
      toast.error("Google registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const user = await register(name, email, password, role);
      toast.success(`Welcome, ${user.name}!`);
      navigate(user.role === "recruiter" ? "/dashboard" : "/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
      background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(108, 99, 255, 0.08) 0%, transparent 60%)",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card"
        style={{ width: "100%", maxWidth: 440, padding: "40px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
            background: "var(--accent-gradient)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Create Account
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 14 }}>
            Join InterviewIQ as a Recruiter or Candidate
          </p>
        </div>

        {/* Role Toggle */}
        <div style={{
          display: "flex", borderRadius: 12, overflow: "hidden",
          border: "1px solid var(--border-color)", marginBottom: 24,
        }}>
          {["recruiter", "candidate"].map((r) => (
            <button key={r} onClick={() => setRole(r)} type="button" style={{
              flex: 1, padding: "12px", border: "none", cursor: "pointer",
              fontFamily: "'Inter'", fontWeight: 600, fontSize: 14,
              background: role === r ? "var(--accent-primary)" : "transparent",
              color: role === r ? "#fff" : "var(--text-secondary)",
              transition: "all 0.3s ease", textTransform: "capitalize",
            }}>
              {r === "recruiter" ? "👔 Recruiter" : "🎓 Candidate"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="input-group">
            <label>Full Name</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: 14, top: 13, color: "var(--text-muted)" }} />
              <input className="input-field" type="text" placeholder="John Doe"
                value={name} onChange={(e) => setName(e.target.value)} required
                style={{ width: "100%", paddingLeft: 42 }} />
            </div>
          </div>
          <div className="input-group">
            <label>Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: 14, top: 13, color: "var(--text-muted)" }} />
              <input className="input-field" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required
                style={{ width: "100%", paddingLeft: 42 }} />
            </div>
          </div>
          <div className="input-group">
            <label>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: 14, top: 13, color: "var(--text-muted)" }} />
              <input className="input-field" type="password" placeholder="Min. 6 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} required
                style={{ width: "100%", paddingLeft: 42 }} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
            {loading ? <div className="spinner" /> : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "24px 0", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Or continue with</span>
          <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google Sign-up failed")}
            useOneTap
            theme="filled_blue"
            shape="pill"
            width="100%"
            text="signup_with"
          />
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
