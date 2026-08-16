import React from 'react';
import { FiStar, FiShoppingBag, FiTrash2, FiShare2, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../../../lib/api';

export default function SavedProductsTab({
  products = [],
  onAddToCart,
  onRemove,
  onShare,
}) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p) => {
        const hasDiscount = p.discount > 0 || (p.actualPrice && p.sellingPrice && p.actualPrice > p.sellingPrice);
        const origPrice = p.actualPrice || p.price || 0;
        const salePrice = p.sellingPrice || p.salePrice || p.price || 0;
        const inStock = p.stock > 0;

        return (
          <div
            key={p.id || p._id}
            className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/10 border border-border flex-shrink-0 relative">
                <img
                  src={resolveMediaUrl(p.images?.[0] || 'https://via.placeholder.com/300')}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className={`absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white ${inStock ? 'bg-emerald-600' : 'bg-red-600'}`}>
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-brand-purple font-bold">{p.category}</span>
                <h4 className="font-bold text-xs text-text-primary truncate mb-0.5">{p.title}</h4>
                <p className="text-[10px] text-text-tertiary truncate">
                  By <span
                    className="font-semibold text-text-secondary cursor-pointer hover:underline"
                    onClick={() => navigate(`/customer/vendor/${p.vendor?.id || p.vendor?._id}`)}
                  >
                    {p.vendor?.vendorProfile?.shopName || p.vendor?.name || 'Verified Vendor'}
                  </span>
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-1 text-[10px] text-yellow-500 font-bold">
                  <FiStar size={11} fill="currentColor" />
                  <span>{p.rating || 0}</span>
                  <span className="text-[9px] text-text-tertiary">({p.totalReviews || 0})</span>
                </div>

                {/* Prices */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs font-bold text-text-primary">₹{salePrice.toLocaleString()}</span>
                  {hasDiscount && (
                    <>
                      <span className="text-[10px] text-text-tertiary line-through">₹{origPrice.toLocaleString()}</span>
                      <span className="text-[9px] px-1 bg-red-500/10 text-red-500 rounded font-bold">
                        {p.discount || Math.round(((origPrice - salePrice) / origPrice) * 100)}% Off
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => onAddToCart(p.id || p._id)}
                disabled={!inStock}
                className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <FiShoppingBag size={11} /> Buy Now
              </button>
              <button
                onClick={() => onRemove(p.id || p._id)}
                className="py-2 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
              >
                <FiTrash2 size={11} /> Remove
              </button>
            </div>

            <div className="flex justify-between items-center text-[9px] text-text-tertiary border-t border-border/50 pt-2">
              <span>Saved: {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Recently'}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => onShare('listing', p.id || p._id, p.title)} className="hover:text-brand-purple p-1">
                  <FiShare2 size={11} />
                </button>
                <button onClick={() => navigate(`/customer/search?search=${p.title}`)} className="hover:text-brand-purple p-1">
                  <FiExternalLink size={11} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
