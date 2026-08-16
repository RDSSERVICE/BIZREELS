import React from 'react';
import { FiStar, FiCalendar, FiTrash2, FiShare2, FiMessageSquare, FiMapPin } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../../../lib/api';

export default function SavedServicesTab({
  services = [],
  onOpenBooking,
  onRemove,
  onShare,
}) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((s) => {
        const coverImg = s.serviceDetails?.coverImage || s.images?.[0] || 'https://via.placeholder.com/300';
        const activeStatus = s.status === 'published';

        return (
          <div
            key={s.id || s._id}
            className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/10 border border-border flex-shrink-0 relative">
                <img
                  src={resolveMediaUrl(coverImg)}
                  alt={s.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className={`absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white ${activeStatus ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                  {activeStatus ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-brand-purple font-bold">{s.category}</span>
                <h4 className="font-bold text-xs text-text-primary truncate mb-0.5">{s.title}</h4>
                <p className="text-[10px] text-text-tertiary truncate">
                  By <span
                    className="font-semibold text-text-secondary cursor-pointer hover:underline"
                    onClick={() => navigate(`/customer/vendor/${s.vendor?.id || s.vendor?._id}`)}
                  >
                    {s.vendor?.vendorProfile?.shopName || s.vendor?.name || 'Service Provider'}
                  </span>
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-1 text-[10px] text-yellow-500 font-bold">
                  <FiStar size={11} fill="currentColor" />
                  <span>{s.rating || 0}</span>
                </div>

                {/* Area & Price */}
                <div className="text-[9px] text-text-tertiary flex items-center gap-1 mt-1">
                  <FiMapPin size={10} />
                  <span className="truncate">{s.serviceDetails?.serviceArea || 'Local'}</span>
                </div>

                <p className="text-xs font-bold text-brand-purple mt-2">
                  Starting: ₹{(s.price || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => onOpenBooking(s)}
                disabled={!activeStatus}
                className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <FiCalendar size={11} /> Book Service
              </button>
              <button
                onClick={() => onRemove(s.id || s._id)}
                className="py-2 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
              >
                <FiTrash2 size={11} /> Remove
              </button>
            </div>

            <div className="flex justify-between items-center text-[9px] text-text-tertiary border-t border-border/50 pt-2">
              <span>Saved: {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : 'Recently'}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/customer/chat?vendorId=${s.vendor?.id || s.vendor?._id}`)}
                  className="hover:text-brand-purple p-1"
                >
                  <FiMessageSquare size={11} />
                </button>
                <button onClick={() => onShare('listing', s.id || s._id, s.title)} className="hover:text-brand-purple p-1">
                  <FiShare2 size={11} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
