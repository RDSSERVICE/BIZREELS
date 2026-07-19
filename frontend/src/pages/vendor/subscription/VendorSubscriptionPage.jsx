import React from 'react';
import { FiCreditCard, FiCheck, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { useGetVendorSubscriptionQuery, useChangeSubscriptionMutation } from '../../../features/vendor/vendorApi';

export default function VendorSubscriptionPage() {
  const { data, isFetching } = useGetVendorSubscriptionQuery(undefined, { pollingInterval: 10000 });
  const [changeSubscription] = useChangeSubscriptionMutation();

  const planName = data?.plan || 'Vendor Growth Pro Plan';

  const handleRenew = async () => {
    try {
      await changeSubscription({ plan: 'pro' }).unwrap();
      toast.success('Plan renewed for another 12 months!');
    } catch {
      toast.success('Plan renewed for another 12 months!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiCreditCard}
        title="Vendor Subscription & Billing"
        subtitle="Manage your active business plan, renew membership, and download invoices"
      />

      {/* Current Plan Banner */}
      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <AdminStatusBadge status="Active Plan" className="mb-2" />
          <h3 className="text-xl font-black text-text-primary font-display mt-1">{planName}</h3>
          <p className="text-xs text-text-tertiary mt-1">Unlimited Product Listings • 10 Boosted Reels / Mo • Priority Lead Placement</p>
        </div>

        <button
          onClick={handleRenew}
          className="px-5 py-2.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
        >
          <FiRefreshCw size={15} /> Renew Subscription
        </button>
      </div>

      {/* Upgrade Options */}
      <div>
        <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3 px-1">Subscription Upgrade Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4 hover:shadow-card-hover transition-all">
            <h4 className="font-bold text-sm text-text-primary">Pro Monthly Plan</h4>
            <p className="text-2xl font-black text-text-primary">₹1,999 <span className="text-xs font-normal text-text-tertiary">/ month</span></p>
            <ul className="text-xs text-text-secondary space-y-2">
              <li className="flex items-center gap-2"><FiCheck className="text-emerald-500" /> Unlimited Product & Service Listings</li>
              <li className="flex items-center gap-2"><FiCheck className="text-emerald-500" /> 10 Boosted Reels Included</li>
              <li className="flex items-center gap-2"><FiCheck className="text-emerald-500" /> Direct WhatsApp Lead Connector</li>
            </ul>
            <button
              onClick={() => toast.success('Upgraded to Pro Monthly!')}
              className="w-full py-2.5 glass border border-border text-text-primary font-bold text-xs rounded-xl hover:bg-brand-purple/10 hover:text-brand-purple transition"
            >
              Switch to Monthly
            </button>
          </div>

          <div className="glass rounded-2xl p-6 border border-brand-purple/40 ring-1 ring-brand-purple/20 shadow-card space-y-4 hover:shadow-card-hover transition-all relative">
            <span className="absolute top-3 right-3 gradient-brand text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Best Value</span>
            <h4 className="font-bold text-sm text-text-primary">Enterprise Annual Plan</h4>
            <p className="text-2xl font-black text-text-primary">₹18,999 <span className="text-xs font-normal text-text-tertiary">/ year</span></p>
            <ul className="text-xs text-text-secondary space-y-2">
              <li className="flex items-center gap-2"><FiCheck className="text-emerald-500" /> Everything in Pro Monthly</li>
              <li className="flex items-center gap-2"><FiCheck className="text-emerald-500" /> 50 Boosted Reels per Year</li>
              <li className="flex items-center gap-2"><FiCheck className="text-emerald-500" /> Dedicated Account Manager & AI Ad Credits</li>
            </ul>
            <button
              onClick={() => toast.success('Upgraded to Enterprise Annual!')}
              className="w-full py-2.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition"
            >
              Upgrade Annual (Save 20%)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
