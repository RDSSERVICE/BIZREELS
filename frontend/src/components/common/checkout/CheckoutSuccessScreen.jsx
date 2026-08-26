import React from 'react';
import { FiCheckCircle, FiMessageSquare, FiShoppingBag } from 'react-icons/fi';

/**
 * CheckoutSuccessScreen — Success receipt and navigation actions
 */
export default function CheckoutSuccessScreen({
  orderConfirmed,
  isService,
  item,
  vendorName,
  vendorId,
  vendorAvatar,
  itemTotal,
  appliedCoupon,
  couponDiscount,
  deliveryFee,
  totalAmount,
  totalCustomerSavings,
  onClose,
  onOpenChat,
  navigate,
}) {
  return (
    <div className="p-6 sm:p-8 text-center space-y-5 overflow-y-auto bg-white flex-1">
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
        <FiCheckCircle size={36} />
      </div>

      <div className="space-y-1.5">
        <h4 className="text-xl font-black text-[#1a1a1a]">
          {isService ? 'Appointment Booked Successfully!' : 'Order Placed Successfully!'}
        </h4>
        <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
          Your order for <strong className="text-[#1a1a1a]">"{item.title || item.caption || 'Item'}"</strong> has been confirmed and transmitted directly to <strong className="text-[#d99a3d]">{vendorName}</strong>.
        </p>
      </div>

      {/* Flipkart-Style Order Receipt Box */}
      <div className="p-4 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] max-w-md mx-auto text-xs space-y-2 text-left">
        <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2">
          <span className="text-slate-500 font-bold">Order ID:</span>
          <span className="font-mono font-black text-[#1a1a1a]">{orderConfirmed._id || 'ORD-REF'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-bold">Item Total:</span>
          <span className="font-bold text-[#1a1a1a]">₹{itemTotal.toLocaleString('en-IN')}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex items-center justify-between text-emerald-700 font-bold">
            <span>Coupon ({appliedCoupon?.couponCode}):</span>
            <span>- ₹{couponDiscount.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-bold">Delivery Fee (Shiprocket):</span>
          <span className={deliveryFee === 0 ? 'text-emerald-700 font-bold uppercase' : 'font-bold text-[#1a1a1a]'}>
            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-[#e3dccb] pt-2 text-sm font-black text-[#1a1a1a]">
          <span>Total Amount:</span>
          <span className="text-base text-[#d99a3d]">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>
        {totalCustomerSavings > 0 && (
          <div className="bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200 text-center font-black text-[11px]">
            🎉 You saved ₹{totalCustomerSavings.toLocaleString('en-IN')} on this order!
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => {
            onClose();
            if (onOpenChat && vendorId) {
              onOpenChat(vendorId, vendorName, vendorAvatar);
            } else {
              navigate(`/customer/chat?vendorId=${vendorId}`);
            }
          }}
          className="w-full py-3.5 bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer border-none"
        >
          <FiMessageSquare size={16} />
          <span>Chat & Confirm with {vendorName}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            navigate('/customer/activities?tab=my-orders');
          }}
          className="w-full py-3 bg-white hover:bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <FiShoppingBag size={15} />
          <span>Track in My Orders</span>
        </button>
      </div>
    </div>
  );
}
