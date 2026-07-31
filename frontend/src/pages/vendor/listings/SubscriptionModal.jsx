import React from 'react';
import { Link } from 'react-router-dom';
import { FiZap, FiCheck } from 'react-icons/fi';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useGetSubscriptionPlansQuery } from '../../../features/vendor/vendorApi';

/**
 * SubscriptionModal — Vendor subscription upgrade plans
 * Dynamically loaded from backend subscription plans configured by the admin.
 */
export default function SubscriptionModal({ isOpen, onClose }) {
  const { data: plansData, isLoading } = useGetSubscriptionPlansQuery(
    { role: 'vendor' },
    { skip: !isOpen }
  );

  const plans = plansData?.data?.items || plansData?.items || [];
  const activePlans = plans.filter(p => p.is_active && !p.is_archived);

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Vendor Subscription Upgrade Plans" maxWidth="max-w-4xl">
      <div className="space-y-4">
        <p className="text-xs text-text-secondary">Upgrade to unlock premium features, product listing boosts, and advanced analytics:</p>

        {isLoading ? (
          <div className="text-center py-8 text-xs text-text-tertiary animate-pulse">Loading plans...</div>
        ) : activePlans.length === 0 ? (
          <div className="text-center py-8 text-xs text-text-tertiary">No plans configured by the admin. Please contact support.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePlans.map((plan, idx) => {
              const borderClass = idx === 1 
                ? 'border-brand-purple/40 shadow-premium' 
                : 'border-white/50';

              const features = plan.features_list?.length > 0
                ? plan.features_list
                : (plan.features ? plan.features.split(',').map(f => f.trim()) : []);

              return (
                <div key={plan.id} className={`glass p-5 rounded-2xl border space-y-3 flex flex-col justify-between ${borderClass}`}>
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-brand-purple font-display capitalize">{plan.title}</h4>
                    <span className="text-xl font-black text-text-primary">
                      ₹{plan.price_inr?.toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal text-text-tertiary">/ {plan.billing_cycle}</span>
                    </span>
                    <ul className="text-xs text-text-secondary space-y-1.5 pt-2">
                      <li className="flex items-center gap-1.5">
                        <FiCheck className="text-emerald-500 shrink-0" size={14} />
                        <span>Listings: <strong>{plan.product_limit ?? 'Unlimited'}</strong></span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <FiCheck className="text-emerald-500 shrink-0" size={14} />
                        <span>Leads: <strong>{plan.leads_limit ?? 'Unlimited'}</strong></span>
                      </li>
                      {features.slice(0, 3).map((feat, fidx) => (
                        <li key={fidx} className="flex items-center gap-1.5">
                          <FiCheck className="text-emerald-500 shrink-0" size={14} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    to="/vendor/subscription"
                    onClick={onClose}
                    className="block w-full text-center py-2.5 gradient-brand text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 transition-opacity mt-4"
                  >
                    Upgrade Plan
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminModal>
  );
}
