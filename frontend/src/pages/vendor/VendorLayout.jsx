import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiGrid, FiUser, FiPackage, FiVideo, FiZap, FiInbox, FiShoppingCart,
  FiPieChart, FiCreditCard, FiDollarSign, FiStar, FiUserCheck, FiSettings,
  FiShield, FiLogOut, FiMenu, FiX, FiBell, FiChevronDown, FiChevronRight,
  FiCheckCircle, FiMessageSquare, FiCheck, FiFileText, FiTv, FiFilm, FiGlobe
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import { useGetMeQuery, useSwitchRoleMutation, useLogoutMutation } from '../../features/auth/authApi';
import { setCredentials, logout, selectCurrentUser, setActiveRole } from '../../features/auth/authSlice';
import { api, tokenStore, resolveMediaUrl } from '../../lib/api';
import NotificationBellDropdown from '../../components/notifications/NotificationBellDropdown';
import { useLanguage } from '../../context/LanguageContext';

/**
 * VendorLayout — Warm Editorial Bento-Brutalism layout for Vendor Portal
 */
export default function VendorLayout() {
  const { lang, toggleLang, bi, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data: profileRes } = useGetMeQuery(undefined, {
    pollingInterval: 300000,
    skip: !user && !tokenStore.getUser(),
  });
  const [switchRoleApi] = useSwitchRoleMutation();
  const [logoutApi] = useLogoutMutation();

  const profileUser = profileRes?.data?.user || profileRes?.user || user || {};
  const vendorProfile = profileUser.vendorProfile || {};
  const roles = profileUser.roles || ['customer'];
  const currentRole = 'vendor';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roleDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isRoleDropdownOpen]);

  useEffect(() => {
    if (roles.includes('vendor') && currentRole !== 'vendor') {
      dispatch(setActiveRole('vendor'));
    }
  }, [roles, currentRole, dispatch]);

  const [isShopClosed, setIsShopClosed] = useState(vendorProfile.isClosed || false);

  const toggleSection = (title) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleRoleSwitch = async (targetRole) => {
    setIsRoleDropdownOpen(false);
    if (targetRole === currentRole) return;

    const userRoles = profileUser.roles || roles || ['vendor'];
    const hasTargetRole = userRoles.includes(targetRole);

    if (!hasTargetRole) {
      if (targetRole === 'vendor') navigate('/vendor/onboarding');
      else if (targetRole === 'creator') navigate('/creator/onboarding');
      return;
    }

    try {
      const res = await switchRoleApi({ role: targetRole }).unwrap();
      const updatedUser = res.user || res.data?.user || res.data || profileUser;
      dispatch(setCredentials({ user: updatedUser }));
      dispatch(setActiveRole(targetRole));
      toast.success(`Switched active role to ${targetRole.toUpperCase()}`);

      if (targetRole === 'vendor') {
        navigate('/vendor/dashboard');
      } else if (targetRole === 'creator') {
        navigate('/creator/dashboard');
      } else if (targetRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/home');
      }
    } catch (err) {
      // Fallback navigation
      dispatch(setActiveRole(targetRole));
      if (targetRole === 'vendor') navigate('/vendor/dashboard');
      else if (targetRole === 'creator') navigate('/creator/dashboard');
      else navigate('/customer/home');
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

  const menuItems = [
    // Main
    { label: bi('Dashboard', 'डैशबोर्ड'), path: '/vendor/dashboard', icon: FiGrid },
    { label: bi('My Listings', 'मेरी लिस्टिंग्स'), path: '/vendor/listings', icon: FiPackage },
    { label: bi('Reels & AI Ads', 'रील्स व विज्ञापन'), path: '/vendor/reels', icon: FiVideo },
    { label: bi('Leads / Enquiries', 'लीड्स व पूछताछ'), path: '/vendor/leads', icon: FiInbox },
    { label: bi('Order Requests', 'ऑर्डर अनुरोध'), path: '/vendor/orders', icon: FiShoppingCart },
    { label: bi('Chat / Inbox', 'चैट इनबॉक्स'), path: '/vendor/chat', icon: FiMessageSquare },

    // Portals
    { label: bi('Customer Feed', 'ग्राहक फीड'), path: '/customer/home', icon: FiTv },
    {
      label: (roles.includes('creator') && profileUser?.creatorProfile?.displayName)
        ? bi('Creator Portal', 'क्रिएटर पोर्टल')
        : bi('Become a Creator', 'क्रिएटर बनें'),
      path: (roles.includes('creator') && profileUser?.creatorProfile?.displayName) ? '/creator/dashboard' : '/creator/onboarding',
      icon: FiFilm,
      highlight: !(roles.includes('creator') && profileUser?.creatorProfile?.displayName)
    },

    // Business & Growth
    { label: bi('Business Profile', 'बिजनेस प्रोफाइल'), path: '/vendor/profile', icon: FiUser },
    { label: bi('Onboarding Details', 'ऑनबोर्डिंग विवरण'), path: '/vendor/onboarding-details', icon: FiFileText },
    { label: bi('Verification Center', 'सत्यापन केंद्र'), path: '/vendor/verification', icon: FiShield, badge: 'BADGE' },
    { label: bi('Analytics', 'एनालिटिक्स'), path: '/vendor/analytics', icon: FiPieChart },
    { label: bi('Refer & Earn', 'रेफर करें और कमाएं'), path: '/vendor/referrals', icon: FiUserCheck },
    { label: bi('Hire Creator', 'क्रिएटर हायर करें'), path: '/vendor/hire-creator', icon: FiUserCheck },
    { label: bi('Reviews', 'समीक्षाएं'), path: '/vendor/reviews', icon: FiStar },
    { label: bi('Followers', 'फॉलोअर्स'), path: '/vendor/followers', icon: FiUserCheck },

    // Finance & Settings
    { label: bi('Subscription', 'सब्सक्रिप्शन'), path: '/vendor/subscription', icon: FiCreditCard },
    { label: bi('Vendor Wallet', 'विक्रेता वॉलेट'), path: '/vendor/wallet', icon: TbCurrencyRupee },
    { label: bi('Credit Rates', 'क्रेडिट दरें'), path: '/vendor/credit-rates', icon: FiZap },
    { label: bi('Settings', 'सेटिंग्स'), path: '/vendor/settings', icon: FiSettings },
  ];

  const NAV_SECTIONS = [
    {
      title: bi('Main', 'मुख्य'),
      items: menuItems.slice(0, 6),
    },
    {
      title: bi('Portals', 'पोर्टल'),
      items: menuItems.slice(6, 8),
    },
    {
      title: bi('Business & Growth', 'व्यवसाय और विकास'),
      items: menuItems.slice(8, 16),
    },
    {
      title: bi('Finance & Account', 'वित्त और खाता'),
      items: menuItems.slice(16),
    },
  ];

  const SidebarContent = ({ onItemClick }) => (
    <div className="flex flex-col h-full bg-white font-sans border-r border-[#e3dccb]">
      {/* Brand Header */}
      <div className="px-4 py-4 border-b border-[#e3dccb] flex items-center justify-between">
        <Link to="/vendor/dashboard" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="BizReels Logo" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" />
          <div>
            <span className="text-sm font-black text-[#1a1a1a] block leading-tight font-heading">
              Biz<span className="gradient-text font-black">Reels</span>
            </span>
            <span className="text-[9px] font-extrabold text-[#d99a3d] uppercase tracking-widest block">Vendor Portal</span>
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
                type="button"
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
                      const isActive = location.pathname === item.path || (item.path !== '/vendor/dashboard' && location.pathname.startsWith(item.path));
                      const Icon = item.icon;

                      const handleClick = () => {
                        onItemClick?.();
                        if (item.path.startsWith('/customer/')) {
                          handleRoleSwitch('customer');
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
                            {item.badge && (
                              <span className="bg-[#d99a3d] text-[#1a1a1a] text-[9.5px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-2xs">
                                {item.badge}
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
          {profileUser?.profile_pic || profileUser?.avatarUrl || vendorProfile?.shopLogo ? (
            <img
              src={resolveMediaUrl(profileUser?.profile_pic || profileUser?.avatarUrl || vendorProfile?.shopLogo)}
              alt={vendorProfile?.shopName || profileUser?.name || 'Vendor'}
              className="w-8 h-8 rounded-full object-cover border-2 border-[#d99a3d] bg-white"
            />
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-[#d99a3d] bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-bold text-xs">
              {(vendorProfile?.shopName || profileUser?.name) ? (vendorProfile?.shopName || profileUser?.name).charAt(0).toUpperCase() : <FiUser />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-[#1a1a1a] truncate">{vendorProfile?.shopName || profileUser?.name || 'Vendor'}</p>
            <p className="text-[10px] text-slate-500 truncate">{profileUser?.email || profileUser?.phone || 'vendor'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition border border-rose-200 cursor-pointer"
        >
          <FiLogOut className="w-3.5 h-3.5" /> {bi('Sign Out', 'साइन आउट')}
        </button>
      </div>
    </div>
  );

  const currentTier = vendorProfile.verificationStatus || 'unverified';
  const isSubscribed = !!profileUser.is_subscribed_verified;

  const getTierBadge = () => {
    if (currentTier === 'premium_verified' || (isSubscribed && currentTier === 'verified_vendor')) {
      return { icon: '🔵', label: bi('Premium Verified', 'प्रीमियम सत्यापित'), class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    }
    if (currentTier === 'verified_vendor') {
      return { icon: '🟢', label: bi('Verified Vendor', 'सत्यापित विक्रेता'), class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    }
    if (currentTier === 'partially_verified') {
      return { icon: '🟡', label: bi('Partially Verified', 'आंशिक रूप से सत्यापित'), class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    }
    return { icon: '⚪', label: bi('Unverified Vendor', 'अपुष्ट विक्रेता'), class: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
  };

  const badgeInfo = getTierBadge();

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
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-[#f2ede4] border-b border-[#e3dccb] px-4 py-3 flex items-center justify-between gap-3 relative font-sans">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-white rounded-md lg:hidden text-[#1a1a1a] flex-shrink-0 border border-[#e3dccb] bg-white/50 cursor-pointer"
            >
              {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <img src="/logo.png" alt="BizReels Logo" className="h-7 w-auto lg:hidden flex-shrink-0" />
              <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm text-[#1a1a1a] uppercase tracking-wide hidden md:block">
                VENDOR PORTAL
              </h1>

              {/* Top Bar Status Badge */}
              <Link
                to="/vendor/verification"
                className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border flex items-center gap-1.5 transition hover:opacity-80 flex-shrink-0 ${badgeInfo.class}`}
              >
                <span>{badgeInfo.icon}</span>
                <span className="hidden sm:inline">{badgeInfo.label}</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Shop Status Toggle */}
            <button
              onClick={handleToggleShopStatus}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${isShopClosed
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isShopClosed ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="hidden sm:inline">{isShopClosed ? bi('Shop Closed', 'दुकान बंद है') : bi('Shop Open', 'दुकान खुली है')}</span>
            </button>

            {/* Role Switcher Pill */}
            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#241b15] border border-[#241b15] text-[#d99a3d] hover:bg-[#342820] transition text-xs font-extrabold cursor-pointer"
              >
                <FiShield className="text-[#d99a3d] flex-shrink-0" size={13} />
                <span className="uppercase hidden sm:inline">{currentRole}</span>
                <FiChevronDown size={13} />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-[#e3dccb] rounded-xl shadow-2xl py-1.5 z-[100] animate-in fade-in slide-in-from-top-2 font-sans">
                  <div className="px-3 py-1.5 border-b border-[#e3dccb] text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {bi('Switch Active Role', 'सक्रिय भूमिका बदलें')}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('customer')}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-[#1a1a1a] hover:bg-[#f8f4ec] flex items-center justify-between cursor-pointer border-none bg-transparent"
                  >
                    <span>{bi('Customer', 'ग्राहक (Customer)')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('vendor')}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-[#1a1a1a] hover:bg-[#f8f4ec] flex items-center justify-between cursor-pointer border-none bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <span>{bi('Vendor', 'विक्रेता (Vendor)')}</span>
                      {!roles.includes('vendor') && (
                        <span className="bg-[#d99a3d] text-[#1a1a1a] text-[9px] px-1.5 py-0.2 rounded font-black uppercase">{bi('Join', 'जुड़ें')}</span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('creator')}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-[#1a1a1a] hover:bg-[#f8f4ec] flex items-center justify-between cursor-pointer border-none bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <span>{bi('Creator', 'क्रिएटर (Creator)')}</span>
                      {!roles.includes('creator') && (
                        <span className="bg-[#d99a3d] text-[#1a1a1a] text-[9px] px-1.5 py-0.2 rounded font-black uppercase">{bi('Join', 'जुड़ें')}</span>
                      )}
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Language Switcher Toggle */}
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border-[1.5px] border-[#d99a3d] text-[#1a1a1a] text-xs font-black hover:bg-[#faf6ee] hover:scale-105 transition-all cursor-pointer shadow-2xs flex-shrink-0"
              title="Switch Language / भाषा बदलें"
            >
              <FiGlobe size={15} className="text-[#d99a3d]" />
              <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            <NotificationBellDropdown role="vendor" />

            <img
              src={resolveMediaUrl(profileUser?.profile_pic || profileUser?.avatarUrl || vendorProfile.shopLogo) || "/logo.png"}
              alt="Vendor Profile"
              className="w-8 h-8 rounded-full object-cover border-2 border-[#d99a3d] bg-white p-0.5 shadow-xs flex-shrink-0"
            />
          </div>
        </header>

        {/* Verification Dialogue Banner (Show if not fully verified) */}
        {currentTier !== 'verified_vendor' && currentTier !== 'premium_verified' && (
          <div className="bg-gradient-to-r from-brand-purple via-brand-pink to-brand-orange text-white px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-semibold flex items-center justify-between gap-2 sm:gap-3 shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm sm:text-base flex-shrink-0">🟢</span>
              <span className="truncate text-[10px] sm:text-xs">{bi('Verify your business to get 5x more leads & maximum buyer trust!', 'अपने व्यवसाय का सत्यापन करें और 5 गुना अधिक लीड्स और अधिकतम ग्राहक विश्वास पाएं!')}</span>
            </div>
            <Link
              to="/vendor/verification"
              className="px-2.5 sm:px-3 py-1 bg-white text-brand-purple rounded-lg font-bold text-[10px] sm:text-[11px] hover:bg-white/90 transition flex-shrink-0 shadow-sm whitespace-nowrap"
            >
              {bi('Verify Now', 'अभी सत्यापित करें')}
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