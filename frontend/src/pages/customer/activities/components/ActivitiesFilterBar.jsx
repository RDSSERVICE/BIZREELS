import React from 'react';
import { FiSearch, FiTrash2 } from 'react-icons/fi';

export default function ActivitiesFilterBar({
  activeTab,
  search,
  setSearch,
  category,
  setCategory,
  status,
  setStatus,
  sortBy,
  setSortBy,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  setPage,
  categoriesList = [],
  dataCount = 0,
  onClearAll,
}) {
  const isCustomTab = [
    'saved-products', 'saved-services', 'saved-reels', 'saved-images',
    'click-to-called', 'whatsapp-contacted', 'chat-inquiries'
  ].includes(activeTab);

  return (
    <div className="glass rounded-2xl p-4 border border-white/50 shadow-card flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
      {/* Search Bar */}
      <div className="relative flex-1">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={15} />
        <input
          type="text"
          placeholder={`Search ${activeTab.replace('-', ' ')}...`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
        />
      </div>

      {/* Filter and Sort options */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category filter */}
        {['saved-products', 'saved-services', 'saved-images', 'following-vendors'].includes(activeTab) && (
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold text-text-secondary focus:outline-none focus:border-brand-purple"
          >
            <option value="">All Categories</option>
            {categoriesList.map((c) => (
              <option key={c.id || c.name || c} value={c.name || c}>
                {c.name || c}
              </option>
            ))}
          </select>
        )}

        {/* Price Range Filter */}
        {['saved-products', 'saved-services', 'my-orders', 'quotes'].includes(activeTab) && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
              className="w-20 px-2 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
            <span className="text-xs text-text-tertiary">-</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
              className="w-20 px-2 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>
        )}

        {/* Status Filters */}
        {(activeTab === 'my-orders' || activeTab === 'inquiries' || activeTab === 'quotes') && (
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold text-text-secondary focus:outline-none focus:border-brand-purple"
          >
            <option value="">All Statuses</option>
            {activeTab === 'my-orders' && (
              <>
                <option value="active">Active Requests</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
                <option value="refunded">Refunded</option>
              </>
            )}
            {activeTab === 'inquiries' && (
              <>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="replied">Replied</option>
                <option value="closed">Closed</option>
              </>
            )}
            {activeTab === 'quotes' && (
              <>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </>
            )}
          </select>
        )}

        {/* Sort Menu */}
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold text-text-secondary focus:outline-none focus:border-brand-purple"
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          {['saved-products', 'saved-services', 'my-orders', 'quotes'].includes(activeTab) && (
            <>
              <option value="price_low_high">Price: Low → High</option>
              <option value="price_high_low">Price: High → Low</option>
            </>
          )}
          {['saved-products', 'saved-services', 'following-vendors', 'following-services'].includes(activeTab) && (
            <>
              <option value="highest_rated">Highest Rated</option>
              <option value="most_popular">Most Popular</option>
            </>
          )}
        </select>

        {/* Clear All action for custom tab logs */}
        {isCustomTab && dataCount > 0 && onClearAll && (
          <button
            onClick={onClearAll}
            className="px-3 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            <FiTrash2 size={13} />
            <span>Clear Tab</span>
          </button>
        )}
      </div>
    </div>
  );
}
