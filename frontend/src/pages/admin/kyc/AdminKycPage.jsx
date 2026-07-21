import React, { useState } from 'react';
import { FiShield, FiCheck, FiX, FiFileText, FiUserCheck, FiFilm, FiEye } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useGetKycQueueQuery,
  useApproveKycMutation,
  useRejectKycMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'all', label: 'All Requests', icon: FiShield },
  { key: 'vendor', label: 'Vendor KYC (PAN/Aadhaar/GST/Business)', icon: FiUserCheck },
  { key: 'creator', label: 'Creator KYC (Aadhaar/PAN/Portfolio)', icon: FiFilm },
];

export default function AdminKycPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewDoc, setViewDoc] = useState(null);

  const { data, isFetching } = useGetKycQueueQuery(undefined, { pollingInterval: 5000 });
  const [approveKyc] = useApproveKycMutation();
  const [rejectKyc] = useRejectKycMutation();

  const items = data?.items || [];

  const filteredItems = items.filter((item) => {
    if (activeTab === 'vendor') return item.doc_type === 'pan' || item.doc_type === 'gst' || item.role === 'vendor';
    if (activeTab === 'creator') return item.doc_type === 'aadhaar' || item.role === 'creator';
    return true;
  });

  const handleApprove = async (id) => {
    try {
      await approveKyc(id).unwrap();
      toast.success('KYC Document Approved!');
    } catch (err) {
      toast.error(err?.data?.message || 'Approval failed');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectId) return;
    try {
      await rejectKyc({ id: rejectId, reason: rejectReason }).unwrap();
      toast.success('KYC Document Rejected');
      setRejectId(null);
      setRejectReason('');
    } catch (err) {
      toast.error(err?.data?.message || 'Rejection failed');
    }
  };

  const columns = [
    {
      key: 'user_id',
      label: 'User Reference',
      render: (val) => <span className="font-bold text-text-primary font-mono text-xs">{val ? val.slice(-8) : '—'}</span>,
    },
    {
      key: 'doc_type',
      label: 'Document Type',
      render: (val) => (
        <span className="font-bold uppercase text-xs text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded border border-brand-purple/20">
          {val}
        </span>
      ),
    },
    {
      key: 'doc_number',
      label: 'Doc / Registration No.',
      render: (val) => <span className="font-mono text-text-secondary text-xs">{val || '—'}</span>,
    },
    {
      key: 'submitted_at',
      label: 'Submitted At',
      render: (val) => <span className="text-text-tertiary text-xs">{val ? new Date(val).toLocaleDateString() : '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val} />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiShield}
        title="KYC Verification Queue"
        subtitle="Review Aadhaar, PAN, GST, Business details, and Creator Portfolios"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={filteredItems}
        loading={isFetching}
        searchPlaceholder="Search KYC queue by document number..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No pending KYC verifications in queue."
        testId="kyc-table"
        actions={(row) => (
          <>
            <button
              onClick={() => setViewDoc(row)}
              className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
              title="View Document"
            >
              <FiEye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleApprove(row.id)}
              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500 transition-all"
              title="Approve"
            >
              <FiCheck className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setRejectId(row.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
              title="Reject"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      />

      {/* Preview Document Modal */}
      <AdminModal isOpen={!!viewDoc} onClose={() => setViewDoc(null)} title="Document Preview" maxWidth="max-w-2xl">
        {viewDoc && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-surface-secondary p-4 rounded-xl">
              <div><span className="text-text-tertiary">Document Type:</span> <strong className="uppercase font-bold text-brand-purple">{viewDoc.doc_type}</strong></div>
              <div><span className="text-text-tertiary">Document No:</span> <strong className="font-mono text-text-primary">{viewDoc.doc_number}</strong></div>
            </div>

            {viewDoc.doc_url ? (
              <div className="border border-border rounded-xl overflow-hidden bg-black/5 flex flex-col items-center justify-center p-3 min-h-[300px]">
                {String(viewDoc.doc_url).toLowerCase().includes('.pdf') || String(viewDoc.doc_url).startsWith('data:application/pdf') ? (
                  <div className="w-full space-y-3">
                    <iframe src={viewDoc.doc_url} title="PDF Preview" className="w-full h-80 rounded-lg border border-border" />
                    <a
                      href={viewDoc.doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-brand-purple font-bold underline hover:opacity-80"
                    >
                      <FiFileText /> Open PDF Document in New Tab
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2 text-center w-full">
                    <img src={viewDoc.doc_url} alt="KYC Document" className="max-h-[380px] mx-auto object-contain rounded-lg" />
                    <a
                      href={viewDoc.doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-brand-purple font-semibold underline"
                    >
                      <FiFileText /> Open Full Document File
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-text-tertiary">No document file attached.</div>
            )}

            {viewDoc.selfie_url && (
              <div className="border border-border rounded-xl p-3">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">Selfie Verification</span>
                <img src={viewDoc.selfie_url} alt="Selfie" className="h-32 object-contain rounded-lg" />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { handleApprove(viewDoc.id); setViewDoc(null); }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1"
              >
                <FiCheck /> Approve Document
              </button>
              <button
                onClick={() => { setRejectId(viewDoc.id); setViewDoc(null); }}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1"
              >
                <FiX /> Reject Document
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Reject Modal */}
      <AdminModal isOpen={!!rejectId} onClose={() => setRejectId(null)} title="Reject KYC Request">
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">Please specify a reason for rejecting this document:</p>
          <textarea
            placeholder="e.g. Document image is blurry or expired PAN card"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full p-3 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple h-24"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setRejectId(null)} className="px-4 py-2 text-xs font-bold text-text-tertiary hover:bg-surface-tertiary rounded-xl">
              Cancel
            </button>
            <button onClick={handleConfirmReject} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700">
              Confirm Reject
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
