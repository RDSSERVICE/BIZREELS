import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiVideo, FiUser, FiFilm, FiDollarSign, FiClock, FiCreditCard,
  FiShield, FiLogOut, FiMenu, FiX, FiCheck
} from 'react-icons/fi';
import { useGetMeQuery, useSwitchRoleMutation } from '../../features/auth/authApi';
import { setCredentials, logout } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';

export default function CreatorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const { data: profileRes } = useGetMeQuery(undefined, { pollingInterval: 30000 });
  const [switchRoleApi] = useSwitchRoleMutation();

  const user = profileRes?.data?.user || profileRes?.user || authUser || {};
  const creatorProfile = user.creatorProfile || {};

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out');
    navigate('/auth/login');
  };

  const creatorMenuItems = [
    { label: 'Dashboard', path: '/creator/dashboard', icon: FiVideo },
    { label: 'Profile', path: '/creator/profile', icon: FiUser },
    { label: 'Portfolio', path: '/creator/portfolio', icon: FiFilm },
    { label: 'Pricing', path: '/creator/pricing', icon: FiDollarSign },
    { label: 'Availability', path: '/creator/availability', icon: FiClock },
    { label: 'Subscription', path: '/creator/subscription', icon: FiCreditCard },
    { label: 'Wallet & Earnings', path: '/creator/wallet', icon: FiDollarSign },
  ];

  return (
    <div className="min-h-screen bg-surface-secondary text-text-primary flex flex-col font-sans relative overflow-x-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-purple/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-orange/10 blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 glass border-b border-border px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-glass">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-white/10"
          >
            {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>

          <Link to="/creator/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-premium group-hover:scale-105 transition-transform">
              <span className="font-black text-white text-lg font-display">C</span>
            </div>
            <div>
              <span className="font-black text-base text-text-primary hidden sm:inline font-display">
                {creatorProfile.name || user.name || 'Creator Studio'}
              </span>
              <span className="block text-[10px] text-brand-pink font-bold uppercase tracking-wider">
                Influencer & Avatar Creator
              </span>
            </div>
          </Link>
        </div>

        <button
          onClick={handleSwitchToCustomer}
          className="px-3.5 py-1.5 rounded-xl glass border border-border hover:bg-white/10 text-text-secondary hover:text-text-primary text-xs font-bold flex items-center gap-1.5 transition"
        >
          <FiShield size={14} className="text-brand-purple" />
          <span className="hidden sm:inline">Switch to Customer</span>
        </button>
      </header>

      {/* Main Viewport */}
      <div className="flex-1 flex overflow-hidden z-10">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 glass border-r border-border p-4 shrink-0 overflow-y-auto">
          <div className="px-2 mb-3 text-[9px] font-bold text-text-tertiary uppercase tracking-widest">
            Creator Studio
          </div>
          <nav className="space-y-1">
            {creatorMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-purple text-white shadow-premium'
                      : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
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

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex">
            <div className="w-72 glass h-full p-4 border-r border-border flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                  <span className="font-bold text-lg text-text-primary font-display">Creator Navigation</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-text-tertiary hover:text-text-primary">
                    <FiX size={20} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {creatorMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition ${
                          isActive
                            ? 'bg-brand-purple text-white shadow-premium'
                            : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
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

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto bg-surface-secondary/40 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
