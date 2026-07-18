import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { FiCreditCard, FiShield, FiTrendingUp } from 'react-icons/fi';
import { selectCurrentUser, selectActiveRole } from '../features/auth/authSlice';

/**
 * Dashboard Sub-Layout
 * Wraps Vendor and Creator views, displaying wallet balance, subscription status,
 * and standard stats at the top.
 */
const DashboardLayout = ({ children, tabs = [] }) => {
  const user = useSelector(selectCurrentUser);
  const activeRole = useSelector(selectActiveRole);
  const location = useLocation();

  const isVendor = activeRole === 'vendor';
  const balance = user?.walletBalance || 0;
  const subscription = user?.subscription?.plan || 'Free';

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Dashboard Top Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Wallet Balance */}
        <div className="glass p-5 rounded-premium border-white/50 shadow-glass flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Wallet Balance</span>
            <span className="text-2xl font-black text-brand-navy mt-1">₹{balance.toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-premium bg-brand-purple/10 text-brand-purple">
            <FiCreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="glass p-5 rounded-premium border-white/50 shadow-glass flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Active Plan</span>
            <span className="text-xl font-bold text-brand-orange mt-1.5 capitalize">{subscription} Plan</span>
          </div>
          <div className="p-3 rounded-premium bg-brand-orange/10 text-brand-orange">
            <FiShield className="w-6 h-6" />
          </div>
        </div>

        {/* Active Role Quick Tracker */}
        <div className="glass p-5 rounded-premium border-white/50 shadow-glass flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Active Mode</span>
            <span className="text-xl font-bold text-brand-pink mt-1.5 capitalize">{activeRole} Workspace</span>
          </div>
          <div className="p-3 rounded-premium bg-brand-pink/10 text-brand-pink">
            <FiTrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Sub Navigation */}
      {tabs.length > 0 && (
        <div className="flex border-b border-border gap-6 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                  ${isActive
                    ? 'border-brand-purple text-brand-purple'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                  }
                `}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Core Page Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
