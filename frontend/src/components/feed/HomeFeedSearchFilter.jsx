import React, { useState } from 'react';
import {
  FiSearch, FiSliders, FiMapPin, FiClock, FiTrendingUp,
  FiEye, FiHeart, FiShare2, FiBookmark, FiZap, FiX, FiCheck,
  FiGrid, FiFilter, FiGlobe, FiRadio, FiTag, FiCornerDownLeft
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
    <div className="sticky top-[53px] z-20 bg-[#f2ede4]/95 backdrop-blur-md py-2 space-y-2.5 font-sans w-full border-b border-[#e3dccb]/60 mb-2">
      
      {/* ── Search Input & Controls Bar ── */}
      <div className="bg-white rounded-md p-2 sm:p-3 border border-[#e3dccb] shadow-xs flex flex-col sm:flex-row gap-2 sm:gap-2.5 items-center w-full">
        {/* Search Input Box with Framed Icon */}
        <div className="relative flex-1 w-full flex items-center gap-2 bg-[#f8f4ec] rounded-md border border-[#e3dccb] px-2.5 py-1.5 focus-within:border-[#d99a3d] focus-within:ring-2 focus-within:ring-[#d99a3d]/20 transition-all min-w-0">
          <div className="w-7 h-7 rounded bg-[#d99a3d] text-[#1a1a1a] border border-[#1a1a1a]/20 flex items-center justify-center shrink-0 shadow-xs">
            <FiSearch size={15} />
          </div>

          <input
            type="text"
            value={filters.searchQuery || ''}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onSearch && onSearch()}
            placeholder="Search nearby reels, products, services..."
            className="w-full bg-transparent text-xs text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none font-medium truncate min-w-0"
          />

          {/* Keyboard shortcut hint pill */}
          <div className="hidden md:flex items-center gap-1 bg-white border border-[#e3dccb] text-[9.5px] font-extrabold text-slate-400 px-1.5 py-0.5 rounded uppercase shrink-0">
            <FiCornerDownLeft size={9} />
            <span>Enter</span>
          </div>
        </div>

        {/* Distance Selector & Filter Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
          {/* Distance Selector */}
          {filters.nearby === 'near_me' && (
            <div className="relative flex items-center bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-2 py-1 text-xs font-bold text-[#1a1a1a] shrink-0">
              <FiMapPin className="text-[#d99a3d] mr-1 shrink-0" size={13} />
              <select
                value={filters.distanceKm || '50'}
                onChange={(e) => onFilterChange({ ...filters, distanceKm: e.target.value })}
                className="bg-transparent text-xs text-[#1a1a1a] font-bold focus:outline-none cursor-pointer border-none pr-1"
              >
                <option value="5">Within 5 km</option>
                <option value="15">Within 15 km</option>
                <option value="50">Within 50 km</option>
                <option value="100">Within 100 km</option>
                <option value="all">Everywhere</option>
              </select>
            </div>
          )}

          {/* Toggle Filter Drawer Button */}
          <button
            type="button"
            onClick={() => setShowDrawer(!showDrawer)}
            className={`px-3 py-1.5 rounded-md text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer border shrink-0 ${
              showDrawer || activeCount > 0
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                : 'bg-[#241b15] text-[#d99a3d] border-[#d99a3d]/40 hover:border-[#d99a3d]'
            }`}
          >
            <FiSliders size={13} className="text-[#d99a3d]" />
            <span>FILTERS</span>
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#d99a3d] text-[#1a1a1a] text-[9.5px] font-black flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Popularity Quick Tabs Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 flex-shrink-0 mr-1">
          <FiTrendingUp size={13} className="text-[#d99a3d]" /> SORT BY:
        </span>
        {POPULARITY_OPTIONS.map((pop) => {
          const Icon = pop.icon;
          const isSelected = filters.popularity === pop.id;
          return (
            <button
              key={pop.id}
              onClick={() => onFilterChange({ ...filters, popularity: pop.id })}
              className={`px-3 py-1.5 rounded-md text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? 'bg-[#d99a3d] text-[#1a1a1a] border-2 border-[#241b15] shadow-xs scale-[1.02]'
                  : 'bg-white border border-[#e3dccb] text-slate-700 hover:border-[#241b15] hover:bg-[#241b15] hover:text-[#d99a3d]'
              }`}
            >
              <Icon size={13} className={isSelected ? 'text-[#1a1a1a]' : 'text-[#d99a3d]'} />
              <span>{pop.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Expanded Filter Drawer ── */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-md p-5 border border-[#e3dccb] shadow-xl space-y-5 overflow-hidden font-sans z-30 relative"
          >
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a] flex items-center gap-2">
                <FiFilter className="text-[#d99a3d]" />
                <span>FEED SEARCH FILTERS</span>
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-[#d99a3d] font-bold hover:underline cursor-pointer border-none bg-transparent"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="p-1 text-slate-400 hover:text-[#1a1a1a] cursor-pointer border-none bg-transparent"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* 1. Reel / Image Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  1. Reel / Image Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REEL_TYPES.map((t) => {
                    const isSelected = filters.type === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onFilterChange({ ...filters, type: t.id })}
                        className={`px-2.5 py-1 rounded text-xs font-extrabold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#241b15]'
                            : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-700 hover:bg-[#241b15] hover:text-[#d99a3d]'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Duration */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  2. Video Duration
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DURATIONS.map((d) => {
                    const isSelected = filters.duration === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => onFilterChange({ ...filters, duration: d.id })}
                        className={`px-2.5 py-1 rounded text-xs font-extrabold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#241b15]'
                            : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-700 hover:bg-[#241b15] hover:text-[#d99a3d]'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Nearby Scope */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  3. Location &amp; Distance
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {NEARBY_SCOPES.map((ns) => {
                    const isSelected = filters.nearby === ns.id;
                    return (
                      <button
                        key={ns.id}
                        onClick={() => onFilterChange({ ...filters, nearby: ns.id })}
                        className={`px-2.5 py-1 rounded text-xs font-extrabold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#241b15]'
                            : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-700 hover:bg-[#241b15] hover:text-[#d99a3d]'
                        }`}
                      >
                        {ns.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Upload Date */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  4. Upload Date
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {UPLOAD_DATES.map((ud) => {
                    const isSelected = filters.uploadDate === ud.id;
                    return (
                      <button
                        key={ud.id}
                        onClick={() => onFilterChange({ ...filters, uploadDate: ud.id })}
                        className={`px-2.5 py-1 rounded text-xs font-extrabold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#241b15]'
                            : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-700 hover:bg-[#241b15] hover:text-[#d99a3d]'
                        }`}
                      >
                        {ud.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Popularity */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  5. Popularity Ranking
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULARITY_OPTIONS.map((pop) => {
                    const isSelected = filters.popularity === pop.id;
                    return (
                      <button
                        key={pop.id}
                        onClick={() => onFilterChange({ ...filters, popularity: pop.id })}
                        className={`px-2.5 py-1 rounded text-xs font-extrabold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#241b15]'
                            : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-700 hover:bg-[#241b15] hover:text-[#d99a3d]'
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
