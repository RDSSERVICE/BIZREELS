import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../pages/admin/AdminLayout';

// Guards
import { PrivateRoute, RoleRoute, PublicRoute, RequireAdmin } from './guards';

// Pages
import Home from '../pages/home/Home';
import About from '../pages/home/About';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import AuthCallback from '../pages/auth/AuthCallback';
import Feed from '../pages/reels/Feed';
import Search from '../pages/search/Search';
import RequirementsNew from '../pages/customer/RequirementsNew';
import VendorDashboard from '../pages/vendor/VendorDashboard';
import CreatorDashboard from '../pages/creator/CreatorDashboard';
import DashboardRouter from '../pages/customer/DashboardRouter';
import Profile from '../pages/customer/Profile';
import ReelsFeed from '../pages/reels/ReelsFeed';
import ReelsUpload from '../pages/reels/ReelsUpload';
import Chats from '../pages/chat/Chats';
import Notifications from '../pages/customer/Notifications';
import CreatorMarketplace from '../pages/creator/CreatorMarketplace';
import LiveStream from '../pages/reels/LiveStream';
import Settings from '../pages/settings/Settings';
import Activities from '../pages/customer/Activities';
import Wallet from '../pages/wallet/Wallet';
import Subscription from '../pages/subscription/Subscription';

// Admin Pages
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminConsole from '../pages/admin/AdminConsole';
import AdminKycPage from '../pages/admin/kyc/AdminKycPage';
import AdminListingsPage from '../pages/admin/listings/AdminListingsPage';
import AdminReelsPage from '../pages/admin/reels/AdminReelsPage';
import AdminBoostPage from '../pages/admin/boost/AdminBoostPage';
import AdminCategoriesPage from '../pages/admin/categories/AdminCategoriesPage';
import AdminLocationsPage from '../pages/admin/locations/AdminLocationsPage';
import AdminRequirementsPage from '../pages/admin/requirements/AdminRequirementsPage';
import AdminChatPage from '../pages/admin/chat/AdminChatPage';
import AdminOrdersPage from '../pages/admin/orders/AdminOrdersPage';
import AdminWalletPage from '../pages/admin/wallet/AdminWalletPage';
import AdminSubscriptionsPage from '../pages/admin/subscriptions/AdminSubscriptionsPage';
import AdminReviewsPage from '../pages/admin/reviews/AdminReviewsPage';
import AdminAnalyticsPage from '../pages/admin/analytics/AdminAnalyticsPage';
import AdminAiPage from '../pages/admin/ai/AdminAiPage';
import AdminNotificationsPage from '../pages/admin/notifications/AdminNotificationsPage';
import AdminOffersPage from '../pages/admin/offers/AdminOffersPage';
import AdminCommissionPage from '../pages/admin/commission/AdminCommissionPage';
import AdminCmsPage from '../pages/admin/cms/AdminCmsPage';
import AdminAppSettingsPage from '../pages/admin/app-settings/AdminAppSettingsPage';
import AdminSecurityPage from '../pages/admin/security/AdminSecurityPage';
import AdminAuditPage from '../pages/admin/audit/AdminAuditPage';
import AdminModerationPage from '../pages/admin/moderation/AdminModerationPage';
import AdminFinancialReportsPage from '../pages/admin/reports/AdminFinancialReportsPage';
import AdminReports from '../pages/admin/AdminReports';



import AdminSettings from '../pages/admin/AdminSettings';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminCustomers from '../pages/admin/users/AdminCustomers';
import AdminVendors from '../pages/admin/users/AdminVendors';
import AdminCreators from '../pages/admin/users/AdminCreators';
import AdminComingSoon from '../pages/admin/AdminComingSoon';


const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Public Website Routes ─────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Route>

      {/* ── Public Auth Routes ────────────────────────────────── */}
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="callback" element={<AuthCallback />} />
        <Route path="" element={<Navigate to="login" replace />} />
      </Route>

      {/* ── Protected Core Application Routes ─────────────────── */}
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        {/* Customer / Main Viewport */}
        <Route path="feed" element={<Feed />} />
        <Route path="search" element={<Search />} />
        <Route path="reels" element={<ReelsFeed />} />
        <Route
          path="reels/upload"
          element={
            <RoleRoute allowedRoles={['vendor', 'creator', 'admin']}>
              <ReelsUpload />
            </RoleRoute>
          }
        />
        <Route path="requirements/new" element={<RequirementsNew />} />
        <Route path="chats" element={<Chats />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="creator/marketplace" element={<CreatorMarketplace />} />
        <Route path="live" element={<LiveStream />} />
        <Route path="profile/:id" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="activities" element={<Activities />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="subscription" element={<Subscription />} />

        {/* Unified Dashboard Router */}
        <Route path="dashboard" element={<DashboardRouter />} />

        {/* Redirect Legacy Dashboard Routes */}
        <Route path="vendor/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="creator/dashboard" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback for authenticated users */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Route>

      {/* ── Admin Auth Routes (Public) ────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
      </Route>

      {/* ── Admin Panel Routes (Dedicated Admin Layout) ───────── */}
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        {/* Overview */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* User Management */}
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/vendors" element={<AdminVendors />} />
        <Route path="/admin/creators" element={<AdminCreators />} />
        <Route path="/admin/users" element={<AdminUsers />} />

        {/* KYC & Verification */}
        <Route path="/admin/kyc" element={<AdminKycPage />} />

        {/* Content Management */}
        <Route path="/admin/listings" element={<AdminListingsPage />} />
        <Route path="/admin/reels" element={<AdminReelsPage />} />
        <Route path="/admin/boost" element={<AdminBoostPage />} />
        <Route path="/admin/categories" element={<AdminCategoriesPage />} />

        {/* Operations */}
        <Route path="/admin/locations" element={<AdminLocationsPage />} />
        <Route path="/admin/requirements" element={<AdminRequirementsPage />} />
        <Route path="/admin/chat" element={<AdminChatPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />

        {/* Finance */}
        <Route path="/admin/wallet" element={<AdminWalletPage />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
        <Route path="/admin/commission" element={<AdminCommissionPage />} />

        {/* Engagement */}
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/ai" element={<AdminAiPage />} />
        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
        <Route path="/admin/offers" element={<AdminOffersPage />} />


        {/* Moderation */}
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/moderation" element={<AdminModerationPage />} />

        {/* System */}
        <Route path="/admin/cms" element={<AdminCmsPage />} />
        <Route path="/admin/app-settings" element={<AdminAppSettingsPage />} />
        <Route path="/admin/security" element={<AdminSecurityPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
        <Route path="/admin/financial-reports" element={<AdminFinancialReportsPage />} />


        {/* Legacy routes — redirect to new paths */}
        <Route path="/admin/console" element={<AdminConsole />} />
        <Route path="/admin/transactions" element={<AdminConsole />} />
        <Route path="/admin/commissions" element={<AdminConsole />} />
        <Route path="/admin/audit-log" element={<AdminConsole />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/setting" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/admin/approvals" element={<AdminComingSoon />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
