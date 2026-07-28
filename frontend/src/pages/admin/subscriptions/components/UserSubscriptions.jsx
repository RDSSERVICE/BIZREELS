import React, { useState } from 'react';
import { FiSearch, FiX, FiRefreshCw, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import {
  useListUserSubscriptionsQuery,
  useCancelUserSubscriptionMutation,
  useExtendUserSubscriptionMutation,
  useRenewUserSubscriptionMutation,
} from '../../../../features/admin/adminApi';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../../features/admin/components/AdminModal';

export default function UserSubscriptions() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [actionModal, setActionModal] = useState(null); // { type: 'cancel'|'extend', sub }
  const [cancelReason, setCancelReason] = useState('');
  const [extendDays, setExtendDays] = useState('30');

  const { data, isFetching } = useListUserSubscriptionsQuery({
    page,
    limit: 25,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(roleFilter && { user_role: roleFilter }),
  }, { pollingInterval: 10000 });

  const [cancelSub, { isLoading: cancelling }] = useCancelUserSubscriptionMutation();
  const [extendSub, { isLoading: extending }] = useExtendUserSubscriptionMutation();
  const [renewSub, { isLoading: renewing }] = useRenewUserSubscriptionMutation();

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const handleAction = async () => {
    if (!actionModal) return;
    try {
      if (actionModal.type === 'cancel') {
        await cancelSub({ id: actionModal.sub.id, reason: cancelReason }).unwrap();
        toast.success('Subscription cancelled successfully');
      } else if (actionModal.type === 'extend') {
        await extendSub({ id: actionModal.sub.id, days: parseInt(extendDays) }).unwrap();
        toast.success(`Subscription extended by ${extendDays} days`);
      }
      setActionModal(null);
      setCancelReason('');
      setExtendDays('30');
    } catch (err) {
      toast.error(err?.data?.message || 'Action failed');
    }
  };

  const handleRenew = async (sub) => {
    if (!window.confirm(`Are you sure you want to renew ${sub.user_name}'s subscription?`)) return;
    try {
      await renewSub(sub.id).unwrap();
      toast.success('Subscription renewed successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Renewal failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="glass rounded-2xl p-4 border border-white/50 flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
          <input
            type="text"
            placeholder="Search by User name, ID or Plan..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-surface border border-border rounded-xl text-xs focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="vendor">Vendor</option>
          <option value="creator">Creator</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-surface border border-border rounded-xl text-xs focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={() => { setSearch(searchInput); setPage(1); }}
          className="px-4 py-2.5 bg-brand-purple text-white rounded-xl text-xs font-bold hover:bg-brand-purple/90"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Plan Details</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Start Date</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Expiry Date</th>
                <th className="text-right px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Amount Paid</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isFetching && items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-text-tertiary animate-pulse">Loading active subscriptions...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-text-tertiary">No subscriptions found.</td></tr>
              ) : (
                items.map((sub) => (
                  <tr key={sub.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-text-primary block">{sub.user_name || 'Unknown'}</span>
                        <span className="text-[9px] text-text-tertiary">{sub.user_id?.slice(-8)} • <span className="capitalize">{sub.user_role}</span></span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-brand-purple block">{sub.plan_name}</span>
                        <span className="text-[9px] text-text-tertiary capitalize">{sub.billing_cycle} ({sub.plan_type})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {sub.start_date ? new Date(sub.start_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={new Date(sub.expiry_date) < new Date() ? 'text-red-500 font-semibold' : ''}>
                        {sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString('en-IN') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold">₹{sub.paid_amount?.toLocaleString('en-IN')}</span>
                      {sub.discount_amount > 0 && <span className="text-[9px] text-text-tertiary block">Saved ₹{sub.discount_amount}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge status={sub.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {sub.status === 'active' && (
                          <>
                            <button
                              onClick={() => setActionModal({ type: 'extend', sub })}
                              className="p-1 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                              title="Extend Expiry"
                            >
                              <FiPlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setActionModal({ type: 'cancel', sub })}
                              className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                              title="Cancel / Stop"
                            >
                              <FiX className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {sub.status !== 'active' && (
                          <button
                            onClick={() => handleRenew(sub)}
                            className="p-1 rounded bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20"
                            title="Force Renew"
                          >
                            <FiRefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-secondary/30">
            <span className="text-[10px] text-text-tertiary">
              Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total} subscriptions
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-30"><FiChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs font-bold text-text-secondary px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-30"><FiChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel/Extend Modal */}
      <AdminModal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.type === 'cancel' ? 'Cancel User Subscription' : 'Extend User Subscription'}
      >
        {actionModal && (
          <div className="space-y-4 text-xs">
            <div className="bg-surface-secondary p-3 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Subscriber:</span>
                <span className="font-bold">{actionModal.sub.user_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Active Plan:</span>
                <span className="font-bold text-brand-purple">{actionModal.sub.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Expires At:</span>
                <span className="font-bold">{new Date(actionModal.sub.expiry_date).toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            {actionModal.type === 'cancel' ? (
              <div className="space-y-3">
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
                  ⚠ Cancelling will immediately revoke the user's verified badge, priority listing rankings, and active limits.
                </div>
                <div>
                  <label className="block mb-1 text-text-tertiary uppercase font-bold text-[10px]">Reason for Cancellation *</label>
                  <input
                    type="text"
                    placeholder="e.g. Terms violation / refund issued"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block mb-1 text-text-tertiary uppercase font-bold text-[10px]">Extension Days *</label>
                <select
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none"
                >
                  <option value="7">7 Days</option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days (1 Month)</option>
                  <option value="90">90 Days (3 Months)</option>
                  <option value="180">180 Days (6 Months)</option>
                  <option value="365">365 Days (1 Year)</option>
                </select>
              </div>
            )}

            <button
              onClick={handleAction}
              disabled={cancelling || extending}
              className={`w-full py-2.5 text-white font-bold rounded-xl ${actionModal.type === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {actionModal.type === 'cancel' ? (cancelling ? 'Revoking...' : 'Revoke Immediately') : (extending ? 'Extending...' : 'Extend Expiry')}
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
