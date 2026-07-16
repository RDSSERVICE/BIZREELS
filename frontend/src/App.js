import "@/App.css";
import "@/lib/i18n";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/sonner";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/app/RequireAuth";

// User / Shared Pages
import Landing from "@/pages/user/Landing";
import Login from "@/pages/user/Login";
import AuthCallback from "@/pages/user/AuthCallback";
import VerifyOtp from "@/pages/user/VerifyOtp";
import Onboarding from "@/pages/user/Onboarding";
import Dashboard from "@/pages/user/Dashboard";
import Profile from "@/pages/user/Profile";
import Browse from "@/pages/user/Browse";
import ListingDetail from "@/pages/user/ListingDetail";
import Feed from "@/pages/user/Feed";
import Explore from "@/pages/user/Explore";
import Search from "@/pages/user/Search";
import Saved from "@/pages/user/Saved";
import Requirements from "@/pages/user/Requirements";
import RequirementNew from "@/pages/user/RequirementNew";
import RequirementDetail from "@/pages/user/RequirementDetail";
import ChatList from "@/pages/user/ChatList";
import ChatThread from "@/pages/user/ChatThread";
import Deals from "@/pages/user/Deals";
import Wallet from "@/pages/user/Wallet";
import Subscriptions from "@/pages/user/Subscriptions";
import Kyc from "@/pages/user/Kyc";
import Notifications from "@/pages/user/Notifications";
import KycVerify from "@/pages/user/KycVerify";
import CreatorDashboard from "@/pages/user/CreatorDashboard";
import ProfileComplete from "@/pages/user/ProfileComplete";
import NotFound from "@/pages/user/NotFound";

// Vendor Pages
import VendorDashboard from "@/pages/vendor/VendorDashboard";
import VendorProfile from "@/pages/vendor/VendorProfile";
import ListingForm from "@/pages/vendor/ListingForm";
import VendorAnalytics from "@/pages/vendor/VendorAnalytics";

// Admin Pages
import Admin from "@/pages/admin/Admin";
import AdminConsole from "@/pages/admin/AdminConsole";
import AdminKyc from "@/pages/admin/AdminKyc";
import AdminListings from "@/pages/admin/AdminListings";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminOtpLogin from "@/pages/admin/AdminOtpLogin";
import AdminReports from "@/pages/admin/AdminReports";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminUsers from "@/pages/admin/AdminUsers";

// Shared Layout Elements
import CartDrawer from "@/components/app/CartDrawer";
import ErrorBoundary from "@/components/app/ErrorBoundary";

function OnboardingGate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Phase 7e (CHANGE 1): admin routes are guarded here. Non-admins get bounced
// to the phone-OTP admin login at `/admin`, NOT to the regular `/login`.
function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/admin" replace />;
  if (!(user.roles || []).includes("admin")) return <Navigate to="/admin" replace />;
  return children;
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
      <div className="App bg-black min-h-screen">
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
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
              <Route path="/admin" element={<AdminOtpLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<RequireAdmin><Admin /></RequireAdmin>} />
              <Route path="/admin/console" element={<RequireAdmin><AdminConsole /></RequireAdmin>} />
              <Route path="/admin/transactions" element={<RequireAdmin><AdminConsole /></RequireAdmin>} />
              <Route path="/admin/orders" element={<RequireAdmin><AdminConsole /></RequireAdmin>} />
              <Route path="/admin/commissions" element={<RequireAdmin><AdminConsole /></RequireAdmin>} />
              <Route path="/admin/audit-log" element={<RequireAdmin><AdminConsole /></RequireAdmin>} />
              <Route path="/admin/kyc" element={<RequireAdmin><AdminKyc /></RequireAdmin>} />
              <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
              <Route path="/admin/listings" element={<RequireAdmin><AdminListings /></RequireAdmin>} />
              <Route path="/admin/reports" element={<RequireAdmin><AdminReports /></RequireAdmin>} />
              <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />
              <Route path="/kyc/verify" element={<RequireAuth><KycVerify /></RequireAuth>} />
              <Route path="/creator/dashboard" element={<RequireAuth><CreatorDashboard /></RequireAuth>} />
              <Route path="/profile/complete" element={<RequireAuth><ProfileComplete /></RequireAuth>} />
              <Route path="/vendor/analytics" element={<RequireAuth><VendorAnalytics /></RequireAuth>} />
              <Route path="/vendor/dashboard" element={<RequireAuth><VendorDashboard /></RequireAuth>} />
              <Route path="/vendor/listing/new" element={<RequireAuth><ListingForm /></RequireAuth>} />
              <Route path="/vendor/listing/:id/edit" element={<RequireAuth><ListingForm /></RequireAuth>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            <CartDrawer />
            <Toaster theme="dark" position="top-center" richColors closeButton />
          </BrowserRouter>
        </AuthProvider>
      </div>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
