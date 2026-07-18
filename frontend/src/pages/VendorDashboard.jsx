import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useGetMeQuery } from '../features/auth/authApi';
import {
  FiGrid,
  FiUser,
  FiBriefcase,
  FiVideo,
  FiZap,
  FiLayers,
  FiShoppingCart,
  FiTrendingUp,
  FiCreditCard,
  FiDollarSign,
  FiStar,
  FiSliders,
  FiMenu,
  FiX,
  FiUsers
} from 'react-icons/fi';

// Modular Component Tab Imports
import VendorDashboardTab from '../features/vendor/VendorDashboardTab';
import BusinessProfileTab from '../features/vendor/BusinessProfileTab';
import MyListingsTab from '../features/listings/MyListingsTab';
import ReelsTab from '../features/reels/ReelsTab';
import ReelBoostTab from '../features/reels/ReelBoostTab';
import LeadsEnquiriesTab from '../features/vendor/LeadsEnquiriesTab';
import OrderRequestTab from '../features/vendor/OrderRequestTab';
import AnalyticsTab from '../features/analytics/AnalyticsTab';
import SubscriptionTab from '../features/subscription/SubscriptionTab';
import WalletTab from '../features/wallet/WalletTab';
import ReviewsTab from '../features/vendor/ReviewsTab';
import VendorSettingsTab from '../features/vendor/VendorSettingsTab';
import VendorSideHireCreator from '../features/creator/VendorSideHireCreator';

const VendorDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { refetch: refetchUser } = useGetMeQuery(undefined, { skip: !user });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: FiGrid },
    { id: 'profile', label: 'Business Profile', icon: FiUser },
    { id: 'listings', label: 'My Listings', icon: FiBriefcase },
    { id: 'reels', label: 'Reels Studio', icon: FiVideo },
    { id: 'boost', label: 'Reel Boost', icon: FiZap },
    { id: 'leads', label: 'Leads & Enquiries', icon: FiLayers },
    { id: 'orders', label: 'Order Requests', icon: FiShoppingCart },
    { id: 'analytics', label: 'Analytics', icon: FiTrendingUp },
    { id: 'reviews', label: 'Customer Reviews', icon: FiStar },
    { id: 'creator-hire', label: 'Hire Creator', icon: FiUsers },
    { id: 'subscription', label: 'Subscription', icon: FiCreditCard },
    { id: 'wallet', label: 'Wallet', icon: FiDollarSign },
    { id: 'settings', label: 'Settings', icon: FiSliders },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <VendorDashboardTab user={user} setActiveTab={setActiveTab} />;
      case 'profile':
        return <BusinessProfileTab user={user} />;
      case 'listings':
        return <MyListingsTab user={user} />;
      case 'reels':
        return <ReelsTab user={user} />;
      case 'boost':
        return <ReelBoostTab user={user} />;
      case 'leads':
        return <LeadsEnquiriesTab user={user} />;
      case 'orders':
        return <OrderRequestTab user={user} />;
      case 'analytics':
        return <AnalyticsTab user={user} />;
      case 'subscription':
        return <SubscriptionTab user={user} refetchUser={refetchUser} />;
      case 'wallet':
        return <WalletTab user={user} refetchUser={refetchUser} />;
      case 'reviews':
        return <ReviewsTab user={user} />;
      case 'creator-hire':
        return <VendorSideHireCreator user={user} />;
      case 'settings':
        return <VendorSettingsTab user={user} />;
      default:
        return <VendorDashboardTab user={user} setActiveTab={setActiveTab} />;
    }
  };

  const activeLabel = menuItems.find(item => item.id === activeTab)?.label || 'Dashboard';

  return (
    <div className="min-h-screen flex flex-col md:flex-row gap-6 animate-fade-in pb-16">
      {/* ── Mobile Sidebar Header Toggle ────────────────────── */}
      <div className="md:hidden flex justify-between items-center bg-white border border-slate-200/50 p-4 rounded-2xl shadow-sm z-20">
        <div className="flex items-center gap-2">
          <img
            src={user?.vendorProfile?.logoUrl || 'https://via.placeholder.com/80'}
            alt="Logo"
            className="w-10 h-10 rounded-xl border border-slate-200 object-cover"
          />
          <h2 className="text-sm font-black text-brand-navy font-display">{user?.vendorProfile?.shopName || 'Store Hub'}</h2>
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
            src={user?.vendorProfile?.logoUrl || 'https://via.placeholder.com/80'}
            alt="Business Logo"
            className="w-12 h-12 rounded-xl border border-slate-200 object-cover"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-black text-brand-navy font-display truncate">
              {user?.vendorProfile?.shopName || 'Store Workspace'}
            </h4>
            <span className="text-[9px] bg-brand-purple text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider mt-1 inline-block">
              Vendor
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
              Store Category: <strong className="text-brand-navy">{user?.vendorProfile?.category || 'Electronics'}</strong> &bull; Address: {user?.vendorProfile?.location?.address || 'Delhi, India'}
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

export default VendorDashboard;
