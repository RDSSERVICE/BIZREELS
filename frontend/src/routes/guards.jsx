import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectActiveRole,
  selectAuthLoading,
  selectCurrentUser
} from '../features/auth/authSlice';
import { getRoleDashboard, getRoleOnboarding, isOnboardingComplete } from '../lib/roleNav';
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
 * If user has the role but hasn't completed onboarding, redirect to onboarding.
 */
export const RoleRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const activeRole = useSelector(selectActiveRole);
  const user = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectAuthLoading);
  const location = useLocation();

  if (isLoading) {
    return <Loader fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const userRoles = user?.roles || [];
  if (userRoles.includes('admin') || activeRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Check if user has permission for the required role
  const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role) || activeRole === role);

  if (!hasAllowedRole) {
    // If user does not have the role yet, navigate to onboarding to become one
    const targetRole = allowedRoles[0];
    if (targetRole === 'vendor') return <Navigate to="/vendor/onboarding" replace />;
    if (targetRole === 'creator') return <Navigate to="/creator/onboarding" replace />;
    return <Navigate to="/customer/home" replace />;
  }

  // User has the role — check if onboarding is complete
  const matchedRole = allowedRoles.find(role => userRoles.includes(role)) || activeRole || 'customer';
  if (!isOnboardingComplete(user, matchedRole)) {
    const onboardingPath = getRoleOnboarding(matchedRole);
    if (!location.pathname.startsWith(onboardingPath)) {
      return <Navigate to={onboardingPath} replace />;
    }
  }

  return children;
};

/**
 * Guard for onboarding pages (e.g., /vendor/onboarding, /creator/onboarding).
 * Requires authentication but does NOT require a specific role.
 * If user already completed onboarding for the target role, redirect to dashboard.
 */
export const OnboardingRoute = ({ children, targetRole }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectAuthLoading);
  const location = useLocation();

  if (isLoading) {
    return <Loader fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If user already has the role OR completed onboarding, send directly to dashboard
  const userRoles = user?.roles || [];
  if (userRoles.includes(targetRole) || isOnboardingComplete(user, targetRole)) {
    return <Navigate to={getRoleDashboard(targetRole)} replace />;
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
    return <Navigate to={getRoleDashboard(activeRole)} replace />;
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
