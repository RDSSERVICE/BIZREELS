import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../pages/admin/AdminLayout';
import CustomerLayout from '../pages/customer/CustomerLayout';
import VendorLayout from '../pages/vendor/VendorLayout';
import CreatorLayout from '../pages/creator/CreatorLayout';

// Guards
import { PrivateRoute, RoleRoute, PublicRoute, RequireAdmin } from './guards';

// Public & Auth Pages
import Home from '../pages/home/Home';
import About from '../pages/home/About';
import PublicLocalReelsPage from '../pages/reels/PublicLocalReelsPage';
import PublicCreatorMarketplacePage from '../pages/creator/PublicCreatorMarketplacePage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import AuthCallback from '../pages/auth/AuthCallback';

// Customer Pages
import CustomerHomePage from '../pages/customer/home/CustomerHomePage';
import PostRequirementPage from '../pages/customer/requirements/PostRequirementPage';
import MyRequirementsPage from '../pages/customer/requirements/MyRequirementsPage';
import SearchListingsPage from '../pages/customer/search/SearchListingsPage';
import CustomerActivitiesPage from '../pages/customer/activities/CustomerActivitiesPage';
import CustomerNotificationsPage from '../pages/customer/notifications/CustomerNotificationsPage';
import CustomerChatPage from '../pages/customer/chat/CustomerChatPage';
import CustomerSettingsPage from '../pages/customer/settings/CustomerSettingsPage';
import BecomeVendorPage from '../pages/customer/become-vendor/BecomeVendorPage';
import BecomeCreatorPage from '../pages/customer/become-creator/BecomeCreatorPage';

// Vendor Pages
import VendorDashboardPage from '../pages/vendor/dashboard/VendorDashboardPage';
import VendorBusinessProfilePage from '../pages/vendor/profile/VendorBusinessProfilePage';
import VendorListingsPage from '../pages/vendor/listings/VendorListingsPage';
import VendorReelsPage from '../pages/vendor/reels/VendorReelsPage';
import VendorReelBoostPage from '../pages/vendor/boost/VendorReelBoostPage';
import VendorLeadsPage from '../pages/vendor/leads/VendorLeadsPage';
import VendorOrdersPage from '../pages/vendor/orders/VendorOrdersPage';
import VendorAnalyticsPage from '../pages/vendor/analytics/VendorAnalyticsPage';
import VendorSubscriptionPage from '../pages/vendor/subscription/VendorSubscriptionPage';
import VendorWalletPage from '../pages/vendor/wallet/VendorWalletPage';
import VendorReviewsPage from '../pages/vendor/reviews/VendorReviewsPage';
import VendorSettingsPage from '../pages/vendor/settings/VendorSettingsPage';
import VendorHireCreatorPage from '../pages/vendor/hire-creator/VendorHireCreatorPage';

// Creator Pages
import CreatorDashboardPage from '../pages/creator/dashboard/CreatorDashboardPage';
import CreatorProfilePage from '../pages/creator/profile/CreatorProfilePage';
import CreatorPortfolioPage from '../pages/creator/portfolio/CreatorPortfolioPage';
import CreatorPricingPage from '../pages/creator/pricing/CreatorPricingPage';
import CreatorAvailabilityPage from '../pages/creator/availability/CreatorAvailabilityPage';
import CreatorSubscriptionPage from '../pages/creator/subscription/CreatorSubscriptionPage';
import CreatorWalletPage from '../pages/creator/wallet/CreatorWalletPage';
import CreatorOrdersPage from '../pages/creator/orders/CreatorOrdersPage';
import CreatorReviewsPage from '../pages/creator/reviews/CreatorReviewsPage';
import CreatorAnalyticsPage from '../pages/creator/analytics/CreatorAnalyticsPage';

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
import AdminCustomers from '../pages/admin/users/AdminCustomers';
import AdminVendors from '../pages/admin/users/AdminVendors';
import AdminCreators from '../pages/admin/users/AdminCreators';

const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Public Landing Pages ───────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/local-reels" element={<PublicLocalReelsPage />} />
        <Route path="/creator-marketplace" element={<PublicCreatorMarketplacePage />} />
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

      {/* ── Customer Portal Routes ───────────────────────────── */}
      <Route
        path="/customer"
        element={
          <PrivateRoute>
            <CustomerLayout />
          </PrivateRoute>
        }
      >
        <Route path="home" element={<CustomerHomePage />} />
        <Route path="post-requirement" element={<PostRequirementPage />} />
        <Route path="my-requirements" element={<MyRequirementsPage />} />
        <Route path="search" element={<SearchListingsPage />} />
        <Route path="activities" element={<CustomerActivitiesPage />} />
        <Route path="notifications" element={<CustomerNotificationsPage />} />
        <Route path="chat" element={<CustomerChatPage />} />
        <Route path="settings" element={<CustomerSettingsPage />} />
        <Route path="become-vendor" element={<BecomeVendorPage />} />
        <Route path="become-creator" element={<BecomeCreatorPage />} />
        <Route path="" element={<Navigate to="home" replace />} />
      </Route>

      {/* ── Vendor Portal Routes ────────────────────────────── */}
      <Route
        path="/vendor"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorLayout />
            </RoleRoute>
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<VendorDashboardPage />} />
        <Route path="profile" element={<VendorBusinessProfilePage />} />
        <Route path="listings" element={<VendorListingsPage />} />
        <Route path="reels" element={<VendorReelsPage />} />
        <Route path="boost" element={<VendorReelBoostPage />} />
        <Route path="leads" element={<VendorLeadsPage />} />
        <Route path="orders" element={<VendorOrdersPage />} />
        <Route path="analytics" element={<VendorAnalyticsPage />} />
        <Route path="subscription" element={<VendorSubscriptionPage />} />
        <Route path="wallet" element={<VendorWalletPage />} />
        <Route path="reviews" element={<VendorReviewsPage />} />
        <Route path="settings" element={<VendorSettingsPage />} />
        <Route path="hire-creator" element={<VendorHireCreatorPage />} />
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ── Creator Portal Routes ───────────────────────────── */}
      <Route
        path="/creator"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['creator']}>
              <CreatorLayout />
            </RoleRoute>
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<CreatorDashboardPage />} />
        <Route path="profile" element={<CreatorProfilePage />} />
        <Route path="portfolio" element={<CreatorPortfolioPage />} />
        <Route path="pricing" element={<CreatorPricingPage />} />
        <Route path="availability" element={<CreatorAvailabilityPage />} />
        <Route path="subscription" element={<CreatorSubscriptionPage />} />
        <Route path="wallet" element={<CreatorWalletPage />} />
        <Route path="orders" element={<CreatorOrdersPage />} />
        <Route path="reviews" element={<CreatorReviewsPage />} />
        <Route path="analytics" element={<CreatorAnalyticsPage />} />
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ── Admin Auth & Panel Routes ────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
      </Route>

      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/vendors" element={<AdminVendors />} />
        <Route path="/admin/creators" element={<AdminCreators />} />
        <Route path="/admin/users" element={<AdminCustomers />} />
        <Route path="/admin/kyc" element={<AdminKycPage />} />
        <Route path="/admin/approvals" element={<AdminKycPage />} />
        <Route path="/admin/listings" element={<AdminListingsPage />} />
        <Route path="/admin/reels" element={<AdminReelsPage />} />
        <Route path="/admin/boost" element={<AdminBoostPage />} />
        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
        <Route path="/admin/locations" element={<AdminLocationsPage />} />
        <Route path="/admin/requirements" element={<AdminRequirementsPage />} />
        <Route path="/admin/chat" element={<AdminChatPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/wallet" element={<AdminWalletPage />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
        <Route path="/admin/commission" element={<AdminCommissionPage />} />
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/ai" element={<AdminAiPage />} />
        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
        <Route path="/admin/offers" element={<AdminOffersPage />} />
        <Route path="/admin/reports" element={<AdminModerationPage />} />
        <Route path="/admin/moderation" element={<AdminModerationPage />} />
        <Route path="/admin/cms" element={<AdminCmsPage />} />
        <Route path="/admin/app-settings" element={<AdminAppSettingsPage />} />
        <Route path="/admin/security" element={<AdminSecurityPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
        <Route path="/admin/financial-reports" element={<AdminFinancialReportsPage />} />
        <Route path="/admin/console" element={<AdminConsole />} />
      </Route>

      {/* ── Global Fallback ─────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/customer/home" replace />} />
    </Routes>
  );
};

export default AppRoutes;
