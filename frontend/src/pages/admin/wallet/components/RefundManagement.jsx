import React, { useState } from 'react';
import { FiSearch, FiCheck, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useListWalletRefundsQuery, useApproveRefundMutation, useRejectRefundMutation } from '../../../../features/admin/adminApi';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../../features/admin/components/AdminModal';

/**
 * RefundManagement
 * Manage refund requests: view, filter by status, approve/reject with remarks.
 */
export default function RefundManagement() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject', refund }
  const [remarks, setRemarks] = useState('');

  const { data, isFetching } = useListWalletRefundsQuery(
    { page, limit: 25, ...(statusFilter && { status: statusFilter }), ...(search && { search }) },
    { pollingInterval: 8000 }
  );
  const [approveRefund, { isLoading: approving }] = useApproveRefundMutation();
  const [rejectRefund, { isLoading: rejecting }] = useRejectRefundMutation();

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const handleAction = async () => {
    if (!actionModal) return;
    try {
      if (actionModal.type === 'approve') {
        await approveRefund({ id: actionModal.refund.id, remarks }).unwrap();
        toast.success('Refund approved and credited to user wallet!');
      } else {
        if (!remarks) return toast.error('Please provide a reason for rejection');
        await rejectRefund({ id: actionModal.refund.id, remarks }).unwrap();
        toast.success('Refund request rejected');
      }
      setActionModal(null);
      setRemarks('');
    } catch (err) {
      toast.error(err?.data?.message || 'Action failed');
    }
  };

  const statusTabs = [
    { value: '', label: 'All', count: null },
    { value: 'pending', label: 'Pending', count: null },
    { value: 'approved', label: 'Approved', count: null },
    { value: 'rejected', label: 'Rejected', count: null },
  ];

  return (
    <div className="space-y-4">
      {/* Status Tabs + Search */}
      <div className="bg-white rounded-2xl p-4 border border-[#e3dccb] shadow-2xs space-y-3">
        <div className="flex flex-wrap gap-2">
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${statusFilter === tab.value ? 'bg-[#1a1a1a] text-white' : 'bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] hover:bg-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search refunds by ID, user..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
            />
          </div>
          <button
            onClick={() => { setSearch(searchInput); setPage(1); }}
            className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-xs cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e3dccb] bg-[#f8f4ec]">
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Refund ID</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">User</th>
                <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Amount</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Reason</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Type</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Date</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccb]">
              {isFetching && items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400"><div className="animate-pulse">Loading refunds...</div></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No refund requests found.</td></tr>
              ) : items.map((r) => (
                <tr key={r.id} className="hover:bg-[#fbf9f4] transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] font-bold text-[#1a1a1a]">{r.refund_id?.slice(-12)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-bold text-[#1a1a1a] block">{r.user_name || 'Unknown'}</span>
                      <span className="text-[9px] text-slate-400">{r.user_id?.slice(-8)} • <span className="capitalize">{r.user_role}</span></span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-black text-[#1a1a1a]">{r.amount?.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[150px]">
                    <span className="text-slate-600 text-[10px] truncate block" title={r.reason}>{r.reason}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] capitalize bg-[#f8f4ec] border border-[#e3dccb] px-2 py-0.5 rounded font-bold text-slate-700">{(r.refund_type || 'other').replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3"><AdminStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <span className="text-slate-600 text-[10px] font-medium">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setActionModal({ type: 'approve', refund: r }); setRemarks(''); }}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
                          title="Approve"
                        >
                          <FiCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setActionModal({ type: 'reject', refund: r }); setRemarks(''); }}
                          className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
                          title="Reject"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-400">
                        {r.admin_remarks ? `"${r.admin_remarks.slice(0, 30)}..."` : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e3dccb] bg-[#f8f4ec]">
            <span className="text-[10px] text-slate-500 font-bold">
              Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#e3dccb] disabled:opacity-30 cursor-pointer"><FiChevronLeft className="w-4 h-4 text-[#1a1a1a]" /></button>
              <span className="text-xs font-bold text-[#1a1a1a] px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#e3dccb] disabled:opacity-30 cursor-pointer"><FiChevronRight className="w-4 h-4 text-[#1a1a1a]" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Approve/Reject Modal */}
      <AdminModal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.type === 'approve' ? 'Approve Refund' : 'Reject Refund'}
      >
        {actionModal && (
          <div className="space-y-4">
            <div className="bg-[#f8f4ec] border border-[#e3dccb] p-3 rounded-xl space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Refund ID:</span>
                <span className="font-mono font-bold text-[#1a1a1a]">{actionModal.refund.refund_id?.slice(-12)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">User:</span>
                <span className="font-bold text-[#1a1a1a]">{actionModal.refund.user_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-emerald-600">{actionModal.refund.amount} credits</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Reason:</span>
                <span className="text-[#1a1a1a] max-w-[200px] text-right">{actionModal.refund.reason}</span>
              </div>
            </div>

            {actionModal.type === 'approve' && (
              <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <FiCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-[10px] text-emerald-700 font-medium">
                  Approving will credit {actionModal.refund.amount} credits to the user's wallet immediately.
                </span>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Admin Remarks {actionModal.type === 'reject' ? '*' : '(Optional)'}
              </label>
              <textarea
                rows={3}
                placeholder={actionModal.type === 'approve' ? 'Optional remarks...' : 'Reason for rejection (required)'}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] resize-none"
              />
            </div>

            <button
              onClick={handleAction}
              disabled={approving || rejecting}
              className={`w-full py-2.5 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs ${actionModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {actionModal.type === 'approve' ? (
                <><FiCheck className="w-4 h-4" /> {approving ? 'Approving...' : 'Approve Refund'}</>
              ) : (
                <><FiX className="w-4 h-4" /> {rejecting ? 'Rejecting...' : 'Reject Refund'}</>
              )}
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
