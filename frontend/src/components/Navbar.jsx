import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, Users, PlusCircle, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(22, 33, 39, 0.96)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* Official Logo */}
        <Link
          to={user?.role === "recruiter" ? "/dashboard" : user ? "/candidate-dashboard" : "/"}
          onClick={() => setMobileMenuOpen(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <img
            src="/logo.png"
            alt="InterviewIQ Logo"
            style={{
              height: 30,
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </Link>

        {/* Desktop Navigation Links */}
        {user && (
          <div className="desktop-only" style={{ alignItems: "center", gap: "16px" }}>
            {user.role === "recruiter" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link
                  to="/dashboard"
                  className={`btn btn-sm ${isActive("/dashboard") ? "btn-primary" : "btn-secondary"}`}
                >
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <Link
                  to="/candidates"
                  className={`btn btn-sm ${isActive("/candidates") ? "btn-primary" : "btn-secondary"}`}
                >
                  <Users size={15} /> Candidates
                </Link>
                <Link to="/create-session" className="btn btn-secondary btn-sm">
                  <PlusCircle size={15} /> Create Session
                </Link>
              </div>
            )}

            {/* User Profile Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "5px 12px",
                borderRadius: "var(--radius)",
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--accent-soft)",
                  border: "1px solid rgba(166, 124, 82, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--accent)",
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  {user.role}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              style={{ padding: "8px" }}
              title="Log Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        {/* Mobile Navigation Toggle */}
        {user && (
          <div className="mobile-only" style={{ alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--accent-soft)",
                border: "1px solid rgba(166, 124, 82, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-secondary btn-sm"
              style={{ padding: "8px", borderRadius: "var(--radius)" }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Drawer Dropdown */}
      <AnimatePresence>
        {user && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              backgroundColor: "var(--surface)",
              borderTop: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* User Details */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                backgroundColor: "var(--background)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--accent-soft)",
                  border: "1px solid rgba(166, 124, 82, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--accent)",
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>
                  {user.role} • {user.email}
                </div>
              </div>
            </div>

            {/* Recruiter Routes */}
            {user.role === "recruiter" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`btn ${isActive("/dashboard") ? "btn-primary" : "btn-secondary"}`}
                  style={{ justifyContent: "flex-start", width: "100%", padding: "10px 14px" }}
                >
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link
                  to="/candidates"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`btn ${isActive("/candidates") ? "btn-primary" : "btn-secondary"}`}
                  style={{ justifyContent: "flex-start", width: "100%", padding: "10px 14px" }}
                >
                  <Users size={16} /> Candidates
                </Link>
                <Link
                  to="/create-session"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`btn ${isActive("/create-session") ? "btn-primary" : "btn-secondary"}`}
                  style={{ justifyContent: "flex-start", width: "100%", padding: "10px 14px" }}
                >
                  <PlusCircle size={16} /> Create Session
                </Link>
              </div>
            )}

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="btn btn-danger"
              style={{ width: "100%", marginTop: 4, justifyContent: "center" }}
            >
              <LogOut size={16} /> Log Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
