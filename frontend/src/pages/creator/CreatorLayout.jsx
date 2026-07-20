import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiVideo, FiUser, FiFilm, FiDollarSign, FiClock, FiCreditCard,
  FiShield, FiLogOut, FiMenu, FiX, FiBell, FiChevronDown, FiChevronRight,
  FiBarChart2, FiBriefcase, FiStar
} from 'react-icons/fi';
import { useGetMeQuery, useSwitchRoleMutation, useLogoutMutation } from '../../features/auth/authApi';
import { setCredentials, logout, selectCurrentUser } from '../../features/auth/authSlice';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/creator/dashboard', icon: FiVideo },
    ],
  },
  {
    title: 'Profile & Work',
    items: [
      { name: 'Profile', path: '/creator/profile', icon: FiUser },
      { name: 'Portfolio', path: '/creator/portfolio', icon: FiFilm },
      { name: 'Pricing', path: '/creator/pricing', icon: FiDollarSign },
      { name: 'Availability', path: '/creator/availability', icon: FiClock },
    ],
  },
  {
    title: 'Projects',
    items: [
      { name: 'My Orders', path: '/creator/orders', icon: FiBriefcase },
      { name: 'Reviews', path: '/creator/reviews', icon: FiStar },
      { name: 'Analytics', path: '/creator/analytics', icon: FiBarChart2 },
    ],
  },
  {
    title: 'Finance',
    items: [
      { name: 'Subscription', path: '/creator/subscription', icon: FiCreditCard },
      { name: 'Wallet & Earnings', path: '/creator/wallet', icon: FiDollarSign },
    ],
  },
];

/**
 * CreatorLayout — Admin-style fixed sidebar layout for Creator Studio
 */
export default function CreatorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data: profileRes } = useGetMeQuery(undefined, { pollingInterval: 300000 });
  const [switchRoleApi] = useSwitchRoleMutation();
  const [logoutApi] = useLogoutMutation();

  const profileUser = profileRes?.data?.user || profileRes?.user || user || {};
  const creatorProfile = profileUser.creatorProfile || {};

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

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
        <Link to="/creator/dashboard" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="BizReels Logo" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" />
          <div>
            <span className="text-sm font-black text-text-primary font-display block leading-tight">
              Biz<span className="gradient-text font-black">Reels</span>
            </span>
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest block">Creator Studio</span>
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
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={profileUser?.profile_pic || "/logo.png"}
            alt="Creator"
            className="w-9 h-9 rounded-full object-cover border border-brand-purple/20 bg-white p-0.5 shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-primary truncate">{creatorProfile.name || profileUser?.name || 'Creator'}</p>
            <p className="text-[10px] text-text-tertiary truncate">{profileUser?.email || profileUser?.phone || 'creator'}</p>
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
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="BizReels Logo" className="h-7 w-auto lg:hidden" />
              <h1 className="text-sm font-bold text-text-primary font-display">Creator Studio</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSwitchToCustomer}
              className="px-3.5 py-1.5 rounded-xl glass border border-border hover:bg-surface-tertiary text-text-secondary hover:text-text-primary text-xs font-bold flex items-center gap-1.5 transition"
            >
              <FiShield size={14} className="text-brand-purple" />
              <span className="hidden sm:inline">Switch to Customer</span>
            </button>
            <img
              src={profileUser?.profile_pic || "/logo.png"}
              alt="Creator Profile"
              className="w-8 h-8 rounded-full object-cover border border-brand-purple/20 bg-white p-0.5 shadow-sm"
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
}
