import React from 'react';
import {
  FiSearch, FiSliders, FiMapPin, FiGrid, FiTag, FiZap,
  FiShoppingBag, FiCheck, FiCornerDownLeft, FiStar, FiClock
} from 'react-icons/fi';

const DISTANCE_VALUES = [
  { value: 'all', label: 'Anywhere' },
  { value: '2', label: 'Within 2 km' },
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '20', label: 'Within 20 km' },
  { value: '50', label: 'Within 50 km' },
];

const getCategoryEmojiIcon = (categoryName) => {
  const name = (categoryName || '').toLowerCase().trim();
  if (name.includes('home') || name.includes('clean') || name.includes('housekeeping') || name.includes('maid')) return '🏠';
  if (name.includes('electronic') || name.includes('tech') || name.includes('gadget') || name.includes('phone')) return '💻';
  if (name.includes('fashion') || name.includes('apparel') || name.includes('cloth')) return '👔';
  if (name.includes('furniture') || name.includes('living')) return '🛋️';
  if (name.includes('service') || name.includes('repair') || name.includes('work')) return '🛠️';
  if (name.includes('auto') || name.includes('vehicle') || name.includes('car')) return '🚗';
  if (name.includes('grocery') || name.includes('mart') || name.includes('store')) return '🛒';
  if (name.includes('health') || name.includes('beauty') || name.includes('salon')) return '✨';
  if (name.includes('food') || name.includes('restaurant') || name.includes('cafe')) return '🍲';
  if (name.includes('education') || name.includes('coaching') || name.includes('school')) return '🎓';
  if (name.includes('real estate') || name.includes('property')) return '🏢';
  if (name.includes('jewelry') || name.includes('watch')) return '💎';
  if (name.includes('event') || name.includes('wedding')) return '🎉';
  return '📦';
};

export default function SearchFiltersBar({
  query,
  setQuery,
  type,
  setType,
  distance,
  setDistance,
  category,
  setCategory,
  categories = [],
  maxPrice,
  setMaxPrice,
  showAdvanced,
  setShowAdvanced,
  condition,
  setCondition,
  sellerType,
  setSellerType,
  minRating,
  setMinRating,
  hasOffers,
  setHasOffers,
  openNow,
  setOpenNow,
  shopName,
  setShopName,
  deliveryType,
  toggleDeliveryType,
}) {
  const activeAdvancedCount = [
    condition !== 'all' ? 1 : 0,
    sellerType !== 'all' ? 1 : 0,
    minRating !== 'all' ? 1 : 0,
    hasOffers ? 1 : 0,
    openNow ? 1 : 0,
    shopName ? 1 : 0,
    deliveryType.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-xl border border-[#e3dccb] shadow-xs p-4 sm:p-5 space-y-4 font-sans">
      {/* ── Top Search & Quick Type Bar ── */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search Input Box */}
        <div className="relative flex-1 flex items-center gap-2 bg-[#f8f4ec] rounded-lg border border-[#e3dccb] px-3 py-2 focus-within:border-[#d99a3d] focus-within:ring-2 focus-within:ring-[#d99a3d]/20 transition-all min-w-0">
          <div className="w-8 h-8 rounded-md bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center shrink-0 shadow-xs font-bold">
            <FiSearch size={16} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, services, shops, or keywords..."
            className="w-full bg-transparent text-xs sm:text-sm text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none font-medium truncate"
          />
        </div>

        {/* Type Toggle Tabs (All / Products / Services) */}
        <div className="flex bg-[#f8f4ec] p-1 rounded-lg border border-[#e3dccb] shrink-0">
          {[
            { id: 'all', label: 'All', icon: FiGrid },
            { id: 'product', label: 'Products', icon: FiTag },
            { id: 'service', label: 'Services', icon: FiZap },
          ].map((t) => {
            const Icon = t.icon;
            const active = type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#d99a3d] text-[#1a1a1a] shadow-xs'
                    : 'text-slate-600 hover:text-[#1a1a1a]'
                }`}
              >
                <Icon size={13} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Distance Selector */}
        <div className="relative shrink-0">
          <select
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="w-full sm:w-auto bg-[#f8f4ec] border border-[#e3dccb] rounded-lg px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] cursor-pointer"
          >
            {DISTANCE_VALUES.map((d) => (
              <option key={d.value} value={d.value}>
                📍 {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Advanced Filters Button */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer shrink-0 ${
            showAdvanced || activeAdvancedCount > 0
              ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
              : 'bg-[#f8f4ec] text-[#1a1a1a] border-[#e3dccb] hover:border-[#d99a3d]'
          }`}
        >
          <FiSliders size={14} />
          <span>Filters</span>
          {activeAdvancedCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#d99a3d] text-[#1a1a1a] text-[10px] font-black flex items-center justify-center">
              {activeAdvancedCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Category Chips Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer border ${
            category === 'all'
              ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#d99a3d]'
              : 'bg-[#f8f4ec] text-slate-600 border-[#e3dccb] hover:border-[#d99a3d]'
          }`}
        >
          All Categories
        </button>
        {(categories.length > 0
          ? categories
          : [
              { name: 'Electronics' },
              { name: 'Fashion' },
              { name: 'Furniture' },
              { name: 'Services' },
              { name: 'Automobile' },
              { name: 'Grocery' },
              { name: 'Healthcare' },
              { name: 'Restaurant' },
              { name: 'Education' },
            ]
        ).map((cat) => {
          const catName = cat.name || cat;
          const active = category === catName;
          return (
            <button
              key={cat._id || cat.id || catName}
              type="button"
              onClick={() => setCategory(catName)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer border ${
                active
                  ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#d99a3d]'
                  : 'bg-[#f8f4ec] text-slate-600 border-[#e3dccb] hover:border-[#d99a3d]'
              }`}
            >
              <span className="flex items-center gap-1">
                <span>{getCategoryEmojiIcon(catName)}</span>
                <span>{catName}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Price Slider & Budget Row (Up to ₹2 Crore) ── */}
      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#e3dccb] gap-4 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <span className="font-bold text-[#1a1a1a] flex items-center gap-1">
            <span>Max Budget:</span>
          </span>
          <span className="font-extrabold text-[#7c3aed] bg-[#7c3aed]/10 px-2.5 py-0.5 rounded-md text-xs">
            {maxPrice >= 20000000
              ? '₹2 Cr (Max)'
              : maxPrice >= 10000000
              ? `₹${(maxPrice / 10000000).toFixed(maxPrice % 10000000 === 0 ? 0 : 2)} Cr`
              : maxPrice >= 100000
              ? `₹${(maxPrice / 100000).toFixed(maxPrice % 100000 === 0 ? 0 : 1)} Lakh`
              : `₹${maxPrice.toLocaleString('en-IN')}`}
          </span>
          <input
            type="range"
            min={1000}
            max={20000000}
            step={maxPrice < 100000 ? 5000 : maxPrice < 1000000 ? 25000 : 100000}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="accent-[#d99a3d] cursor-pointer w-32 sm:w-48"
          />

          {/* Quick Preset Chips */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { label: '50k', val: 50000 },
              { label: '5L', val: 500000 },
              { label: '25L', val: 2500000 },
              { label: '1 Cr', val: 10000000 },
              { label: '2 Cr', val: 20000000 },
            ].map((chip) => (
              <button
                key={chip.val}
                type="button"
                onClick={() => setMaxPrice(chip.val)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                  maxPrice === chip.val
                    ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                    : 'bg-[#f8f4ec] text-slate-600 border-[#e3dccb] hover:bg-[#e3dccb]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer bg-[#f8f4ec] px-2.5 py-1 rounded-md border border-[#e3dccb]">
            <input
              type="checkbox"
              checked={hasOffers}
              onChange={(e) => setHasOffers(e.target.checked)}
              className="accent-[#d99a3d] w-3.5 h-3.5 rounded"
            />
            <span className="text-[11px] font-bold text-[#1a1a1a]">🔥 With Offers</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-[#f8f4ec] px-2.5 py-1 rounded-md border border-[#e3dccb]">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              className="accent-emerald-500 w-3.5 h-3.5 rounded"
            />
            <span className="text-[11px] font-bold text-emerald-700">🟢 Open Now</span>
          </label>
        </div>
      </div>

      {/* ── Advanced Filters Drawer ── */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#e3dccb] animate-fade-in bg-[#f8f4ec]/60 p-3 rounded-lg">
          {/* Delivery Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Delivery Type
            </label>
            <div className="flex flex-wrap gap-1">
              {['Home Delivery', 'Shop Pickup', 'Courier Available', 'COD Available'].map((dt) => (
                <button
                  type="button"
                  key={dt}
                  onClick={() => toggleDeliveryType(dt)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition border cursor-pointer ${
                    deliveryType.includes(dt)
                      ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                      : 'bg-white border-[#e3dccb] text-slate-600 hover:border-[#d99a3d]'
                  }`}
                >
                  {dt}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-white border border-[#e3dccb] rounded-lg px-2.5 py-1.5 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
            >
              <option value="all">All Conditions</option>
              <option value="new">New</option>
              <option value="used">Old / Used</option>
              <option value="refurbished">Refurbished</option>
            </select>
          </div>

          {/* Seller Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Seller Type
            </label>
            <select
              value={sellerType}
              onChange={(e) => setSellerType(e.target.value)}
              className="w-full bg-white border border-[#e3dccb] rounded-lg px-2.5 py-1.5 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
            >
              <option value="all">All Sellers</option>
              <option value="verified">✅ Verified Vendor</option>
              <option value="gst_verified">📋 GST Verified</option>
              <option value="local">📍 Local Seller</option>
            </select>
          </div>

          {/* Minimum Rating */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Minimum Rating
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-full bg-white border border-[#e3dccb] rounded-lg px-2.5 py-1.5 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
            >
              <option value="all">Any Rating</option>
              <option value="4">⭐ 4+ Stars</option>
              <option value="3">⭐ 3+ Stars</option>
              <option value="2">⭐ 2+ Stars</option>
            </select>
          </div>

          {/* Shop Name Search */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Filter by Specific Shop / Vendor Name
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Kumar Electronics, Sharma Services..."
              className="w-full px-3 py-1.5 bg-white border border-[#e3dccb] rounded-lg text-xs text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:border-[#d99a3d]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
