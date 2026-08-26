import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiShield, FiCreditCard, FiZap, FiCheckCircle } from 'react-icons/fi';
import AddonsSelector from './AddonsSelector';

/**
 * SubscriptionCheckoutModal — SaaS-style checkout modal with live add-ons tally and multi-mode payment
 */
export default function SubscriptionCheckoutModal({
  isOpen,
  plan,
  onClose,
  walletBalance = 0,
  isSubscribing = false,
  onPayRazorpay,
  onPayWallet,
}) {
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  if (!isOpen || !plan) return null;

  const basePrice = Number(plan.price_inr || 0);
  const addonsTotal = selectedAddons.reduce(
    (sum, a) => sum + (Number(a.price_inr) || 0),
    0
  );
  const totalPrice = basePrice + addonsTotal;
  const hasEnoughWallet = walletBalance >= totalPrice;

  const handleToggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id || a.title === addon.title);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id && a.title !== addon.title);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleConfirm = () => {
    if (paymentMethod === 'wallet') {
      onPayWallet(plan, selectedAddons);
    } else {
      onPayRazorpay(plan, selectedAddons);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 font-sans text-xs">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isSubscribing) onClose();
          }}
          className="absolute inset-0 bg-black/75 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-2xl bg-[#faf7f2] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-[#241b15]/20"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-[#241b15] text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shadow-xs shrink-0">
                <FiZap size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>Subscription Checkout</span>
                  <span className="text-[10px] bg-[#d99a3d] text-[#1a1a1a] font-black px-2 py-0.5 rounded uppercase">
                    {plan.billing_cycle || 'Monthly'}
                  </span>
                </h3>
                <p className="text-[11px] text-[#d99a3d] font-semibold">
                  Subscribing to <strong className="text-white underline">{plan.title}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubscribing}
              className="w-8 h-8 rounded-lg bg-[#3a2c22] hover:bg-[#d99a3d] text-white hover:text-[#1a1a1a] flex items-center justify-center transition cursor-pointer border-none shrink-0 disabled:opacity-50"
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Selected Plan Summary Banner */}
            <div className="p-3.5 rounded-xl bg-white border border-[#e3dccb] flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#d99a3d] block">
                  Base Subscription Tier
                </span>
                <h4 className="text-sm sm:text-base font-black text-[#1a1a1a]">{plan.title}</h4>
                <p className="text-[11px] text-slate-500 font-medium">{plan.duration_days || 30} days validity</p>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-lg font-black text-[#d99a3d]">
                  ₹{basePrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block font-bold">/{plan.billing_cycle}</span>
              </div>
            </div>

            {/* Add-Ons Selector Component */}
            {plan.add_ons && plan.add_ons.length > 0 && (
              <div className="p-4 rounded-xl bg-white border border-[#e3dccb] shadow-2xs">
                <AddonsSelector
                  availableAddons={plan.add_ons}
                  selectedAddons={selectedAddons}
                  onToggleAddon={handleToggleAddon}
                />
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="p-4 rounded-xl bg-white border border-[#e3dccb] shadow-2xs space-y-2.5">
              <label className="text-[11px] font-black uppercase text-[#1a1a1a] tracking-wider block">
                Choose Payment Method
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Razorpay Online */}
                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'razorpay'
                      ? 'bg-amber-500/10 border-[#d99a3d] ring-1 ring-[#d99a3d]'
                      : 'bg-[#faf7f2] border-[#e3dccb] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-[#1a1a1a] flex items-center gap-1.5">
                      <FiCreditCard size={14} className="text-[#d99a3d]" />
                      <span>Razorpay Online</span>
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1">UPI, Google Pay, PhonePe, Cards, Netbanking</p>
                </div>

                {/* Wallet Balance */}
                <div
                  onClick={() => {
                    if (hasEnoughWallet) setPaymentMethod('wallet');
                  }}
                  className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                    paymentMethod === 'wallet'
                      ? 'bg-amber-500/10 border-[#d99a3d] ring-1 ring-[#d99a3d] cursor-pointer'
                      : hasEnoughWallet
                      ? 'bg-[#faf7f2] border-[#e3dccb] hover:bg-white cursor-pointer'
                      : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-[#1a1a1a]">Wallet Balance</span>
                    <span className={`text-[10px] font-black font-mono ${hasEnoughWallet ? 'text-emerald-700' : 'text-red-500'}`}>
                      ₹{walletBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    {hasEnoughWallet ? 'Instant 1-click deduction' : 'Insufficient balance'}
                  </p>
                </div>
              </div>
            </div>

            {/* Price Details Breakdown */}
            <div className="p-4 rounded-xl bg-white border border-[#e3dccb] shadow-2xs space-y-2 text-xs font-bold text-slate-600">
              <div className="flex items-center justify-between border-b border-[#f0ebe0] pb-2">
                <span className="font-black text-[#1a1a1a] uppercase text-[11px]">Price Details</span>
                <span className="text-[10.5px] text-slate-400">Standard GST Included</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span>Base Plan ({plan.title})</span>
                <span className="text-[#1a1a1a]">₹{basePrice.toLocaleString('en-IN')}</span>
              </div>

              {selectedAddons.map((addon) => (
                <div key={addon.id || addon.title} className="flex items-center justify-between text-emerald-700">
                  <span className="flex items-center gap-1">
                    <FiZap size={11} className="text-[#d99a3d]" /> Add-on: {addon.title}
                  </span>
                  <span>+₹{Number(addon.price_inr).toLocaleString('en-IN')}</span>
                </div>
              ))}

              <div className="border-t border-[#e3dccb] pt-2.5 flex items-baseline justify-between">
                <span className="text-sm font-black text-[#1a1a1a] uppercase">Total Payable</span>
                <span className="text-lg font-black text-[#d99a3d]">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 text-[10.5px] text-slate-500 font-bold pt-1">
              <span className="flex items-center gap-1 text-emerald-700">
                <FiShield size={13} /> 256-Bit Encrypted
              </span>
              <span>•</span>
              <span>Instant Activation</span>
              <span>•</span>
              <span>Official Tax Invoice</span>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-4 bg-white border-t border-[#e3dccb] flex items-center justify-between shrink-0 shadow-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Due</span>
              <span className="text-base font-black text-[#1a1a1a]">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>

            <button
              type="button"
              disabled={isSubscribing}
              onClick={handleConfirm}
              className="py-3 px-6 bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-xs sm:text-sm font-black rounded-xl transition flex items-center gap-2 shadow-lg cursor-pointer border border-[#241b15] disabled:opacity-50"
            >
              {isSubscribing ? (
                <div className="w-4 h-4 rounded-full border-2 border-[#d99a3d] border-t-transparent animate-spin" />
              ) : (
                <>
                  <FiCheckCircle size={15} />
                  <span>
                    Pay ₹{totalPrice.toLocaleString('en-IN')} & Subscribe
                  </span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
