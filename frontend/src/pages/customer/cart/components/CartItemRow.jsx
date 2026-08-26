import React from 'react';
import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiPackage } from 'react-icons/fi';

export default function CartItemRow({ item, onUpdateQty, onRemove, isUpdating }) {
  const listingId = item.listing_id || item._id || item.id;

  return (
    <div
      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:bg-[#faf7f0]/50 ${
        isUpdating ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Product Image & Details */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <Link
          to={`/customer/listings/${listingId}`}
          className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-[#f2ede4] border border-[#e3dccb] overflow-hidden shrink-0 group relative block"
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.title || 'Product'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#d99a3d]">
              <FiPackage size={24} />
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1 space-y-1">
          <Link
            to={`/customer/listings/${listingId}`}
            className="text-xs sm:text-sm font-black text-[#1a1a1a] hover:text-[#d99a3d] transition line-clamp-1 block"
          >
            {item.title || 'Untitled Product / Listing'}
          </Link>
          
          <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <span>Price:</span>
            <span className="text-[#1a1a1a] font-extrabold">₹{item.price?.toLocaleString()}</span>
            <span className="text-slate-400">each</span>
          </p>

          <p className="text-xs font-black text-[#d99a3d] sm:hidden">
            Total: ₹{item.line_total?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Quantity & Action Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#f0ebe0]">
        {/* Quantity Modifier */}
        <div className="flex items-center gap-1.5 bg-[#f8f4ec] border border-[#e3dccb] p-1 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => onUpdateQty(listingId, item.quantity - 1)}
            disabled={isUpdating}
            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 border border-[#e3dccb] flex items-center justify-center transition cursor-pointer text-[#1a1a1a] disabled:opacity-40"
            title="Decrease quantity"
          >
            <FiMinus size={12} />
          </button>
          
          <span className="text-xs font-black text-[#1a1a1a] w-8 text-center tabular-nums">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => onUpdateQty(listingId, item.quantity + 1)}
            disabled={isUpdating}
            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 border border-[#e3dccb] flex items-center justify-center transition cursor-pointer text-[#1a1a1a] disabled:opacity-40"
            title="Increase quantity"
          >
            <FiPlus size={12} />
          </button>
        </div>

        {/* Subtotal Display (Desktop) */}
        <div className="hidden sm:block text-right min-w-[90px]">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Subtotal</p>
          <p className="text-sm font-black text-[#1a1a1a]">₹{item.line_total?.toLocaleString()}</p>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(listingId)}
          disabled={isUpdating}
          className="p-2 rounded-xl text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer disabled:opacity-40 shrink-0"
          title="Remove from cart"
        >
          <FiTrash2 size={15} />
        </button>
      </div>
    </div>
  );
}
