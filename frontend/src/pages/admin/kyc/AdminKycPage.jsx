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
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [activeDocId, setActiveDocId] = useState(null);

  const { data, isFetching } = useGetKycQueueQuery(undefined, { pollingInterval: 5000 });
  const [approveKyc] = useApproveKycMutation();
  const [rejectKyc] = useRejectKycMutation();

  const items = data?.items || [];

  const filteredItems = items.filter((item) => {
    const isVendor = item.role === 'vendor' || item.user?.roles?.includes('vendor');
    const isCreator = item.role === 'creator' || item.user?.roles?.includes('creator');
    if (activeTab === 'vendor') return isVendor;
    if (activeTab === 'creator') return isCreator;
    return true;
  });

  const groupedItems = React.useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      const uid = item.user_id;
      if (!groups[uid]) {
        groups[uid] = {
          user_id: uid,
          user: item.user,
          role: item.role,
          documents: [],
          submitted_at: item.submitted_at,
        };
      }
      groups[uid].documents.push(item);
      if (new Date(item.submitted_at) > new Date(groups[uid].submitted_at)) {
        groups[uid].submitted_at = item.submitted_at;
      }
    });
    return Object.values(groups);
  }, [filteredItems]);

  const activeGroup = React.useMemo(() => {
    if (!selectedUserId) return null;
    return groupedItems.find((g) => g.user_id === selectedUserId) || null;
  }, [groupedItems, selectedUserId]);

  // Set default active doc when a new user is selected
  React.useEffect(() => {
    if (activeGroup && activeGroup.documents && activeGroup.documents.length > 0) {
      const pendingDoc = activeGroup.documents.find((d) => d.status === 'pending');
      setActiveDocId(pendingDoc ? pendingDoc.id : activeGroup.documents[0].id);
    } else {
      setActiveDocId(null);
    }
  }, [selectedUserId]);

  const activeDoc = activeGroup?.documents.find((d) => d.id === activeDocId) || activeGroup?.documents[0] || null;

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
      key: 'user',
      label: 'User Info',
      render: (val, row) => {
        const u = row.user || {};
        return (
          <div className="flex items-center gap-2.5">
            {u.avatarUrl || u.profile_pic ? (
              <img src={u.avatarUrl || u.profile_pic} alt="" className="w-8 h-8 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-purple/15 flex items-center justify-center text-brand-purple text-xs font-bold font-sans">
                {u.name ? u.name[0].toUpperCase() : '?'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-text-primary text-xs">{u.name || 'Unknown User'}</span>
              <span className="text-[10px] text-text-tertiary font-mono">{u.email || u.phone || row.user_id}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      label: 'Roles',
      render: (val, row) => {
        const roles = row.user?.roles || [row.role];
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((r) => (
              <span
                key={r}
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                  r === 'vendor'
                    ? 'text-orange-500 bg-orange-500/10 border-orange-500/20'
                    : r === 'creator'
                    ? 'text-sky-500 bg-sky-500/10 border-sky-500/20'
                    : 'text-text-tertiary bg-surface-tertiary border-border'
                }`}
              >
                {r}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'documents',
      label: 'Uploaded Documents',
      render: (val, row) => {
        return (
          <div className="flex flex-wrap gap-1.5">
            {row.documents.map((doc) => {
              const statusColor = doc.status === 'approved'
                ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
                : doc.status === 'rejected'
                ? 'text-red-600 bg-red-500/10 border-red-500/20'
                : 'text-amber-600 bg-amber-500/10 border-amber-500/20';
              return (
                <span
                  key={doc.id}
                  className={`font-bold uppercase text-[9px] px-2 py-0.5 rounded border flex items-center gap-1 ${statusColor}`}
                >
                  {doc.doc_type}
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    doc.status === 'approved' ? 'bg-emerald-500' : doc.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'submitted_at',
      label: 'Latest Submission',
      render: (val) => <span className="text-text-tertiary text-xs">{val ? new Date(val).toLocaleDateString() : '—'}</span>,
    },
    {
      key: 'status',
      label: 'Overall Status',
      render: (val, row) => {
        const statuses = row.documents.map((d) => d.status);
        let overallStatus = 'approved';
        if (statuses.includes('pending')) {
          overallStatus = 'pending';
        } else if (statuses.includes('rejected')) {
          overallStatus = 'rejected';
        }
        return <AdminStatusBadge status={overallStatus} />;
      },
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
        data={groupedItems}
        loading={isFetching}
        searchPlaceholder="Search KYC queue by document number..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No pending KYC verifications in queue."
        testId="kyc-table"
        actions={(row) => (
          <>
            <button
              onClick={() => setSelectedUserId(row.user_id)}
              className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
              title="View Documents"
            >
              <FiEye className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      />

      {/* Preview Document Modal */}
      <AdminModal isOpen={!!activeGroup} onClose={() => setSelectedUserId(null)} title="KYC Verification Details" maxWidth="max-w-4xl">
        {activeGroup && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Left Column: Vendor/Creator Details */}
            <div className="space-y-4 border-b md:border-b-0 md:border-r border-border/60 pb-6 md:pb-0 md:pr-6">
              <div className="flex items-center gap-3 bg-surface-secondary p-3 rounded-xl">
                {activeGroup.user?.avatarUrl || activeGroup.user?.profile_pic ? (
                  <img src={activeGroup.user?.avatarUrl || activeGroup.user?.profile_pic} alt="" className="w-12 h-12 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-brand-purple/15 flex items-center justify-center text-brand-purple text-lg font-bold font-sans">
                    {activeGroup.user?.name ? activeGroup.user.name[0].toUpperCase() : '?'}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-text-primary">{activeGroup.user?.name || 'Unknown User'}</h4>
                  <p className="text-[10px] text-text-tertiary font-mono">{activeGroup.user?.email || 'No email'}</p>
                  <p className="text-[10px] text-text-tertiary font-mono">{activeGroup.user?.phone || 'No phone'}</p>
                </div>
              </div>

              {(activeGroup.user?.roles?.includes('vendor') || activeGroup.role === 'vendor') && activeGroup.user?.vendorProfile && (
                <div className="space-y-3 animate-fade-in">
                  <h5 className="font-extrabold text-[11px] uppercase tracking-wider text-orange-500 bg-orange-500/5 px-2 py-1 rounded">Vendor Business Profile</h5>
                  <div className="grid grid-cols-2 gap-2 bg-surface-secondary/40 p-3 rounded-xl border border-border/40">
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase block">Business Name</span>
                      <strong className="text-text-primary text-[11px] font-semibold">{activeGroup.user.vendorProfile.businessName || activeGroup.user.vendorProfile.shopName || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase block">Category</span>
                      <strong className="text-text-primary text-[11px] font-semibold">{activeGroup.user.vendorProfile.category || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase block">Subcategory</span>
                      <strong className="text-text-primary text-[11px] font-semibold">{activeGroup.user.vendorProfile.subcategory || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase block">City / Address</span>
                      <strong className="text-text-primary text-[11px] font-semibold">{activeGroup.user.vendorProfile.address || activeGroup.user.city || '—'}</strong>
                    </div>
                    {activeGroup.user.vendorProfile.website && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-text-tertiary uppercase block">Website</span>
                        <a href={activeGroup.user.vendorProfile.website} target="_blank" rel="noreferrer" className="text-brand-purple hover:underline font-medium text-[11px] block truncate">
                          {activeGroup.user.vendorProfile.website}
                        </a>
                      </div>
                    )}
                    {activeGroup.user.vendorProfile.verificationStatus && (
                      <div>
                        <span className="text-[10px] text-text-tertiary uppercase block">Verification Tier</span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 font-bold uppercase text-[9px] text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded">
                          {activeGroup.user.vendorProfile.verificationStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(activeGroup.user?.roles?.includes('creator') || activeGroup.role === 'creator') && activeGroup.user?.creatorProfile && (
                <div className="space-y-3 animate-fade-in">
                  <h5 className="font-extrabold text-[11px] uppercase tracking-wider text-sky-500 bg-sky-500/5 px-2 py-1 rounded">Creator Profile</h5>
                  <div className="grid grid-cols-2 gap-2 bg-surface-secondary/40 p-3 rounded-xl border border-border/40">
                    <div className="col-span-2">
                      <span className="text-[10px] text-text-tertiary uppercase block">Bio</span>
                      <p className="text-text-secondary text-[11px] leading-relaxed mt-0.5 italic">"{activeGroup.user.creatorProfile.bio || 'No bio provided'}"</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase block">Category / Occupation</span>
                      <strong className="text-text-primary text-[11px] font-semibold">{activeGroup.user.creatorProfile.category || activeGroup.user.creatorProfile.occupation || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase block">Experience</span>
                      <strong className="text-text-primary text-[11px] font-semibold">{activeGroup.user.creatorProfile.experienceYears ? `${activeGroup.user.creatorProfile.experienceYears} Years` : '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase block">Languages</span>
                      <strong className="text-text-primary text-[11px] font-semibold">{activeGroup.user.creatorProfile.languages || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase block">Travel Available</span>
                      <strong className="text-text-primary text-[11px] font-semibold">{activeGroup.user.creatorProfile.travelAvailable ? 'Yes' : 'No'}</strong>
                    </div>
                    {activeGroup.user.creatorProfile.pricing && (
                      <div className="col-span-2 mt-1">
                        <span className="text-[10px] text-text-tertiary uppercase block mb-1">Pricing (Reels)</span>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-[9px] text-text-tertiary">1 Reel:</span> <strong className="text-emerald-600 font-bold">₹{activeGroup.user.creatorProfile.pricing.reel1 || '—'}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-text-tertiary">3 Reels:</span> <strong className="text-emerald-600 font-bold">₹{activeGroup.user.creatorProfile.pricing.reel3 || '—'}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fallback if user profile doesn't have detailed objects */}
              {!(activeGroup.user?.vendorProfile || activeGroup.user?.creatorProfile) && (
                <div className="p-4 rounded-xl bg-surface-secondary/40 text-center text-text-tertiary border border-border/40">
                  No detailed Business or Creator profile data is populated for this user yet.
                </div>
              )}
            </div>

            {/* Right Column: Document Details & Preview */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Document Tab Switcher */}
                <div className="flex border-b border-border/40 gap-1 overflow-x-auto pb-1.5">
                  {activeGroup.documents.map((doc) => {
                    const isSelected = doc.id === activeDocId;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setActiveDocId(doc.id)}
                        className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-brand-purple text-white border-brand-purple shadow-sm shadow-brand-purple/10'
                            : 'bg-surface border-border text-text-secondary hover:bg-surface-tertiary'
                        }`}
                      >
                        {doc.doc_type}
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          doc.status === 'approved' ? 'bg-emerald-500' : doc.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                      </button>
                    );
                  })}
                </div>

                {activeDoc && (
                  <div className="space-y-3 animate-fade-in" key={activeDoc.id}>
                    <div className="grid grid-cols-2 gap-3 text-xs bg-surface-secondary p-3 rounded-xl">
                      <div>
                        <span className="text-text-tertiary uppercase block text-[9px]">Document Type</span>
                        <strong className="uppercase font-bold text-brand-purple text-[11px]">{activeDoc.doc_type}</strong>
                      </div>
                      <div>
                        <span className="text-text-tertiary uppercase block text-[9px]">Document No</span>
                        <strong className="font-mono text-text-primary text-[11px]">{activeDoc.doc_number}</strong>
                      </div>
                      <div>
                        <span className="text-text-tertiary uppercase block text-[9px]">Status</span>
                        <span className="inline-block mt-0.5"><AdminStatusBadge status={activeDoc.status} /></span>
                      </div>
                      <div>
                        <span className="text-text-tertiary uppercase block text-[9px]">Submitted At</span>
                        <strong className="text-text-primary text-[11px] font-semibold">{new Date(activeDoc.submitted_at).toLocaleDateString()}</strong>
                      </div>
                    </div>

                    {activeDoc.doc_url ? (
                      <div className="border border-border rounded-xl overflow-hidden bg-black/5 flex flex-col items-center justify-center p-3 min-h-[220px]">
                        {String(activeDoc.doc_url).toLowerCase().includes('.pdf') || String(activeDoc.doc_url).startsWith('data:application/pdf') ? (
                          <div className="w-full space-y-3">
                            <iframe src={activeDoc.doc_url} title="PDF Preview" className="w-full h-48 rounded-lg border border-border" />
                            <a
                              href={activeDoc.doc_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-brand-purple font-bold underline hover:opacity-80"
                            >
                              <FiFileText /> Open PDF Document in New Tab
                            </a>
                          </div>
                        ) : (
                          <div className="space-y-2 text-center w-full">
                            <img src={activeDoc.doc_url} alt="KYC Document" className="max-h-[220px] mx-auto object-contain rounded-lg" />
                            <a
                              href={activeDoc.doc_url}
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
                      <div className="p-8 text-center text-xs text-text-tertiary border border-border border-dashed rounded-xl">No document file attached.</div>
                    )}

                    {activeDoc.selfie_url && (
                      <div className="border border-border rounded-xl p-3">
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">Selfie Verification</span>
                        <img src={activeDoc.selfie_url} alt="Selfie" className="h-24 object-contain rounded-lg" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {activeDoc && (
                <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                  <button
                    onClick={() => { handleApprove(activeDoc.id); }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm shadow-emerald-600/10"
                  >
                    <FiCheck /> Approve Document
                  </button>
                  <button
                    onClick={() => { setRejectId(activeDoc.id); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1 shadow-sm shadow-red-600/10"
                  >
                    <FiX /> Reject Document
                  </button>
                </div>
              )}
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
