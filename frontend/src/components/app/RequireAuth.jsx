import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black" data-testid="auth-loading">
        <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-pink-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.name) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
