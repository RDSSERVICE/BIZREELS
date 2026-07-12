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
import Requirements from "@/pages/Requirements";
import RequirementNew from "@/pages/RequirementNew";
import RequirementDetail from "@/pages/RequirementDetail";
import ChatList from "@/pages/ChatList";
import ChatThread from "@/pages/ChatThread";
import Deals from "@/pages/Deals";
import Wallet from "@/pages/Wallet";
import Subscriptions from "@/pages/Subscriptions";
import Kyc from "@/pages/Kyc";
import Notifications from "@/pages/Notifications";
import AdminKyc from "@/pages/AdminKyc";
import Admin from "@/pages/Admin";
import AdminUsers from "@/pages/AdminUsers";
import AdminListings from "@/pages/AdminListings";
import AdminReports from "@/pages/AdminReports";
import VendorAnalytics from "@/pages/VendorAnalytics";

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
              <Route path="/requirements" element={<Requirements />} />
              <Route path="/requirements/:id" element={<RequirementDetail />} />

              {/* Auth-gated */}
              <Route path="/onboarding" element={<OnboardingGate><Onboarding /></OnboardingGate>} />
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/saved" element={<RequireAuth><Saved /></RequireAuth>} />
              <Route path="/requirements/new" element={<RequireAuth><RequirementNew /></RequireAuth>} />
              <Route path="/chat" element={<RequireAuth><ChatList /></RequireAuth>} />
              <Route path="/chat/:threadId" element={<RequireAuth><ChatThread /></RequireAuth>} />
              <Route path="/deals" element={<RequireAuth><Deals /></RequireAuth>} />
              <Route path="/wallet" element={<RequireAuth><Wallet /></RequireAuth>} />
              <Route path="/subscriptions" element={<RequireAuth><Subscriptions /></RequireAuth>} />
              <Route path="/kyc" element={<RequireAuth><Kyc /></RequireAuth>} />
              <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
              <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
              <Route path="/admin/kyc" element={<RequireAuth><AdminKyc /></RequireAuth>} />
              <Route path="/admin/users" element={<RequireAuth><AdminUsers /></RequireAuth>} />
              <Route path="/admin/listings" element={<RequireAuth><AdminListings /></RequireAuth>} />
              <Route path="/admin/reports" element={<RequireAuth><AdminReports /></RequireAuth>} />
              <Route path="/vendor/analytics" element={<RequireAuth><VendorAnalytics /></RequireAuth>} />
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
