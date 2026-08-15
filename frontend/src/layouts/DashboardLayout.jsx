import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCreditCard, FiShield, FiTrendingUp, FiArrowUpRight } from 'react-icons/fi';
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

  const balance = user?.walletBalance || 0;
  const subscription = user?.subscription?.plan || 'Free';

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-sans">
      {/* Dashboard Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Wallet Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/90 to-purple-50/50 dark:from-slate-900/90 dark:to-slate-900/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Available Balance
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-heading font-black text-slate-900 dark:text-white">
                  ₹{balance.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-brand-purple/10 text-brand-purple transition-transform group-hover:scale-110">
              <FiCreditCard className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400">Wallet Payouts</span>
            <Link to="/wallet" className="inline-flex items-center gap-1 font-semibold text-brand-purple hover:underline">
              Manage <FiArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Active Plan Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/90 to-amber-50/50 dark:from-slate-900/90 dark:to-slate-900/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Current Plan
              </span>
              <span className="text-xl font-heading font-bold text-amber-600 dark:text-amber-400 mt-1 capitalize">
                {subscription} Tier
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-transform group-hover:scale-110">
              <FiShield className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400">Benefits Active</span>
            <Link to="/subscription" className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:underline">
              Upgrade <FiArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Active Workspace Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/90 to-purple-50/50 dark:from-slate-900/90 dark:to-slate-900/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Workspace Context
              </span>
              <span className="text-xl font-heading font-bold text-brand-purple mt-1 capitalize">
                {activeRole} Workspace
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-transform group-hover:scale-110">
              <FiTrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live & Ready
            </span>
            <span className="text-slate-400 capitalize">{activeRole}</span>
          </div>
        </div>
      </div>

      {/* Tabs Sub Navigation */}
      {tabs.length > 0 && (
        <div className="relative flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || location.pathname + location.search === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`relative px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap rounded-t-xl
                  ${isActive
                    ? 'text-brand-purple font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                  }
                `}
              >
                <span>{tab.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeSubTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Core Content View */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;

