import React, { useState } from 'react';
import {
  FiSearch, FiSliders, FiMapPin, FiClock, FiTrendingUp,
  FiEye, FiHeart, FiShare2, FiBookmark, FiZap, FiX, FiCheck,
  FiGrid, FiFilter, FiGlobe, FiRadio, FiTag
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export const REEL_TYPES = [
  { id: 'all', label: 'All Types', icon: FiGrid },
  { id: 'Product Reel', label: 'Product Reel', icon: FiTag },
  { id: 'Service Reel', label: 'Service Reel', icon: FiZap },
  { id: 'Offer Reel', label: 'Offer Reel', icon: FiTag },
  { id: 'Announcement', label: 'Announcement', icon: FiRadio },
  { id: 'Shop promotion', label: 'Shop Promotion', icon: FiGlobe },
];

export const DURATIONS = [
  { id: 'all', label: 'All Durations' },
  { id: 'under15', label: 'Under 15 sec' },
  { id: 'under30', label: 'Under 30 sec' },
];

export const NEARBY_SCOPES = [
  { id: 'near_me', label: 'Near Me / Distance', icon: FiMapPin },
  { id: 'city', label: 'City', icon: FiMapPin },
  { id: 'state', label: 'State', icon: FiMapPin },
  { id: 'india', label: 'India (Nationwide)', icon: FiGlobe },
];

export const UPLOAD_DATES = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
];

export const POPULARITY_OPTIONS = [
  { id: 'trending', label: 'Trending', icon: FiTrendingUp },
  { id: 'most_viewed', label: 'Most Viewed', icon: FiEye },
  { id: 'most_liked', label: 'Most Liked', icon: FiHeart },
  { id: 'most_shared', label: 'Most Shared', icon: FiShare2 },
  { id: 'most_saved', label: 'Most Saved', icon: FiBookmark },
];

export default function HomeFeedSearchFilter({
  filters,
  onFilterChange,
  onSearch,
  totalResults = 0
}) {
  const [showDrawer, setShowDrawer] = useState(false);

  const activeCount = [
    filters.type !== 'all' ? 1 : 0,
    filters.duration !== 'all' ? 1 : 0,
    filters.nearby !== 'near_me' ? 1 : 0,
    filters.uploadDate !== 'all' ? 1 : 0,
    filters.popularity !== 'trending' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleReset = () => {
    onFilterChange({
      searchQuery: '',
      type: 'all',
      duration: 'all',
      nearby: 'near_me',
      distanceKm: '50',
      uploadDate: 'all',
      popularity: 'trending',
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Input Bar */}
      <div className="glass rounded-2xl p-3 sm:p-4 border border-white/50 shadow-card flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
          <input
            type="text"
            value={filters.searchQuery || ''}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onSearch && onSearch()}
            placeholder="Search nearby reels, products, services, announcements..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Quick Distance Selector if Nearby is near_me */}
          {filters.nearby === 'near_me' && (
            <select
              value={filters.distanceKm || '50'}
              onChange={(e) => onFilterChange({ ...filters, distanceKm: e.target.value })}
              className="bg-surface border border-border text-xs text-brand-purple font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-brand-purple"
            >
              <option value="5">Within 5 km</option>
              <option value="15">Within 15 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
              <option value="all">Everywhere</option>
            </select>
          )}

          {/* Toggle Filter Drawer Button */}
          <button
            type="button"
            onClick={() => setShowDrawer(!showDrawer)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
              showDrawer || activeCount > 0
                ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                : 'glass text-text-secondary border-border hover:text-text-primary'
            }`}
          >
            <FiSliders size={16} />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-brand-purple text-[10px] font-black flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Popularity Quick Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1 flex-shrink-0 mr-1">
          <FiTrendingUp size={13} /> Sort:
        </span>
        {POPULARITY_OPTIONS.map((pop) => {
          const Icon = pop.icon;
          const isSelected = filters.popularity === pop.id;
          return (
            <button
              key={pop.id}
              onClick={() => onFilterChange({ ...filters, popularity: pop.id })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition ${
                isSelected
                  ? 'bg-brand-purple/15 text-brand-purple border-brand-purple/40 shadow-sm'
                  : 'bg-surface border-border text-text-secondary hover:border-brand-purple/30'
              }`}
            >
              <Icon size={13} />
              <span>{pop.label}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded Filter Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-3xl p-5 sm:p-6 border border-border shadow-card space-y-6 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
                <FiFilter className="text-brand-purple" />
                <span>Home Feed Search Filters</span>
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-brand-purple font-bold hover:underline"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="p-1 text-text-tertiary hover:text-text-primary"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* 1. Reel / Image Type */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-text-primary font-display block">
                  1. Reel / Image Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REEL_TYPES.map((t) => {
                    const isSelected = filters.type === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onFilterChange({ ...filters, type: t.id })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          isSelected
                            ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                            : 'bg-surface border-border text-text-secondary hover:border-brand-purple/40'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Duration */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-text-primary font-display block">
                  2. Video Duration
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DURATIONS.map((d) => {
                    const isSelected = filters.duration === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => onFilterChange({ ...filters, duration: d.id })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          isSelected
                            ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                            : 'bg-surface border-border text-text-secondary hover:border-brand-purple/40'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Nearby Scope */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-text-primary font-display block">
                  3. Location & Distance
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {NEARBY_SCOPES.map((ns) => {
                    const isSelected = filters.nearby === ns.id;
                    return (
                      <button
                        key={ns.id}
                        onClick={() => onFilterChange({ ...filters, nearby: ns.id })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          isSelected
                            ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                            : 'bg-surface border-border text-text-secondary hover:border-brand-purple/40'
                        }`}
                      >
                        {ns.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Upload Date */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-text-primary font-display block">
                  4. Upload Date
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {UPLOAD_DATES.map((ud) => {
                    const isSelected = filters.uploadDate === ud.id;
                    return (
                      <button
                        key={ud.id}
                        onClick={() => onFilterChange({ ...filters, uploadDate: ud.id })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          isSelected
                            ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                            : 'bg-surface border-border text-text-secondary hover:border-brand-purple/40'
                        }`}
                      >
                        {ud.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Popularity */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-text-primary font-display block">
                  5. Popularity Ranking
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULARITY_OPTIONS.map((pop) => {
                    const isSelected = filters.popularity === pop.id;
                    return (
                      <button
                        key={pop.id}
                        onClick={() => onFilterChange({ ...filters, popularity: pop.id })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          isSelected
                            ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                            : 'bg-surface border-border text-text-secondary hover:border-brand-purple/40'
                        }`}
                      >
                        {pop.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
