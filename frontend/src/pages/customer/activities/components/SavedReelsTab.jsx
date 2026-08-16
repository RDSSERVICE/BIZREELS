import React from 'react';
import { FiVideo, FiExternalLink, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../../../lib/api';

export default function SavedReelsTab({
  reels = [],
  onRemove,
}) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reels.map((r) => (
        <div
          key={r.id || r._id}
          className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 group"
        >
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/10 border border-border flex-shrink-0 relative">
              {r.thumbnailUrl ? (
                <img
                  src={resolveMediaUrl(r.thumbnailUrl)}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-brand-purple/20 flex items-center justify-center">
                  <FiVideo size={24} className="text-brand-purple" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-brand-purple font-bold">
                {r.category || 'Reel'}
              </span>
              <h4 className="font-bold text-xs text-text-primary truncate mb-0.5">
                {r.caption || 'Video Reel'}
              </h4>
              <p className="text-[10px] text-text-tertiary truncate">
                By <span className="font-semibold text-text-secondary">
                  {r.creator?.vendorProfile?.shopName || r.creator?.name || 'Creator'}
                </span>
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-text-tertiary">
                <span>👁️ {r.views || 0} views</span>
                <span>❤️ {r.likesCount || 0} likes</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => navigate(`/customer/home?reel=${r.id || r._id}`)}
              className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition flex items-center justify-center gap-1"
            >
              <FiExternalLink size={11} /> Watch Reel
            </button>
            <button
              onClick={() => onRemove(r.id || r._id)}
              className="py-2 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
            >
              <FiTrash2 size={11} /> Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
