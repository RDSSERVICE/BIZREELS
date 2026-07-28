import React, { useEffect } from 'react';
import { FiCreditCard, FiCheck, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import {
  useGetVendorSubscriptionQuery,
  useGetSubscriptionPlansQuery,
  useChangeSubscriptionMutation
} from '../../../features/vendor/vendorApi';
import { getSocket } from '../../../lib/socket';

export default function VendorSubscriptionPage() {
  const { data: subData, isFetching: loadingSub, refetch: refetchSub } = useGetVendorSubscriptionQuery(undefined, { pollingInterval: 10000 });
  const { data: plansData, isFetching: loadingPlans, refetch: refetchPlans } = useGetSubscriptionPlansQuery(undefined, { pollingInterval: 10000 });
  const [changeSubscription] = useChangeSubscriptionMutation();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      refetchSub();
      refetchPlans();
    };

    socket.on('subscription:updated', handleUpdate);
    return () => {
      socket.off('subscription:updated', handleUpdate);
    };
  }, [refetchSub, refetchPlans]);

  const activePlanName = subData?.data?.plan || subData?.data?.subscription?.planName || subData?.data?.subscription?.plan || subData?.plan || subData?.subscription?.planName || 'Free Plan';
  const plans = plansData?.data?.items || plansData?.items || [];

  // Filter plans targeted at vendors (or 'all')
  const vendorPlans = plans.filter(p => p.is_active && !p.is_archived && (p.user_type === 'vendor' || p.target_role === 'vendor' || p.user_type === 'all' || p.target_role === 'all'));

  const handleSubscribe = async (plan) => {
    const confirm = window.confirm(`Confirm subscription to ${plan.title} for ₹${plan.price_inr}/${plan.billing_cycle}?`);
    if (!confirm) return;

    try {
      await changeSubscription({ plan: plan.id || plan.title.toLowerCase() }).unwrap();
      toast.success(`Successfully subscribed to ${plan.title}!`);
    } catch (err) {
      toast.error(err?.data?.message || 'Subscription change failed. Please top-up your wallet.');
    }
  };

  const currentPlanDetails = vendorPlans.find(p => p.title.toLowerCase() === activePlanName.toLowerCase()) || {
    features_list: ['Unlimited Listings', 'Basic Listings Placement'],
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in text-xs">
      <AdminPageHeader
        icon={FiCreditCard}
        title="Vendor Subscription & Billing"
        subtitle="Manage your active business plan, review membership tiers, and upgrade limits"
      />

      {/* Current Plan Banner */}
      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <AdminStatusBadge status="Active Plan" className="mb-2" />
          <h3 className="text-xl font-black text-text-primary font-display mt-1 capitalize">
            {activePlanName}
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            {currentPlanDetails.features_list?.join(' • ') || 'Access to basic vendor tools'}
          </p>
        </div>
      </div>

      {/* Upgrade Options */}
      <div>
        <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3 px-1">
          Available Subscription Packages
        </h3>
        
        {loadingPlans ? (
          <div className="text-center py-12 text-text-tertiary animate-pulse">Loading active pricing tiers...</div>
        ) : vendorPlans.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">No plans configured by the admin yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorPlans.map((plan) => {
              const isCurrent = plan.title.toLowerCase() === activePlanName.toLowerCase();
              
              // Prepare features list
              const features = plan.features_list?.length > 0
                ? plan.features_list
                : (plan.features ? plan.features.split(',').map(f => f.trim()) : []);

              return (
                <div
                  key={plan.id}
                  className={`glass rounded-2xl p-6 border shadow-card space-y-4 hover:shadow-card-hover transition-all relative ${
                    isCurrent ? 'border-brand-purple/60 ring-1 ring-brand-purple/20' : 'border-white/50'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute top-3 right-3 gradient-brand text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                      Current Plan
                    </span>
                  )}
                  <h4 className="font-bold text-sm text-text-primary capitalize">{plan.title}</h4>
                  <p className="text-2xl font-black text-text-primary font-display">
                    ₹{plan.price_inr?.toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-text-tertiary">/ {plan.billing_cycle}</span>
                  </p>
                  
                  <ul className="text-xs text-text-secondary space-y-2 pt-1 border-t border-border">
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-emerald-500 flex-shrink-0" />
                      <span>Listings Limit: <strong>{plan.product_limit ?? plan.max_listings ?? 'Unlimited'}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-emerald-500 flex-shrink-0" />
                      <span>Leads Placement: <strong>{plan.leads_limit ?? 'Unlimited'}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-emerald-500 flex-shrink-0" />
                      <span>Reel Boosts: <strong>{plan.reels_limit ?? 'Unlimited'}</strong></span>
                    </li>
                    {features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <FiCheck className="text-emerald-500 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrent}
                    className={`w-full py-2.5 font-bold text-xs rounded-xl transition ${
                      isCurrent
                        ? 'bg-surface-secondary text-text-tertiary cursor-default'
                        : 'gradient-brand text-white shadow-premium hover:opacity-90'
                    }`}
                  >
                    {isCurrent ? 'Active Plan' : 'Subscribe Now'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
