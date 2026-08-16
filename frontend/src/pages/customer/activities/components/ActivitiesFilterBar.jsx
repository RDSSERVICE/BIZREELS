import React from 'react';
import { FiSearch, FiSliders } from 'react-icons/fi';

export default function ActivitiesFilterBar({
  search,
  setSearch,
  category,
  setCategory,
  categories = [],
  sortBy,
  setSortBy,
  status,
  setStatus,
  showCategory = true,
  showStatus = false,
  showPriceFilter = false,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  totalResults = 0,
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e3dccb] p-3.5 sm:p-4 shadow-xs space-y-3 font-sans">
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search input with framed icon */}
        <div className="relative flex-1 flex items-center gap-2 bg-[#f8f4ec] rounded-lg border border-[#e3dccb] px-3 py-1.5 focus-within:border-[#d99a3d] focus-within:ring-2 focus-within:ring-[#d99a3d]/20 transition-all min-w-0">
          <div className="w-7 h-7 rounded-md bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center shrink-0 shadow-xs font-bold">
            <FiSearch size={14} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title, vendor name, or keyword..."
            className="w-full bg-transparent text-xs text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none font-medium truncate"
          />
        </div>

        {/* Dropdown controls */}
        <div className="flex flex-wrap items-center gap-2">
          {showCategory && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#f8f4ec] border border-[#e3dccb] rounded-lg px-3 py-1.5 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {showStatus && (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-[#f8f4ec] border border-[#e3dccb] rounded-lg px-3 py-1.5 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#f8f4ec] border border-[#e3dccb] rounded-lg px-3 py-1.5 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] cursor-pointer"
          >
            <option value="latest">Latest Added</option>
            <option value="price_low_high">Price: Low to High</option>
            <option value="price_high_low">Price: High to Low</option>
          </select>
        </div>
      </div>

      {showPriceFilter && (
        <div className="flex items-center gap-3 pt-2 border-t border-[#e3dccb] text-xs">
          <span className="font-bold text-[#1a1a1a]">Budget Filter:</span>
          <input
            type="number"
            placeholder="Min ₹"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-24 bg-[#f8f4ec] border border-[#e3dccb] rounded-lg px-2.5 py-1 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-24 bg-[#f8f4ec] border border-[#e3dccb] rounded-lg px-2.5 py-1 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
          />
        </div>
      )}
    </div>
  );
}
