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
      <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-2xs overflow-hidden font-sans p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-[#241b15] text-[#d99a3d] text-[9.5px] font-black uppercase rounded-full tracking-widest shadow-2xs">
                FREE PLAN ACTIVE
              </span>
              <span className="text-xs font-bold text-slate-500">Real-Time Database Sync</span>
            </div>
            <p className="text-xs text-slate-600 font-medium max-w-3xl leading-relaxed">
              List your products so customers can easily search, discover, and connect with you.
              <span className="hidden sm:inline"> The Free Plan allows you to list a limited number of products, which are searchable by customers.</span>
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-bold text-[#1a1a1a]">
              <div className="flex items-center gap-1.5"><FiCheck className="text-emerald-700 flex-shrink-0" /> List more products</div>
              <div className="flex items-center gap-1.5"><FiCheck className="text-emerald-700 flex-shrink-0" /> Increase search limit</div>
              <div className="flex items-center gap-1.5"><FiCheck className="text-emerald-700 flex-shrink-0" /> Product boost features</div>
              <div className="flex items-center gap-1.5"><FiCheck className="text-emerald-700 flex-shrink-0" /> Reach more customers</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onShowSubscription}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] font-black text-xs rounded-xl shadow-2xs transition flex-shrink-0 flex items-center justify-center gap-2 cursor-pointer border-none"
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
            type="button"
            onClick={onShowOfferModal}
            className="px-3.5 py-2 bg-[#d99a3d] text-[#241b15] hover:bg-[#c8892c] rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs border-none cursor-pointer"
          >
            <FiPercent /> <span className="hidden sm:inline">Create Dynamic Offer</span><span className="sm:hidden">New Offer</span>
          </button>
          <button
            type="button"
            onClick={onShowAddModal}
            className="px-3.5 py-2 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs border-none cursor-pointer"
          >
            <FiPlus className="w-4 h-4" /> <span className="hidden sm:inline">Add Product / Service</span><span className="sm:hidden">Add Product</span>
          </button>
        </div>
      </AdminPageHeader>
    </>
  );
}
