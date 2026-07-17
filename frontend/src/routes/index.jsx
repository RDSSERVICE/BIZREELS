import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import PublicLayout from '../layouts/PublicLayout';

// Guards
import { PrivateRoute, RoleRoute, PublicRoute } from './guards';

// Pages
import Home from '../pages/Home';
import About from '../pages/About';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import AuthCallback from '../pages/AuthCallback';
import Feed from '../pages/Feed';
import Search from '../pages/Search';
import RequirementsNew from '../pages/RequirementsNew';
import VendorDashboard from '../pages/VendorDashboard';
import CreatorDashboard from '../pages/CreatorDashboard';
import DashboardRouter from '../pages/DashboardRouter';
import Profile from '../pages/Profile';
import ReelsFeed from '../pages/ReelsFeed';
import ReelsUpload from '../pages/ReelsUpload';
import Chats from '../pages/Chats';
import Notifications from '../pages/Notifications';
import CreatorMarketplace from '../pages/CreatorMarketplace';
import LiveStream from '../pages/LiveStream';
import AdminDashboard from '../pages/AdminDashboard';
import Settings from '../pages/Settings';
import Activities from '../pages/Activities';
import Wallet from '../pages/Wallet';
import Subscription from '../pages/Subscription';

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
        <Route path="admin" element={<Navigate to="/dashboard" replace />} />
        <Route path="admin/dashboard" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback for authenticated users */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
