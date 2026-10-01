import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const user = await loginWithGoogle(credentialResponse.credential);
      toast.success(`Welcome, ${user.name}!`);
      navigate(user.role === "recruiter" ? "/dashboard" : "/candidate-dashboard");
    } catch (err) {
      toast.error("Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === "recruiter" ? "/dashboard" : "/candidate-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
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
        style={{ width: "100%", maxWidth: 420, padding: "36px 32px" }}
      >
        {/* Official Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
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
            Welcome Back
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 13 }}>
            Sign in to continue to InterviewIQ
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
                placeholder="••••••••"
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
            {loading ? <div className="spinner" /> : <><LogIn size={16} /> Sign In</>}
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
            onError={() => toast.error("Google Login failed")}
            useOneTap
            theme="filled_black"
            shape="rectangular"
            width="100%"
          />
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
          >
            Create Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
