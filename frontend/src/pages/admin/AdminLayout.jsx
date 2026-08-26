import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiGrid, FiUsers, FiUserCheck, FiShield, FiLayers, FiFilm, FiZap, FiFolder,
  FiMapPin, FiInbox, FiMessageSquare, FiShoppingBag, FiCreditCard, FiStar,
  FiBarChart2, FiCpu, FiBell, FiGift, FiDollarSign, FiAlertTriangle, FiFileText,
  FiSettings, FiLock, FiList, FiPieChart, FiMenu, FiX, FiLogOut, FiChevronDown,
  FiChevronRight, FiHome, FiSearch
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { selectCurrentUser, logout } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../features/auth/authApi';
import NotificationBellDropdown from '../../components/notifications/NotificationBellDropdown';
import { useEffect } from 'react';
import { getSocket, disconnectSocket } from '../../lib/socket';
import adminApi, { useGetAdminOverviewQuery } from '../../features/admin/adminApi';
import AdminQuickSearchModal from '../../features/admin/components/AdminQuickSearchModal';
import SEO from '../../components/common/SEO';


const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: FiGrid },
    ],
  },
  {
    title: 'User Management',
    items: [
      { name: 'Customers', path: '/admin/customers', icon: FiUsers },
      { name: 'Vendors', path: '/admin/vendors', icon: FiUserCheck },
      { name: 'Creators', path: '/admin/creators', icon: FiFilm },
    ],
  },
  {
    title: 'Verification',
    items: [
      { name: 'KYC Verification', path: '/admin/kyc', icon: FiShield },
    ],
  },
  {
    title: 'Content',
    items: [
      { name: 'Listings', path: '/admin/listings', icon: FiLayers },
      { name: 'Reels', path: '/admin/reels', icon: FiFilm },
      { name: 'Boost / Ads', path: '/admin/boost', icon: FiZap },
      { name: 'Categories', path: '/admin/categories', icon: FiFolder },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Locations', path: '/admin/locations', icon: FiMapPin },
      { name: 'Requirements', path: '/admin/requirements', icon: FiInbox },
      { name: 'Chat Monitor', path: '/admin/chat', icon: FiMessageSquare },
      { name: 'Orders', path: '/admin/orders', icon: FiShoppingBag },
    ],
  },
  {
    title: 'Finance',
    items: [
      { name: 'Wallet', path: '/admin/wallet', icon: FiCreditCard },
      { name: 'Subscriptions', path: '/admin/subscriptions', icon: FiCreditCard },
      { name: 'Commission', path: '/admin/commission', icon: FaRupeeSign },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { name: 'Reviews', path: '/admin/reviews', icon: FiStar },
      { name: 'Analytics', path: '/admin/analytics', icon: FiBarChart2 },
      { name: 'AI Management', path: '/admin/ai', icon: FiCpu },
      { name: 'Notifications', path: '/admin/notifications', icon: FiBell },
      { name: 'Offers & Coupons', path: '/admin/offers', icon: FiGift },
    ],
  },
  {
    title: 'Moderation',
    items: [
      { name: 'Reports', path: '/admin/reports', icon: FiAlertTriangle },
      { name: 'Moderation', path: '/admin/moderation', icon: FiAlertTriangle },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'CMS Pages', path: '/admin/cms', icon: FiFileText },
      { name: 'App Settings', path: '/admin/app-settings', icon: FiSettings },
      { name: 'Credit Rates', path: '/admin/credit-rates', icon: FiZap },
      { name: 'Security', path: '/admin/security', icon: FiLock },
      { name: 'Audit Logs', path: '/admin/audit', icon: FiList },
      { name: 'Financial Reports', path: '/admin/financial-reports', icon: FiPieChart },
    ],
  },
];

/**
 * AdminLayout — Dedicated admin layout with full sidebar navigation
 */
const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [logoutApi] = useLogoutMutation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch overview stats for live notification badges
  const { data: ov } = useGetAdminOverviewQuery(undefined, { pollingInterval: 30000 });

  const toggleSection = (title) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // Listen for custom open-admin-search event from keyboard shortcut
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    document.addEventListener('open-admin-search', handleOpenSearch);
    return () => document.removeEventListener('open-admin-search', handleOpenSearch);
  }, []);

  // Realtime Socket event listener for admin tag invalidations
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAdminUpdate = ({ tags }) => {
      console.log('Realtime Admin Update event received. Invalidating tags:', tags);
      if (Array.isArray(tags)) {
        dispatch(adminApi.util.invalidateTags(tags));
      }
    };

    socket.on('admin:update', handleAdminUpdate);

    return () => {
      socket.off('admin:update', handleAdminUpdate);
    };
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      disconnectSocket();
      dispatch(logout());
      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch {
      disconnectSocket();
      dispatch(logout());
      navigate('/auth/login');
    }
  };

  const getBadgeCount = (itemPath) => {
    if (itemPath === '/admin/kyc' && ov?.pending_kyc_count > 0) return ov.pending_kyc_count;
    if ((itemPath === '/admin/reports' || itemPath === '/admin/moderation') && ov?.open_reports_count > 0) return ov.open_reports_count;
    return null;
  };

  const SidebarContent = ({ onItemClick }) => (
    <div className="flex flex-col h-full font-sans bg-[#f8f4ec] border-r border-[#e3dccb]">
      {/* Brand Header */}
      <div className="px-4 py-4 bg-white border-b border-[#e3dccb] flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="BizReels Logo" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" />
          <div>
            <span style={{ fontFamily: "'Outfit', 'Manrope', sans-serif" }} className="text-sm font-black text-[#1a1a1a] block leading-tight tracking-tight">
              BIZ<span className="text-[#1D4ED8]">REELS</span>
            </span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">ADMIN CONTROL</span>
          </div>
        </Link>
      </div>

      {/* Nav Sections */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-2 scrollbar-none">
        {NAV_SECTIONS.map((section) => {
          const isCollapsed = collapsedSections[section.title];

          return (
            <div key={section.title} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-2 py-1 text-[9.5px] font-black text-slate-400 uppercase tracking-widest hover:text-[#0F172A] transition-all cursor-pointer border-none bg-transparent"
              >
                <span>{section.title}</span>
                {isCollapsed ? (
                  <FiChevronRight className="w-3 h-3 text-slate-400" />
                ) : (
                  <FiChevronDown className="w-3 h-3 text-slate-400" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden space-y-0.5"
                  >
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      const badgeCount = getBadgeCount(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onItemClick}
                          className={`relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 group ${
                            isActive
                              ? 'bg-[#0F172A] text-[#EAB308] shadow-xs'
                              : 'text-slate-700 hover:bg-white hover:text-[#0F172A] hover:shadow-2xs'
                          }`}
                        >
                          {/* Active Gold Left Indicator */}
                          {isActive && (
                            <span className="w-1 h-5 bg-[#EAB308] rounded-r-full absolute left-0" />
                          )}

                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Icon Container Badge */}
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isActive
                                  ? 'bg-[#EAB308] text-[#0F172A] shadow-xs'
                                  : 'bg-white text-slate-600 border border-[#e3dccb] group-hover:border-[#0F172A] group-hover:text-[#0F172A]'
                              }`}
                            >
                              <Icon size={14} />
                            </div>
                            <span className="truncate">{item.name}</span>
                          </div>

                          {badgeCount && (
                            <span className="bg-[#EAB308] text-[#0F172A] text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                              {badgeCount}
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

      {/* User Info + Logout Footer Card */}
      <div className="border-t border-[#e3dccb] p-3 bg-white space-y-2">
        <div className="flex items-center gap-2.5 p-1">
          <img
            src={user?.profile_pic || "/logo.png"}
            alt="Admin Logo"
            className="w-9 h-9 rounded-full object-cover border border-[#e3dccb] bg-[#f8f4ec] p-0.5 shadow-xs shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-[#1a1a1a] truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] font-medium text-slate-400 truncate">{user?.email || user?.phone || 'admin'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-200 cursor-pointer"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-secondary flex">
      <SEO title="Admin Portal" robots="noindex, nofollow" />
      {/* Quick Search Command Palette Modal */}
      <AdminQuickSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

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
              <h1 className="text-sm font-bold text-text-primary font-display hidden md:block">Admin Control Panel</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Quick Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-tertiary text-text-secondary text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
              title="Quick Search (Ctrl+K)"
            >
              <FiSearch className="w-3.5 h-3.5 text-brand-purple" />
              <span className="hidden sm:inline text-text-tertiary text-[11px]">Quick Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-secondary border border-border text-[9px] font-mono text-text-tertiary">
                Ctrl K
              </kbd>
            </button>

            <NotificationBellDropdown role="admin" />
            <img
              src={user?.profile_pic || "/logo.png"}
              alt="Admin Profile Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-brand-purple/20 bg-white p-0.5 shadow-sm flex-shrink-0"
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

