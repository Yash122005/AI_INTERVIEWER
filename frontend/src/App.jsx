import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import CreateSessionPage from "./pages/CreateSessionPage";
import InterviewPage from "./pages/InterviewPage";
import CandidateSummary from "./pages/CandidateSummary";
import SessionReport from "./pages/SessionReport";
import CandidateDashboard from "./pages/CandidateDashboard";
import CandidatesPage from "./pages/CandidatesPage";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Loading InterviewIQ...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Default Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Authentication */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={user.role === "recruiter" ? "/dashboard" : "/candidate-dashboard"} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to={user.role === "recruiter" ? "/dashboard" : "/candidate-dashboard"} replace />
          ) : (
            <RegisterPage />
          )
        }
      />

      {/* Recruiter Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="recruiter">
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-session"
        element={
          <ProtectedRoute requiredRole="recruiter">
            <CreateSessionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report/:sessionId"
        element={
          <ProtectedRoute requiredRole="recruiter">
            <SessionReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidates"
        element={
          <ProtectedRoute requiredRole="recruiter">
            <CandidatesPage />
          </ProtectedRoute>
        }
      />

      {/* Candidate and Interview Routes */}
      <Route path="/interview/:token" element={<InterviewPage />} />
      <Route path="/summary/:sessionId" element={<CandidateSummary />} />
      <Route
        path="/candidate-dashboard"
        element={
          <ProtectedRoute requiredRole="candidate">
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
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
              background: "#162127",
              color: "#D7B899",
              border: "1px solid rgba(166, 124, 82, 0.25)",
              borderRadius: "10px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            },
            success: {
              iconTheme: {
                primary: "#A67C52",
                secondary: "#0C1519",
              },
            },
            error: {
              iconTheme: {
                primary: "#F87171",
                secondary: "#0C1519",
              },
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
