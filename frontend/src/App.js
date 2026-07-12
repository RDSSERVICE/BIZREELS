import "@/App.css";
import "@/lib/i18n";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/sonner";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/app/RequireAuth";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import VerifyOtp from "@/pages/VerifyOtp";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Browse from "@/pages/Browse";
import ListingDetail from "@/pages/ListingDetail";
import VendorDashboard from "@/pages/VendorDashboard";
import ListingForm from "@/pages/ListingForm";
import Feed from "@/pages/Feed";
import Explore from "@/pages/Explore";
import Search from "@/pages/Search";
import VendorProfile from "@/pages/VendorProfile";
import Saved from "@/pages/Saved";

function OnboardingGate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <HelmetProvider>
      <div className="App bg-black min-h-screen">
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/browse/:categorySlug" element={<Browse />} />
              <Route path="/listing/:slug" element={<ListingDetail />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/search" element={<Search />} />
              <Route path="/vendor/:vendorId" element={<VendorProfile />} />

              {/* Auth-gated */}
              <Route path="/onboarding" element={<OnboardingGate><Onboarding /></OnboardingGate>} />
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/saved" element={<RequireAuth><Saved /></RequireAuth>} />
              <Route path="/vendor/dashboard" element={<RequireAuth><VendorDashboard /></RequireAuth>} />
              <Route path="/vendor/listing/new" element={<RequireAuth><ListingForm /></RequireAuth>} />
              <Route path="/vendor/listing/:id/edit" element={<RequireAuth><ListingForm /></RequireAuth>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster theme="dark" position="top-center" richColors closeButton />
          </BrowserRouter>
        </AuthProvider>
      </div>
    </HelmetProvider>
  );
}

export default App;
