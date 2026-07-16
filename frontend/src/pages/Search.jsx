import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiSliders, FiMapPin, FiStar, FiFilter, FiBriefcase, FiUser, FiChevronRight } from 'react-icons/fi';
import { useGetListingsQuery } from '../features/listings/listingsApi';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';

const CATEGORIES = [
  'All',
  'Electronics',
  'Home Services',
  'Fashion & Apparel',
  'Beauty & Wellness',
  'Consulting & Professional',
  'Automotive',
  'Health & Fitness',
];

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [distance, setDistance] = useState(10); // 10km
  const [type, setType] = useState('all'); // all | product | service | vendor
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rating, setRating] = useState(0);
  const [coords, setCoords] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Auto-detect geolocation coordinates for search context
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        logger.info('Location coordinates matching skipped or blocked.');
      }
    );
  }, []);

  // Map API parameters
  const queryParams = {
    page: 1,
    limit: 15,
    search: searchTerm || undefined,
    category: activeCategory !== 'All' ? activeCategory : undefined,
    type: type !== 'all' ? type : undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    rating: rating > 0 ? rating : undefined,
  };

  if (coords) {
    queryParams.lat = coords.lat;
    queryParams.lng = coords.lng;
    queryParams.distance = distance;
  }

  const { data: listingsRes, isLoading, refetch } = useGetListingsQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  const listings = listingsRes?.data || [];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      {/* ── Search Header Section ────────────────────────────────── */}
      <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col gap-4">
        <h2 className="text-2xl font-black text-brand-navy font-display">
          Discover Local <span className="gradient-text font-black">Markets & Services</span>
        </h2>
        
        {/* Main search bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary w-5 h-5" />
            <input
              type="text"
              placeholder="Search products, services, local vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-surface-secondary/70 border border-border focus:border-brand-purple rounded-premium text-sm font-sans focus:outline-none transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3 rounded-premium text-sm font-semibold border flex items-center gap-2 transition-all cursor-pointer
                ${showFilters 
                  ? 'bg-brand-purple/10 border-brand-purple text-brand-purple' 
                  : 'bg-white border-border hover:border-brand-purple text-brand-navy'
                }
              `}
            >
              <FiSliders />
              Filters
            </button>
            <Button onClick={() => refetch()} variant="primary" className="cursor-pointer">
              Search
            </Button>
          </div>
        </div>

        {/* ── Category Quick Links ────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer
                ${activeCategory === cat
                  ? 'bg-brand-purple text-white border-brand-purple shadow-premium'
                  : 'bg-white text-text-secondary border-border hover:text-brand-purple'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Advanced Filters Drawer ─────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass p-6 rounded-premium border-white/50 shadow-glass overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Type Select */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-brand-navy uppercase tracking-wider">Type</label>
                <div className="flex bg-surface-tertiary p-1 rounded-premium gap-1">
                  {['all', 'product', 'service'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-all capitalize cursor-pointer
                        ${type === t 
                          ? 'bg-white text-brand-purple shadow-sm' 
                          : 'text-text-secondary hover:text-brand-purple'
                        }
                      `}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance radius */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-bold text-brand-navy uppercase tracking-wider">
                  <span>Proximity Range</span>
                  <span className="text-brand-purple font-black lowercase">{distance}km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={distance}
                  onChange={(e) => setDistance(parseInt(e.target.value))}
                  className="w-full accent-brand-purple mt-2"
                />
              </div>

              {/* Price Limits */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-brand-navy uppercase tracking-wider">Price Budget</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Min Ratings */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-brand-navy uppercase tracking-wider">Vendor Rating</label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(rating === star ? 0 : star)}
                      className="p-1 cursor-pointer"
                    >
                      <FiStar
                        className={`w-5 h-5 transition-all
                          ${star <= rating ? 'fill-brand-orange text-brand-orange scale-110' : 'text-text-tertiary'}
                        `}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Viewports: Map View & List View ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* listings list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-bold text-brand-navy">
              Found {listings.length} matches
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader size="lg" />
            </div>
          ) : listings.length === 0 ? (
            <div className="glass p-12 text-center rounded-premium text-text-secondary flex flex-col items-center gap-2">
              <p className="text-base font-bold text-brand-navy">No results found</p>
              <p className="text-xs">Try clearing some filter criteria or search for another keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-4 rounded-premium border-white/50 shadow-glass hover:shadow-premium transition-all flex flex-col gap-3 group relative overflow-hidden"
                >
                  {/* Image banner */}
                  <div className="h-40 w-full rounded-premium overflow-hidden relative bg-surface-tertiary">
                    <img
                      src={item.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <span className={`absolute top-3 left-3 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white rounded shadow-sm
                      ${item.type === 'product' ? 'bg-brand-purple' : 'bg-brand-pink'}
                    `}>
                      {item.type}
                    </span>
                    {item.isBoosted && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 text-[9px] font-black uppercase text-white bg-brand-orange rounded shadow-sm">
                        Boosted
                      </span>
                    )}
                  </div>

                  {/* Title & Info */}
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-bold text-brand-navy font-display line-clamp-1 mt-0.5">
                      {item.title}
                    </h4>
                    {item.vendor && (
                      <span className="text-[10px] text-text-tertiary mt-0.5">
                        by {item.vendor.businessName || item.vendor.name}
                      </span>
                    )}
                  </div>

                  {/* Price and Ratings */}
                  <div className="flex justify-between items-center mt-2 pt-3 border-t border-border-light">
                    <div className="flex flex-col">
                      {item.salePrice ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-black text-brand-navy">₹{item.salePrice}</span>
                          <span className="text-[10px] line-through text-text-tertiary">₹{item.price}</span>
                          <span className="text-[9px] text-success font-bold">({item.discount}% OFF)</span>
                        </div>
                      ) : (
                        <span className="text-sm font-black text-brand-navy">₹{item.price}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <FiStar className="w-3.5 h-3.5 fill-brand-orange text-brand-orange" />
                      <span className="text-xs font-black text-brand-navy">{item.rating || 'New'}</span>
                    </div>
                  </div>

                  {/* Proximity Location details */}
                  <div className="flex items-center justify-between mt-1 text-[10px] text-text-secondary">
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <FiMapPin className="text-brand-purple" /> {item.location?.address || 'Local storefront'}
                    </span>
                    {item.distance !== undefined && (
                      <span className="font-bold text-brand-purple">
                        {parseFloat(item.distance / 1000).toFixed(1)} km away
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── Interactive Proximity Local Map Mockup ────────────────── */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider px-2">Storefront Proximity</h3>
          
          <div className="glass h-[420px] rounded-premium border-white/50 shadow-glass overflow-hidden relative flex items-center justify-center p-4">
            {/* Visual vector maps mockup */}
            <div className="absolute inset-0 bg-surface-tertiary flex flex-col p-4 opacity-80 justify-between select-none">
              <div className="grid grid-cols-6 grid-rows-6 h-full w-full gap-4 border border-dashed border-border pointer-events-none">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className="border-t border-l border-border-light/40" />
                ))}
              </div>
            </div>

            {/* Radar wave */}
            <div className="absolute w-56 h-56 rounded-full border border-brand-purple/20 bg-brand-purple/5 animate-pulse flex items-center justify-center">
              <div className="w-36 h-36 rounded-full border border-brand-purple/30 bg-brand-purple/5 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-brand-purple/40 bg-brand-purple/10" />
              </div>
            </div>

            {/* Center User Pin */}
            <div className="absolute flex flex-col items-center z-10">
              <div className="w-4 h-4 rounded-full bg-brand-purple ring-4 ring-brand-purple/30 shadow-premium animate-bounce" />
              <span className="px-2 py-0.5 rounded bg-brand-purple text-white text-[8px] font-black uppercase mt-1">
                You
              </span>
            </div>

            {/* Vendor Pin Mockups */}
            {listings.slice(0, 4).map((item, idx) => {
              const positions = [
                { top: '25%', left: '35%' },
                { top: '65%', left: '75%' },
                { top: '35%', left: '70%' },
                { top: '70%', left: '20%' },
              ];
              const pos = positions[idx % positions.length];
              return (
                <div
                  key={item._id}
                  className="absolute flex flex-col items-center group cursor-pointer z-10"
                  style={pos}
                >
                  <FiMapPin className="w-6 h-6 text-brand-orange fill-brand-orange hover:scale-125 transition-all filter drop-shadow-md" />
                  <div className="absolute bottom-6 scale-0 group-hover:scale-100 transition-all bg-brand-navy text-white text-[9px] p-2 rounded shadow-modal w-24 text-center select-none font-sans font-bold">
                    <p className="truncate text-white">{item.title}</p>
                    <p className="text-brand-orange text-[8px] mt-0.5">₹{item.price}</p>
                  </div>
                </div>
              );
            })}

            {/* Location status overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-premium border border-border shadow-premium flex items-center justify-between z-10 text-[10px]">
              <span className="font-semibold text-brand-navy flex items-center gap-1.5">
                <FiMapPin className="text-brand-purple animate-pulse" />
                {coords ? 'Location syncing active' : 'Default city range'}
              </span>
              <span className="text-brand-orange font-bold">Radius: {distance}km</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
