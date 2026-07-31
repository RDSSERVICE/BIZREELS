import React, { useEffect } from 'react';
import { FiCheckCircle, FiStar, FiCalendar, FiCreditCard, FiZap, FiShield } from 'react-icons/fi';
import Button from '../../components/common/Button';
import { toast } from 'react-hot-toast';
import { useGetSubscriptionPlansQuery, useChangeSubscriptionMutation, usePurchaseSubscriptionRazorpayMutation } from '../vendor/vendorApi';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';

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

const SubscriptionTab = ({ user, refetchUser }) => {
  const currentRole = user?.current_role || user?.roles?.[0] || 'vendor';
  const roleParam = currentRole === 'creator' ? 'creator' : 'vendor';

  const { data: plansData, isFetching: loadingPlans, refetch: refetchPlans } = useGetSubscriptionPlansQuery(
    { role: roleParam },
    { pollingInterval: 30000 }
  );
  const [changeSubscription, { isLoading: isSubscribingWallet }] = useChangeSubscriptionMutation();
  const [purchaseRazorpay, { isLoading: isSubscribingRzp }] = usePurchaseSubscriptionRazorpayMutation();

  const isSubscribing = isSubscribingWallet || isSubscribingRzp;

  // Listen for real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleUpdate = () => {
      refetchPlans();
      if (refetchUser) refetchUser();
    };
    socket.on('subscription:updated', handleUpdate);
    return () => socket.off('subscription:updated', handleUpdate);
  }, [refetchPlans, refetchUser]);

  const currentPlan = user?.subscription?.plan || 'Free Member';
  const planExpires = user?.subscription?.expiresAt;
  const walletBalance = user?.walletBalance ?? 0;

  const plans = plansData?.data?.items || plansData?.items || [];
  const activePlans = plans.filter(p => p.is_active && !p.is_archived);

  // Razorpay-based subscription purchase
  const handleRazorpayPurchase = async (plan) => {
    if (!window.confirm(`Subscribe to ${plan.title} for ₹${plan.price_inr?.toLocaleString('en-IN')}/${plan.billing_cycle}?`)) return;

    try {
      // 1. Create Razorpay order via backend
      const res = await api.post('/v1/subscription/purchase-razorpay', { plan_id: plan.id }).catch(() => null);

      if (res?.data?.data?.razorpay_order_id) {
        const orderData = res.data.data;

        // Dev mode — auto-simulate success
        if (orderData.dev_mode || orderData.razorpay_order_id.startsWith('order_dev_')) {
          toast.success('Processing subscription...');
          try {
            await api.post('/v1/payments/dev/simulate-success', { payment_id: orderData.payment_id });
            toast.success(`Successfully subscribed to ${plan.title}!`);
            if (refetchUser) refetchUser();
            refetchPlans();
          } catch (err) {
            toast.error('Subscription activation failed');
          }
          return;
        }

        // Production — open Razorpay checkout
        const sdkLoaded = await loadRazorpayScript();
        if (sdkLoaded && window.Razorpay) {
          const options = {
            key: orderData.key_id || 'rzp_test_mockKey',
            amount: orderData.amount_paise,
            currency: 'INR',
            name: 'BizReels Subscription',
            description: `${plan.title} - ${plan.billing_cycle}`,
            order_id: orderData.razorpay_order_id,
            handler: async (response) => {
              try {
                await api.post('/v1/payments/verify', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                toast.success(`Successfully subscribed to ${plan.title}!`);
                if (refetchUser) refetchUser();
                refetchPlans();
              } catch (err) {
                toast.error('Payment verification failed');
              }
            },
            modal: { ondismiss: () => {} },
            theme: { color: '#7C3AED' },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
          return;
        }
      }

      // Fallback: wallet purchase
      toast.error('Payment gateway unavailable. Trying wallet payment...');
      await handleWalletPurchase(plan);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Subscription purchase failed');
    }
  };

  // Wallet-based purchase (fallback)
  const handleWalletPurchase = async (plan) => {
    if (walletBalance < plan.price_inr) {
      return toast.error('Insufficient wallet balance. Please recharge your wallet first.');
    }
    if (window.confirm(`Upgrade/Renew subscription to ${plan.title} plan using ₹${plan.price_inr} from your wallet?`)) {
      try {
        await changeSubscription({ plan: plan.id }).unwrap();
        toast.success(`Successfully subscribed to ${plan.title}!`);
        if (refetchUser) refetchUser();
      } catch (err) {
        toast.error(err?.data?.message || 'Subscription purchase failed.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Current Plan Overview Card */}
      <div className="glass p-6 rounded-2xl border border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-2xl">
            <FiStar className="w-8 h-8 fill-brand-purple/20" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Account Tier</span>
            <h3 className="text-xl font-black text-brand-navy font-display mt-0.5">{currentPlan}</h3>
            {planExpires && (
              <span className="text-xs text-slate-500 mt-1 block flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5 text-brand-purple" />
                Active until: {new Date(planExpires).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex flex-col sm:flex-row gap-4 shrink-0 sm:items-center">
          <div className="flex items-center gap-3">
            <FiCreditCard className="text-brand-purple w-5 h-5" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase">Wallet Balance</span>
              <span className="text-xs font-bold text-emerald-600 font-display">₹{walletBalance?.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
            <FiShield className="text-emerald-500 w-5 h-5" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase">Payment Security</span>
              <span className="text-xs font-bold text-brand-navy">Razorpay Secured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider px-1">Available Subscription Plans</h4>

        {loadingPlans ? (
          <div className="text-center py-12 text-text-tertiary animate-pulse">Loading subscription plans...</div>
        ) : activePlans.length === 0 ? (
          <div className="text-center py-16 text-text-tertiary">
            <FiCreditCard className="w-10 h-10 mx-auto mb-3 text-text-quaternary" />
            <p className="font-bold text-sm">No plans available</p>
            <p className="text-xs mt-1">Subscription plans will appear here once configured by the admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePlans.map((plan, idx) => {
              const isCurrent = currentPlan.toLowerCase() === plan.title.toLowerCase();
              const isPopular = idx === 1 || plan.plan_type === 'premium';
              const features = plan.features_list?.length > 0
                ? plan.features_list
                : (plan.features ? plan.features.split(',').map(f => f.trim()).filter(Boolean) : []);

              return (
                <div
                  key={plan.id}
                  className={`glass p-6 rounded-2xl border flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-premium
                    ${isPopular ? 'border-brand-purple shadow-premium ring-2 ring-brand-purple/15' : 'border-white/50 shadow-glass'}
                    ${isCurrent ? 'bg-slate-50/70 border-brand-purple' : ''}
                  `}
                >
                  {isPopular && (
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white bg-brand-purple rounded-lg shadow-sm">
                      Recommended
                    </span>
                  )}

                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-black text-brand-navy font-display uppercase tracking-wide">{plan.title}</h4>
                    {plan.description && (
                      <p className="text-[10px] text-slate-400 line-clamp-2">{plan.description}</p>
                    )}
                    <div className="flex items-baseline gap-1 mt-3">
                      <span className="text-2xl font-black text-brand-navy font-display">₹{plan.price_inr?.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-slate-400">/ {plan.billing_cycle}</span>
                    </div>
                    {plan.discount_percentage > 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold">{plan.discount_percentage}% OFF</span>
                    )}
                  </div>

                  <ul className="flex flex-col gap-2.5 my-6 text-xs text-slate-600 flex-grow">
                    {plan.product_limit != null && (
                      <li className="flex items-start gap-2 leading-relaxed">
                        <FiCheckCircle className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                        <span>Listings: <strong>{plan.product_limit}</strong></span>
                      </li>
                    )}
                    {plan.leads_limit != null && (
                      <li className="flex items-start gap-2 leading-relaxed">
                        <FiCheckCircle className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                        <span>Leads: <strong>{plan.leads_limit}</strong></span>
                      </li>
                    )}
                    {plan.reels_limit != null && (
                      <li className="flex items-start gap-2 leading-relaxed">
                        <FiCheckCircle className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                        <span>Reels: <strong>{plan.reels_limit}</strong></span>
                      </li>
                    )}
                    {plan.ai_credits > 0 && (
                      <li className="flex items-start gap-2 leading-relaxed">
                        <FiCheckCircle className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                        <span>AI Credits: <strong>{plan.ai_credits}</strong></span>
                      </li>
                    )}
                    {plan.verified_badge && (
                      <li className="flex items-start gap-2 leading-relaxed">
                        <FiCheckCircle className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                        <span>Verified Badge</span>
                      </li>
                    )}
                    {plan.priority_support && (
                      <li className="flex items-start gap-2 leading-relaxed">
                        <FiCheckCircle className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                        <span>Priority Support (24/7)</span>
                      </li>
                    )}
                    {plan.analytics_access && (
                      <li className="flex items-start gap-2 leading-relaxed">
                        <FiCheckCircle className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                        <span>Advanced Analytics</span>
                      </li>
                    )}
                    {features.map((feat, fidx) => (
                      <li key={fidx} className="flex items-start gap-2 leading-relaxed">
                        <FiCheckCircle className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <span className="w-full text-center py-2.5 text-xs font-bold text-brand-purple bg-brand-purple-50 rounded-xl border border-brand-purple/20">
                      Active Plan
                    </span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleRazorpayPurchase(plan)}
                        disabled={isSubscribing}
                        className="w-full py-2 text-xs font-bold text-white bg-brand-purple rounded-xl shadow-premium hover:bg-brand-purple-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <FiZap className="w-3.5 h-3.5 fill-current text-white" /> Pay via Razorpay
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWalletPurchase(plan)}
                        disabled={isSubscribing}
                        className={`w-full py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                          walletBalance >= plan.price_inr
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        <FiCreditCard className="w-3.5 h-3.5" /> Pay via Wallet
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionTab;
