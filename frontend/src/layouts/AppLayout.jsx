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
  FiUserCheck,
  FiUsers,
  FiAlertTriangle,
  FiShield,
  FiCheckSquare,
  FiTrendingUp,
  FiZap,
  FiCompass,
  FiShoppingBag,
  FiFilm
} from 'react-icons/fi';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectActiveRole,
  logout,
  setActiveRole,
  setCredentials
} from '../features/auth/authSlice';
import { useSwitchRoleMutation, useLogoutMutation, useAddRoleMutation } from '../features/auth/authApi';
import { isOnboardingComplete, getRoleDashboard, getRoleOnboarding } from '../lib/roleNav';
import Button from '../components/common/Button';

/**
 * Main application layout enclosing feed, search, messaging, profile, dashboard.
 * Styled according to Warm Editorial Bento-Brutalism design system.
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
  const [addRoleApi] = useAddRoleMutation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  if (!isAuthenticated || !user) {
    navigate('/auth/login', { replace: true });
    return null;
  }

  if (activeRole === 'admin') {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  const handleRoleChange = async (newRole) => {
    try {
      const hasRole = user.roles.includes(newRole);
      if (!hasRole) {
        toast.loading(`Activating ${newRole} role...`, { id: 'role-switch' });
        await addRoleApi({ role: newRole }).unwrap();
      } else {
        toast.loading(`Switching to ${newRole}...`, { id: 'role-switch' });
      }

      const res = await switchRoleApi({ role: newRole }).unwrap();
      const resData = res.data || res;
      const updatedUser = resData.user || res.user || user;
      dispatch(setCredentials({ user: updatedUser }));
      dispatch(setActiveRole(newRole));
      setIsProfileMenuOpen(false);
      toast.success(`Active role is now ${newRole.toUpperCase()}`, { id: 'role-switch' });

      const destination = resData.redirectTo || (
        resData.isOnboardingRequired
          ? resData.targetOnboardingPath
          : (resData.targetDashboardPath || (isOnboardingComplete(updatedUser, newRole) ? getRoleDashboard(newRole) : getRoleOnboarding(newRole)))
      );
      navigate(destination);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to switch role.', { id: 'role-switch' });
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

  const getNavSections = () => {
    if (activeRole === 'admin') {
      return [
        {
          title: 'Admin Control',
          items: [
            { name: 'Admin Panel', path: '/admin/dashboard', icon: FiGrid },
            { name: 'Home Feed', path: '/feed', icon: FiTv },
            { name: 'Discover', path: '/search', icon: FiCompass },
            { name: 'Settings', path: '/settings', icon: FiSettings },
          ]
        }
      ];
    }

    const dashboardPath = activeRole === 'vendor' ? '/vendor/dashboard' : activeRole === 'creator' ? '/creator/dashboard' : '/customer/dashboard';

    return [
      {
        title: 'Overview',
        items: [
          { name: 'Home Feed', path: '/feed', icon: FiTv },
          { name: 'Discover', path: '/search', icon: FiCompass },
          { name: 'Dashboard', path: dashboardPath, icon: FiGrid },
        ]
      },
      {
        title: 'Activity',
        items: [
          { name: 'Notifications', path: '/notifications', icon: FiBell },
          { name: 'Chats & Messages', path: '/chats', icon: FiMessageSquare },
          ...(activeRole !== 'customer' ? [{ name: 'Wallet & Payouts', path: '/wallet', icon: FiBriefcase }] : []),
          { name: 'Subscription', path: '/subscription', icon: FiShield },
        ]
      },
      {
        title: 'Account',
        items: [
          { name: 'Settings', path: '/settings', icon: FiSettings },
          { name: 'My Profile', path: `/profile/${user._id}`, icon: FiUser }
        ]
      }
    ];
  };

  const navSections = getNavSections();
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  const handleHeaderSearchSubmit = (e) => {
    e.preventDefault();
    if (headerSearchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(headerSearchQuery.trim())}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f2ede4] flex flex-col font-sans">
      {/* ── Top Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-[#f2ede4]/95 border-b border-[#e3dccb] px-4 md:px-6 py-2.5 flex items-center justify-between backdrop-blur-xs">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white rounded-md lg:hidden text-[#1a1a1a] transition-colors border border-[#e3dccb] bg-white/50"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
          
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="BizReels Logo" className="h-9 w-auto transition-transform group-hover:scale-105" />
            <span className="hidden sm:inline text-xl font-heading font-extrabold tracking-tight text-[#1a1a1a]">
              Biz<span className="gradient-text font-black">Reels</span>
            </span>
          </Link>

          {/* Role badge indicator in header */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-[#1c1a17] text-[#d99a3d] border border-[#1c1a17]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d99a3d]" />
            <span>{activeRole} Mode</span>
          </div>
        </div>

        {/* Global Quick Search Bar */}
        <form onSubmit={handleHeaderSearchSubmit} className="hidden md:flex flex-1 max-w-xs mx-6 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={headerSearchQuery}
            onChange={(e) => setHeaderSearchQuery(e.target.value)}
            placeholder="Search products, creators, reels..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-[#e3dccb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d99a3d]/40 text-[#1a1a1a] placeholder-slate-400 transition-all shadow-xs"
          />
        </form>

        <div className="flex items-center gap-3">
          {/* Notifications button */}
          <Link
            to="/notifications"
            className="p-2 text-[#1a1a1a] hover:bg-white rounded-md border border-[#e3dccb] transition-all relative"
            title="Notifications"
          >
            <FiBell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d99a3d] ring-2 ring-white" />
          </Link>

          {/* User profile & Role switcher */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 hover:bg-white rounded-md transition-all border border-transparent hover:border-[#e3dccb]"
            >
              <img
                src={user.avatarUrl || 'https://via.placeholder.com/150'}
                alt={user.name}
                className="w-8 h-8 rounded-full border-2 border-[#d99a3d] object-cover shadow-xs"
              />
              <div className="hidden sm:flex flex-col items-start text-left pr-1">
                <span className="text-xs font-extrabold text-[#1a1a1a] max-w-[100px] truncate leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] font-bold text-slate-500 capitalize">
                  {activeRole}
                </span>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-60 bg-white shadow-xl rounded-md border border-[#e3dccb] z-20 py-2 divide-y divide-[#e3dccb] font-sans"
                  >
                    <div className="px-4 py-2.5">
                      <p className="text-sm font-extrabold text-[#1a1a1a] truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email || user.phone}</p>
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#241b15] text-[#d99a3d] uppercase">
                        Active Role: {activeRole}
                      </div>
                    </div>

                    {activeRole !== 'admin' && (
                      <div className="px-3 py-2">
                        <p className="px-1 text-[9.5px] font-extrabold text-slate-400 tracking-wider uppercase mb-1">
                          Switch Role Context
                        </p>
                        <div className="flex flex-col gap-1">
                          {['customer', 'vendor', 'creator'].map((r) => {
                            const hasRole = user.roles.includes(r);
                            return (
                              <button
                                key={r}
                                onClick={() => handleRoleChange(r)}
                                className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-bold rounded transition-all cursor-pointer border-none ${
                                  activeRole === r
                                    ? 'bg-[#241b15] text-[#d99a3d]'
                                    : 'hover:bg-[#f8f4ec] text-slate-700 bg-transparent'
                                }`}
                              >
                                <span className="capitalize">{r}</span>
                                {activeRole === r ? (
                                  <span className="w-2 h-2 rounded-full bg-[#d99a3d]" />
                                ) : !hasRole ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#d99a3d] text-[#1a1a1a] font-extrabold uppercase">
                                    Activate
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="py-1">
                      <Link
                        to="/settings"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-[#f8f4ec] transition-all"
                      >
                        <FiSettings className="w-4 h-4 text-slate-400" />
                        Account Settings
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all text-left border-none bg-transparent cursor-pointer"
                      >
                        <FiLogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Desktop Sidebar & Main Workspace ────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Grouped Sidebar for Desktop */}
        <aside className="hidden lg:flex w-64 bg-white border-r border-[#e3dccb] flex-col p-4 gap-5 overflow-y-auto">
          {navSections.map((section, idx) => (
            <div key={idx} className="flex flex-col gap-1.5">
              <span className="px-2 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                {section.title}
              </span>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path && location.pathname + location.search === item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? 'bg-[#241b15] text-[#d99a3d] border border-[#241b15] shadow-xs'
                        : 'text-slate-700 hover:bg-[#f8f4ec] hover:text-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded flex items-center justify-center border ${
                        isActive
                          ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#d99a3d]'
                          : 'bg-[#f8f4ec] text-[#1a1a1a] border-[#e3dccb]'
                      }`}>
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      </div>
                      <span>{item.name}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d99a3d]" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Responsive Mobile Drawer Navigation */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <div
                className="fixed inset-0 z-30 lg:hidden bg-black/40 backdrop-blur-xs"
                onClick={() => setIsSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed top-0 bottom-0 left-0 w-72 z-40 bg-white flex flex-col p-5 gap-5 border-r border-[#e3dccb] shadow-2xl overflow-y-auto font-sans"
              >
                <div className="flex items-center justify-between pb-4 border-b border-[#e3dccb]">
                  <div className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="BizReels Logo" className="h-8 w-auto" />
                    <span className="text-lg font-heading font-extrabold text-[#1a1a1a]">
                      Biz<span className="gradient-text font-black">Reels</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {navSections.map((section, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <span className="px-2 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                      {section.title}
                    </span>
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path || (item.path && location.pathname + location.search === item.path);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-[#241b15] text-[#d99a3d] border border-[#241b15]'
                              : 'text-slate-700 hover:bg-[#f8f4ec]'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded flex items-center justify-center border ${
                            isActive
                              ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#d99a3d]'
                              : 'bg-[#f8f4ec] text-[#1a1a1a] border-[#e3dccb]'
                          }`}>
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          </div>
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom Mobile Bar (Tablets/Phones) ───────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 border-t border-[#e3dccb] z-30 flex justify-around items-center py-2 px-2 shadow-lg backdrop-blur-xs">
        <Link to="/feed" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${location.pathname === '/feed' ? 'text-[#d99a3d]' : 'text-slate-500'}`}>
          <FiTv size={18} />
          <span>Feed</span>
        </Link>
        <Link to="/search" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${location.pathname === '/search' ? 'text-[#d99a3d]' : 'text-slate-500'}`}>
          <FiCompass size={18} />
          <span>Discover</span>
        </Link>
        <Link to="/chats" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${location.pathname === '/chats' ? 'text-[#d99a3d]' : 'text-slate-500'}`}>
          <FiMessageSquare size={18} />
          <span>Chats</span>
        </Link>
        <Link to="/notifications" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${location.pathname === '/notifications' ? 'text-[#d99a3d]' : 'text-slate-500'}`}>
          <FiBell size={18} />
          <span>Alerts</span>
        </Link>
      </nav>
    </div>
  );
};

export default AppLayout;
