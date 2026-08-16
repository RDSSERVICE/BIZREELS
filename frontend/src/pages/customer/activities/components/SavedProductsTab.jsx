import React from 'react';
import { FiStar, FiShoppingBag, FiTrash2, FiShare2, FiExternalLink, FiMapPin } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '../../../../components/common/OptimizedImage';
import { resolveMediaUrl } from '../../../../lib/api';

const DEFAULT_PRODUCT_IMG = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80';

export default function SavedProductsTab({
  products = [],
  onAddToCart,
  onRemove,
  onShare,
}) {
  const navigate = useNavigate();

  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#e3dccb] space-y-2 p-6 shadow-xs">
        <p className="text-sm font-bold text-[#1a1a1a]">No saved products yet</p>
        <p className="text-xs">Browse local products and click the bookmark icon to save them for later.</p>
        <button
          onClick={() => navigate('/customer/search?type=product')}
          className="mt-3 px-4 py-2 bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
        >
          Explore Products
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
      {products.map((p) => {
        const itemId = p._id || p.id;
        const vendorObj = p.vendor || p.vendorId || {};
        const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || 'Verified Vendor';
        const rawImg = p.images?.[0] || p.image || p.mediaUrl || DEFAULT_PRODUCT_IMG;
        const imgUrl = resolveMediaUrl(rawImg);

        const origPrice = Number(p.actualPrice || p.regularPrice || p.price || 0);
        const salePrice = Number(p.sellingPrice || p.salePrice || p.price || 0);
        const hasDiscount = origPrice > salePrice;
        const inStock = p.stock === undefined || p.stock > 0;

        return (
          <div
            key={itemId}
            className="bg-white rounded-xl border border-[#e3dccb] shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group"
          >
            {/* Top vendor info bar */}
            <div className="p-3 flex items-center justify-between border-b border-[#e3dccb]/70 bg-[#f8f4ec]/40">
              <span className="text-[10px] font-extrabold uppercase text-[#d99a3d] tracking-wider truncate">
                {p.category || 'Product'}
              </span>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                inStock ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Media Image Area */}
            <div
              onClick={() => navigate(`/customer/search?productId=${itemId}`)}
              className="aspect-[4/3] bg-[#f8f4ec] relative overflow-hidden cursor-pointer"
            >
              <OptimizedImage
                src={imgUrl}
                alt={p.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                width={400}
              />
              {hasDiscount && (
                <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                  {Math.round(((origPrice - salePrice) / origPrice) * 100)}% OFF
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4
                  onClick={() => navigate(`/customer/search?productId=${itemId}`)}
                  className="font-bold text-sm text-[#1a1a1a] hover:text-[#7c3aed] transition cursor-pointer line-clamp-1"
                >
                  {p.title}
                </h4>

                <p
                  onClick={() => {
                    const vendorId = vendorObj._id || vendorObj.id || p.vendor;
                    if (vendorId) navigate(`/customer/vendor/${vendorId}`);
                  }}
                  className="text-xs text-slate-500 hover:text-[#7c3aed] cursor-pointer transition flex items-center gap-1 mt-1 truncate"
                >
                  <FiMapPin size={11} className="text-[#d99a3d] shrink-0" />
                  <span>By {vendorName}</span>
                </p>

                {/* Rating & Pricing */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e3dccb]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-black text-[#1a1a1a]">₹{salePrice.toLocaleString('en-IN')}</span>
                    {hasDiscount && (
                      <span className="text-[10px] text-slate-400 line-through">₹{origPrice.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#d99a3d]">
                    <FiStar size={11} className="fill-[#d99a3d]" />
                    <span>{p.rating || '4.8'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#e3dccb]">
                <button
                  type="button"
                  onClick={() => navigate(`/customer/search?productId=${itemId}`)}
                  className="py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <FiShoppingBag size={12} />
                  <span>View / Order</span>
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
                <span>Saved item</span>
                <button
                  type="button"
                  onClick={() => onShare('listing', itemId, p.title)}
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
