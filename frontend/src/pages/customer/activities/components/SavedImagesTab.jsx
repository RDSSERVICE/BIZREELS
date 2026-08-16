import React from 'react';
import { FiExternalLink, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../../../lib/api';

export default function SavedImagesTab({
  images = [],
  onRemove,
}) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((img) => {
        const coverImg = img.images?.[0] || 'https://via.placeholder.com/300';
        return (
          <div
            key={img.id || img._id}
            className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/10 border border-border flex-shrink-0 relative">
                <img
                  src={resolveMediaUrl(coverImg)}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-brand-purple font-bold">
                  {img.category || 'Listing'}
                </span>
                <h4 className="font-bold text-xs text-text-primary truncate mb-0.5">{img.title}</h4>
                <p className="text-[10px] text-text-tertiary truncate">
                  By <span className="font-semibold text-text-secondary">
                    {img.vendor?.vendorProfile?.shopName || img.vendor?.name || 'Vendor'}
                  </span>
                </p>
                <p className="text-xs font-bold text-brand-purple mt-2">
                  ₹{(img.price || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => navigate(`/customer/search?search=${img.title}`)}
                className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition flex items-center justify-center gap-1"
              >
                <FiExternalLink size={11} /> View Listing
              </button>
              <button
                onClick={() => onRemove(img.id || img._id)}
                className="py-2 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
              >
                <FiTrash2 size={11} /> Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
