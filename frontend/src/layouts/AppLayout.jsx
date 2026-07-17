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
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

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

  const handleBecomeVendor = () => {
    if (user?.roles.includes('vendor')) {
      handleRoleChange('vendor');
    } else {
      navigate(`/profile/${user._id}?activate=vendor`);
    }
  };

  const handleBecomeCreator = () => {
    if (user?.roles.includes('creator')) {
      handleRoleChange('creator');
    } else {
      navigate(`/profile/${user._id}?activate=creator`);
    }
  };

  // Sidebar Menu Items based on Active Role
  const getNavItems = () => {
    const items = [
      { name: 'Home', path: '/feed', icon: FiHome },
      { name: 'Discover', path: '/search', icon: FiSearch },
    ];

    if (activeRole === 'vendor') {
      items.push({ name: 'Dashboard', path: '/vendor/dashboard', icon: FiGrid });
    } else if (activeRole === 'creator') {
      items.push({ name: 'Dashboard', path: '/creator/dashboard', icon: FiGrid });
    } else if (activeRole === 'customer') {
      items.push({ name: 'Post Requirement', path: '/requirements/new', icon: FiPlusSquare });
      items.push({ name: 'Activities', path: '/activities', icon: FiLayers });
      if (!user?.roles.includes('vendor')) {
        items.push({ name: 'Become a Vendor', action: handleBecomeVendor, icon: FiBriefcase });
      }
      if (!user?.roles.includes('creator')) {
        items.push({ name: 'Become a Creator', action: handleBecomeCreator, icon: FiVideo });
      }
    } else if (activeRole === 'admin') {
      items.push({ name: 'Admin Panel', path: '/admin/dashboard', icon: FiGrid });
    }

    items.push(
      { name: 'Notifications', path: '/notifications', icon: FiBell },
      { name: 'Chats', path: '/chats', icon: FiMessageSquare },
      { name: 'Wallet', path: '/wallet', icon: FiBriefcase },
      { name: 'Subscription', path: '/subscription', icon: FiSettings },
      { name: 'Settings', path: '/settings', icon: FiSettings },
      { name: 'My Profile', path: `/profile/${user._id}`, icon: FiUser }
    );

    return items;
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

                    <Link
                      to="/settings"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-text-secondary hover:bg-surface-tertiary transition-all"
                    >
                      <FiSettings className="w-4 h-4" />
                      Account Settings
                    </Link>

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
        <aside className="hidden lg:flex w-64 glass border-r border-border flex-col p-4 gap-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path && location.pathname + location.search === item.path);
            const Icon = item.icon;
            if (item.action) {
              return (
                <button
                  key={item.name}
                  onClick={item.action}
                  className="flex items-center gap-3 px-4 py-3 rounded-premium text-sm font-semibold transition-all duration-300 text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple text-left w-full cursor-pointer"
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            }
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
                  const isActive = location.pathname === item.path || (item.path && location.pathname + location.search === item.path);
                  const Icon = item.icon;
                  if (item.action) {
                    return (
                      <button
                        key={item.name}
                        onClick={() => { item.action(); setIsSidebarOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 rounded-premium text-sm font-semibold transition-all text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple text-left w-full cursor-pointer"
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.name}</span>
                      </button>
                    );
                  }
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-border z-30 flex justify-around items-center py-2.5 px-2 shadow-modal">
        {/* Home */}
        <Link
          to="/feed"
          className={`flex flex-col items-center justify-center p-1.5 rounded-full transition-all duration-300
            ${location.pathname === '/feed' ? 'text-brand-purple' : 'text-text-tertiary hover:text-brand-purple'}
          `}
        >
          <FiHome className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold mt-0.5">Home</span>
        </Link>

        {/* Search */}
        <Link
          to="/search"
          className={`flex flex-col items-center justify-center p-1.5 rounded-full transition-all duration-300
            ${location.pathname === '/search' ? 'text-brand-purple' : 'text-text-tertiary hover:text-brand-purple'}
          `}
        >
          <FiSearch className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold mt-0.5">Search</span>
        </Link>

        {/* Dynamic Plus Center Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
            className="flex flex-col items-center justify-center w-11 h-11 rounded-full bg-brand-purple text-white shadow-premium hover:bg-brand-purple-800 transition-all cursor-pointer border border-brand-purple/20"
          >
            <FiPlusSquare className={`w-6 h-6 transition-transform duration-300 ${isPlusMenuOpen ? 'rotate-45' : ''}`} />
          </button>

          <AnimatePresence>
            {isPlusMenuOpen && (
              <>
                {/* Backdrop overlay */}
                <div
                  className="fixed inset-0 z-40 bg-black/5"
                  onClick={() => setIsPlusMenuOpen(false)}
                />
                
                {/* Plus Popup Options */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 15 }}
                  className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-48 bg-white/95 backdrop-blur-md border border-slate-200/50 shadow-modal rounded-2xl py-2 z-50 flex flex-col gap-0.5"
                >
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center py-1 border-b border-slate-100">
                    {activeRole} actions
                  </p>
                  
                  {activeRole === 'customer' && (
                    <button
                      onClick={() => { navigate('/requirements/new'); setIsPlusMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-brand-navy hover:bg-brand-purple/5 hover:text-brand-purple transition-all text-left"
                    >
                      + Post Requirement
                    </button>
                  )}

                  {activeRole === 'vendor' && (
                    <>
                      <button
                        onClick={() => { navigate('/vendor/dashboard?tab=listings&action=add-product'); setIsPlusMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-brand-navy hover:bg-brand-purple/5 hover:text-brand-purple transition-all text-left"
                      >
                        + Upload Product
                      </button>
                      <button
                        onClick={() => { navigate('/vendor/dashboard?tab=listings&action=add-service'); setIsPlusMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-brand-navy hover:bg-brand-purple/5 hover:text-brand-purple transition-all text-left"
                      >
                        + Upload Service
                      </button>
                      <button
                        onClick={() => { navigate('/reels/upload'); setIsPlusMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-brand-navy hover:bg-brand-purple/5 hover:text-brand-purple transition-all text-left"
                      >
                        + Upload Reel
                      </button>
                      <button
                        onClick={() => { navigate('/live'); setIsPlusMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-brand-navy hover:bg-brand-purple/5 hover:text-brand-purple transition-all text-left"
                      >
                        + Live Broadcast
                      </button>
                    </>
                  )}

                  {activeRole === 'creator' && (
                    <>
                      <button
                        onClick={() => { navigate('/creator/dashboard?tab=portfolio&action=upload'); setIsPlusMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-brand-navy hover:bg-brand-purple/5 hover:text-brand-purple transition-all text-left"
                      >
                        + Upload Portfolio
                      </button>
                      <button
                        onClick={() => { navigate('/creator/marketplace'); setIsPlusMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-brand-navy hover:bg-brand-purple/5 hover:text-brand-purple transition-all text-left"
                      >
                        + Apply Project
                      </button>
                      <button
                        onClick={() => { navigate('/reels/upload'); setIsPlusMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-brand-navy hover:bg-brand-purple/5 hover:text-brand-purple transition-all text-left"
                      >
                        + Upload Reel Sample
                      </button>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Chat */}
        <Link
          to="/chats"
          className={`flex flex-col items-center justify-center p-1.5 rounded-full transition-all duration-300
            ${location.pathname === '/chats' ? 'text-brand-purple' : 'text-text-tertiary hover:text-brand-purple'}
          `}
        >
          <FiMessageSquare className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold mt-0.5">Chat</span>
        </Link>

        {/* Account Profile */}
        <Link
          to={`/profile/${user._id}`}
          className={`flex flex-col items-center justify-center p-1.5 rounded-full transition-all duration-300
            ${location.pathname.startsWith('/profile') ? 'text-brand-purple' : 'text-text-tertiary hover:text-brand-purple'}
          `}
        >
          <FiUser className="w-5.5 h-5.5" />
          <span className="text-[9px] font-bold mt-0.5">Account</span>
        </Link>
      </nav>
    </div>
  );
};

export default AppLayout;
