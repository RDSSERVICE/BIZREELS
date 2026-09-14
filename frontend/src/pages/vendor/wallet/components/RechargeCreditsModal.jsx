import React, { useState, useEffect } from 'react';
import { FiX, FiZap, FiCheck, FiShield, FiStar, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../../../lib/api';
import { useLanguage } from '../../../../context/LanguageContext';
import { useGetSubscriptionPlansQuery } from '../../../../features/vendor/vendorApi';

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

const DEFAULT_PLANS = [
  {
    id: '6aa5537c564952f956e9c0ba',
    title: 'Starter',
    price_inr: 499,
    wallet_credits: 599,
    free_reel_boosts: 1,
    badge_text: 'Starter',
    description: '599 Credits + 1 Free Boost',
  },
  {
    id: '6aa5537c564952f956e9c0bb',
    title: 'Growth',
    price_inr: 1199,
    wallet_credits: 1599,
    free_reel_boosts: 3,
    badge_text: 'Most Popular',
    is_popular: true,
    description: '1,599 Credits + 3 Free Boosts',
  },
  {
    id: '6aa5537c564952f956e9c0bc',
    title: 'Business',
    price_inr: 2199,
    wallet_credits: 2999,
    free_reel_boosts: 5,
    badge_text: 'Best Value',
    description: '2,999 Credits + 5 Free Boosts',
  },
];

/**
 * RechargeCreditsModal
 * Razorpay Checkout Modal for purchasing/recharging official Vendor Subscription Plans.
 * As defined in BizReels Requirements Document:
 * Vendors take a plan (Starter ₹499 / Growth ₹1,199 / Business ₹2,199) and receive non-expiring usage credits.
 */
export default function RechargeCreditsModal({
  isOpen,
  initialPlan = null,
  onClose,
  onSuccess,
}) {
  const { bi } = useLanguage();
  const { data: plansData } = useGetSubscriptionPlansQuery({ role: 'vendor' });

  const rawItems = plansData?.data?.items || plansData?.items || [];
  const activeVendorPlans = rawItems.filter(
    (p) =>
      p.is_active !== false &&
      !p.is_archived &&
      (p.user_type === 'vendor' || p.target_role === 'vendor' || !p.target_role) &&
      p.price_inr > 0
  );

  const plans = activeVendorPlans.length > 0 ? activeVendorPlans : DEFAULT_PLANS;

  // Selected plan state
  const [selectedPlanId, setSelectedPlanId] = useState(
    initialPlan?.id || initialPlan?._id || '6aa5537c564952f956e9c0bb'
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialPlan) {
      setSelectedPlanId(initialPlan.id || initialPlan._id);
    }
  }, [initialPlan]);

  if (!isOpen) return null;

  const currentPlan =
    plans.find((p) => (p.id || p._id) === selectedPlanId) ||
    plans.find((p) => p.price_inr === 1199) ||
    plans[0] ||
    DEFAULT_PLANS[1];

  const handleRazorpayCheckout = async (e) => {
    if (e) e.preventDefault();
    if (!currentPlan) {
      toast.error('Please select a plan to proceed.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Razorpay order via backend
      const res = await api.post('/v1/subscription/purchase-razorpay', {
        plan_id: currentPlan.id || currentPlan._id,
      });

      const orderData = res?.data?.data;
      if (!orderData?.razorpay_order_id || !orderData?.key_id) {
        toast.error('Payment initialization failed. Please try again.');
        setLoading(false);
        return;
      }

      // 2. Ensure Razorpay SDK script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        toast.error('Failed to load Razorpay payment gateway. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // 3. Configure Razorpay checkout options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency || 'INR',
        name: 'BizReels Vendor Subscription',
        description: `${currentPlan.title} Plan — +${Number(currentPlan.wallet_credits || 0).toLocaleString('en-IN')} Usage Credits`,
        order_id: orderData.razorpay_order_id,
        handler: async function (response) {
          try {
            await api.post('/v1/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success(
              `🎉 Successfully subscribed to ${currentPlan.title}! +${Number(currentPlan.wallet_credits || 0).toLocaleString('en-IN')} Credits added to your wallet.`
            );
            if (typeof onSuccess === 'function') onSuccess();
            onClose();
          } catch (verifyErr) {
            toast.error(
              verifyErr.response?.data?.message ||
                'Payment verification failed. If amount was deducted, please contact support.'
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast('Payment cancelled.', { icon: '⚠️' });
            setLoading(false);
          },
        },
        theme: {
          color: '#241b15',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        setLoading(false);
        toast.error(response.error?.description || 'Payment failed. Please try again.');
      });
      paymentObject.open();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Payment initialization failed.';
      toast.error(errMsg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div
        className="bg-white border-2 border-[#241b15] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-[#241b15] hover:bg-slate-100 rounded-lg transition cursor-pointer"
        >
          <FiX size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#e3dccb] pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center shrink-0">
            <FiZap size={22} className="fill-[#d99a3d]" />
          </div>
          <div>
            <h3
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
              className="text-base sm:text-lg text-[#1a1a1a] uppercase tracking-tight"
            >
              {bi('Subscribe & Get Credits', 'सदस्यता लें और क्रेडिट्स पाएं')}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {bi(
                'Select a vendor plan to deposit non-expiring usage credits',
                'उपयोग क्रेडिट्स जोड़ने के लिए योजना चुनें'
              )}
            </p>
          </div>
        </div>

        {/* Plan Selector Grid */}
        <div className="space-y-3 mb-5">
          <label className="text-xs font-black uppercase text-[#1a1a1a] tracking-wider block">
            {bi('Choose Subscription Plan:', 'सदस्यता योजना चुनें:')}
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {plans.map((plan) => {
              const pid = plan.id || plan._id;
              const isSelected = selectedPlanId === pid;
              const isPopular =
                plan.is_popular ||
                String(plan.title).toLowerCase().includes('growth') ||
                plan.price_inr === 1199;

              return (
                <div
                  key={pid}
                  onClick={() => !loading && setSelectedPlanId(pid)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-[#241b15] bg-[#fdf8ee] shadow-xs'
                      : 'border-[#e3dccb] hover:border-slate-400 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#241b15] bg-[#241b15]' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#d99a3d]" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#1a1a1a]">{plan.title}</span>
                        {isPopular && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-black text-[9px] uppercase tracking-wider inline-flex items-center gap-0.5">
                            <FiStar size={10} className="fill-amber-600" />
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-emerald-700 font-bold block mt-0.5">
                        +{Number(plan.wallet_credits || 0).toLocaleString('en-IN')} Credits
                        {plan.free_reel_boosts > 0 && ` · +${plan.free_reel_boosts} Boosts`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-[#1a1a1a] font-mono block">
                      ₹{Number(plan.price_inr).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Non-expiring</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Plan Summary Breakdown */}
        {currentPlan && (
          <div className="p-4 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] mb-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-bold">{bi('Plan Price:', 'योजना मूल्य:')}</span>
              <span className="font-mono font-black text-[#1a1a1a]">
                ₹{Number(currentPlan.price_inr).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-bold">{bi('Platform Credits Added:', 'जोड़े गए क्रेडिट्स:')}</span>
              <span className="font-mono font-black text-amber-900">
                +{Number(currentPlan.wallet_credits || 0).toLocaleString('en-IN')} Credits
              </span>
            </div>
            {currentPlan.free_reel_boosts > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">{bi('Free Reel Boosts:', 'निःशुल्क रील बूस्ट:')}</span>
                <span className="font-mono font-black text-emerald-700">
                  +{currentPlan.free_reel_boosts} Free Boosts
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-[#e3dccb] flex items-center justify-between text-xs font-black text-[#1a1a1a]">
              <span>{bi('Total Amount Payable:', 'कुल देय राशि:')}</span>
              <span className="font-mono text-base text-[#1a1a1a]">
                ₹{Number(currentPlan.price_inr).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* Security & Non-expiring notice */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mb-5">
          <FiShield className="text-emerald-600 shrink-0" size={15} />
          <span>
            {bi(
              '100% Secure Razorpay Checkout · Credits never expire · No recurring auto-debit',
              '१००% सुरक्षित रेज़रपे चेकआउट · क्रेडिट कभी समाप्त नहीं होते · कोई स्वतः कटौती नहीं'
            )}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 border-2 border-[#e3dccb] hover:border-[#241b15] text-[#241b15] text-xs font-black rounded-xl transition cursor-pointer"
          >
            {bi('Cancel', 'रद्द करें')}
          </button>

          <button
            type="button"
            onClick={handleRazorpayCheckout}
            disabled={loading}
            className="flex-2 py-3 px-4 bg-[#241b15] text-[#d99a3d] hover:bg-[#382b22] text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#d99a3d] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {bi(
                    `Pay ₹${Number(currentPlan?.price_inr || 0).toLocaleString('en-IN')} via Razorpay`,
                    `रेज़रपे द्वारा ₹${Number(currentPlan?.price_inr || 0).toLocaleString('en-IN')} भुगतान करें`
                  )}
                </span>
                <FiArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
