import React from 'react';
import { FiPlay, FiHeart, FiTrash2, FiShare2, FiExternalLink, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '../../../../components/common/OptimizedImage';
import { resolveMediaUrl } from '../../../../lib/api';

const DEFAULT_REEL_IMG = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';

export default function SavedReelsTab({
  reels = [],
  onRemove,
  onShare,
}) {
  const navigate = useNavigate();

  if (reels.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#e3dccb] space-y-2 p-6 shadow-xs">
        <p className="text-sm font-bold text-[#1a1a1a]">No saved reels yet</p>
        <p className="text-xs">Browse local reels on the home feed and click the bookmark button to save them here.</p>
        <button
          onClick={() => navigate('/customer')}
          className="mt-3 px-4 py-2 bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
        >
          Explore Home Feed
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5 font-sans">
      {reels.map((r) => {
        const reelId = r._id || r.id;
        const creatorObj = r.creator || r.user || {};
        const creatorName = creatorObj.name || creatorObj.shopName || 'Creator';
        const rawThumb = r.thumbnailUrl || r.thumbnail || r.mediaUrls?.[0] || r.coverUrl || DEFAULT_REEL_IMG;
        const thumbUrl = resolveMediaUrl(rawThumb);

        return (
          <div
            key={reelId}
            className="bg-white rounded-xl border border-[#e3dccb] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
          >
            {/* Reel 9:16 aspect preview */}
            <div
              onClick={() => navigate(`/reels?reelId=${reelId}`)}
              className="aspect-[9/16] bg-black relative overflow-hidden cursor-pointer"
            >
              <OptimizedImage
                src={thumbUrl}
                alt={r.caption || 'Reel'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                width={300}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3">
                <span className="text-[10px] font-bold text-white/90 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded w-fit">
                  🎬 {r.category || 'Reel'}
                </span>

                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-full bg-[#d99a3d]/90 text-[#1a1a1a] flex items-center justify-center mx-auto shadow-md group-hover:scale-110 transition-transform">
                    <FiPlay size={18} className="fill-[#1a1a1a] ml-0.5" />
                  </div>
                  <p className="text-white text-xs font-bold line-clamp-2 leading-tight">
                    {r.caption || r.title || 'Local Business Reel'}
                  </p>
                  <p className="text-white/70 text-[10px] truncate">
                    @{creatorName}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="p-2.5 bg-white border-t border-[#e3dccb] flex items-center justify-between">
              <button
                type="button"
                onClick={() => onShare('reel', reelId, r.caption || 'Reel')}
                className="p-1 text-slate-500 hover:text-[#1a1a1a] transition cursor-pointer"
                title="Share Reel"
              >
                <FiShare2 size={13} />
              </button>

              <button
                type="button"
                onClick={() => onRemove(reelId)}
                className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                title="Remove from Saved"
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
