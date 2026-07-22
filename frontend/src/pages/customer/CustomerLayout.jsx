import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiHome, FiPlusSquare, FiSearch, FiBriefcase, FiVideo,
  FiActivity, FiFileText, FiBell, FiMessageSquare, FiSettings,
  FiMapPin, FiUser, FiLogOut, FiChevronDown, FiChevronRight,
  FiShield, FiRefreshCw, FiMenu, FiX, FiCheck
} from 'react-icons/fi';
import { useGetMeQuery, useSwitchRoleMutation, useLogoutMutation } from '../../features/auth/authApi';
import { setCredentials, logout, updateUser, selectCurrentUser } from '../../features/auth/authSlice';
import { api, locationApi, tokenStore } from '../../lib/api';
import NotificationBellDropdown from '../../components/notifications/NotificationBellDropdown';

/**
 * CustomerLayout — Admin-style fixed sidebar layout for Customer Portal
 */
export default function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data: profileData, refetch: refetchProfile } = useGetMeQuery(undefined, {
    pollingInterval: 300000,
    skip: !user && !tokenStore.getAccess(),
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
        toast.error(`Location permission denied or error: ${error.message}`, { id: 'loc-toast' });
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
      dispatch(setCredentials({ user: res.user || res.data?.user }));
      toast.success(`Switched role to ${targetRole.toUpperCase()}`);
      if (targetRole === 'vendor') navigate('/vendor/dashboard');
      else if (targetRole === 'creator') navigate('/creator/dashboard');
      else if (targetRole === 'admin') navigate('/admin/dashboard');
      else navigate('/customer/home');
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
    { label: 'Home Feed', path: '/customer/home', icon: FiHome },
    { label: 'Post Requirement', path: '/customer/post-requirement', icon: FiPlusSquare },
    { label: 'Search Listings', path: '/customer/search', icon: FiSearch },
    {
      label: roles.includes('vendor') ? 'Vendor Portal' : 'Become a Vendor',
      path: roles.includes('vendor') ? '/vendor/dashboard' : '/customer/become-vendor',
      icon: FiBriefcase,
      highlight: !roles.includes('vendor')
    },
    {
      label: roles.includes('creator') ? 'Creator Portal' : 'Become a Creator',
      path: roles.includes('creator') ? '/creator/dashboard' : '/customer/become-creator',
      icon: FiVideo,
      highlight: !roles.includes('creator')
    },
    { label: 'Activities', path: '/customer/activities', icon: FiActivity },
    { label: 'My Requirements', path: '/customer/my-requirements', icon: FiFileText },
    { label: 'Notifications', path: '/customer/notifications', icon: FiBell },
    { label: 'Chat', path: '/customer/chat', icon: FiMessageSquare },
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
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="px-4 py-4 border-b border-border flex items-center gap-3">
        <Link to="/customer/home" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="BizReels Logo" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" />
          <div>
            <span className="text-sm font-black text-text-primary font-display block leading-tight">
              Biz<span className="gradient-text font-black">Reels</span>
            </span>
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest block">Customer Portal</span>
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
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 mb-0.5 ${
                            isActive
                              ? 'bg-brand-purple text-white shadow-premium'
                              : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.highlight && (
                            <span className="gradient-brand text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              NEW
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
          {profileUser.profile_pic ? (
            <img
              src={profileUser.profile_pic}
              alt={profileUser.name || 'User'}
              className="w-9 h-9 rounded-full object-cover border border-brand-purple/20 bg-white p-0.5 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-full border border-brand-purple/20 bg-brand-purple/10 flex items-center justify-center text-brand-purple font-bold text-sm shadow-sm">
              {profileUser.name ? profileUser.name.charAt(0).toUpperCase() : <FiUser />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-primary truncate">{profileUser?.name || 'Customer'}</p>
            <p className="text-[10px] text-text-tertiary truncate">{profileUser?.email || profileUser?.phone || 'customer'}</p>
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
              <h1 className="text-sm font-bold text-text-primary font-display">Customer Portal</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Location Pill */}
            <div className="hidden sm:flex items-center gap-2 glass border border-border px-3.5 py-1.5 rounded-full text-xs font-semibold text-text-secondary shadow-sm">
              <FiMapPin className="text-brand-orange shrink-0" size={15} />
              <span className="truncate max-w-[140px] sm:max-w-[220px]">{displayLocation}</span>
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="p-1 hover:bg-surface-tertiary text-brand-purple rounded-full transition cursor-pointer"
                title="Autofill Current Geolocation"
              >
                <FiRefreshCw size={12} className={isLocating ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple hover:bg-brand-purple/20 transition text-xs font-bold"
              >
                <FiShield className="text-brand-purple" size={14} />
                <span className="capitalize">Customer</span>
                <FiChevronDown size={14} />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 glass border border-border rounded-2xl shadow-premium py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-border text-[9px] font-bold text-text-tertiary uppercase tracking-widest">
                    Switch Active Role
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('customer')}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-text-primary hover:bg-brand-purple/5 flex items-center justify-between"
                  >
                    <span>Customer</span>
                    <FiCheck className="text-emerald-500" size={14} />
                  </button>

                  <button
                    onClick={() => handleRoleSwitch('vendor')}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-text-primary hover:bg-brand-purple/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span>Vendor</span>
                      {!roles.includes('vendor') && (
                        <span className="bg-brand-orange/10 text-brand-orange text-[9px] px-1.5 py-0.5 rounded font-bold">Join</span>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleSwitch('creator')}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-text-primary hover:bg-brand-purple/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span>Creator</span>
                      {!roles.includes('creator') && (
                        <span className="bg-brand-pink/10 text-brand-pink text-[9px] px-1.5 py-0.5 rounded font-bold">Join</span>
                      )}
                    </div>
                  </button>
                </div>
              )}
            </div>

            <NotificationBellDropdown role="customer" />

            {/* Profile */}
            <button
              onClick={() => navigate('/customer/settings')}
              className="w-9 h-9 rounded-full bg-surface border border-border overflow-hidden hover:border-brand-purple transition shrink-0"
            >
              {profileUser.profile_pic ? (
                <img src={profileUser.profile_pic} alt={profileUser.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-purple font-bold text-sm">
                  {profileUser.name ? profileUser.name.charAt(0).toUpperCase() : <FiUser />}
                </div>
              )}
            </button>
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
