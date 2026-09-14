import React, { useState } from 'react';
import { FiX, FiZap, FiCreditCard } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useRechargeWalletMutation } from '../../../../features/vendor/vendorApi';
import { api } from '../../../../lib/api';
import { useLanguage } from '../../../../context/LanguageContext';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000];

/**
 * RechargeCreditsModal
 * Self-contained Razorpay payment modal for purchasing platform utility credits.
 */
export default function RechargeCreditsModal({
  isOpen,
  initialAmount = '1000',
  onClose,
  onSuccess,
}) {
  const { bi } = useLanguage();
  const [amount, setAmount] = useState(initialAmount);
  const [loading, setLoading] = useState(false);
  const [rechargeWallet] = useRechargeWalletMutation();

  if (!isOpen) return null;

  const handleRechargeSubmit = async (e) => {
    if (e) e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 10) {
      toast.error('Minimum recharge amount is ₹10');
      return;
    }

    setLoading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load payment gateway. Please check internet connection.');
        setLoading(false);
        return;
      }

      const res = await rechargeWallet({ amount: numAmount }).unwrap();
      const orderData = res.data || res;

      if (!orderData?.id || !orderData?.key) {
        toast.error('Payment initialization failed.');
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'BizReels Vendor Wallet',
        description: `Purchase ${numAmount} Platform Usage Credits`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            await api.post('/v1/vendor/wallet/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(`🎉 Successfully added ${numAmount} Credits to your wallet!`);
            if (typeof onSuccess === 'function') onSuccess();
            onClose();
          } catch (verifyErr) {
            toast.error('Payment verification failed. Please contact support if amount was deducted.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment cancelled.');
            setLoading(false);
          },
        },
        theme: {
          color: '#241b15',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to initiate recharge');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#241b15] space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <FiZap size={18} />
            </span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-base font-black text-[#1a1a1a]">
                {bi('RECHARGE CREDITS', 'क्रेडिट रीचार्ज करें')}
              </h3>
              <span className="text-[10px] text-slate-500 font-bold">
                {bi('1 Credit = ₹1 INR (Non-Expiring)', '1 क्रेडिट = ₹1 (कभी समाप्त नहीं होते)')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleRechargeSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-black text-[#1a1a1a] block mb-1">
              {bi('Select or Enter Amount (INR)', 'राशि चुनें या दर्ज करें (रुपये)')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">
                ₹
              </span>
              <input
                type="number"
                min="10"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full pl-8 pr-4 py-3 bg-[#f8f4ec] border-2 border-[#e3dccb] focus:border-[#241b15] rounded-xl text-lg font-mono font-bold text-[#1a1a1a] outline-none transition"
                required
              />
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer border ${
                  amount === String(preset)
                    ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                    : 'bg-[#f8f4ec] text-slate-700 border-[#e3dccb] hover:border-[#241b15]'
                }`}
              >
                +₹{preset}
              </button>
            ))}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <span className="font-black block">
              💡 {bi('Instant Credits Deposit', 'त्वरित क्रेडिट जमा')}
            </span>
            <span className="text-[11px] text-amber-800 leading-relaxed block">
              {bi(
                'Credits will be instantly credited to your vendor account upon successful Razorpay payment via UPI, Cards, or NetBanking.',
                'यूपीआई, कार्ड या नेटबैंकिंग द्वारा भुगतान सफल होते ही क्रेडिट्स तुरंत खाते में जुड़ जाएंगे।'
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              {bi('Cancel', 'रद्द करें')}
            </button>
            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) < 10}
              className="flex-1 py-3 px-4 rounded-xl bg-[#241b15] text-[#d99a3d] hover:bg-[#382b22] text-xs font-black transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>{bi('Processing...', 'प्रक्रिया जारी...')}</span>
              ) : (
                <>
                  <FiCreditCard size={15} />
                  <span>{bi('Pay & Add Credits', 'भुगतान करें और जोड़ें')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
