/**
 * Role-aware nav mapping.
 * Single source of truth for what a user's bottom-nav shows for their
 * currently-active role. Consumed by BottomNav.jsx + RoleSwitcherChip.
 */
import { Home, Compass, Plus, MessageCircle, User as UserIcon,
         LayoutDashboard, BarChart3, Palette, Briefcase, ShoppingCart } from "lucide-react";

const CUSTOMER_NAV = [
  { to: "/feed",           label: "Feed",     icon: Home,           testId: "nav-feed" },
  { to: "/explore",        label: "Explore",  icon: Compass,        testId: "nav-explore" },
  { to: "/requirements/new", label: "Post",   icon: Plus,           testId: "nav-post", isCta: true },
  { to: "/chat",           label: "Chat",     icon: MessageCircle,  testId: "nav-chat", showUnread: true },
  { to: "/profile",        label: "Me",       icon: UserIcon,       testId: "nav-profile" },
];

const VENDOR_NAV = [
  { to: "/vendor/dashboard", label: "Home",     icon: LayoutDashboard, testId: "nav-vendor-home" },
  { to: "/vendor/analytics", label: "Analytics", icon: BarChart3,      testId: "nav-analytics" },
  { to: "/vendor/listing/new", label: "Sell",   icon: Plus,           testId: "nav-add", isCta: true },
  { to: "/chat",             label: "Chat",     icon: MessageCircle,  testId: "nav-chat", showUnread: true },
  { to: "/profile",          label: "Me",       icon: UserIcon,       testId: "nav-profile" },
];

const CREATOR_NAV = [
  { to: "/creator/dashboard", label: "Home",    icon: Palette,        testId: "nav-creator-home" },
  { to: "/requirements",      label: "Jobs",    icon: Briefcase,      testId: "nav-jobs" },
  { to: "/vendor/listing/new", label: "Work",   icon: Plus,           testId: "nav-add-work", isCta: true },
  { to: "/chat",              label: "Chat",    icon: MessageCircle,  testId: "nav-chat", showUnread: true },
  { to: "/profile",           label: "Me",      icon: UserIcon,       testId: "nav-profile" },
];

const ADMIN_NAV = [
  { to: "/admin",           label: "Overview", icon: LayoutDashboard, testId: "nav-admin-home" },
  { to: "/admin/users",     label: "Users",    icon: UserIcon,       testId: "nav-admin-users" },
  { to: "/admin/listings",  label: "Listings", icon: ShoppingCart,   testId: "nav-admin-listings" },
  { to: "/chat",            label: "Chat",     icon: MessageCircle,  testId: "nav-chat", showUnread: true },
  { to: "/profile",         label: "Me",       icon: UserIcon,       testId: "nav-profile" },
];

const NAV_MAP = {
  customer: CUSTOMER_NAV, vendor: VENDOR_NAV, creator: CREATOR_NAV, admin: ADMIN_NAV,
};

export function navForRole(role) {
  return NAV_MAP[role] || CUSTOMER_NAV;
}

export function getRoleDashboard(role) {
  switch (role) {
    case 'vendor':
      return '/vendor/dashboard';
    case 'creator':
      return '/creator/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'customer':
    default:
      return '/customer/home';
  }
}

/**
 * Returns the onboarding route for a given role.
 */
export function getRoleOnboarding(role) {
  switch (role) {
    case 'vendor':
      return '/vendor/onboarding';
    case 'creator':
      return '/creator/onboarding';
    case 'customer':
      return '/customer/choose-interests';
    default:
      return '/customer/choose-interests';
  }
}

/**
 * Checks if onboarding is complete for a given role.
 * Uses backend profile fields as the source of truth.
 */
export function isOnboardingComplete(user, role) {
  if (!user) return false;
  const vp = user.vendorProfile || {};
  const cp = user.creatorProfile || {};
  const custp = user.customerProfile || {};

  switch (role) {
    case 'vendor': {
      return Boolean(vp.shopName || vp.businessName || vp.store_name);
    }
    case 'creator': {
      return Boolean(cp.displayName || cp.name);
    }
    case 'customer': {
      return Boolean(
        custp.interestsSelectedAt || (Array.isArray(custp.interests) && custp.interests.length >= 5)
      );
    }
    case 'admin':
      return true;
    default:
      return false;
  }
}

/**
 * Returns the correct destination for a user based on their role and onboarding status.
 */
export function getRoleDestination(user, role) {
  if (role === 'admin') return '/admin/dashboard';
  return isOnboardingComplete(user, role) ? getRoleDashboard(role) : getRoleOnboarding(role);
}

/**
 * Returns the correct post-login destination for a user based on their role and onboarding status.
 */
export function getPostLoginDestination(user, role) {
  return getRoleDestination(user, role);
}

