import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useGetMeQuery } from '../features/auth/authApi';
import {
  FiGrid,
  FiUser,
  FiFileText,
  FiTag,
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiMenu,
  FiX
} from 'react-icons/fi';

// Component Tab Imports
import CreatorDashboardTab from '../features/creator/CreatorDashboardTab';
import CreatorProfileTab from '../features/creator/CreatorProfileTab';
import CreatorPortfolioTab from '../features/creator/CreatorPortfolioTab';
import CreatorCategoriesTab from '../features/creator/CreatorCategoriesTab';
import CreatorPricingTab from '../features/creator/CreatorPricingTab';
import CreatorAvailabilityTab from '../features/creator/CreatorAvailabilityTab';
import SubscriptionTab from '../features/subscription/SubscriptionTab';
import WalletTab from '../features/wallet/WalletTab';

const CreatorDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { refetch: refetchUser } = useGetMeQuery(undefined, { skip: !user });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: FiGrid },
    { id: 'profile', label: 'Creator Profile', icon: FiUser },
    { id: 'portfolio', label: 'Media Portfolio', icon: FiFileText },
    { id: 'categories', label: 'Content Niches', icon: FiTag },
    { id: 'pricing', label: 'Pricing Packages', icon: FiDollarSign },
    { id: 'availability', label: 'Availability Status', icon: FiCalendar },
    { id: 'subscription', label: 'Subscription', icon: FiCreditCard },
    { id: 'wallet', label: 'Wallet', icon: FiDollarSign },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CreatorDashboardTab user={user} />;
      case 'profile':
        return <CreatorProfileTab user={user} />;
      case 'portfolio':
        return <CreatorPortfolioTab user={user} />;
      case 'categories':
        return <CreatorCategoriesTab user={user} />;
      case 'pricing':
        return <CreatorPricingTab user={user} />;
      case 'availability':
        return <CreatorAvailabilityTab user={user} />;
      case 'subscription':
        return <SubscriptionTab user={user} refetchUser={refetchUser} />;
      case 'wallet':
        return <WalletTab user={user} refetchUser={refetchUser} />;
      default:
        return <CreatorDashboardTab user={user} />;
    }
  };

  const activeLabel = menuItems.find(item => item.id === activeTab)?.label || 'Dashboard';

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
          <h2 className="text-sm font-black text-brand-navy font-display">{user?.name || 'Creator Hub'}</h2>
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
            alt="Creator Avatar"
            className="w-12 h-12 rounded-full border border-slate-200 object-cover"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-black text-brand-navy font-display truncate">
              {user?.name || 'Influencer Space'}
            </h4>
            <span className="text-[9px] bg-brand-pink text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider mt-1 inline-block">
              Creator
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
              Base City: <strong className="text-brand-navy">{user?.creatorProfile?.city || 'Delhi'}</strong> &bull; Travel Availability: {user?.creatorProfile?.travelAvailable ? 'Domestic shoots' : 'Local shoots only'}
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

export default CreatorDashboard;
