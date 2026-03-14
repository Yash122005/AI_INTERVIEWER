import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import CreateSessionPage from "./pages/CreateSessionPage";
import InterviewPage from "./pages/InterviewPage";
import CandidateSummary from "./pages/CandidateSummary";
import SessionReport from "./pages/SessionReport";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: "var(--text-secondary)" }}>Loading InterviewIQ...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === "recruiter" ? "/dashboard" : "/"} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={user.role === "recruiter" ? "/dashboard" : "/"} /> : <RegisterPage />} />

      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="recruiter"><RecruiterDashboard /></ProtectedRoute>
      } />
      <Route path="/create-session" element={
        <ProtectedRoute requiredRole="recruiter"><CreateSessionPage /></ProtectedRoute>
      } />
      <Route path="/report/:sessionId" element={
        <ProtectedRoute requiredRole="recruiter"><SessionReport /></ProtectedRoute>
      } />

      <Route path="/interview/:token" element={<InterviewPage />} />
      <Route path="/summary/:sessionId" element={<CandidateSummary />} />

      <Route path="/" element={
        !user ? (
          <Navigate to="/login" />
        ) : user.role === "recruiter" ? (
          <Navigate to="/dashboard" />
        ) : (
          <div className="page-container" style={{ textAlign: "center", marginTop: "100px" }}>
            <h1 style={{ fontSize: "32px", marginBottom: "16px", background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Welcome, {user.name}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "18px" }}>
              Please use the interview link provided by your recruiter to start your session.
            </p>
          </div>
        )
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1A1A2E",
              color: "#E2E8F0",
              border: "1px solid rgba(108, 99, 255, 0.2)",
              borderRadius: "12px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
