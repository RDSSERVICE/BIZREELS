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
import { PrivateRoute, RoleRoute, PublicRoute, RequireAdmin, OnboardingRoute } from './guards';
import Loader from '../components/common/Loader';

// Public & Auth Pages
const Home = React.lazy(() => import('../pages/home/Home'));
const About = React.lazy(() => import('../pages/home/About'));
const PublicLocalReelsPage = React.lazy(() => import('../pages/reels/PublicLocalReelsPage'));
const PublicCreatorMarketplacePage = React.lazy(() => import('../pages/creator/PublicCreatorMarketplacePage'));
const Login = React.lazy(() => import('../pages/auth/Login'));
const CustomerLogin = React.lazy(() => import('../pages/auth/CustomerLogin'));
const VendorLogin = React.lazy(() => import('../pages/auth/VendorLogin'));
const CreatorLogin = React.lazy(() => import('../pages/auth/CreatorLogin'));
const Register = React.lazy(() => import('../pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('../pages/auth/ForgotPassword'));
const AuthCallback = React.lazy(() => import('../pages/auth/AuthCallback'));
const DashboardRouter = React.lazy(() => import('../pages/customer/DashboardRouter'));

// Customer Pages
const CustomerHomePage = React.lazy(() => import('../pages/customer/home/CustomerHomePage'));
const PostRequirementPage = React.lazy(() => import('../pages/customer/requirements/PostRequirementPage'));
const MyRequirementsPage = React.lazy(() => import('../pages/customer/requirements/MyRequirementsPage'));
const SearchListingsPage = React.lazy(() => import('../pages/customer/search/SearchListingsPage'));
const CustomerActivitiesPage = React.lazy(() => import('../pages/customer/activities/CustomerActivitiesPage'));
const CustomerNotificationsPage = React.lazy(() => import('../pages/customer/notifications/CustomerNotificationsPage'));
const CustomerChatPage = React.lazy(() => import('../pages/customer/chat/CustomerChatPage'));
const CustomerSettingsPage = React.lazy(() => import('../pages/customer/settings/CustomerSettingsPage'));
const BecomeVendorPage = React.lazy(() => import('../pages/vendor/onboarding/BecomeVendorPage'));
const BecomeCreatorPage = React.lazy(() => import('../pages/creator/onboarding/BecomeCreatorPage'));
const VendorProfilePage = React.lazy(() => import('../pages/customer/vendor/VendorProfilePage'));
const InterestSelectionPage = React.lazy(() => import('../pages/customer/onboarding/InterestSelectionPage'));
const ListingDetailPage = React.lazy(() => import('../pages/customer/listings/ListingDetailPage'));

// Vendor Pages
const VendorDashboardPage = React.lazy(() => import('../pages/vendor/dashboard/VendorDashboardPage'));
const VendorBusinessProfilePage = React.lazy(() => import('../pages/vendor/profile/VendorBusinessProfilePage'));
const VendorListingsPage = React.lazy(() => import('../pages/vendor/listings/VendorListingsPage'));
const VendorReelsPage = React.lazy(() => import('../pages/vendor/reels/VendorReelsPage'));
const VendorLeadsPage = React.lazy(() => import('../pages/vendor/leads/VendorLeadsPage'));
const VendorOrdersPage = React.lazy(() => import('../pages/vendor/orders/VendorOrdersPage'));
const VendorAnalyticsPage = React.lazy(() => import('../pages/vendor/analytics/VendorAnalyticsPage'));
const VendorSubscriptionPage = React.lazy(() => import('../pages/vendor/subscription/VendorSubscriptionPage'));
const VendorWalletPage = React.lazy(() => import('../pages/vendor/wallet/VendorWalletPage'));
const VendorCreditRatesPage = React.lazy(() => import('../pages/vendor/wallet/VendorCreditRatesPage'));
const VendorReferralPage = React.lazy(() => import('../pages/vendor/referrals/VendorReferralPage'));
const VendorReviewsPage = React.lazy(() => import('../pages/vendor/reviews/VendorReviewsPage'));
const VendorSettingsPage = React.lazy(() => import('../pages/vendor/settings/VendorSettingsPage'));
const VendorHireCreatorPage = React.lazy(() => import('../pages/vendor/hire-creator/VendorHireCreatorPage'));
const VendorVerificationPage = React.lazy(() => import('../pages/vendor/verification/VendorVerificationPage'));
const VendorChatPage = React.lazy(() => import('../pages/vendor/chat/VendorChatPage'));
const VendorFollowersPage = React.lazy(() => import('../pages/vendor/followers/VendorFollowersPage'));

// Creator Pages
const CreatorDashboardPage = React.lazy(() => import('../pages/creator/dashboard/CreatorDashboardPage'));
const CreatorProfilePage = React.lazy(() => import('../pages/creator/profile/CreatorProfilePage'));
const CreatorPortfolioPage = React.lazy(() => import('../pages/creator/portfolio/CreatorPortfolioPage'));
const CreatorPricingPage = React.lazy(() => import('../pages/creator/pricing/CreatorPricingPage'));
const CreatorAvailabilityPage = React.lazy(() => import('../pages/creator/availability/CreatorAvailabilityPage'));
const CreatorSubscriptionPage = React.lazy(() => import('../pages/creator/subscription/CreatorSubscriptionPage'));
const CreatorWalletPage = React.lazy(() => import('../pages/creator/wallet/CreatorWalletPage'));
const CreatorOrdersPage = React.lazy(() => import('../pages/creator/orders/CreatorOrdersPage'));
const CreatorReviewsPage = React.lazy(() => import('../pages/creator/reviews/CreatorReviewsPage'));
const CreatorAnalyticsPage = React.lazy(() => import('../pages/creator/analytics/CreatorAnalyticsPage'));
const CreatorVerificationPage = React.lazy(() => import('../pages/creator/verification/CreatorVerificationPage'));
const CreatorSettingsPage = React.lazy(() => import('../pages/creator/settings/CreatorSettingsPage'));
const Chats = React.lazy(() => import('../pages/chat/Chats'));

// Admin Pages
const AdminLogin = React.lazy(() => import('../pages/admin/AdminLogin'));
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const AdminConsole = React.lazy(() => import('../pages/admin/AdminConsole'));
const AdminKycPage = React.lazy(() => import('../pages/admin/kyc/AdminKycPage'));
const AdminListingsPage = React.lazy(() => import('../pages/admin/listings/AdminListingsPage'));
const AdminReelsPage = React.lazy(() => import('../pages/admin/reels/AdminReelsPage'));
const AdminBoostPage = React.lazy(() => import('../pages/admin/boost/AdminBoostPage'));
const AdminCategoriesPage = React.lazy(() => import('../pages/admin/categories/AdminCategoriesPage'));
const AdminLocationsPage = React.lazy(() => import('../pages/admin/locations/AdminLocationsPage'));
const AdminRequirementsPage = React.lazy(() => import('../pages/admin/requirements/AdminRequirementsPage'));
const AdminChatPage = React.lazy(() => import('../pages/admin/chat/AdminChatPage'));
const AdminOrdersPage = React.lazy(() => import('../pages/admin/orders/AdminOrdersPage'));
const AdminWalletPage = React.lazy(() => import('../pages/admin/wallet/AdminWalletPage'));
const AdminSubscriptionsPage = React.lazy(() => import('../pages/admin/subscriptions/AdminSubscriptionsPage'));
const AdminReviewsPage = React.lazy(() => import('../pages/admin/reviews/AdminReviewsPage'));
const AdminAnalyticsPage = React.lazy(() => import('../pages/admin/analytics/AdminAnalyticsPage'));
const AdminAiPage = React.lazy(() => import('../pages/admin/ai/AdminAiPage'));
const AdminNotificationsPage = React.lazy(() => import('../pages/admin/notifications/AdminNotificationsPage'));
const AdminOffersPage = React.lazy(() => import('../pages/admin/offers/AdminOffersPage'));
const AdminCommissionPage = React.lazy(() => import('../pages/admin/commission/AdminCommissionPage'));
const AdminCmsPage = React.lazy(() => import('../pages/admin/cms/AdminCmsPage'));
const AdminAppSettingsPage = React.lazy(() => import('../pages/admin/app-settings/AdminAppSettingsPage'));
const AdminCreditRatesPage = React.lazy(() => import('../pages/admin/app-settings/AdminCreditRatesPage'));
const AdminSecurityPage = React.lazy(() => import('../pages/admin/security/AdminSecurityPage'));
const AdminAuditPage = React.lazy(() => import('../pages/admin/audit/AdminAuditPage'));
const AdminModerationPage = React.lazy(() => import('../pages/admin/moderation/AdminModerationPage'));
const AdminFinancialReportsPage = React.lazy(() => import('../pages/admin/reports/AdminFinancialReportsPage'));
const AdminCustomers = React.lazy(() => import('../pages/admin/users/AdminCustomers'));
const AdminVendors = React.lazy(() => import('../pages/admin/users/AdminVendors'));
const AdminCreators = React.lazy(() => import('../pages/admin/users/AdminCreators'));

const AppRoutes = () => {
  return (
    <React.Suspense fallback={<Loader fullPage />}>
      <Routes>
      {/* ── Public Landing Pages ───────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/local-reels" element={<PublicLocalReelsPage />} />
        <Route path="/creator-marketplace" element={<PublicCreatorMarketplacePage />} />
      </Route>

      <Route path="/feed" element={<DashboardRouter />} />

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
        <Route path="customer-login" element={<CustomerLogin />} />
        <Route path="vendor-login" element={<VendorLogin />} />
        <Route path="creator-login" element={<CreatorLogin />} />
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
        <Route path="listings/:id" element={<ListingDetailPage />} />
        <Route path="product/:productId" element={<ListingDetailPage />} />
        <Route path="listing/:id" element={<ListingDetailPage />} />
        <Route path="activities" element={<CustomerActivitiesPage />} />
        <Route path="notifications" element={<CustomerNotificationsPage />} />
        <Route path="chat" element={<CustomerChatPage />} />
        <Route path="settings" element={<CustomerSettingsPage />} />
        <Route path="vendor/:vendorId" element={<VendorProfilePage />} />
        <Route path="choose-interests" element={<InterestSelectionPage />} />
        {/* Backward compatibility: old onboarding URLs redirect to new namespace */}
        <Route path="become-vendor" element={<Navigate to="/vendor/onboarding" replace />} />
        <Route path="become-creator" element={<Navigate to="/creator/onboarding" replace />} />
        <Route path="" element={<Navigate to="home" replace />} />
      </Route>

      {/* ── Vendor Onboarding Route (auth required, no vendor role needed) ── */}
      <Route
        path="/vendor/onboarding"
        element={
          <OnboardingRoute targetRole="vendor">
            <BecomeVendorPage />
          </OnboardingRoute>
        }
      />

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
        <Route path="onboarding-details" element={<BecomeVendorPage isEditMode={true} />} />
        <Route path="setup-details" element={<Navigate to="/vendor/onboarding-details" replace />} />
        <Route path="verification" element={<VendorVerificationPage />} />
        <Route path="listings" element={<VendorListingsPage />} />
        <Route path="reels" element={<VendorReelsPage />} />
        <Route path="leads" element={<VendorLeadsPage />} />
        <Route path="orders" element={<VendorOrdersPage />} />
        <Route path="analytics" element={<VendorAnalyticsPage />} />
        <Route path="subscription" element={<VendorSubscriptionPage />} />
        <Route path="wallet" element={<VendorWalletPage />} />
        <Route path="credit-rates" element={<VendorCreditRatesPage />} />
        <Route path="referrals" element={<VendorReferralPage />} />
        <Route path="reviews" element={<VendorReviewsPage />} />
        <Route path="settings" element={<VendorSettingsPage />} />
        <Route path="chat" element={<VendorChatPage />} />
        <Route path="followers" element={<VendorFollowersPage />} />
        <Route path="hire-creator" element={<VendorHireCreatorPage />} />
        <Route path="notifications" element={<CustomerNotificationsPage />} />
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ── Creator Onboarding Route (auth required, no creator role needed) ── */}
      <Route
        path="/creator/onboarding"
        element={
          <OnboardingRoute targetRole="creator">
            <BecomeCreatorPage />
          </OnboardingRoute>
        }
      />

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
        <Route path="onboarding-details" element={<BecomeCreatorPage isEditMode={true} />} />
        <Route path="setup-details" element={<Navigate to="/creator/onboarding-details" replace />} />
        <Route path="verification" element={<CreatorVerificationPage />} />
        <Route path="portfolio" element={<CreatorPortfolioPage />} />
        <Route path="pricing" element={<CreatorPricingPage />} />
        <Route path="availability" element={<CreatorAvailabilityPage />} />
        <Route path="subscription" element={<CreatorSubscriptionPage />} />
        <Route path="wallet" element={<CreatorWalletPage />} />
        <Route path="orders" element={<CreatorOrdersPage />} />
        <Route path="reviews" element={<CreatorReviewsPage />} />
        <Route path="analytics" element={<CreatorAnalyticsPage />} />
        <Route path="settings" element={<CreatorSettingsPage />} />
        <Route path="chat" element={<Chats />} />
        <Route path="notifications" element={<CustomerNotificationsPage />} />
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ── Admin Auth & Panel Routes ────────────────────────── */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/adminlogin" element={<AdminLogin />} />

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
        <Route path="/admin/credit-rates" element={<AdminCreditRatesPage />} />
        <Route path="/admin/security" element={<AdminSecurityPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
        <Route path="/admin/financial-reports" element={<AdminFinancialReportsPage />} />
        <Route path="/admin/console" element={<AdminConsole />} />
      </Route>

      {/* ── Global Fallback ─────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/customer/home" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default AppRoutes;
