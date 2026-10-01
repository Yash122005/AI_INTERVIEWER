import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, Users, PlusCircle } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 28px",
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Official Logo */}
      <Link
        to={user?.role === "recruiter" ? "/dashboard" : user ? "/candidate-dashboard" : "/"}
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
            height: 32,
            width: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
      </Link>

      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
    </nav>
  );
}
