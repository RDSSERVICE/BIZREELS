import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectActiveRole,
  selectAuthLoading,
  selectCurrentUser
} from '../features/auth/authSlice';
import Loader from '../components/common/Loader';

/**
 * Guard for authenticated-only routes.
 */
export const PrivateRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const location = useLocation();

  if (isLoading) {
    return <Loader fullPage />;
  }

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/auth/login" state={{ from: location }} replace />
  );
};

/**
 * Guard for matching specific role access.
 * e.g., only vendor roles can access vendor/dashboard.
 */
export const RoleRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const activeRole = useSelector(selectActiveRole);
  const user = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) {
    return <Loader fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const userRoles = user?.roles || [];
  if (userRoles.includes('admin') || activeRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const hasAllowedRole = allowedRoles.some(r => r === activeRole || userRoles.includes(r));

  if (!hasAllowedRole) {
    if (userRoles.includes('vendor')) {
      return <Navigate to="/vendor/dashboard" replace />;
    }
    if (userRoles.includes('creator')) {
      return <Navigate to="/creator/dashboard" replace />;
    }
    return <Navigate to="/customer/home" replace />;
  }

  return children;
};

/**
 * Guard for auth pages (login/register) to prevent logged-in users from re-visiting.
 */
export const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const activeRole = useSelector(selectActiveRole);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) {
    return <Loader fullPage />;
  }

  if (isAuthenticated) {
    if (activeRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (activeRole === 'vendor' || activeRole === 'creator') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/feed" replace />;
  }


  return children;
};

/**
 * Guard for admin-only routes.
 * Redirects to /admin if not authenticated or not an admin.
 */
export const RequireAdmin = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) {
    return <Loader fullPage />;
  }

  if (!isAuthenticated || !(user?.roles || []).includes('admin')) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};
