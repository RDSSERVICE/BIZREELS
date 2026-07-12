import "@/App.css";
import "@/lib/i18n";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/app/RequireAuth";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import VerifyOtp from "@/pages/VerifyOtp";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";

function OnboardingGate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <div className="App bg-black min-h-screen">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route
              path="/onboarding"
              element={
                <OnboardingGate>
                  <Onboarding />
                </OnboardingGate>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            theme="dark"
            position="top-center"
            richColors
            closeButton
          />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
