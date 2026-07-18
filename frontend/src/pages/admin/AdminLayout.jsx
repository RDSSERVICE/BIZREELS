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
  FiChevronRight, FiHome
} from 'react-icons/fi';
import { selectCurrentUser, logout } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../features/auth/authApi';

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
      { name: 'Commission', path: '/admin/commission', icon: FiDollarSign },
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

  const toggleSection = (title) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
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
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-premium group-hover:scale-105 transition-transform">
            <FiShield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-black text-text-primary font-display block leading-tight">
              Biz<span className="gradient-text">Reels</span>
            </span>
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Admin Panel</span>
          </div>
        </Link>
      </div>

      {/* Nav Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {NAV_SECTIONS.map((section) => {
          const isCollapsed = collapsedSections[section.title];
          const hasActiveItem = section.items.some((item) => location.pathname === item.path);

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
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 mb-0.5 ${
                            isActive
                              ? 'bg-brand-purple text-white shadow-premium'
                              : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.name}</span>
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
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-black">
            {(user?.name || 'A')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-primary truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-text-tertiary truncate">{user?.email || user?.phone || 'admin'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/feed"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold text-text-secondary hover:bg-surface-tertiary transition-all border border-border"
          >
            <FiHome className="w-3.5 h-3.5" /> Main App
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold text-error hover:bg-error-light/40 transition-all border border-error/20"
          >
            <FiLogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

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
        <header className="sticky top-0 z-20 glass border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-surface-tertiary rounded-xl lg:hidden text-text-secondary"
            >
              {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-text-primary font-display">Admin Panel</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/notifications" className="p-2 text-text-tertiary hover:text-brand-purple rounded-xl hover:bg-surface-tertiary transition-all relative">
              <FiBell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
            </Link>
            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-black">
              {(user?.name || 'A')[0].toUpperCase()}
            </div>
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
