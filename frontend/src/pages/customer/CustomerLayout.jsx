import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiTv, FiZap, FiCompass, FiShoppingBag, FiFilm,
  FiTrendingUp, FiCheckSquare, FiBell, FiMessageSquare, FiSettings,
  FiMapPin, FiUser, FiLogOut, FiChevronDown, FiChevronRight,
  FiShield, FiRefreshCw, FiMenu, FiX, FiCheck
} from 'react-icons/fi';
import { useGetMeQuery, useSwitchRoleMutation, useLogoutMutation } from '../../features/auth/authApi';
import { setCredentials, logout, updateUser, selectCurrentUser } from '../../features/auth/authSlice';
import { api, locationApi, tokenStore } from '../../lib/api';
import NotificationBellDropdown from '../../components/notifications/NotificationBellDropdown';

/**
 * CustomerLayout — Warm Editorial Bento-Brutalism layout for Customer Portal
 */
export default function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data: profileData, refetch: refetchProfile } = useGetMeQuery(undefined, {
    pollingInterval: 300000,
    skip: !user && !tokenStore.getUser(),
  });
  const [switchRoleApi] = useSwitchRoleMutation();
  const [logoutApi] = useLogoutMutation();

  const profileUser = profileData?.data?.user || profileData?.user || user || {};
  const roles = profileUser.roles || ['customer'];
  const currentRole = profileUser.current_role || profileUser.activeRole || 'customer';

  useEffect(() => {
    if (roles.includes('admin') || currentRole === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [roles, currentRole, navigate]);

  useEffect(() => {
    if (
      profileUser &&
      profileUser._id &&
      !profileUser.customerProfile?.interestsSelectedAt &&
      !location.pathname.includes('choose-interests') &&
      !location.pathname.includes('become-vendor') &&
      !location.pathname.includes('become-creator') &&
      !location.pathname.includes('settings')
    ) {
      navigate('/customer/choose-interests', { replace: true });
    }
  }, [profileUser, location.pathname, navigate]);

  const [activityCounts, setActivityCounts] = useState({ total: 0, unreadNotifications: 0, unreadChat: 0 });

  useEffect(() => {
    const fetchActivityCounts = async () => {
      try {
        const res = await api.get('/v1/users/me/activity-counts');
        const data = res.data || {};
        setActivityCounts({
          total: data.total || 0,
          unreadNotifications: data.unreadNotifications || 0,
          unreadChat: data.unreadChat || 0,
        });
      } catch {}
    };
    fetchActivityCounts();
    const interval = setInterval(fetchActivityCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const userLoc = profileUser.location || {};
  const displayLocation = userLoc.city || profileUser.city
    ? `${userLoc.city || profileUser.city}${userLoc.state ? `, ${userLoc.state}` : ''}`
    : 'Set Location';

  const toggleSection = (title) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    toast.loading('Fetching your location...', { id: 'loc-toast' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let city = '';
        let district = '';
        let state = '';
        let pincode = '';
        let fullAddress = '';

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept': 'application/json' } }
          );
          if (res.ok) {
            const data = await res.json();
            const address = data.address || {};
            city = address.city || address.town || address.village || address.suburb || '';
            district = address.state_district || address.county || address.city_district || '';
            state = address.state || '';
            pincode = address.postcode || '';
            fullAddress = data.display_name || `${city}, ${state}`;
          }
        } catch (e) {
          console.warn('Nominatim reverse-geocode failed, using backend fallback', e);
        }

        if (!city && !state) {
          try {
            const backendGeo = await locationApi.reverseGeocode(latitude, longitude);
            const geoData = backendGeo.data?.data || backendGeo.data || {};
            city = geoData.city || '';
            state = geoData.state || '';
            district = geoData.area || '';
            pincode = geoData.pincode || '';
            fullAddress = `${city}${state ? `, ${state}` : ''}`;
          } catch (e) {
            console.warn('Backend reverseGeocode fallback failed', e);
          }
        }

        try {
          const updateRes = await api.patch('/v1/users/me', {
            city,
            location: {
              type: 'Point',
              coordinates: [longitude, latitude],
              address: fullAddress,
              city,
              district,
              state,
              pincode
            }
          });

          const updatedUserData = updateRes.data?.data?.user || updateRes.data?.user || { city, location: { city, state } };
          dispatch(updateUser(updatedUserData));
          if (refetchProfile) refetchProfile();

          toast.success(`Location updated: ${city || state || 'Current Location'}`, { id: 'loc-toast' });
        } catch (err) {
          const errorMsg = err?.response?.data?.message || err?.message || 'Could not update location details';
          toast.error(`Location error: ${errorMsg}`, { id: 'loc-toast' });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        toast.error(`Location permission denied: ${error.message}`, { id: 'loc-toast' });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleRoleSwitch = async (targetRole) => {
    setIsRoleDropdownOpen(false);
    if (targetRole === currentRole) return;

    if (!roles.includes(targetRole)) {
      if (targetRole === 'vendor') navigate('/customer/become-vendor');
      else if (targetRole === 'creator') navigate('/customer/become-creator');
      return;
    }

    try {
      const res = await switchRoleApi({ role: targetRole }).unwrap();
      const updatedUser = res.user || res.data?.user || res;
      dispatch(setCredentials({ user: updatedUser }));
      toast.success(`Switched role to ${targetRole.toUpperCase()}`);
      if (targetRole === 'vendor') {
        if (updatedUser?.vendorProfile?.shopName) {
          navigate('/vendor/dashboard');
        } else {
          navigate('/customer/become-vendor');
        }
      } else if (targetRole === 'creator') {
        if (updatedUser?.creatorProfile?.displayName) {
          navigate('/creator/dashboard');
        } else {
          navigate('/customer/become-creator');
        }
      } else if (targetRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/home');
      }
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

  const menuItems = [
    { label: 'Home Feed', path: '/customer/home', icon: FiTv },
    { label: 'Post Requirement', path: '/customer/post-requirement', icon: FiZap },
    { label: 'Search Listings', path: '/customer/search', icon: FiCompass },
    {
      label: (roles.includes('vendor') && profileUser?.vendorProfile?.shopName) ? 'Vendor Portal' : 'Become a Vendor',
      path: (roles.includes('vendor') && profileUser?.vendorProfile?.shopName) ? '/vendor/dashboard' : '/customer/become-vendor',
      icon: FiShoppingBag,
      highlight: !(roles.includes('vendor') && profileUser?.vendorProfile?.shopName)
    },
    {
      label: (roles.includes('creator') && profileUser?.creatorProfile?.displayName) ? 'Creator Portal' : 'Become a Creator',
      path: (roles.includes('creator') && profileUser?.creatorProfile?.displayName) ? '/creator/dashboard' : '/customer/become-creator',
      icon: FiFilm,
      highlight: !(roles.includes('creator') && profileUser?.creatorProfile?.displayName)
    },
    { label: 'Activities', path: '/customer/activities', icon: FiTrendingUp, badge: activityCounts.total || 0 },
    { label: 'My Requirements', path: '/customer/my-requirements', icon: FiCheckSquare },
    { label: 'Notifications', path: '/customer/notifications', icon: FiBell, badge: activityCounts.unreadNotifications || 0 },
    { label: 'Chat', path: '/customer/chat', icon: FiMessageSquare, badge: activityCounts.unreadChat || 0 },
    { label: 'Settings', path: '/customer/settings', icon: FiSettings },
  ];

  const NAV_SECTIONS = [
    {
      title: 'Browse',
      items: menuItems.slice(0, 3),
    },
    {
      title: 'Portals',
      items: menuItems.slice(3, 5),
    },
    {
      title: 'My Account',
      items: menuItems.slice(5),
    },
  ];

  const SidebarContent = ({ onItemClick }) => (
    <div className="flex flex-col h-full bg-white font-sans border-r border-[#e3dccb]">
      {/* Brand Header */}
      <div className="px-4 py-4 border-b border-[#e3dccb] flex items-center justify-between">
        <Link to="/customer/home" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="BizReels Logo" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" />
          <div>
            <span className="text-sm font-black text-[#1a1a1a] block leading-tight font-heading">
              Biz<span className="gradient-text font-black">Reels</span>
            </span>
            <span className="text-[9px] font-extrabold text-[#d99a3d] uppercase tracking-widest block">Customer Portal</span>
          </div>
        </Link>
      </div>

      {/* Nav Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {NAV_SECTIONS.map((section) => {
          const isCollapsed = collapsedSections[section.title];

          return (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-[#1a1a1a] transition-all cursor-pointer border-none bg-transparent"
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
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden space-y-1 mt-1"
                  >
                    {section.items.map((item) => {
                      const isActive = location.pathname.startsWith(item.path);
                      const Icon = item.icon;

                      const handleClick = (e) => {
                        onItemClick?.();
                        if (item.path.startsWith('/vendor/')) {
                          handleRoleSwitch('vendor');
                        } else if (item.path.startsWith('/creator/')) {
                          handleRoleSwitch('creator');
                        }
                      };

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={handleClick}
                          className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold transition-all duration-150 ${
                            isActive
                              ? 'bg-[#241b15] text-[#d99a3d] border border-[#241b15] shadow-xs'
                              : 'text-slate-700 hover:bg-[#f8f4ec] hover:text-[#1a1a1a]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Framed Icon Box */}
                            <div className={`w-6 h-6 rounded flex items-center justify-center border ${
                              isActive
                                ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#d99a3d]'
                                : 'bg-[#f8f4ec] text-[#1a1a1a] border-[#e3dccb]'
                            }`}>
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            </div>
                            <span className="truncate">{item.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {item.highlight && (
                              <span className="bg-[#d99a3d] text-[#1a1a1a] text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                NEW
                              </span>
                            )}
                            {item.badge > 0 && (
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center ${
                                isActive
                                  ? 'bg-[#d99a3d] text-[#1a1a1a]'
                                  : 'bg-[#241b15] text-[#d99a3d]'
                              }`}>
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </div>
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
      <div className="border-t border-[#e3dccb] px-4 py-3 bg-[#f8f4ec]">
        <div className="flex items-center gap-2.5 mb-3">
          {profileUser.profile_pic ? (
            <img
              src={profileUser.profile_pic}
              alt={profileUser.name || 'User'}
              className="w-8 h-8 rounded-full object-cover border-2 border-[#d99a3d] bg-white"
            />
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-[#d99a3d] bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-bold text-xs">
              {profileUser.name ? profileUser.name.charAt(0).toUpperCase() : <FiUser />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-[#1a1a1a] truncate">{profileUser?.name || 'Customer'}</p>
            <p className="text-[10px] text-slate-500 truncate">{profileUser?.email || profileUser?.phone || 'customer'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition border border-rose-200 cursor-pointer"
        >
          <FiLogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2ede4] flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-white border-r border-[#e3dccb] fixed top-0 bottom-0 left-0 z-30">
        <SidebarContent onItemClick={() => { }} />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] z-50 bg-white border-r border-[#e3dccb] shadow-2xl lg:hidden"
            >
              <SidebarContent onItemClick={() => setIsSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-[#f2ede4]/95 backdrop-blur-xs border-b border-[#e3dccb] px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-white rounded-md lg:hidden text-[#1a1a1a] flex-shrink-0 border border-[#e3dccb] bg-white/50"
            >
              {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <img src="/logo.png" alt="BizReels Logo" className="h-7 w-auto lg:hidden flex-shrink-0" />
              <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm text-[#1a1a1a] uppercase tracking-wide hidden md:block">
                CUSTOMER PORTAL
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Geolocation Pill */}
            <div className="hidden md:flex items-center gap-2 bg-white border border-[#e3dccb] px-3 py-1.5 rounded-full text-xs font-bold text-[#1a1a1a] shadow-xs">
              <FiMapPin className="text-[#d99a3d] shrink-0" size={14} />
              <span className="truncate max-w-[140px] lg:max-w-[220px]">{displayLocation}</span>
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="p-1 hover:bg-slate-100 text-[#1a1a1a] rounded-full transition cursor-pointer border-none bg-transparent"
                title="Autofill Current Geolocation"
              >
                <FiRefreshCw size={12} className={isLocating ? 'animate-spin text-[#d99a3d]' : ''} />
              </button>
            </div>

            {/* Mobile Location Button */}
            <button
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="md:hidden p-1.5 bg-white border border-[#e3dccb] rounded-md text-[#1a1a1a] flex-shrink-0 cursor-pointer"
              title="Set Location"
            >
              <FiMapPin size={16} className={`text-[#d99a3d] ${isLocating ? 'animate-spin' : ''}`} />
            </button>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#241b15] border border-[#241b15] text-[#d99a3d] hover:bg-[#342820] transition text-xs font-extrabold cursor-pointer"
              >
                <FiShield className="text-[#d99a3d] flex-shrink-0" size={13} />
                <span className="uppercase hidden sm:inline">CUSTOMER</span>
                <FiChevronDown size={13} />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-[#e3dccb] rounded-md shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 font-sans">
                  <div className="px-3 py-1.5 border-b border-[#e3dccb] text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Switch Active Role
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('customer')}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-[#1a1a1a] hover:bg-[#f8f4ec] flex items-center justify-between cursor-pointer border-none bg-transparent"
                  >
                    <span>Customer</span>
                    <FiCheck className="text-emerald-600" size={14} />
                  </button>

                  <button
                    onClick={() => handleRoleSwitch('vendor')}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-[#1a1a1a] hover:bg-[#f8f4ec] flex items-center justify-between cursor-pointer border-none bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <span>Vendor</span>
                      {!roles.includes('vendor') && (
                        <span className="bg-[#d99a3d] text-[#1a1a1a] text-[9px] px-1.5 py-0.2 rounded font-black uppercase">Join</span>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleSwitch('creator')}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-[#1a1a1a] hover:bg-[#f8f4ec] flex items-center justify-between cursor-pointer border-none bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <span>Creator</span>
                      {!roles.includes('creator') && (
                        <span className="bg-[#d99a3d] text-[#1a1a1a] text-[9px] px-1.5 py-0.2 rounded font-black uppercase">Join</span>
                      )}
                    </div>
                  </button>
                </div>
              )}
            </div>

            <NotificationBellDropdown role="customer" />

            {/* Profile Avatar */}
            <button
              onClick={() => navigate('/customer/settings')}
              className="w-8 h-8 rounded-full bg-white border-2 border-[#d99a3d] overflow-hidden transition shrink-0 cursor-pointer p-0"
            >
              {profileUser.profile_pic ? (
                <img src={profileUser.profile_pic} alt={profileUser.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#1a1a1a] font-bold text-xs bg-[#f8f4ec]">
                  {profileUser.name ? profileUser.name.charAt(0).toUpperCase() : <FiUser />}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Page Main Viewport */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Tablets & Phones) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#e3dccb] z-40 flex items-center justify-around py-1.5 px-2 shadow-lg font-sans">
        <Link
          to="/customer/home"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition ${
            location.pathname === '/customer/home' ? 'text-[#d99a3d]' : 'text-slate-500 hover:text-[#1a1a1a]'
          }`}
        >
          <FiTv size={18} />
          <span>Feed</span>
        </Link>

        <Link
          to="/customer/search"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition ${
            location.pathname === '/customer/search' ? 'text-[#d99a3d]' : 'text-slate-500 hover:text-[#1a1a1a]'
          }`}
        >
          <FiCompass size={18} />
          <span>Search</span>
        </Link>

        <Link
          to="/customer/post-requirement"
          className="flex flex-col items-center gap-0.5 text-[10px] font-extrabold -mt-4"
        >
          <div className="w-10 h-10 rounded-full bg-[#241b15] text-[#d99a3d] border-2 border-[#d99a3d] flex items-center justify-center shadow-md">
            <FiZap size={18} />
          </div>
          <span className="text-[#1a1a1a]">Post</span>
        </Link>

        <Link
          to="/customer/activities"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition ${
            location.pathname === '/customer/activities' ? 'text-[#d99a3d]' : 'text-slate-500 hover:text-[#1a1a1a]'
          }`}
        >
          <FiTrendingUp size={18} />
          <span>Activity</span>
        </Link>

        <Link
          to="/customer/settings"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold transition ${
            location.pathname === '/customer/settings' ? 'text-[#d99a3d]' : 'text-slate-500 hover:text-[#1a1a1a]'
          }`}
        >
          <FiSettings size={18} />
          <span>Account</span>
        </Link>
      </nav>
    </div>
  );
}