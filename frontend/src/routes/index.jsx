import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import PublicLayout from '../layouts/PublicLayout';

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
import AdminLogin from '../pages/admin/AdminLogin';
import Admin from '../pages/admin/Admin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminConsole from '../pages/admin/AdminConsole';
import AdminKyc from '../pages/admin/AdminKyc';
import AdminListings from '../pages/admin/AdminListings';
import AdminReports from '../pages/admin/AdminReports';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminUsers from '../pages/admin/AdminUsers';
import Activities from '../pages/customer/Activities';
import Wallet from '../pages/wallet/Wallet';
import Subscription from '../pages/subscription/Subscription';

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

        {/* ── Guarded Admin Console Routes (Unified inside AppLayout) ── */}
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
        <Route path="/admin/setting" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/admin/approvals" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

        {/* Fallback for authenticated users */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Route>

      {/* ── Admin Auth Routes (Public) ────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
