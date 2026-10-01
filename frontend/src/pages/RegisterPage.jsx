import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserPlus, Mail, Lock, User } from "lucide-react";
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
      navigate(user.role === "recruiter" ? "/dashboard" : "/candidate-dashboard");
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
      navigate(user.role === "recruiter" ? "/dashboard" : "/candidate-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
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
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="card"
        style={{ width: "100%", maxWidth: 440, padding: "36px 32px" }}
      >
        {/* Official Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link to="/" style={{ display: "inline-block", marginBottom: 16 }}>
            <img
              src="/logo.png"
              alt="InterviewIQ Logo"
              style={{
                height: 42,
                width: "auto",
                objectFit: "contain",
                margin: "0 auto",
                display: "block",
              }}
            />
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Create Account
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 13 }}>
            Join InterviewIQ to practice or recruit
          </p>
        </div>

        {/* Role Toggle */}
        <div
          style={{
            display: "flex",
            borderRadius: "var(--radius)",
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            padding: 3,
            marginBottom: 20,
          }}
        >
          {["recruiter", "candidate"].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              type="button"
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: 13,
                backgroundColor: role === r ? "var(--accent)" : "transparent",
                color: role === r ? "#0C1519" : "var(--text-secondary)",
                transition: "var(--transition)",
                textTransform: "capitalize",
              }}
            >
              {r === "recruiter" ? "👔 Recruiter" : "🎓 Candidate"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="input-group">
            <label>Full Name</label>
            <div style={{ position: "relative" }}>
              <User
                size={16}
                style={{
                  position: "absolute",
                  left: 14,
                  top: 13,
                  color: "var(--text-muted)",
                }}
              />
              <input
                className="input-field"
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: "100%", paddingLeft: 40 }}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: 14,
                  top: 13,
                  color: "var(--text-muted)",
                }}
              />
              <input
                className="input-field"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", paddingLeft: 40 }}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: 14,
                  top: 13,
                  color: "var(--text-muted)",
                }}
              />
              <input
                className="input-field"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", paddingLeft: 40 }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: "100%", marginTop: 6 }}
          >
            {loading ? <div className="spinner" /> : <><UserPlus size={16} /> Create Account</>}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "22px 0", gap: 12 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Or continue with
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google Sign-up failed")}
            useOneTap
            theme="filled_black"
            shape="rectangular"
            width="100%"
            text="signup_with"
          />
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
