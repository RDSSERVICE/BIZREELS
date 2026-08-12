import React from 'react';
import { FiEye, FiVideo, FiTrendingUp } from 'react-icons/fi';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';

export default function PortfolioAnalyticsTab({ stats = {} }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Portfolio Views"
          value={(stats.portfolioViews ?? 0).toLocaleString()}
          icon={FiEye}
          color="cyan"
          trend={stats.viewsTrend}
        />
        <AdminStatCard
          label="Portfolio Reels"
          value={String(stats.portfolioReels ?? 0)}
          icon={FiVideo}
          color="purple"
        />
        <AdminStatCard
          label="Portfolio Images"
          value={String(stats.portfolioImages ?? 0)}
          icon={FiTrendingUp}
          color="orange"
        />
      </div>
      <div className="glass rounded-2xl p-6 border border-white/50">
        <h3 className="text-sm font-bold text-text-primary font-display mb-2">Portfolio Growth</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Your portfolio items have received a total of <strong>{(stats.portfolioViews ?? 0).toLocaleString()} views</strong> across <strong>{stats.portfolioReels ?? 0} sample reels</strong> and <strong>{stats.portfolioImages ?? 0} sample shoot images</strong>. Adding new reels regularly helps build engagement and client trust.
        </p>
      </div>
    </div>
  );
}
