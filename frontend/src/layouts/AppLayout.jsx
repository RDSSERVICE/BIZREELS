import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiHome,
  FiSearch,
  FiPlusSquare,
  FiMessageSquare,
  FiBell,
  FiUser,
  FiLogOut,
  FiBriefcase,
  FiVideo,
  FiSettings,
  FiGrid,
  FiLayers,
  FiMenu,
  FiX,
  FiTv,
  FiUserCheck
} from 'react-icons/fi';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectActiveRole,
  logout,
  setActiveRole
} from '../features/auth/authSlice';
import { useSwitchRoleMutation, useLogoutMutation } from '../features/auth/authApi';
import Button from '../components/common/Button';

/**
 * Main application layout enclosing feed, search, messaging, profile, dashboard.
 * Houses role switching, notifications, responsive sidebar, and bottom mobile bar.
 */
const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const activeRole = useSelector(selectActiveRole);
  
  const [switchRoleApi] = useSwitchRoleMutation();
  const [logoutApi] = useLogoutMutation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Fallback: If not logged in, redirect to login page
  if (!isAuthenticated || !user) {
    navigate('/auth/login', { replace: true });
    return null;
  }

  const handleRoleChange = async (newRole) => {
    try {
      await switchRoleApi({ role: newRole }).unwrap();
      dispatch(setActiveRole(newRole));
      setIsProfileMenuOpen(false);
      toast.success(`Switched role to ${newRole.toUpperCase()}`);
      if (newRole === 'vendor') navigate('/vendor/dashboard');
      else if (newRole === 'creator') navigate('/creator/dashboard');
      else navigate('/feed');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to switch role.');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      dispatch(logout());
      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch (err) {
      dispatch(logout());
      navigate('/auth/login');
    }
  };

  // Sidebar Menu Items based on Active Role
  const getNavItems = () => {
    const customerItems = [
      { name: 'Feed', path: '/feed', icon: FiHome },
      { name: 'Discover', path: '/search', icon: FiSearch },
      { name: 'Reels', path: '/reels', icon: FiVideo },
      { name: 'Live Broadcasts', path: '/live', icon: FiTv },
      { name: 'Creator Marketplace', path: '/creator/marketplace', icon: FiUserCheck },
      { name: 'Post Requirement', path: '/requirements/new', icon: FiPlusSquare },
      { name: 'My Quotes', path: '/requirements/new', icon: FiLayers },
      { name: 'Chats', path: '/chats', icon: FiMessageSquare },
      { name: 'Profile', path: `/profile/${user._id}`, icon: FiUser },
    ];

    const vendorItems = [
      { name: 'Dashboard', path: '/vendor/dashboard', icon: FiGrid },
      { name: 'Catalog', path: '/vendor/dashboard', icon: FiBriefcase },
      { name: 'Reels Upload', path: '/reels/upload', icon: FiVideo },
      { name: 'Live Broadcasts', path: '/live', icon: FiTv },
      { name: 'Creator Marketplace', path: '/creator/marketplace', icon: FiUserCheck },
      { name: 'Leads & Bids', path: '/vendor/dashboard', icon: FiLayers },
      { name: 'Chats', path: '/chats', icon: FiMessageSquare },
      { name: 'Store Profile', path: `/profile/${user._id}`, icon: FiSettings },
    ];

    const creatorItems = [
      { name: 'Dashboard', path: '/creator/dashboard', icon: FiGrid },
      { name: 'Portfolio', path: '/creator/dashboard', icon: FiBriefcase },
      { name: 'Sample Reels', path: '/reels', icon: FiVideo },
      { name: 'Live Broadcasts', path: '/live', icon: FiTv },
      { name: 'Work Requests', path: '/creator/dashboard', icon: FiLayers },
      { name: 'Chats', path: '/chats', icon: FiMessageSquare },
      { name: 'Availability', path: '/creator/dashboard', icon: FiSettings },
    ];

    const adminItems = [
      { name: 'Admin Panel', path: '/admin/dashboard', icon: FiGrid },
      { name: 'Feed', path: '/feed', icon: FiHome },
      { name: 'Discover', path: '/search', icon: FiSearch },
      { name: 'Reels', path: '/reels', icon: FiVideo },
      { name: 'Chats', path: '/chats', icon: FiMessageSquare },
    ];

    if (activeRole === 'vendor') return vendorItems;
    if (activeRole === 'creator') return creatorItems;
    if (activeRole === 'admin') return adminItems;
    return customerItems;
  };

  const navItems = getNavItems();

  return (
    <div className="relative min-h-screen bg-surface-secondary flex flex-col">
      {/* ── Top Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full glass border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-surface-tertiary rounded-premium lg:hidden text-brand-navy"
          >
            {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="BizReels Logo" className="h-8 w-auto" />
            <span className="hidden md:inline text-lg font-bold tracking-tight text-brand-navy">
              Biz<span className="gradient-text font-black">Reels</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Link to="/notifications" className="p-2 text-text-secondary hover:text-brand-purple hover:bg-surface-tertiary rounded-full transition-all relative">
            <FiBell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
          </Link>

          {/* User profile & Role switcher */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-surface-tertiary rounded-premium transition-all"
            >
              <img
                src={user.avatarUrl || 'https://via.placeholder.com/150'}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-brand-purple/20 object-cover"
              />
              <span className="hidden sm:inline text-xs font-semibold text-brand-navy max-w-[80px] truncate">
                {user.name}
              </span>
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 glass-strong shadow-modal rounded-premium border border-white/50 z-20 py-2"
                  >
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-bold text-brand-navy truncate">{user.name}</p>
                      <p className="text-xs text-text-tertiary truncate">{user.email || user.phone}</p>
                    </div>

                    {/* Role Switcher Options */}
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-[10px] font-bold text-text-tertiary tracking-wider uppercase mb-1.5">
                        Active Role
                      </p>
                      <div className="flex flex-col gap-1">
                        {user.roles.map((r) => (
                          <button
                            key={r}
                            onClick={() => handleRoleChange(r)}
                            className={`flex items-center justify-between px-2 py-1.5 text-xs font-semibold rounded-md transition-all
                              ${activeRole === r
                                ? 'bg-brand-purple/10 text-brand-purple'
                                : 'hover:bg-surface-tertiary text-text-secondary'
                              }
                            `}
                          >
                            <span className="capitalize">{r}</span>
                            {activeRole === r && <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-error hover:bg-error-light/40 transition-all text-left"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Desktop Sidebar & Main Workspace ────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for Desktop */}
        <aside className="hidden lg:flex w-64 glass border-r border-border flex-col p-4 gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-premium text-sm font-semibold transition-all duration-300
                  ${isActive
                    ? 'bg-brand-purple text-white shadow-premium'
                    : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </aside>

        {/* Responsive Mobile Drawer Navigation */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <div className="fixed inset-0 z-30 lg:hidden bg-brand-navy-dark/25 backdrop-blur-xs" onClick={() => setIsSidebarOpen(false)} />
              <motion.aside
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 w-64 z-40 bg-surface flex flex-col p-4 gap-2 border-r border-border shadow-modal"
              >
                <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="BizReels Logo" className="h-8 w-auto" />
                    <span className="text-lg font-bold text-brand-navy">BizReels</span>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-surface-tertiary rounded-full text-text-secondary">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-premium text-sm font-semibold transition-all
                        ${isActive
                          ? 'bg-brand-purple text-white shadow-premium'
                          : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom Mobile Bar (Tablets/Phones) ───────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-border z-30 flex justify-around py-3 px-2 shadow-modal">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-1.5 rounded-full relative transition-all duration-300
                ${isActive ? 'text-brand-purple' : 'text-text-tertiary hover:text-brand-purple'}
              `}
            >
              <Icon className="w-5.5 h-5.5" />
              {isActive && (
                <motion.span
                  layoutId="bottomBubble"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-brand-purple"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AppLayout;
