import React, { useState } from 'react';
import {
  FiX,
  FiExternalLink,
  FiPackage,
  FiTool,
  FiUser,
  FiCheckCircle,
  FiAlertTriangle,
  FiEye,
  FiHeart,
  FiShoppingBag,
  FiStar,
  FiMapPin,
  FiTruck,
  FiZap,
  FiSlash,
  FiRefreshCw,
  FiMessageSquare
} from 'react-icons/fi';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';
import { formatCurrencyINR, formatCompactNumber, getStockStatus } from './listingUtils';

export default function ListingDetailModal({
  listing,
  isOpen,
  onClose,
  onTakedown,
  onRestore,
  onToggleBoost,
  onModerate,
  isLoading
}) {
  if (!isOpen || !listing) return null;

  const images = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images : [];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const stockInfo = getStockStatus(listing);
  const isService = listing.type === 'service';
  const isTakenDown = listing.is_takendown === true || listing.status === 'hidden' || listing.status === 'paused';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col font-['Outfit']">
        {/* Header */}
        <div className="p-4 sm:px-6 sm:py-4 bg-white border-b border-[#e3dccb] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a1a1a]/5 text-[#1a1a1a] flex items-center justify-center font-bold">
              {isService ? <FiTool className="w-5 h-5 text-indigo-600" /> : <FiPackage className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-[#1a1a1a] font-['Archivo_Black'] truncate max-w-md">
                  {listing.title || 'Untitled Listing'}
                </h3>
                <AdminStatusBadge status={isTakenDown ? 'Reported' : listing.status} />
                {listing.isBoosted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    <FiZap className="w-3 h-3 fill-current text-amber-600" /> Boosted
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Listing ID: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-700">{listing.id || listing._id}</code> • Category: <strong className="text-slate-800">{listing.category || 'General'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View live public listing link */}
            <a
              href={`/listings/${listing.id || listing._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fbf9f4] hover:bg-[#e3dccb]/50 border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] transition-colors"
              title="Open public marketplace storefront"
            >
              <span>Storefront</span>
              <FiExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-[#1a1a1a] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Top Grid: Gallery & Main Pricing Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Media Gallery (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              <div className="aspect-square w-full rounded-2xl bg-white border border-[#e3dccb] overflow-hidden relative shadow-2xs">
                {images[activeImageIndex] ? (
                  <img
                    src={images[activeImageIndex]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <FiPackage className="w-16 h-16 mb-2" />
                    <span className="text-xs font-medium text-slate-400">No image uploaded</span>
                  </div>
                )}
                {images.length > 1 && (
                  <span className="absolute bottom-2.5 right-2.5 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {activeImageIndex + 1} / {images.length}
                  </span>
                )}
              </div>

              {/* Thumbnails Row */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                        activeImageIndex === idx
                          ? 'border-[#1a1a1a] shadow-xs scale-105'
                          : 'border-[#e3dccb] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Quick Dossier & Highlights (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Pricing & Stock Banner */}
              <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] shadow-2xs flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Selling Price</span>
                  <div className="text-2xl font-black text-emerald-700 font-['Archivo_Black']">
                    {formatCurrencyINR(listing.price || 0)}
                  </div>
                  {listing.actualPrice > listing.price && (
                    <div className="text-xs text-slate-400 line-through">
                      MRP: {formatCurrencyINR(listing.actualPrice)}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Inventory Level</span>
                  <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${stockInfo.color}`}>
                    {stockInfo.label}
                  </span>
                  {listing.sku && (
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      SKU: {listing.sku}
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Information Card */}
              <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Merchant / Vendor</span>
                  {listing.vendor_verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <FiCheckCircle className="w-3 h-3" /> Verified Seller
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 pt-1">
                  {listing.vendor_avatar ? (
                    <img src={listing.vendor_avatar} alt="" className="w-10 h-10 rounded-xl object-cover border border-[#e3dccb]" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
                      <FiUser className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-[#1a1a1a] truncate">
                      {listing.vendor_name || 'Registered Vendor'}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {listing.vendor_email || 'No email provided'} • {listing.vendor_phone || 'No phone'}
                    </p>
                  </div>
                  <a
                    href={`/admin/chat?vendorId=${listing.vendor_id}`}
                    className="p-2 bg-[#f8f4ec] hover:bg-[#e3dccb] text-[#1a1a1a] rounded-xl transition-colors shrink-0"
                    title="Open Direct Admin Chat with Vendor"
                  >
                    <FiMessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Engagement / Conversion Analytics */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-[#e3dccb] shadow-2xs">
                  <FiEye className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                  <div className="text-sm font-black text-[#1a1a1a]">{formatCompactNumber(listing.views || 0)}</div>
                  <div className="text-[10px] text-slate-500 font-bold">Views</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#e3dccb] shadow-2xs">
                  <FiHeart className="w-4 h-4 mx-auto text-rose-500 mb-1" />
                  <div className="text-sm font-black text-[#1a1a1a]">{formatCompactNumber(listing.likes || 0)}</div>
                  <div className="text-[10px] text-slate-500 font-bold">Likes</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#e3dccb] shadow-2xs">
                  <FiShoppingBag className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                  <div className="text-sm font-black text-[#1a1a1a]">{listing.orders_count || 0}</div>
                  <div className="text-[10px] text-slate-500 font-bold">Orders</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#e3dccb] shadow-2xs">
                  <FiStar className="w-4 h-4 mx-auto text-amber-500 mb-1 fill-current" />
                  <div className="text-sm font-black text-[#1a1a1a]">{listing.rating ? listing.rating.toFixed(1) : '—'}</div>
                  <div className="text-[10px] text-slate-500 font-bold">Rating</div>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Details */}
          <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-2">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Item Description</h4>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {listing.description || 'No detailed description provided for this listing.'}
            </p>
          </div>

          {/* Shipping & Logistics (if physical product) */}
          {!isService && listing.shippingDetails && (
            <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <FiTruck className="w-3.5 h-3.5" />
                <span>Shipping & Package Dimensions</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div><span className="text-slate-400">Weight:</span> <strong className="text-[#1a1a1a] ml-1">{listing.shippingDetails.weight || 0.5} kg</strong></div>
                <div><span className="text-slate-400">Dimensions:</span> <strong className="text-[#1a1a1a] ml-1">{listing.shippingDetails.dimensions || '10x10x10 cm'}</strong></div>
                <div><span className="text-slate-400">Free Shipping:</span> <strong className="text-[#1a1a1a] ml-1">{listing.shippingDetails.freeShipping ? 'Yes' : 'No'}</strong></div>
                <div><span className="text-slate-400">Est. Days:</span> <strong className="text-[#1a1a1a] ml-1">{listing.shippingDetails.estimatedDays || 5} days</strong></div>
              </div>
            </div>
          )}

          {/* Service Policies (if service) */}
          {isService && listing.serviceDetails && (
            <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <FiTool className="w-3.5 h-3.5" />
                <span>Service Operation Details</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div><span className="text-slate-400">Service Type:</span> <strong className="text-[#1a1a1a] ml-1">{listing.serviceDetails.serviceType || 'On-site'}</strong></div>
                <div><span className="text-slate-400">Duration:</span> <strong className="text-[#1a1a1a] ml-1">{listing.serviceDetails.durationText || '1 Hour'}</strong></div>
                <div><span className="text-slate-400">Home Visit:</span> <strong className="text-[#1a1a1a] ml-1">{listing.serviceDetails.homeVisitAvailable ? 'Available' : 'No'}</strong></div>
                <div><span className="text-slate-400">Working Hours:</span> <strong className="text-[#1a1a1a] ml-1">{listing.serviceDetails.workingHours || '9 AM - 8 PM'}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-white border-t border-[#e3dccb] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {/* Boost Toggle */}
            <button
              type="button"
              onClick={() => onToggleBoost(listing.id || listing._id)}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                listing.isBoosted
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-white text-slate-700 border-[#e3dccb] hover:border-[#1a1a1a]'
              }`}
            >
              <FiZap className={`w-3.5 h-3.5 ${listing.isBoosted ? 'fill-current text-amber-600' : ''}`} />
              <span>{listing.isBoosted ? 'Remove Boost' : 'Feature Listing'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isTakenDown ? (
              <button
                type="button"
                onClick={() => onRestore(listing.id || listing._id)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                <span>Restore to Market</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onTakedown(listing)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <FiSlash className="w-3.5 h-3.5" />
                <span>Takedown Listing</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
