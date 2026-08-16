import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMapPin, FiStar, FiShoppingBag, FiTool, FiHeart,
  FiBookmark, FiShare2, FiPhone, FiMessageSquare, FiPackage,
  FiCheckCircle, FiClock
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import OptimizedImage from '../../../../components/common/OptimizedImage';
import { resolveMediaUrl } from '../../../../lib/api';

export default function ListingCard({
  item,
  coords,
  geocodedCache,
  onSelect,
  isSaved,
  isLiked,
  onToggleSave,
  onToggleLike,
  onShare,
  onWhatsApp,
}) {
  const navigate = useNavigate();
  const itemId = item._id || item.id;
  const vendorObj = item.vendor || item.vendorId || {};
  const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || item.vendorName || 'Verified Vendor';
  const city = item.city || vendorObj.city || item.location?.city || 'Local';
  const vendorAvatar = vendorObj.avatarUrl || vendorObj.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
  
  const rawImage = item.images?.[0] || item.image || item.mediaUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
  const imageUrl = resolveMediaUrl(rawImage);
  const isService = item.type === 'service';

  // Distance calculation
  let distStr = 'Nearby';
  const itemAddress = item.location?.address || vendorObj.location?.address || vendorObj.address;
  const itemState = item.location?.state || vendorObj.location?.state || vendorObj.state;
  const itemPincode = item.location?.pincode || vendorObj.location?.pincode || vendorObj.pincode;
  const itemLocStr = [itemAddress, city, itemState, itemPincode].filter(Boolean).join(', ') || city;

  const vendorCoords = (vendorObj.location && Array.isArray(vendorObj.location.coordinates) && vendorObj.location.coordinates.length === 2 && (vendorObj.location.coordinates[0] !== 0 || vendorObj.location.coordinates[1] !== 0))
    ? vendorObj.location.coordinates
    : (geocodedCache[itemLocStr] ? [geocodedCache[itemLocStr].lng, geocodedCache[itemLocStr].lat] : null);
  const itemCoords = (item.location && Array.isArray(item.location.coordinates) && item.location.coordinates.length === 2 && (item.location.coordinates[0] !== 0 || item.location.coordinates[1] !== 0))
    ? item.location.coordinates
    : null;

  const targetCoords = itemCoords || vendorCoords;

  if (coords && targetCoords && (coords.lat !== 0 || coords.lng !== 0)) {
    const [targetLng, targetLat] = targetCoords;
    const R = 6371; // Earth radius in km
    const dLat = (targetLat - coords.lat) * (Math.PI / 180);
    const dLng = (targetLng - coords.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coords.lat * (Math.PI / 180)) *
      Math.cos(targetLat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const calculatedKm = R * c;
    if (calculatedKm < 6000) {
      distStr = `${calculatedKm.toFixed(1)} km`;
    }
  } else if (item.distance !== undefined && item.distance !== null && item.distance / 1000 < 6000) {
    const km = item.distance / 1000;
    distStr = `${km.toFixed(1)} km`;
  } else if (item.distanceKm !== undefined && item.distanceKm !== null && Number(item.distanceKm) < 6000) {
    distStr = `${Number(item.distanceKm).toFixed(1)} km`;
  }

  const priceVal = Number(item.salePrice || item.price || 0);
  const originalPrice = Number(item.actualPrice || item.regularPrice || 0);

  return (
    <div
      className="bg-white rounded-xl border border-[#e3dccb] shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group"
      onClick={() => onSelect(item)}
    >
      {/* ── 1. Vendor Card Header ── */}
      <div className="p-3 flex items-center justify-between border-b border-[#e3dccb]/70 bg-[#f8f4ec]/40">
        <div
          onClick={(e) => {
            e.stopPropagation();
            const vendorId = vendorObj._id || vendorObj.id || item.vendor;
            if (vendorId) navigate(`/customer/vendor/${vendorId}`);
          }}
          className="flex items-center gap-2.5 cursor-pointer min-w-0"
        >
          <img
            src={resolveMediaUrl(vendorAvatar)}
            alt={vendorName}
            className="w-8 h-8 rounded-full object-cover border border-[#e3dccb]"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
            }}
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[#1a1a1a] hover:text-[#7c3aed] transition truncate flex items-center gap-1">
              <span>{vendorName}</span>
              <FiCheckCircle size={11} className="text-[#d99a3d] shrink-0" />
            </h4>
            <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
              <FiMapPin size={9} className="text-[#d99a3d] shrink-0" />
              <span>{city}</span>
            </p>
          </div>
        </div>

        {/* Distance Badge */}
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#d99a3d]/15 text-[#1a1a1a] border border-[#d99a3d]/30 shrink-0">
          {distStr === 'Nearby' ? '📍 Nearby' : `📍 ${distStr}`}
        </span>
      </div>

      {/* ── 2. Image / Media Area ── */}
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden cursor-pointer">
        <OptimizedImage
          src={imageUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          width={400}
        />

        {/* Type Badge */}
        <div className="absolute top-2.5 left-2.5 bg-[#1a1a1a]/85 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          {isService ? <FiTool size={10} className="text-[#d99a3d]" /> : <FiShoppingBag size={10} className="text-[#d99a3d]" />}
          <span>{item.type || 'product'}</span>
        </div>

        {/* Category Pill */}
        <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-[#1a1a1a] px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-[#e3dccb] shadow-xs">
          {item.category || 'General'}
        </div>

        {/* Discount Tag if available */}
        {originalPrice > priceVal && (
          <div className="absolute bottom-2.5 left-2.5 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
            {Math.round(((originalPrice - priceVal) / originalPrice) * 100)}% OFF
          </div>
        )}
      </div>

      {/* ── 3. Post / Card Body ── */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider truncate">
              {item.subcategory || item.brand || 'Local Deal'}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-extrabold text-[#d99a3d] shrink-0">
              <FiStar size={12} className="fill-[#d99a3d]" />
              <span>{item.rating || '4.8'}</span>
            </span>
          </div>

          <h3 className="font-bold text-sm text-[#1a1a1a] line-clamp-1 group-hover:text-[#7c3aed] transition">
            {item.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {item.description || item.shortDescription || 'Available directly from local vendor. Click to view specifications, working hours and place orders.'}
          </p>
        </div>

        {/* ── 4. Action Row & Pricing ── */}
        <div className="pt-2.5 border-t border-[#e3dccb] space-y-2.5">
          {/* Quick Interaction Buttons (Like, Save, Share, WhatsApp) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike(itemId);
                }}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isLiked
                    ? 'bg-red-50 border-red-200 text-red-500'
                    : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-600 hover:text-red-500'
                }`}
                title="Like"
              >
                <FiHeart size={14} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(itemId);
                }}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isSaved
                    ? 'bg-amber-50 border-amber-200 text-[#d99a3d]'
                    : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-600 hover:text-[#d99a3d]'
                }`}
                title="Save / Bookmark"
              >
                <FiBookmark size={14} className={isSaved ? 'fill-[#d99a3d] text-[#d99a3d]' : ''} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(item);
                }}
                className="p-1.5 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] text-slate-600 hover:text-[#1a1a1a] transition cursor-pointer"
                title="Share"
              >
                <FiShare2 size={14} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onWhatsApp(item);
                }}
                className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition cursor-pointer"
                title="Chat on WhatsApp"
              >
                <FaWhatsapp size={14} />
              </button>
            </div>

            {/* Price Display */}
            <div className="text-right">
              <div className="text-sm sm:text-base font-black text-[#1a1a1a]">
                ₹{priceVal.toLocaleString('en-IN')}
              </div>
              {originalPrice > priceVal && (
                <div className="text-[10px] text-slate-400 line-through">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </div>
              )}
            </div>
          </div>

          {/* View Details / Order CTA Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="w-full py-2 px-3 rounded-lg bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FiPackage size={13} />
            <span>View Details & Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}
