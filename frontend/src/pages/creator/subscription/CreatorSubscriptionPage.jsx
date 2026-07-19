import React from 'react';
import { FiCreditCard, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { useGetCreatorSubscriptionQuery } from '../../../features/creator/creatorApi';

export default function CreatorSubscriptionPage() {
  const { data } = useGetCreatorSubscriptionQuery(undefined, { pollingInterval: 10000 });

  const planName = data?.plan || 'Creator Pro Badge';

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiCreditCard}
        title="Creator Membership Subscription"
        subtitle="Unlock zero-commission creator payouts, featured vendor marketplace placement, and AI tools"
      />

      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <AdminStatusBadge status="Active Plan" className="mb-2" />
          <h3 className="text-xl font-black text-text-primary font-display mt-1">{planName}</h3>
          <p className="text-xs text-text-tertiary mt-1">Zero Commission on Hire Deals • Top Marketplace Placement • AI Scripting Tools</p>
        </div>

        <button
          onClick={() => toast.success('Creator membership renewed!')}
          className="px-5 py-2.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
        >
          Renew Pro Plan
        </button>
      </div>
    </div>
  );
}
