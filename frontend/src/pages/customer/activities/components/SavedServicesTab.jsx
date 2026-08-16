import React from 'react';
import { FiStar, FiTool, FiTrash2, FiShare2, FiMapPin, FiCalendar, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '../../../../components/common/OptimizedImage';
import { resolveMediaUrl } from '../../../../lib/api';

const DEFAULT_SERVICE_IMG = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80';

export default function SavedServicesTab({
  services = [],
  onBookService,
  onRemove,
  onShare,
}) {
  const navigate = useNavigate();

  if (services.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#e3dccb] space-y-2 p-6 shadow-xs">
        <p className="text-sm font-bold text-[#1a1a1a]">No saved services yet</p>
        <p className="text-xs">Browse local service professionals and save services for quick booking.</p>
        <button
          onClick={() => navigate('/customer/search?type=service')}
          className="mt-3 px-4 py-2 bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
        >
          Explore Services
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
      {services.map((s) => {
        const itemId = s._id || s.id;
        const vendorObj = s.vendor || s.vendorId || {};
        const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || 'Verified Vendor';
        const rawImg = s.images?.[0] || s.image || s.mediaUrl || DEFAULT_SERVICE_IMG;
        const imgUrl = resolveMediaUrl(rawImg);

        const priceVal = Number(s.price || s.salePrice || 0);

        return (
          <div
            key={itemId}
            className="bg-white rounded-xl border border-[#e3dccb] shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group"
          >
            {/* Top vendor info bar */}
            <div className="p-3 flex items-center justify-between border-b border-[#e3dccb]/70 bg-[#f8f4ec]/40">
              <span className="text-[10px] font-extrabold uppercase text-[#7c3aed] tracking-wider truncate">
                {s.category || 'Service'}
              </span>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-[#7c3aed] border border-purple-200">
                {s.serviceDetails?.serviceType || 'On-site'}
              </span>
            </div>

            {/* Media Image Area */}
            <div
              onClick={() => navigate(`/customer/search?productId=${itemId}`)}
              className="aspect-[4/3] bg-[#f8f4ec] relative overflow-hidden cursor-pointer"
            >
              <OptimizedImage
                src={imgUrl}
                alt={s.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                width={400}
              />
            </div>

            {/* Content Details */}
            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4
                  onClick={() => navigate(`/customer/search?productId=${itemId}`)}
                  className="font-bold text-sm text-[#1a1a1a] hover:text-[#7c3aed] transition cursor-pointer line-clamp-1"
                >
                  {s.title}
                </h4>

                <p
                  onClick={() => {
                    const vendorId = vendorObj._id || vendorObj.id || s.vendor;
                    if (vendorId) navigate(`/customer/vendor/${vendorId}`);
                  }}
                  className="text-xs text-slate-500 hover:text-[#7c3aed] cursor-pointer transition flex items-center gap-1 mt-1 truncate"
                >
                  <FiMapPin size={11} className="text-[#d99a3d] shrink-0" />
                  <span>By {vendorName}</span>
                </p>

                {/* Duration & Availability badges */}
                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 bg-[#f8f4ec] px-2 py-0.5 rounded border border-[#e3dccb]">
                    <FiClock size={10} className="text-[#d99a3d]" />
                    <span>{s.serviceDetails?.durationText || '1 Hour'}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#d99a3d] ml-auto">
                    <FiStar size={11} className="fill-[#d99a3d]" />
                    <span>{s.rating || '4.9'}</span>
                  </span>
                </div>

                {/* Price */}
                <div className="mt-2 pt-2 border-t border-[#e3dccb]">
                  <span className="text-sm font-black text-[#1a1a1a]">₹{priceVal.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-400 ml-1 font-semibold">/ service visit</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#e3dccb]">
                <button
                  type="button"
                  onClick={() => onBookService(s)}
                  className="py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <FiCalendar size={12} />
                  <span>Book Service</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRemove(itemId)}
                  className="py-2 rounded-lg bg-[#f8f4ec] hover:bg-red-50 hover:text-red-600 border border-[#e3dccb] text-slate-600 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FiTrash2 size={12} />
                  <span>Remove</span>
                </button>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                <span>Saved service</span>
                <button
                  type="button"
                  onClick={() => onShare('service', itemId, s.title)}
                  className="p-1 text-slate-500 hover:text-[#1a1a1a] transition cursor-pointer"
                  title="Share"
                >
                  <FiShare2 size={12} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
