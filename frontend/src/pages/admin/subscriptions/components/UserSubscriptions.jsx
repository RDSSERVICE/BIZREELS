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
      <div className="bg-white rounded-2xl p-4 border border-[#e3dccb] shadow-2xs flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by User name, ID or Plan..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
        >
          <option value="">All Roles</option>
          <option value="vendor">Vendor</option>
          <option value="creator">Creator</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={() => { setSearch(searchInput); setPage(1); }}
          className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-xs cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e3dccb] bg-[#f8f4ec]">
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">User</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Plan Details</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Start Date</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Expiry Date</th>
                <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Amount Paid</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccb]">
              {isFetching && items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400 animate-pulse">Loading active subscriptions...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No subscriptions found.</td></tr>
              ) : (
                items.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#fbf9f4] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-[#1a1a1a] block">{sub.user_name || 'Unknown'}</span>
                        <span className="text-[9px] text-slate-400">{sub.user_id?.slice(-8)} • <span className="capitalize">{sub.user_role}</span></span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-[#1a1a1a] block">{sub.plan_name}</span>
                        <span className="text-[9px] text-slate-400 capitalize">{sub.billing_cycle} ({sub.plan_type})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {sub.start_date ? new Date(sub.start_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={new Date(sub.expiry_date) < new Date() ? 'text-red-600 font-bold' : 'text-slate-600'}>
                        {sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString('en-IN') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black text-emerald-600">₹{sub.paid_amount?.toLocaleString('en-IN')}</span>
                      {sub.discount_amount > 0 && <span className="text-[9px] text-slate-400 block">Saved ₹{sub.discount_amount}</span>}
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
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
                              title="Extend Expiry"
                            >
                              <FiPlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setActionModal({ type: 'cancel', sub })}
                              className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
                              title="Cancel / Stop"
                            >
                              <FiX className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {sub.status !== 'active' && (
                          <button
                            onClick={() => handleRenew(sub)}
                            className="p-1.5 rounded-lg bg-[#f8f4ec] text-[#1a1a1a] hover:bg-white border border-[#e3dccb] transition-all cursor-pointer"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e3dccb] bg-[#f8f4ec]">
            <span className="text-[10px] text-slate-500 font-bold">
              Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total} subscriptions
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#e3dccb] disabled:opacity-30 cursor-pointer"><FiChevronLeft className="w-4 h-4 text-[#1a1a1a]" /></button>
              <span className="text-xs font-bold text-[#1a1a1a] px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#e3dccb] disabled:opacity-30 cursor-pointer"><FiChevronRight className="w-4 h-4 text-[#1a1a1a]" /></button>
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
            <div className="bg-[#f8f4ec] border border-[#e3dccb] p-3 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Subscriber:</span>
                <span className="font-bold text-[#1a1a1a]">{actionModal.sub.user_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Plan:</span>
                <span className="font-bold text-[#1a1a1a]">{actionModal.sub.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expires At:</span>
                <span className="font-bold text-[#1a1a1a]">{new Date(actionModal.sub.expiry_date).toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            {actionModal.type === 'cancel' ? (
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
                  ⚠ Cancelling will immediately revoke the user's verified badge, priority listing rankings, and active limits.
                </div>
                <div>
                  <label className="block mb-1 text-slate-500 uppercase font-bold text-[10px]">Reason for Cancellation *</label>
                  <input
                    type="text"
                    placeholder="e.g. Terms violation / refund issued"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block mb-1 text-slate-500 uppercase font-bold text-[10px]">Extension Days *</label>
                <select
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
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
              className={`w-full py-2.5 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all ${actionModal.type === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {actionModal.type === 'cancel' ? (cancelling ? 'Revoking...' : 'Revoke Immediately') : (extending ? 'Extending...' : 'Extend Expiry')}
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
