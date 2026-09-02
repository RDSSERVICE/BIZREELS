import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiGrid, FiUser, FiFilm, FiClock, FiCreditCard,
  FiShield, FiLogOut, FiMenu, FiX, FiBell, FiChevronDown, FiChevronRight,
  FiBarChart2, FiBriefcase, FiStar, FiMessageSquare, FiSettings, FiCheck, FiFileText, FiGlobe
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import { useGetMeQuery, useSwitchRoleMutation, useLogoutMutation } from '../../features/auth/authApi';
import { setCredentials, logout, selectCurrentUser, setActiveRole } from '../../features/auth/authSlice';
import { api, tokenStore } from '../../lib/api';
import NotificationBellDropdown from '../../components/notifications/NotificationBellDropdown';
import { useLanguage } from '../../context/LanguageContext';
import SEO from '../../components/common/SEO';

function CreatorSidebarContent({
  onItemClick,
  NAV_SECTIONS,
  collapsedSections,
  toggleSection,
  pathname,
  handleLogout,
  profileUser,
  creatorProfile,
  bi,
}) {
  return (
    <div className="flex flex-col h-full font-sans bg-[#f8f4ec] border-r border-[#e3dccb]">
      {/* Brand Header */}
      <div className="px-4 py-4 bg-white border-b border-[#e3dccb] flex items-center justify-between">
        <Link to="/creator/dashboard" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="BizReels Logo" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" />
          <div>
            <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm text-[#1a1a1a] block leading-tight tracking-tight">
              BIZ<span className="text-[#d99a3d]">REELS</span>
            </span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">CREATOR STUDIO</span>
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
                className="w-full flex items-center justify-between px-2 py-1 text-[9.5px] font-black text-slate-400 uppercase tracking-widest hover:text-[#1a1a1a] transition-all cursor-pointer border-none bg-transparent"
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
                      const isActive = pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onItemClick}
                          className={`relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 group ${
                            isActive
                              ? 'bg-[#241b15] text-[#d99a3d] shadow-2xs'
                              : 'text-slate-700 hover:bg-white hover:text-[#1a1a1a] hover:shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isActive
                                  ? 'bg-[#d99a3d] text-[#1a1a1a] shadow-xs'
                                  : 'bg-white text-slate-600 border border-[#e3dccb] group-hover:border-[#241b15] group-hover:text-[#241b15]'
                              }`}
                            >
                              <Icon size={14} />
                            </div>
                            <span className="truncate">{item.name}</span>
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

      {/* User Info + Logout Footer Card */}
      <div className="border-t border-[#e3dccb] p-3 bg-white space-y-2">
        <div className="flex items-center gap-2.5 p-1">
          <img
            src={creatorProfile.profilePhoto || profileUser?.profile_pic || "/logo.png"}
            alt="Creator"
            className="w-9 h-9 rounded-full object-cover border border-[#e3dccb] bg-[#f8f4ec] p-0.5 shadow-xs shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-[#1a1a1a] truncate">{creatorProfile.name || profileUser?.name || 'Creator'}</p>
            <p className="text-[10px] font-medium text-slate-400 truncate">{profileUser?.email || profileUser?.phone || 'creator'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-200 cursor-pointer"
        >
          <FiLogOut className="w-4 h-4" />
          <span>{bi('Sign Out', 'साइन आउट')}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * CreatorLayout — Warm Editorial Bento Sidebar Layout for Creator Studio
 */
export default function CreatorLayout() {
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
  const creatorProfile = profileUser.creatorProfile || {};
  const roles = profileUser.roles || ['customer'];
  const currentRole = 'creator';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roleDropdownRef = useRef(null);

  useEffect(() => {
    if (user && user.activeRole !== 'creator') {
      dispatch(setActiveRole('creator'));
    }
  }, [user, dispatch]);

  const NAV_SECTIONS = [
    {
      title: bi('Overview', 'अवलोकन'),
      items: [
        { name: bi('Dashboard', 'डैशबोर्ड'), path: '/creator/dashboard', icon: FiGrid },
        { name: bi('Settings', 'सेटिंग्स'), path: '/creator/settings', icon: FiSettings },
      ],
    },
    {
      title: bi('Profile & Work', 'प्रोफ़ाइल और कार्य'),
      items: [
        { name: bi('Profile', 'प्रोफ़ाइल'), path: '/creator/profile', icon: FiUser },
        { name: bi('Onboarding Details', 'ऑनबोर्डिंग विवरण'), path: '/creator/onboarding-details', icon: FiFileText },
        { name: bi('Verification Center', 'सत्यापन केंद्र'), path: '/creator/verification', icon: FiShield },
        { name: bi('Portfolio', 'पोर्टफोलियो'), path: '/creator/portfolio', icon: FiFilm },
        { name: bi('Pricing Rates', 'मूल्य निर्धारण दरें'), path: '/creator/pricing', icon: TbCurrencyRupee },
        { name: bi('Availability', 'उपलब्धता'), path: '/creator/availability', icon: FiClock },
      ],
    },
    {
      title: bi('Projects & Earnings', 'परियोजनाएं और कमाई'),
      items: [
        { name: bi('My Orders', 'मेरे ऑर्डर'), path: '/creator/orders', icon: FiBriefcase },
        { name: bi('Chats', 'चैट इनबॉक्स'), path: '/creator/chat', icon: FiMessageSquare },
        { name: bi('Reviews', 'समीक्षाएं'), path: '/creator/reviews', icon: FiStar },
        { name: bi('Analytics', 'एनालिटिक्स'), path: '/creator/analytics', icon: FiBarChart2 },
        { name: bi('Wallet', 'वॉलेट'), path: '/creator/wallet', icon: FiCreditCard },
      ],
    },
  ];

  const toggleSection = (title) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleRoleSwitch = async (targetRole) => {
    setIsRoleDropdownOpen(false);
    if (targetRole === 'creator') {
      navigate('/creator/dashboard');
      return;
    }

    const userRoles = profileUser.roles || roles || ['creator'];
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

      const isVendorIncomplete = targetRole === 'vendor' && (!updatedUser?.vendorProfile?.shopName && !updatedUser?.vendorProfile?.businessName);
      const isCreatorIncomplete = targetRole === 'creator' && (!updatedUser?.creatorProfile?.displayName && !updatedUser?.creatorProfile?.name);

      if (targetRole === 'vendor') {
        navigate(isVendorIncomplete ? '/vendor/onboarding' : '/vendor/dashboard');
      } else if (targetRole === 'creator') {
        navigate(isCreatorIncomplete ? '/creator/onboarding' : '/creator/dashboard');
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

  const currentTier = creatorProfile.verificationStatus || 'unverified';
  const isSubscribed = !!profileUser.is_subscribed_verified;

  const getTierBadge = () => {
    if (currentTier === 'pro_verified' || (isSubscribed && currentTier === 'verified_creator')) {
      return { icon: '🔵', label: bi('Pro Verified', 'प्रो सत्यापित'), class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    }
    if (currentTier === 'verified_creator') {
      return { icon: '🟢', label: bi('Verified Creator', 'सत्यापित क्रिएटर'), class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    }
    if (currentTier === 'partially_verified') {
      return { icon: '🟡', label: bi('Partially Verified', 'आंशिक रूप से सत्यापित'), class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    }
    return { icon: '⚪', label: bi('Unverified Creator', 'अपुष्ट क्रिएटर'), class: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
  };

  const badgeInfo = getTierBadge();

  return (
    <div className="min-h-screen bg-surface-secondary flex font-sans w-full max-w-full overflow-x-hidden relative">
      <SEO title="Creator Studio" robots="noindex, nofollow" />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-surface border-r border-border fixed top-0 bottom-0 left-0 z-30">
        <CreatorSidebarContent
          onItemClick={() => {}}
          NAV_SECTIONS={NAV_SECTIONS}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
          pathname={location.pathname}
          handleLogout={handleLogout}
          profileUser={profileUser}
          creatorProfile={creatorProfile}
          bi={bi}
        />
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
              <CreatorSidebarContent
                onItemClick={() => setIsSidebarOpen(false)}
                NAV_SECTIONS={NAV_SECTIONS}
                collapsedSections={collapsedSections}
                toggleSection={toggleSection}
                pathname={location.pathname}
                handleLogout={handleLogout}
                profileUser={profileUser}
                creatorProfile={creatorProfile}
                bi={bi}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 w-full max-w-full overflow-x-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#e3dccb] shadow-2xs px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 relative font-sans">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-surface-tertiary rounded-xl lg:hidden text-text-secondary flex-shrink-0"
            >
              {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <img src="/logo.png" alt="BizReels Logo" className="h-7 w-auto lg:hidden flex-shrink-0" />
              <h1 className="text-sm font-bold text-text-primary font-display hidden md:block">CREATOR STUDIO</h1>

              {/* Top Bar Status Badge */}
              <Link
                to="/creator/verification"
                className={`px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border flex items-center gap-1 sm:gap-1.5 transition hover:opacity-80 flex-shrink-0 ${badgeInfo.class}`}
              >
                <span>{badgeInfo.icon}</span>
                <span className="hidden sm:inline">{badgeInfo.label}</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
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
                    <FiCheck className="text-emerald-600 w-4 h-4" />
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

            <NotificationBellDropdown role="creator" />

            <img
              src={creatorProfile.profilePhoto || profileUser?.profile_pic || "/logo.png"}
              alt="Creator Profile"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-brand-purple/20 bg-white p-0.5 shadow-sm flex-shrink-0"
            />
          </div>
        </header>

        {/* Verification Dialogue Banner (Show if not fully verified) */}
        {currentTier !== 'verified_creator' && currentTier !== 'pro_verified' && (
          <div className="bg-[#241b15] text-[#f8f4ec] border-b border-[#d99a3d]/40 px-3 sm:px-5 py-2.5 text-[11px] sm:text-xs font-bold flex items-center justify-between gap-2 sm:gap-4 shadow-xs font-sans">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] flex-shrink-0 animate-pulse" />
              <span className="truncate text-[11px] sm:text-xs tracking-wide text-[#f8f4ec] font-bold">
                {bi('Verify your Creator profile for 5x more brand offers & verified badge!', 'ब्रांड ऑफ़र और सत्यापित बैज प्राप्त करने के लिए अपनी क्रिएटर प्रोफ़ाइल सत्यापित करें!')}
              </span>
            </div>
            <Link
              to="/creator/verification"
              className="px-3.5 py-1 bg-[#d99a3d] hover:bg-[#e2a84b] text-[#1a1a1a] rounded-lg font-black text-[10px] sm:text-[11px] transition-all flex-shrink-0 shadow-xs whitespace-nowrap cursor-pointer border border-[#d99a3d]"
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
