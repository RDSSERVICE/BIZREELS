import React from 'react';
import {
  FiPackage, FiPlus, FiPercent, FiZap, FiCheck
} from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';

/**
 * ListingHeader — Top banner (subscription info) + page header with action buttons
 */
export default function ListingHeader({
  registeredCat,
  onShowSubscription,
  onShowOfferModal,
  onShowAddModal,
}) {
  return (
    <>
      {/* Subscription Banner */}
      <div className="glass rounded-2xl sm:rounded-3xl border border-brand-purple/20 overflow-hidden shadow-premium bg-gradient-to-r from-brand-purple/5 via-surface to-brand-orange/5">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 sm:px-3 py-1 bg-brand-purple text-white text-[9px] sm:text-[10px] font-black uppercase rounded-full tracking-wider shadow-sm">
                FREE PLAN ACTIVE
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-text-secondary">Real-Time Database Sync</span>
            </div>
            <p className="text-[11px] sm:text-xs text-text-secondary max-w-3xl leading-relaxed">
              List your products so customers can easily search, discover, and connect with you.
              <span className="hidden sm:inline"> The Free Plan allows you to list a limited number of products, which are searchable by customers.</span>
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] sm:text-[11px] font-semibold text-text-primary">
              <div className="flex items-center gap-1.5"><FiCheck className="text-emerald-500 flex-shrink-0" /> List more products</div>
              <div className="flex items-center gap-1.5"><FiCheck className="text-emerald-500 flex-shrink-0" /> Increase search limit</div>
              <div className="flex items-center gap-1.5"><FiCheck className="text-emerald-500 flex-shrink-0" /> Product boost features</div>
              <div className="flex items-center gap-1.5"><FiCheck className="text-emerald-500 flex-shrink-0" /> Reach more customers</div>
            </div>
          </div>
          <button
            onClick={onShowSubscription}
            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 gradient-brand text-white font-bold text-[11px] sm:text-xs rounded-xl sm:rounded-2xl shadow-premium hover:opacity-90 transition flex-shrink-0 flex items-center justify-center gap-2"
          >
            <FiZap /> <span className="hidden sm:inline">SHOW SUBSCRIPTION PLAN</span><span className="sm:hidden">SUBSCRIPTION</span>
          </button>
        </div>
      </div>

      {/* Page Header */}
      <AdminPageHeader
        icon={FiPackage}
        title="My Listing & Offer Center (Real-Time)"
        subtitle={`Live database catalog • Category Scope: ${registeredCat || 'All Categories'}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onShowOfferModal}
            className="px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-xl text-[11px] sm:text-xs font-bold hover:bg-amber-600 transition flex items-center gap-1.5 shadow-sm"
          >
            <FiPercent /> <span className="hidden sm:inline">Create Dynamic Offer</span><span className="sm:hidden">New Offer</span>
          </button>
          <button
            onClick={onShowAddModal}
            className="px-3 sm:px-4 py-2 gradient-brand text-white rounded-xl text-[11px] sm:text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-premium"
          >
            <FiPlus className="w-4 h-4" /> <span className="hidden sm:inline">Add Product / Service</span><span className="sm:hidden">Add Product</span>
          </button>
        </div>
      </AdminPageHeader>
    </>
  );
}
