import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiUsers, FiAlertCircle } from 'react-icons/fi';
import { useGetWalletStatsQuery } from '../../../../features/admin/adminApi';

/**
 * WalletStatsBar
 * Displays summary cards for wallet overview metrics.
 */
export default function WalletStatsBar() {
  const { data: stats, isLoading } = useGetWalletStatsQuery(undefined, { pollingInterval: 10000 });

  const cards = [
    {
      label: 'Total Platform Credits',
      value: stats?.total_credits?.toLocaleString('en-IN') || '0',
      sub: `${stats?.total_wallets || 0} wallets`,
      icon: FiUsers,
      color: 'text-brand-purple',
      bg: 'bg-brand-purple/10',
    },
    {
      label: "Today's Credits",
      value: stats?.today_credits?.toLocaleString('en-IN') || '0',
      sub: `${stats?.today_credits_count || 0} transactions`,
      icon: FiTrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      label: "Today's Debits",
      value: stats?.today_debits?.toLocaleString('en-IN') || '0',
      sub: `${stats?.today_debits_count || 0} transactions`,
      icon: FiTrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Pending Refunds',
      value: stats?.pending_refunds || '0',
      sub: `${stats?.frozen_wallets || 0} frozen wallets`,
      icon: FiAlertCircle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass rounded-2xl p-5 border border-white/50 hover:border-brand-purple/30 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                {card.label}
              </span>
              <span className={`text-2xl font-black mt-1 font-display block ${card.color}`}>
                {isLoading ? '...' : card.value}
              </span>
              <span className="text-[10px] text-text-tertiary">{card.sub}</span>
            </div>
            <div className={`p-2.5 rounded-xl ${card.bg} group-hover:scale-110 transition-transform`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
