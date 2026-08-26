import React from 'react';
import { FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiCopy, FiArchive, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import {
  useListSubscriptionPlansQuery,
  useActivateSubscriptionPlanMutation,
  useDeactivateSubscriptionPlanMutation,
  useArchiveSubscriptionPlanMutation,
  useDuplicateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
} from '../../../../features/admin/adminApi';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';

export default function PlansList({ onEdit, onCreateNew }) {
  const { data, isFetching } = useListSubscriptionPlansQuery();
  const [activatePlan] = useActivateSubscriptionPlanMutation();
  const [deactivatePlan] = useDeactivateSubscriptionPlanMutation();
  const [archivePlan] = useArchiveSubscriptionPlanMutation();
  const [duplicatePlan] = useDuplicateSubscriptionPlanMutation();
  const [deletePlan] = useDeleteSubscriptionPlanMutation();

  const plans = data?.items || [];

  const handleToggle = async (plan) => {
    try {
      if (plan.is_active) {
        await deactivatePlan(plan.id).unwrap();
        toast.success('Plan deactivated successfully');
      } else {
        await activatePlan(plan.id).unwrap();
        toast.success('Plan activated successfully');
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to toggle plan status');
    }
  };

  const handleArchive = async (plan) => {
    try {
      await archivePlan(plan.id).unwrap();
      toast.success('Plan archived successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to archive plan');
    }
  };

  const handleDuplicate = async (plan) => {
    try {
      await duplicatePlan(plan.id).unwrap();
      toast.success('Plan duplicated successfully as draft');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to duplicate plan');
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Are you sure you want to delete ${plan.title}?`)) return;
    try {
      await deletePlan(plan.id).unwrap();
      toast.success('Plan deleted successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete plan');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-text-primary">All Pricing Plans ({plans.length})</h2>
        <button
          onClick={onCreateNew}
          className="px-3 py-1.5 bg-brand-purple text-white rounded-xl text-xs font-bold hover:bg-brand-purple/90"
        >
          + Create New Plan
        </button>
      </div>

      <div className="glass rounded-2xl border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Plan Title</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Target</th>
                <th className="text-right px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Price (INR)</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Duration</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Limits (Listing / Lead / Reel)</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Features</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isFetching && plans.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-text-tertiary animate-pulse">Loading plans...</td></tr>
              ) : plans.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-text-tertiary">No subscription plans found.</td></tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-text-primary block">{plan.title}</span>
                        <span className="text-[10px] text-text-tertiary capitalize">{plan.plan_type} Tier</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize px-2 py-0.5 rounded bg-surface-secondary font-bold text-[10px]">
                        {plan.user_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-text-primary">₹{plan.price_inr?.toLocaleString('en-IN')}</span>
                      {plan.discount_percentage > 0 && (
                        <span className="text-[9px] text-emerald-600 block">({plan.discount_percentage}% Off)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize">{plan.billing_cycle}</span>
                      <span className="text-[9px] text-text-tertiary block">{plan.duration_days} days</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5 text-[10px]">
                        <div>Listings: <span className="font-bold">{plan.product_limit ?? plan.max_listings ?? 'Unlimited'}</span></div>
                        <div>Leads: <span className="font-bold">{plan.leads_limit ?? 'Unlimited'}</span></div>
                        <div>Reels: <span className="font-bold">{plan.reels_limit ?? 'Unlimited'}</span></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {plan.verified_badge && (
                          <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded text-[9px] font-bold">Verified</span>
                        )}
                        {plan.priority_support && (
                          <span className="px-1.5 py-0.5 bg-brand-purple/10 text-brand-purple rounded text-[9px] font-bold">Support</span>
                        )}
                        {plan.analytics_access && (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-bold">Analytics</span>
                        )}
                        {Array.isArray(plan.add_ons) && plan.add_ons.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[9px] font-black border border-emerald-500/30">
                            +{plan.add_ons.length} Add-on{plan.add_ons.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {!plan.verified_badge && !plan.priority_support && !plan.analytics_access && (!plan.add_ons || plan.add_ons.length === 0) && (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge status={plan.is_archived ? 'archived' : plan.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleToggle(plan)}
                          className={`p-1.5 rounded-lg transition-all ${plan.is_active ? 'text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-text-tertiary bg-surface-secondary hover:bg-surface-tertiary'}`}
                          title={plan.is_active ? 'Deactivate Plan' : 'Activate Plan'}
                        >
                          {plan.is_active ? <FiToggleRight className="w-3.5 h-3.5" /> : <FiToggleLeft className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => onEdit(plan)}
                          className="p-1.5 rounded-lg text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-all"
                          title="Edit"
                        >
                          <FiEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(plan)}
                          className="p-1.5 rounded-lg text-brand-purple bg-brand-purple/10 hover:bg-brand-purple/20 transition-all"
                          title="Duplicate"
                        >
                          <FiCopy className="w-3.5 h-3.5" />
                        </button>
                        {!plan.is_archived && (
                          <button
                            onClick={() => handleArchive(plan)}
                            className="p-1.5 rounded-lg text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-all"
                            title="Archive"
                          >
                            <FiArchive className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(plan)}
                          className="p-1.5 rounded-lg text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-all"
                          title="Delete"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
