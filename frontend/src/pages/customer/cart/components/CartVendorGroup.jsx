import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiChevronRight } from 'react-icons/fi';
import CartItemRow from './CartItemRow';

export default function CartVendorGroup({ group, onUpdateQty, onRemove, updatingId }) {
  const vendorId = group.vendor_id || group.vendor?._id || group.vendor?.id;
  const vendorName = group.vendor?.shopName || group.vendor?.businessName || group.vendor?.name || 'Verified Vendor';

  return (
    <div className="bg-white border border-[#e3dccb] rounded-2xl overflow-hidden shadow-xs">
      {/* Vendor Header Card */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-[#faf7f0] border-b border-[#e3dccb]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d99a3d] to-[#241b15] p-0.5 shrink-0">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xs font-black text-[#241b15] overflow-hidden">
              {group.vendor?.avatarUrl || group.vendor?.profile_pic ? (
                <img
                  src={group.vendor.avatarUrl || group.vendor.profile_pic}
                  alt={vendorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{vendorName.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/customer/vendor/${vendorId}`}
                className="text-xs sm:text-sm font-black text-[#1a1a1a] hover:text-[#d99a3d] transition truncate block"
              >
                {vendorName}
              </Link>
              <span className="bg-amber-100 text-[#241b15] text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300/40 uppercase">
                Vendor
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">
              {group.items.length} {group.items.length === 1 ? 'item' : 'items'} in order
            </p>
          </div>
        </div>

        {/* Vendor Subtotal Badge */}
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Vendor Total</span>
          <span className="text-xs sm:text-sm font-black text-[#d99a3d]">
            ₹{group.subtotal?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Item Rows */}
      <div className="divide-y divide-[#f0ebe0]">
        {group.items.map((item) => (
          <CartItemRow
            key={item.listing_id || item._id || item.id}
            item={item}
            onUpdateQty={onUpdateQty}
            onRemove={onRemove}
            isUpdating={updatingId === (item.listing_id || item._id || item.id)}
          />
        ))}
      </div>
    </div>
  );
}
