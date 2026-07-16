import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';

// Guards
import { PrivateRoute, RoleRoute, PublicRoute } from './guards';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import AuthCallback from '../pages/AuthCallback';
import Feed from '../pages/Feed';
import Search from '../pages/Search';
import RequirementsNew from '../pages/RequirementsNew';
import VendorDashboard from '../pages/VendorDashboard';
import CreatorDashboard from '../pages/CreatorDashboard';
import Profile from '../pages/Profile';
import ReelsFeed from '../pages/ReelsFeed';
import ReelsUpload from '../pages/ReelsUpload';
import Chats from '../pages/Chats';
import Notifications from '../pages/Notifications';
import CreatorMarketplace from '../pages/CreatorMarketplace';
import LiveStream from '../pages/LiveStream';
import AdminDashboard from '../pages/AdminDashboard';

const AppRoutes = () => {
  return (
    <Routes>
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
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        {/* Redirect base path to feed */}
        <Route index element={<Navigate to="/feed" replace />} />
        
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

        {/* Vendor Protected Area */}
        <Route
          path="vendor/dashboard"
          element={
            <RoleRoute allowedRoles={['vendor', 'admin']}>
              <VendorDashboard />
            </RoleRoute>
          }
        />

        {/* Creator Protected Area */}
        <Route
          path="creator/dashboard"
          element={
            <RoleRoute allowedRoles={['creator', 'admin']}>
              <CreatorDashboard />
            </RoleRoute>
          }
        />

        {/* Admin Protected Area */}
        <Route
          path="admin/dashboard"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />

        {/* Fallback for authenticated users */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
