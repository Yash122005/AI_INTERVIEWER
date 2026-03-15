import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Zap, LayoutDashboard, Users } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 32px",
      background: "rgba(10, 10, 26, 0.9)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border-color)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <Link to={user?.role === "recruiter" ? "/dashboard" : "/"} style={{
        display: "flex", alignItems: "center", gap: "10px",
        textDecoration: "none", color: "inherit",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "var(--accent-gradient)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Zap size={20} color="#fff" />
        </div>
        <span style={{
          fontSize: 20, fontWeight: 800,
          background: "var(--accent-gradient)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>InterviewIQ</span>
      </Link>

      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {user.role === "recruiter" && (
            <>
              <Link to="/dashboard" className="btn btn-secondary btn-sm">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/candidates" className="btn btn-secondary btn-sm">
                <Users size={16} /> Candidates
              </Link>
            </>
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "6px 14px", borderRadius: 10,
            background: "rgba(108, 99, 255, 0.1)", border: "1px solid var(--border-color)",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "var(--accent-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
            }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>
                {user.role}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ padding: "8px" }}>
            <LogOut size={16} />
          </button>
        </div>
      )}
    </nav>
  );
}
