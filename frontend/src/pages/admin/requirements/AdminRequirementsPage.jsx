import React, { useState, useEffect } from 'react';
import { getSocket } from '../../../lib/socket';
import { FiInbox, FiPackage, FiTool, FiCheckCircle, FiXCircle, FiAlertTriangle, FiEye, FiCheck, FiX, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListAdminRequirementsQuery,
  useApproveRequirementMutation,
  useRejectRequirementMutation
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'all', label: 'All Requirements', icon: FiInbox },
  { key: 'pending_approval', label: 'Pending Approval', icon: FiClock },
  { key: 'approved', label: 'Approved & Active', icon: FiCheckCircle },
  { key: 'rejected', label: 'Rejected', icon: FiXCircle },
  { key: 'product', label: 'Product', icon: FiPackage },
  { key: 'service', label: 'Service', icon: FiTool },
];

export default function AdminRequirementsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [viewReq, setViewReq] = useState(null);
  const [rejectingReqId, setRejectingReqId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [approveRequirement, { isLoading: isApproving }] = useApproveRequirementMutation();
  const [rejectRequirement, { isLoading: isRejecting }] = useRejectRequirementMutation();

  const queryParams = { limit: 100 };
  if (activeTab === 'pending_approval' || activeTab === 'approved' || activeTab === 'rejected') {
    queryParams.approvalStatus = activeTab;
  } else if (activeTab === 'product' || activeTab === 'service') {
    queryParams.type = activeTab;
  }

  const { data, isFetching, refetch } = useListAdminRequirementsQuery(queryParams, { pollingInterval: 5000 });

  // Socket.IO real-time update listeners for Admin dashboard
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      if (typeof refetch === 'function') refetch();
    };

    socket.on('requirement:created', handleUpdate);
    socket.on('requirement:updated', handleUpdate);
    socket.on('requirement:deleted', handleUpdate);
    socket.on('requirement:closed', handleUpdate);
    socket.on('requirement:approved', handleUpdate);
    socket.on('requirement:rejected', handleUpdate);
    socket.on('proposal:submitted', handleUpdate);
    socket.on('proposal:accepted', handleUpdate);
    socket.on('proposal:rejected', handleUpdate);

    return () => {
      socket.off('requirement:created', handleUpdate);
      socket.off('requirement:updated', handleUpdate);
      socket.off('requirement:deleted', handleUpdate);
      socket.off('requirement:closed', handleUpdate);
      socket.off('requirement:approved', handleUpdate);
      socket.off('requirement:rejected', handleUpdate);
      socket.off('proposal:submitted', handleUpdate);
      socket.off('proposal:accepted', handleUpdate);
      socket.off('proposal:rejected', handleUpdate);
    };
  }, [refetch]);

  const handleApprove = async (id) => {
    try {
      await approveRequirement(id).unwrap();
      toast.success('Requirement approved successfully and matched vendors notified!');
      if (viewReq && viewReq.id === id) {
        setViewReq(null);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to approve requirement.');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }
    try {
      await rejectRequirement({ id: rejectingReqId, reason: rejectionReason }).unwrap();
      toast.success('Requirement rejected and customer notified.');
      setRejectingReqId(null);
      setRejectionReason('');
      if (viewReq && viewReq.id === rejectingReqId) {
        setViewReq(null);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reject requirement.');
    }
  };

  const items = data?.items || [];

  const columns = [
    {
      key: 'title',
      label: 'Requirement Title',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val || 'Untitled Requirement'}</span>
          <span className="text-[10px] text-text-tertiary capitalize">{row.type} • {row.category || 'General'}</span>
        </div>
      ),
    },
    {
      key: 'customer_name',
      label: 'Posted By',
      render: (val) => <span className="font-semibold text-text-secondary text-xs">{val || 'Customer'}</span>,
    },
    {
      key: 'budget',
      label: 'Budget Range',
      render: (val, row) => (
        <span className="font-bold text-brand-purple">
          {row.budget_min || row.budget_max ? (
            `₹${(row.budget_min || 0).toLocaleString('en-IN')} - ₹${(row.budget_max || 0).toLocaleString('en-IN')}`
          ) : (
            `₹${(val || 0).toLocaleString('en-IN')}`
          )}
        </span>
      ),
    },
    {
      key: 'matches_count',
      label: 'Proposals / Matches',
      render: (val) => <span className="font-bold text-emerald-600">{val || 0} proposals</span>,
    },
    {
      key: 'approvalStatus',
      label: 'Approval Status',
      render: (val) => {
        if (val === 'pending_approval') {
          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending Approval</span>;
        } else if (val === 'rejected') {
          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Rejected</span>;
        } else {
          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</span>;
        }
      },
    },
    {
      key: 'status',
      label: 'Lead Status',
      render: (val) => <AdminStatusBadge status={val} />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiInbox}
        title="Requirement Management"
        subtitle="Monitor customer product & service requests, vendor matches, proposals, and approval workflow"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={items}
        loading={isFetching}
        searchPlaceholder="Search requirements..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No requirements found matching filter."
        testId="requirements-table"
        actions={(row) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewReq(row)}
              className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
              title="View Details"
            >
              <FiEye className="w-3.5 h-3.5" />
            </button>
            {row.approvalStatus === 'pending_approval' && (
              <>
                <button
                  onClick={() => handleApprove(row.id)}
                  disabled={isApproving}
                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-all"
                  title="Approve"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRejectingReqId(row.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-all"
                  title="Reject"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* Detail Modal */}
      <AdminModal isOpen={!!viewReq} onClose={() => setViewReq(null)} title="Requirement Detail">
        {viewReq && (
          <div className="space-y-4 text-xs">
            <div className="bg-surface-secondary p-4 rounded-xl space-y-2.5">
              <h4 className="font-bold text-sm text-text-primary">{viewReq.title}</h4>
              <div><span className="text-text-tertiary">Customer:</span> <strong className="text-text-primary">{viewReq.customer_name}</strong></div>
              <div><span className="text-text-tertiary">Type & Category:</span> <strong className="text-text-primary capitalize">{viewReq.type} — {viewReq.category}</strong></div>
              <div>
                <span className="text-text-tertiary">Budget:</span>{' '}
                <strong className="text-brand-purple">
                  {viewReq.budget_min || viewReq.budget_max ? (
                    `₹${(viewReq.budget_min || 0).toLocaleString('en-IN')} - ₹${(viewReq.budget_max || 0).toLocaleString('en-IN')}`
                  ) : (
                    `₹${(viewReq.budget || 0).toLocaleString('en-IN')}`
                  )}
                </strong>
              </div>
              <div><span className="text-text-tertiary">Proposals Submitted:</span> <strong className="text-emerald-600">{viewReq.matches_count} proposals</strong></div>
              <div>
                <span className="text-text-tertiary">Approval:</span>{' '}
                <strong className="capitalize text-text-primary">{viewReq.approvalStatus}</strong>
                {viewReq.adminRejectionReason && (
                  <p className="text-red-500 font-semibold mt-1">Rejection Reason: {viewReq.adminRejectionReason}</p>
                )}
              </div>
              <div><span className="text-text-tertiary">Status:</span> <AdminStatusBadge status={viewReq.status} className="ml-2" /></div>
            </div>

            {viewReq.approvalStatus === 'pending_approval' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(viewReq.id)}
                  disabled={isApproving}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5"
                >
                  <FiCheck /> Approve & Assign
                </button>
                <button
                  onClick={() => setRejectingReqId(viewReq.id)}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5"
                >
                  <FiX /> Reject Request
                </button>
              </div>
            )}
          </div>
        )}
      </AdminModal>

      {/* Rejection Modal */}
      <AdminModal isOpen={!!rejectingReqId} onClose={() => setRejectingReqId(null)} title="Reject Requirement">
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Reason for Rejection</label>
            <textarea
              required
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this requirement is being rejected (this will be sent to the customer)..."
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectingReqId(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRejecting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
