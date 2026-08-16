import React, { useState } from 'react';
import {
  FiSearch, FiSliders, FiMapPin, FiTrendingUp,
  FiEye, FiHeart, FiShare2, FiBookmark, FiZap, FiX, FiCheck,
  FiGrid, FiFilter, FiGlobe, FiRadio, FiTag, FiCornerDownLeft, FiFilm, FiPackage
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export const FEED_TABS = [
  { id: 'combined', label: 'All Feed', icon: FiGrid },
  { id: 'reels', label: 'Reels', icon: FiFilm },
  { id: 'images', label: 'Products & Services', icon: FiPackage },
];

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
  totalResults = 0,
  activeTab = 'combined',
  onTabChange
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

  const handleClearSearch = () => {
    onFilterChange({ ...filters, searchQuery: '' });
  };

  return (
    <div className="relative w-full py-0.5 font-sans">
      <div className="w-full max-w-5xl mx-auto px-0.5">
        <div className="bg-white rounded-xl p-1.5 border border-[#e3dccb] shadow-2xs flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full">
          
          {/* 1. Feed Type Tabs (All / Reels / Products) */}
          {onTabChange && (
            <div className="flex items-center gap-0.5 shrink-0 bg-[#f8f4ec] p-0.5 rounded-lg border border-[#e3dccb]">
              {FEED_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#241b15] text-[#d99a3d] shadow-2xs'
                        : 'text-slate-600 hover:text-[#1a1a1a]'
                    }`}
                  >
                    <Icon size={12} className={isActive ? 'text-[#d99a3d]' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Vertical Separator */}
          <div className="h-5 w-px bg-[#e3dccb] shrink-0 hidden sm:block" />

          {/* 2. Main Search Input */}
          <div className="relative flex-1 min-w-[160px] sm:min-w-[220px] flex items-center gap-1.5 bg-[#f8f4ec] rounded-lg border border-[#e3dccb] px-2.5 py-1 focus-within:border-[#d99a3d] focus-within:ring-1 focus-within:ring-[#d99a3d]/20 transition-all">
            <FiSearch size={13} className="text-[#d99a3d] shrink-0" />
            <input
              type="text"
              value={filters.searchQuery || ''}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && onSearch && onSearch()}
              placeholder="Search reels, products & services..."
              className="w-full bg-transparent text-xs text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none font-medium truncate min-w-0"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-0.5 rounded-full text-slate-400 hover:text-slate-700 transition shrink-0 border-none bg-transparent cursor-pointer"
                title="Clear search"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          {/* 3. Distance Selector */}
          {filters.nearby === 'near_me' && (
            <div className="relative flex items-center bg-[#f8f4ec] border border-[#e3dccb] rounded-lg px-2 py-1 text-[11px] font-bold text-[#1a1a1a] shrink-0">
              <FiMapPin className="text-[#d99a3d] mr-1 shrink-0" size={12} />
              <select
                value={filters.distanceKm || '50'}
                onChange={(e) => onFilterChange({ ...filters, distanceKm: e.target.value })}
                className="bg-transparent text-[11px] text-[#1a1a1a] font-bold focus:outline-none cursor-pointer border-none pr-0.5"
              >
                <option value="5">5 km</option>
                <option value="15">15 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
                <option value="all">Everywhere</option>
              </select>
            </div>
          )}

          {/* 4. Sort Dropdown */}
          <div className="relative flex items-center bg-[#f8f4ec] border border-[#e3dccb] rounded-lg px-2 py-1 text-[11px] font-bold text-[#1a1a1a] shrink-0">
            <FiTrendingUp className="text-[#d99a3d] mr-1 shrink-0" size={12} />
            <select
              value={filters.popularity || 'trending'}
              onChange={(e) => onFilterChange({ ...filters, popularity: e.target.value })}
              className="bg-transparent text-[11px] text-[#1a1a1a] font-bold focus:outline-none cursor-pointer border-none pr-0.5"
            >
              {POPULARITY_OPTIONS.map((pop) => (
                <option key={pop.id} value={pop.id}>
                  {pop.label}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Filters Drawer Button */}
          <button
            type="button"
            onClick={() => setShowDrawer(!showDrawer)}
            className={`px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer border shrink-0 ${
              showDrawer || activeCount > 0
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                : 'bg-[#241b15] text-[#d99a3d] border-[#d99a3d]/40 hover:border-[#d99a3d]'
            }`}
          >
            <FiSliders size={12} className="text-[#d99a3d]" />
            <span>FILTERS</span>
            {activeCount > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-[#d99a3d] text-[#1a1a1a] text-[9px] font-black flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

        </div>
      </div>



      {/* ── Expanded Filter Drawer Modal ── */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-5xl mx-auto px-1"
          >
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#e3dccb] shadow-xl space-y-4 font-sans text-xs">
              
              <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2.5">
                <h3 className="text-xs font-black uppercase text-[#1a1a1a] flex items-center gap-2 tracking-wide">
                  <FiFilter className="text-[#d99a3d]" size={15} />
                  <span>Filter Options</span>
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] text-[#d99a3d] font-black hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Reset All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    className="p-1 rounded text-slate-400 hover:text-[#1a1a1a] cursor-pointer border-none bg-transparent transition"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                
                {/* 1. Category / Reel Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Type
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {REEL_TYPES.map((t) => {
                      const isSelected = filters.type === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onFilterChange({ ...filters, type: t.id })}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
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

                {/* 2. Duration & Upload Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Video Duration
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DURATIONS.map((d) => {
                        const isSelected = filters.duration === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => onFilterChange({ ...filters, duration: d.id })}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
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

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Upload Date
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {UPLOAD_DATES.map((ud) => {
                        const isSelected = filters.uploadDate === ud.id;
                        return (
                          <button
                            key={ud.id}
                            type="button"
                            onClick={() => onFilterChange({ ...filters, uploadDate: ud.id })}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
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
                </div>

                {/* 3. Nearby Scope */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Location Scope
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {NEARBY_SCOPES.map((ns) => {
                      const isSelected = filters.nearby === ns.id;
                      return (
                        <button
                          key={ns.id}
                          type="button"
                          onClick={() => onFilterChange({ ...filters, nearby: ns.id })}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
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

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

