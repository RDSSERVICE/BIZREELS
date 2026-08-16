import React from 'react';
import { FiImage, FiTrash2, FiShare2, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '../../../../components/common/OptimizedImage';
import { resolveMediaUrl } from '../../../../lib/api';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80';

export default function SavedImagesTab({
  images = [],
  onRemove,
  onShare,
}) {
  const navigate = useNavigate();

  if (images.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#e3dccb] space-y-2 p-6 shadow-xs">
        <p className="text-sm font-bold text-[#1a1a1a]">No saved images yet</p>
        <p className="text-xs">Save product photos, portfolios, and banners to your personal collection.</p>
        <button
          onClick={() => navigate('/customer/search')}
          className="mt-3 px-4 py-2 bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
        >
          Browse Listings
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 font-sans">
      {images.map((img) => {
        const imgId = img._id || img.id;
        const rawUrl = img.images?.[0] || img.image || img.mediaUrl || img.url || DEFAULT_IMG;
        const url = resolveMediaUrl(rawUrl);

        return (
          <div
            key={imgId}
            className="bg-white rounded-xl border border-[#e3dccb] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
          >
            <div
              onClick={() => navigate(`/customer/search?productId=${imgId}`)}
              className="aspect-square bg-[#f8f4ec] relative overflow-hidden cursor-pointer"
            >
              <OptimizedImage
                src={url}
                alt={img.title || 'Saved Photo'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                width={350}
              />
            </div>

            <div className="p-3 bg-white flex items-center justify-between border-t border-[#e3dccb]">
              <div className="min-w-0 pr-2">
                <h5 className="font-bold text-xs text-[#1a1a1a] truncate">{img.title || 'Saved Image'}</h5>
                <p className="text-[10px] text-slate-400 truncate">{img.category || 'General'}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onShare('image', imgId, img.title)}
                  className="p-1 text-slate-500 hover:text-[#1a1a1a] transition cursor-pointer"
                  title="Share"
                >
                  <FiShare2 size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => onRemove(imgId)}
                  className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  title="Remove"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
