import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetMeQuery } from '../../features/auth/authApi';
import {
  FiGrid,
  FiPlusSquare,
  FiLayers,
  FiCreditCard,
  FiDollarSign,
  FiSliders,
  FiMenu,
  FiX,
  FiShield,
  FiBell,
  FiLock,
  FiLogOut
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, setActiveRole } from '../../features/auth/authSlice';
import { useSwitchRoleMutation, useAddRoleMutation } from '../../features/auth/authApi';

// Component Tab Imports
import RequirementsNew from './RequirementsNew';
import Activities from './Activities';
import SubscriptionTab from '../../features/subscription/SubscriptionTab';
import WalletTab from '../../features/wallet/WalletTab';

const CustomerDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { refetch: refetchUser } = useGetMeQuery(undefined, { skip: !user });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [switchRoleApi] = useSwitchRoleMutation();
  const [addRoleApi] = useAddRoleMutation();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleBecomeVendor = async () => {
    try {
      const hasRole = user.roles.includes('vendor');
      if (!hasRole) {
        toast.loading('Activating vendor profile...', { id: 'vendor-switch' });
        await addRoleApi({ role: 'vendor' }).unwrap();
      } else {
        toast.loading('Switching to vendor space...', { id: 'vendor-switch' });
      }
      await switchRoleApi({ role: 'vendor' }).unwrap();
      dispatch(setActiveRole('vendor'));
      toast.success('Successfully switched to Vendor Workspace!', { id: 'vendor-switch' });
      navigate('/vendor/dashboard');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to switch role.', { id: 'vendor-switch' });
    }
  };

  // Settings states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: FiGrid },
    { id: 'post-requirement', label: 'Post Requirement', icon: FiPlusSquare },
    { id: 'activities', label: 'My Activities', icon: FiLayers },
    { id: 'subscription', label: 'Subscription', icon: FiCreditCard },
    { id: 'wallet', label: 'Wallet', icon: FiDollarSign },
    { id: 'settings', label: 'Settings', icon: FiSliders },
  ];

  const handleSaveSettings = (e) => {
    e.preventDefault();
    toast.success('Customer alert preferences saved successfully!');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      dispatch(logout());
      navigate('/auth/login');
      toast.success('Logged out successfully.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Wallet Balance</span>
                  <h4 className="text-xl font-black text-brand-navy mt-1.5 font-display">₹{(user?.walletBalance || 0).toLocaleString()}</h4>
                </div>
                <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-2xl">
                  <FiDollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Plan</span>
                  <h4 className="text-xl font-black text-brand-orange mt-1.5 font-display capitalize">{user?.subscription?.plan || 'Free'} Plan</h4>
                </div>
                <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-2xl">
                  <FiShield className="w-5 h-5" />
                </div>
              </div>

              <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Profile Mode</span>
                  <h4 className="text-xl font-black text-brand-pink mt-1.5 font-display capitalize">Customer Workspace</h4>
                </div>
                <div className="p-3 bg-brand-pink/10 text-brand-pink rounded-2xl">
                  <FiGrid className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick Actions Banner */}
            <div className="glass p-6 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('post-requirement')}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-brand-purple/20 hover:bg-brand-purple/5 transition-all text-left cursor-pointer group"
                >
                  <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-xl group-hover:scale-105 transition-transform">
                    <FiPlusSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-navy">Post a Requirement</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Publish listings for products or services to local vendors.</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('activities')}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-brand-purple/20 hover:bg-brand-purple/5 transition-all text-left cursor-pointer group"
                >
                  <div className="p-3 bg-brand-pink/10 text-brand-pink rounded-xl group-hover:scale-105 transition-transform">
                    <FiLayers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-navy">Activities Hub</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Manage your bookmarks, track online orders, and inspect quotes.</p>
                  </div>
                </button>
              </div>
            </div>
            {/* Become a Vendor Banner */}
            <div className="glass p-6 rounded-2xl border border-brand-orange/20 bg-brand-orange/5 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-brand-orange uppercase tracking-wider">Start Selling on BizReels</h3>
                <p className="text-xs text-slate-500 mt-1">Activate your Seller Profile to upload products, post service listings, and accept requirements from buyers.</p>
              </div>
              <button
                onClick={handleBecomeVendor}
                className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange-700 text-white text-xs font-bold rounded-xl shadow-premium cursor-pointer transition-colors flex-shrink-0"
              >
                Become a Vendor / Seller
              </button>
            </div>
          </div>
        );
      case 'post-requirement':
        return <RequirementsNew />;
      case 'activities':
        return <Activities />;
      case 'subscription':
        return <SubscriptionTab user={user} refetchUser={refetchUser} />;
      case 'wallet':
        return <WalletTab user={user} refetchUser={refetchUser} />;
      case 'settings':
        return (
          <div className="flex flex-col gap-6 animate-fade-in">
            <form onSubmit={handleSaveSettings} className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
              <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <FiBell className="text-brand-purple" /> Notification Preferences
              </h4>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'E-mail notifications for bidding quotes and updates', val: emailAlerts, setVal: setEmailAlerts },
                  { label: 'SMS alerts for urgent seller replies', val: smsAlerts, setVal: setSmsAlerts },
                  { label: 'Push alerts for checkouts & order status', val: pushAlerts, setVal: setPushAlerts }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <span className="text-xs font-bold text-slate-600">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={item.val}
                      onChange={(e) => item.setVal(e.target.checked)}
                      className="w-4.5 h-4.5 text-brand-purple border-slate-300 rounded focus:ring-brand-purple cursor-pointer"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-5 py-2 bg-brand-purple hover:bg-brand-purple-800 text-white text-xs font-bold rounded-xl shadow-premium cursor-pointer transition-colors">
                  Save Alert Settings
                </button>
              </div>
            </form>

            <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
              <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <FiLock className="text-info" /> Privacy Preferences
              </h4>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-bold text-slate-600">Keep my active requirements private from guest web crawlers</span>
                <input
                  type="checkbox"
                  checked={privateProfile}
                  onChange={(e) => setPrivateProfile(e.target.checked)}
                  className="w-4.5 h-4.5 text-brand-purple border-slate-300 rounded focus:ring-brand-purple cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleLogout}
                className="px-5 py-2.5 bg-slate-200/60 hover:bg-slate-300/60 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-2"
              >
                <FiLogOut /> Logout Session
              </button>
            </div>
          </div>
        );
      default:
        return <RequirementsNew />;
    }
  };

  const activeLabel = menuItems.find(item => item.id === activeTab)?.label || 'Customer Workspace';

  return (
    <div className="min-h-screen flex flex-col md:flex-row gap-6 animate-fade-in pb-16">
      {/* ── Mobile Sidebar Header Toggle ────────────────────── */}
      <div className="md:hidden flex justify-between items-center bg-white border border-slate-200/50 p-4 rounded-2xl shadow-sm z-20">
        <div className="flex items-center gap-2">
          <img
            src={user?.avatarUrl || 'https://via.placeholder.com/80'}
            alt="Logo"
            className="w-10 h-10 rounded-xl border border-slate-200 object-cover"
          />
          <h2 className="text-sm font-black text-brand-navy font-display">{user?.name || 'Customer Hub'}</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-brand-navy cursor-pointer transition-colors"
        >
          {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Left Sidebar Navigation ──────────────────────────── */}
      <aside className={`md:flex flex-col w-full md:w-64 bg-white border border-slate-200/60 rounded-2xl shadow-glass p-4 shrink-0 transition-transform duration-300 z-10
        ${isSidebarOpen ? 'block' : 'hidden md:flex'}
      `}>
        {/* Profile Info Header */}
        <div className="hidden md:flex items-center gap-3.5 pb-4 mb-4 border-b border-slate-100">
          <img
            src={user?.avatarUrl || 'https://via.placeholder.com/80'}
            alt="Customer Avatar"
            className="w-12 h-12 rounded-full border border-slate-200 object-cover"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-black text-brand-navy font-display truncate">
              {user?.name || 'Customer Space'}
            </h4>
            <span className="text-[9px] bg-brand-orange text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider mt-1 inline-block">
              Customer
            </span>
          </div>
        </div>

        {/* Menu Navigation Options */}
        <nav className="flex flex-col gap-1 overflow-y-auto max-h-[75vh]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer
                  ${isSelected
                    ? 'bg-brand-purple text-white shadow-premium'
                    : 'text-slate-500 hover:text-brand-purple hover:bg-brand-purple/5'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Right Content Viewport ──────────────────────────── */}
      <main className="flex-grow flex flex-col gap-6">
        {/* Banner header */}
        <div className="glass p-5 rounded-2xl border-white/50 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-brand-navy font-display">{activeLabel}</h2>
            <p className="text-[10px] text-slate-400 mt-1">
              Active Mode: <strong className="text-brand-navy">Customer</strong> &bull; Total Requirements Posted: <strong className="text-brand-navy">{user?.customerProfile?.requirementCount || 0}</strong>
            </p>
          </div>
        </div>

        {/* Tab components viewport */}
        <div className="w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
