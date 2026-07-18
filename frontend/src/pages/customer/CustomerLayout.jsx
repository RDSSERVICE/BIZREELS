import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiHome, FiPlusSquare, FiSearch, FiBriefcase, FiVideo,
  FiActivity, FiFileText, FiBell, FiMessageSquare, FiSettings,
  FiMapPin, FiUser, FiLogOut, FiChevronDown, FiShield, FiRefreshCw,
  FiMenu, FiX, FiCheck
} from 'react-icons/fi';
import { useGetMeQuery, useSwitchRoleMutation } from '../../features/auth/authApi';
import { setCredentials, logout } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';

export default function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const { data: profileData } = useGetMeQuery(undefined, { pollingInterval: 30000 });
  const [switchRoleApi] = useSwitchRoleMutation();

  const user = profileData?.data?.user || profileData?.user || authUser || {};
  const roles = user.roles || ['customer'];
  const currentRole = user.current_role || user.activeRole || 'customer';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const userLoc = user.location || {};
  const displayLocation = userLoc.city || user.city
    ? `${userLoc.city || user.city}${userLoc.state ? `, ${userLoc.state}` : ''}`
    : 'Set Location';

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
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const address = data.address || {};

          const city = address.city || address.town || address.village || address.suburb || '';
          const district = address.state_district || address.county || address.city_district || '';
          const state = address.state || '';
          const pincode = address.postcode || '';
          const fullAddress = data.display_name || `${city}, ${state}`;

          const updateRes = await fetch('/api/v1/users/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
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
            })
          });

          if (updateRes.ok) {
            toast.success(`Location updated: ${city || state || 'Current Location'}`, { id: 'loc-toast' });
            window.location.reload();
          } else {
            toast.success(`Location found: ${city}, ${state}`, { id: 'loc-toast' });
          }
        } catch (err) {
          toast.error('Could not auto-fill location details', { id: 'loc-toast' });
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

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/auth/login');
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

  return (
    <div className="min-h-screen bg-surface-secondary text-text-primary flex flex-col font-sans relative overflow-x-hidden">
      {/* Decorative ambient background glows (Login & Admin template) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-purple/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-orange/10 blur-[100px] pointer-events-none" />

      {/* ── Top Header Navigation Bar ────────────────────────────── */}
      <header className="sticky top-0 z-40 glass border-b border-border px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-glass">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-white/10 transition"
          >
            {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>

          <Link to="/customer/home" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-premium group-hover:scale-105 transition-transform">
              <span className="font-black text-white text-lg font-display">B</span>
            </div>
            <span className="font-black text-xl text-text-primary font-display hidden sm:inline">
              Biz<span className="gradient-text font-black">Reels</span>
            </span>
          </Link>
        </div>

        {/* Center: Geolocation Pill */}
        <div className="flex items-center gap-2 glass border border-border px-3.5 py-1.5 rounded-full text-xs font-semibold text-text-secondary shadow-sm">
          <FiMapPin className="text-brand-orange shrink-0" size={15} />
          <span className="truncate max-w-[140px] sm:max-w-[220px]">{displayLocation}</span>
          <button
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="p-1 hover:bg-white/10 text-brand-purple rounded-full transition cursor-pointer"
            title="Autofill Current Geolocation"
          >
            <FiRefreshCw size={12} className={isLocating ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Right: Role Switcher & Profile */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple hover:bg-brand-purple/20 transition text-xs font-bold"
            >
              <FiShield className="text-brand-purple" size={14} />
              <span className="capitalize">{currentRole}</span>
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
                  {currentRole === 'customer' && <FiCheck className="text-emerald-500" size={14} />}
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
                  {currentRole === 'vendor' && <FiCheck className="text-emerald-500" size={14} />}
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
                  {currentRole === 'creator' && <FiCheck className="text-emerald-500" size={14} />}
                </button>

                {roles.includes('admin') && (
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-amber-500 hover:bg-amber-500/10 flex items-center justify-between"
                  >
                    <span>Admin Panel</span>
                    {currentRole === 'admin' && <FiCheck className="text-amber-500" size={14} />}
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/customer/settings')}
            className="w-9 h-9 rounded-full bg-surface border border-border overflow-hidden hover:border-brand-purple transition shrink-0"
          >
            {user.profile_pic ? (
              <img src={user.profile_pic} alt={user.name || 'User'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-purple font-bold text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden z-10">
        {/* Desktop Sidebar (Identical to Admin Sidebar) */}
        <aside className="hidden lg:flex flex-col w-64 glass border-r border-border p-4 shrink-0 overflow-y-auto">
          <div className="px-2 mb-3 text-[9px] font-bold text-text-tertiary uppercase tracking-widest">
            Customer Menu
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-purple text-white shadow-premium'
                      : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && (
                    <span className="gradient-brand text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition"
            >
              <FiLogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex">
            <div className="w-72 glass h-full p-4 border-r border-border flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center font-bold text-white">B</div>
                    <span className="font-bold text-lg text-text-primary font-display">BizReels</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-text-tertiary hover:text-text-primary">
                    <FiX size={20} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition ${
                          isActive
                            ? 'bg-brand-purple text-white shadow-premium'
                            : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition"
                >
                  <FiLogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        {/* Viewport Outlet */}
        <main className="flex-1 overflow-y-auto bg-surface-secondary/40 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
