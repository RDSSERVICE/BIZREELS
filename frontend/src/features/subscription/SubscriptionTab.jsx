import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiLayers, FiShield } from 'react-icons/fi';
import { useGetSubscriptionPlansQuery, useChangeSubscriptionMutation, usePurchaseSubscriptionRazorpayMutation } from '../vendor/vendorApi';
import { useGetCreatorWalletQuery, useGetVendorWalletQuery } from '../wallet/walletApi';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../lib/socket';

// Modular Components
import ActiveSubscriptionCard from './components/ActiveSubscriptionCard';
import PlanCard from './components/PlanCard';
import SubscriptionCheckoutModal from './components/SubscriptionCheckoutModal';

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

/**
 * SubscriptionTab — Modular orchestrator for Vendor and Creator subscription management
 */
export default function SubscriptionTab({ user, refetchUser, role }) {
  const { refreshMe } = useAuth();
  const currentRole = role || user?.current_role || (typeof window !== 'undefined' && window.location.pathname.startsWith('/creator') ? 'creator' : 'vendor');
  const roleParam = currentRole === 'creator' ? 'creator' : 'vendor';

  const { data: plansData, isFetching: loadingPlans, refetch: refetchPlans } = useGetSubscriptionPlansQuery(
    { role: roleParam },
    { pollingInterval: 30000 }
  );
  const [changeSubscription, { isLoading: isSubscribingWallet }] = useChangeSubscriptionMutation();
  const [purchaseRazorpay, { isLoading: isSubscribingRzp }] = usePurchaseSubscriptionRazorpayMutation();

  // Role-Isolated Wallet Queries
  const { data: creatorWalletData, refetch: refetchCreatorWallet } = useGetCreatorWalletQuery(undefined, {
    skip: roleParam !== 'creator',
    pollingInterval: 30000,
  });
  const { data: vendorWalletData, refetch: refetchVendorWallet } = useGetVendorWalletQuery(undefined, {
    skip: roleParam !== 'vendor',
    pollingInterval: 30000,
  });

  // Modal checkout state
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const isSubscribing = isSubscribingWallet || isSubscribingRzp || isProcessingPayment;

  // Listen for real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleUpdate = () => {
      refetchPlans();
      if (refetchUser) refetchUser();
      if (roleParam === 'creator' && refetchCreatorWallet) refetchCreatorWallet();
      if (roleParam === 'vendor' && refetchVendorWallet) refetchVendorWallet();
    };
    socket.on('subscription:updated', handleUpdate);
    socket.on('wallet:updated', handleUpdate);
    return () => {
      socket.off('subscription:updated', handleUpdate);
      socket.off('wallet:updated', handleUpdate);
    };
  }, [refetchPlans, refetchUser, roleParam, refetchCreatorWallet, refetchVendorWallet]);

  // Active Plan Metadata
  const currentPlan = roleParam === 'creator'
    ? (user?.creatorProfile?.subscription?.plan || (user?.current_role === 'creator' ? user?.subscription?.plan : null) || 'Free Creator')
    : (user?.vendorProfile?.subscription?.plan || user?.subscription?.plan || 'Free Member');

  const planExpires = roleParam === 'creator'
    ? (user?.creatorProfile?.subscription?.expiresAt || (user?.current_role === 'creator' ? user?.subscription?.expiresAt : null))
    : (user?.vendorProfile?.subscription?.expiresAt || user?.subscription?.expiresAt);

  const activeSubscription = roleParam === 'creator'
    ? (user?.creatorProfile?.subscription || user?.subscription)
    : (user?.vendorProfile?.subscription || user?.subscription);

  // Role-isolated Wallet Balance
  const walletBalance = roleParam === 'creator'
    ? (creatorWalletData?.data?.balance ?? creatorWalletData?.balance ?? 0)
    : (vendorWalletData?.data?.balance ?? vendorWalletData?.balance ?? user?.walletBalance ?? 0);

  const plans = plansData?.data?.items || plansData?.items || [];
  const activePlans = plans.filter((p) => p.is_active && !p.is_archived);

  // Open Checkout Modal
  const handleSelectPlan = (plan) => {
    setSelectedPlanForCheckout(plan);
  };

  // Razorpay Payment Handler (with Add-Ons)
  const handleRazorpayPurchase = async (plan, selectedAddons = []) => {
    setIsProcessingPayment(true);
    try {
      // 1. Create Razorpay order via backend including selected add-ons
      const res = await api.post('/v1/subscription/purchase-razorpay', {
        plan_id: plan.id,
        selected_addons: selectedAddons,
      });

      const orderData = res?.data?.data;
      if (!orderData?.razorpay_order_id) {
        toast.error('Failed to create payment order. Please try again.');
        setIsProcessingPayment(false);
        return;
      }

      // 2. Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        toast.error('Payment gateway could not be loaded. Please check your internet connection.');
        setIsProcessingPayment(false);
        return;
      }

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount_paise,
        currency: 'INR',
        name: 'BizReels Subscription',
        description: `${plan.title} ${selectedAddons.length > 0 ? `(+${selectedAddons.length} Add-on${selectedAddons.length > 1 ? 's' : ''})` : ''}`,
        order_id: orderData.razorpay_order_id,
        handler: async (response) => {
          try {
            await api.post('/v1/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(`🎉 Successfully subscribed to ${plan.title}!`);
            setSelectedPlanForCheckout(null);
            await refreshMe();
            if (refetchUser) refetchUser();
            refetchPlans();
          } catch (err) {
            toast.error('Payment was received but verification failed. Please contact support.');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
            toast('Payment cancelled.', { icon: '⚠️' });
          },
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#241B15' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setIsProcessingPayment(false);
        toast.error(response.error?.description || 'Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      setIsProcessingPayment(false);
      toast.error(err?.response?.data?.message || err?.message || 'Subscription purchase failed');
    }
  };

  // Wallet Payment Handler (with Add-Ons)
  const handleWalletPurchase = async (plan, selectedAddons = []) => {
    const basePrice = Number(plan.price_inr || 0);
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + (Number(a.price_inr) || 0), 0);
    const totalDue = basePrice + addonsTotal;

    if (walletBalance < totalDue) {
      toast.error(`Insufficient wallet balance (₹${walletBalance?.toLocaleString('en-IN')}). Required: ₹${totalDue.toLocaleString('en-IN')}`);
      return;
    }

    setIsProcessingPayment(true);
    try {
      await api.post('/v1/wallet/purchase-plan', {
        planId: plan.id,
        selected_addons: selectedAddons,
      });

      toast.success(`🎉 Subscribed to ${plan.title} successfully!`);
      setSelectedPlanForCheckout(null);
      await refreshMe();
      if (refetchUser) refetchUser();
      if (roleParam === 'creator' && refetchCreatorWallet) refetchCreatorWallet();
      if (roleParam === 'vendor' && refetchVendorWallet) refetchVendorWallet();
      refetchPlans();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.data?.message || 'Subscription purchase failed.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Active Subscription Overview Card */}
      <ActiveSubscriptionCard
        currentPlan={currentPlan}
        planExpires={planExpires}
        roleParam={roleParam}
        walletBalance={walletBalance}
        activeSubscription={activeSubscription}
      />

      {/* Available Plans Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#1a1a1a] tracking-tight">
              Choose Your Membership Tier
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Select a base tier and customize with flexible Add-Ons anytime
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {activePlans.length} plans available
          </span>
        </div>

        {loadingPlans && activePlans.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse border border-[#e3dccb]" />
            ))}
          </div>
        ) : activePlans.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#e3dccb] space-y-2">
            <FiLayers size={28} className="mx-auto text-slate-300" />
            <p className="text-slate-500 font-bold text-xs">No active subscription tiers published yet.</p>
            <p className="text-slate-400 text-[11px]">Please check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {activePlans.map((plan) => {
              const isCurrent = Boolean(
                currentPlan &&
                currentPlan.toLowerCase() === (plan.title || '').toLowerCase()
              );

              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={isCurrent}
                  onSelectPlan={handleSelectPlan}
                  isSubscribing={isSubscribing}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Subscription & Add-ons Checkout Modal */}
      <SubscriptionCheckoutModal
        isOpen={Boolean(selectedPlanForCheckout)}
        plan={selectedPlanForCheckout}
        onClose={() => setSelectedPlanForCheckout(null)}
        walletBalance={walletBalance}
        isSubscribing={isSubscribing}
        onPayRazorpay={handleRazorpayPurchase}
        onPayWallet={handleWalletPurchase}
      />
    </div>
  );
}
