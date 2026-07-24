import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiGrid, FiUser, FiPackage, FiVideo, FiZap, FiInbox, FiShoppingCart,
  FiPieChart, FiCreditCard, FiDollarSign, FiStar, FiUserCheck, FiSettings,
  FiShield, FiLogOut, FiMenu, FiX, FiBell, FiChevronDown, FiChevronRight,
  FiCheckCircle, FiMessageSquare
} from 'react-icons/fi';
import { useGetMeQuery, useSwitchRoleMutation, useLogoutMutation } from '../../features/auth/authApi';
import { setCredentials, logout, selectCurrentUser, setActiveRole } from '../../features/auth/authSlice';
import { api, tokenStore } from '../../lib/api';
import NotificationBellDropdown from '../../components/notifications/NotificationBellDropdown';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/vendor/dashboard', icon: FiGrid },
    ],
  },
  {
    title: 'Business',
    items: [
      { name: 'Business Profile', path: '/vendor/profile', icon: FiUser },
      { name: 'Verification Center', path: '/vendor/verification', icon: FiShield, badge: 'Badge' },
      { name: 'My Listings', path: '/vendor/listings', icon: FiPackage },
      { name: 'Reels & AI Ads', path: '/vendor/reels', icon: FiVideo },
      { name: 'Reel Boost', path: '/vendor/boost', icon: FiZap, badge: 'Revenue' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { name: 'Leads / Enquiries', path: '/vendor/leads', icon: FiInbox },
      { name: 'Order Requests', path: '/vendor/orders', icon: FiShoppingCart },
      { name: 'Chat / Inbox', path: '/vendor/chat', icon: FiMessageSquare },
      { name: 'Analytics', path: '/vendor/analytics', icon: FiPieChart },
    ],
  },
  {
    title: 'Finance',
    items: [
      { name: 'Subscription', path: '/vendor/subscription', icon: FiCreditCard },
      { name: 'Wallet', path: '/vendor/wallet', icon: FiDollarSign },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { name: 'Reviews', path: '/vendor/reviews', icon: FiStar },
      { name: 'Hire Creator', path: '/vendor/hire-creator', icon: FiUserCheck },
      { name: 'Settings', path: '/vendor/settings', icon: FiSettings },
    ],
  },
];

/**
 * VendorLayout — Admin-style fixed sidebar layout for Vendor Portal
 */
export default function VendorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data: profileRes } = useGetMeQuery(undefined, {
    pollingInterval: 300000,
    skip: !user && !tokenStore.getAccess(),
  });
  const [switchRoleApi] = useSwitchRoleMutation();
  const [logoutApi] = useLogoutMutation();

  const profileUser = profileRes?.data?.user || profileRes?.user || user || {};
  const vendorProfile = profileUser.vendorProfile || {};
  const roles = profileUser.roles || ['customer'];
  const currentRole = profileUser.current_role || profileUser.activeRole || 'customer';

  useEffect(() => {
    if (roles.includes('vendor') && currentRole !== 'vendor') {
      dispatch(setActiveRole('vendor'));
    }
  }, [roles, currentRole, dispatch]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [isShopClosed, setIsShopClosed] = useState(vendorProfile.isClosed || false);

  const toggleSection = (title) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleSwitchToCustomer = async () => {
    try {
      const res = await switchRoleApi({ role: 'customer' }).unwrap();
      dispatch(setCredentials({ user: res.user || res.data?.user }));
      toast.success('Switched to Customer view');
      navigate('/customer/home');
    } catch (err) {
      toast.error('Failed to switch role');
    }
  };

  const handleToggleShopStatus = async () => {
    const newStatus = !isShopClosed;
    setIsShopClosed(newStatus);
    try {
      await api.patch('/v1/users/me', {
        vendorProfile: { ...vendorProfile, isClosed: newStatus }
      });
      toast.success(newStatus ? 'Shop marker set to TEMPORARY CLOSED' : 'Shop marker set to OPEN');
    } catch (err) {
      toast.error('Failed to update shop status');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      dispatch(logout());
      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch {
      dispatch(logout());
      navigate('/auth/login');
    }
  };

  const SidebarContent = ({ onItemClick }) => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="px-4 py-4 border-b border-border flex items-center gap-3">
        <Link to="/vendor/dashboard" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="BizReels Logo" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" />
          <div>
            <span className="text-sm font-black text-text-primary font-display block leading-tight">
              Biz<span className="gradient-text font-black">Reels</span>
            </span>
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest block">Vendor Portal</span>
          </div>
        </Link>
      </div>

      {/* Nav Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {NAV_SECTIONS.map((section) => {
          const isCollapsed = collapsedSections[section.title];

          return (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-[9px] font-bold text-text-tertiary uppercase tracking-widest hover:text-text-secondary transition-all"
              >
                {section.title}
                {isCollapsed ? (
                  <FiChevronRight className="w-3 h-3" />
                ) : (
                  <FiChevronDown className="w-3 h-3" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onItemClick}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 mb-0.5 ${
                            isActive
                              ? 'bg-brand-purple text-white shadow-premium'
                              : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </div>
                          {item.badge && (
                            <span className="gradient-brand text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={profileUser?.profile_pic || "/logo.png"}
            alt="Vendor"
            className="w-9 h-9 rounded-full object-cover border border-brand-purple/20 bg-white p-0.5 shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-primary truncate">{vendorProfile.shopName || profileUser?.name || 'Vendor'}</p>
            <p className="text-[10px] text-text-tertiary truncate">{profileUser?.email || profileUser?.phone || 'vendor'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-error bg-error/10 hover:bg-error/20 transition-all border border-error/20"
        >
          <FiLogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  const currentTier = vendorProfile.verificationStatus || 'unverified';
  const isSubscribed = !!profileUser.is_subscribed_verified;

  const getTierBadge = () => {
    if (currentTier === 'premium_verified' || (isSubscribed && currentTier === 'verified_vendor')) {
      return { icon: '🔵', label: 'Premium Verified', class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    }
    if (currentTier === 'verified_vendor') {
      return { icon: '🟢', label: 'Verified Vendor', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    }
    if (currentTier === 'partially_verified') {
      return { icon: '🟡', label: 'Partially Verified', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    }
    return { icon: '⚪', label: 'Unverified Vendor', class: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
  };

  const badgeInfo = getTierBadge();

  return (
    <div className="min-h-screen bg-surface-secondary flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-surface border-r border-border fixed top-0 bottom-0 left-0 z-30">
        <SidebarContent onItemClick={() => {}} />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] z-50 bg-surface border-r border-border shadow-modal lg:hidden"
            >
              <SidebarContent onItemClick={() => setIsSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 glass border-b border-border px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-surface-tertiary rounded-xl lg:hidden text-text-secondary flex-shrink-0"
            >
              {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <img src="/logo.png" alt="BizReels Logo" className="h-7 w-auto lg:hidden flex-shrink-0" />
              <h1 className="text-sm font-bold text-text-primary font-display hidden md:block">Vendor Portal</h1>
              
              {/* Top Bar Status Badge — icon-only on very small screens */}
              <Link
                to="/vendor/verification"
                className={`px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border flex items-center gap-1 sm:gap-1.5 transition hover:opacity-80 flex-shrink-0 ${badgeInfo.class}`}
              >
                <span>{badgeInfo.icon}</span>
                <span className="hidden sm:inline">{badgeInfo.label}</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Shop Status Toggle */}
            <button
              onClick={handleToggleShopStatus}
              className={`px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 border transition ${
                isShopClosed
                  ? 'bg-error/10 text-error border-error/20'
                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isShopClosed ? 'bg-error' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="hidden sm:inline">{isShopClosed ? 'Shop Closed' : 'Shop Open'}</span>
            </button>

            <button
              onClick={handleSwitchToCustomer}
              className="px-2 sm:px-3 py-1.5 rounded-xl glass border border-border hover:bg-surface-tertiary text-text-secondary hover:text-text-primary text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition"
            >
              <FiShield size={14} className="text-brand-purple flex-shrink-0" />
              <span className="hidden md:inline">Switch to Customer</span>
            </button>

            <NotificationBellDropdown role="vendor" />

            <img
              src={profileUser?.profile_pic || "/logo.png"}
              alt="Vendor Profile"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-brand-purple/20 bg-white p-0.5 shadow-sm flex-shrink-0"
            />
          </div>
        </header>

        {/* Verification Dialogue Banner (Show if not fully verified) */}
        {currentTier !== 'verified_vendor' && currentTier !== 'premium_verified' && (
          <div className="bg-gradient-to-r from-brand-purple via-brand-pink to-brand-orange text-white px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-semibold flex items-center justify-between gap-2 sm:gap-3 shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm sm:text-base flex-shrink-0">🟢</span>
              <span className="truncate text-[10px] sm:text-xs">Verify your business to get 5x more leads & maximum buyer trust!</span>
            </div>
            <Link
              to="/vendor/verification"
              className="px-2.5 sm:px-3 py-1 bg-white text-brand-purple rounded-lg font-bold text-[10px] sm:text-[11px] hover:bg-white/90 transition flex-shrink-0 shadow-sm whitespace-nowrap"
            >
              Verify Now
            </Link>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
