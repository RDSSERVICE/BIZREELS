import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getSocket } from '../../../lib/socket';
import { resolveMediaUrl } from '../../../lib/api';
import {
  FiFileText, FiPlus, FiShoppingBag, FiTool, FiClock, FiMessageSquare,
  FiTrash2, FiEye, FiCheck, FiX, FiSearch, FiSliders, FiArrowLeft,
  FiUser, FiMapPin, FiRefreshCw, FiDollarSign, FiPlusCircle, FiShare2,
  FiActivity, FiCheckSquare, FiAlertTriangle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useGetRequirementsQuery,
  useDeleteRequirementMutation,
  useUpdateRequirementMutation,
  useGetQuotesForRequirementQuery,
  useUpdateQuoteStatusMutation,
  useGetRequirementDetailsQuery
} from '../../../features/customer/requirementsApi';

const TABS = [
  { key: 'all', label: 'All Requirements', icon: FiFileText },
  { key: 'product', label: 'Product Requirements', icon: FiShoppingBag },
  { key: 'service', label: 'Service Requirements', icon: FiTool },
];

export default function MyRequirementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeReqId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);

  // Compare mode states
  const [compareIds, setCompareIds] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Edit modal states
  const [editReq, setEditReq] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // API Hooks with polling for real-time views and bids update (3 minutes interval)
  const { data, isFetching, refetch } = useGetRequirementsQuery({
    search,
    status: statusFilter,
    sortBy,
    requirementType: activeTab !== 'all' ? activeTab : undefined,
    page,
    limit: 10
  }, { pollingInterval: 180000 });

  const [deleteRequirement] = useDeleteRequirementMutation();
  const [updateRequirement] = useUpdateRequirementMutation();

  const rawList = Array.isArray(data?.data) ? data.data : (data?.requirements || data?.data?.requirements || []);
  const totalItems = data?.meta?.total || data?.total || 0;

  // Selected requirement details query
  const { data: detailData, isFetching: isDetailLoading, refetch: refetchDetails } = useGetRequirementDetailsQuery(
    activeReqId,
    { skip: !activeReqId }
  );
  
  const selectedReq = detailData?.requirement || detailData?.data?.requirement || detailData?.data;

  const { data: quotesData, isFetching: isQuotesLoading, refetch: refetchQuotes } = useGetQuotesForRequirementQuery(
    activeReqId,
    { skip: !activeReqId }
  );

  const [updateQuoteStatus] = useUpdateQuoteStatusMutation();

  const quotesList = quotesData?.data?.quotes || quotesData?.quotes || (Array.isArray(quotesData?.data) ? quotesData.data : []);

  // Reset page when tab/filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, statusFilter, search, sortBy]);

  // Socket.IO real-time update listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReqCreated = (req) => {
      if (typeof refetch === 'function') refetch();
    };

    const handleReqUpdated = (req) => {
      if (typeof refetch === 'function') refetch();
      if (activeReqId === req._id || activeReqId === req.id) {
        if (typeof refetchDetails === 'function') refetchDetails();
        if (typeof refetchQuotes === 'function') refetchQuotes();
      }
    };

    const handleReqDeleted = ({ id }) => {
      if (typeof refetch === 'function') refetch();
      if (activeReqId === id) {
        setSearchParams({});
      }
    };

    const handleReqClosed = (req) => {
      if (typeof refetch === 'function') refetch();
      if (activeReqId === req._id || activeReqId === req.id) {
        if (typeof refetchDetails === 'function') refetchDetails();
        if (typeof refetchQuotes === 'function') refetchQuotes();
      }
    };

    const handleProposalSubmitted = ({ requirementId, quote }) => {
      if (activeReqId === requirementId) {
        if (typeof refetchQuotes === 'function') refetchQuotes();
        if (typeof refetchDetails === 'function') refetchDetails();
      }
      if (typeof refetch === 'function') refetch();
    };

    const handleProposalAccepted = ({ requirementId, quote }) => {
      if (activeReqId === requirementId) {
        if (typeof refetchQuotes === 'function') refetchQuotes();
        if (typeof refetchDetails === 'function') refetchDetails();
      }
      if (typeof refetch === 'function') refetch();
    };

    const handleProposalRejected = ({ requirementId, quote }) => {
      if (activeReqId === requirementId) {
        if (typeof refetchQuotes === 'function') refetchQuotes();
        if (typeof refetchDetails === 'function') refetchDetails();
      }
      if (typeof refetch === 'function') refetch();
    };

    const handleReqViewed = ({ requirementId }) => {
      if (activeReqId === requirementId) {
        if (typeof refetchDetails === 'function') refetchDetails();
      }
      if (typeof refetch === 'function') refetch();
    };

    socket.on('requirement:created', handleReqCreated);
    socket.on('requirement:updated', handleReqUpdated);
    socket.on('requirement:deleted', handleReqDeleted);
    socket.on('requirement:closed', handleReqClosed);
    socket.on('requirement:viewed', handleReqViewed);
    socket.on('proposal:submitted', handleProposalSubmitted);
    socket.on('proposal:accepted', handleProposalAccepted);
    socket.on('proposal:rejected', handleProposalRejected);

    return () => {
      socket.off('requirement:created', handleReqCreated);
      socket.off('requirement:updated', handleReqUpdated);
      socket.off('requirement:deleted', handleReqDeleted);
      socket.off('requirement:closed', handleReqClosed);
      socket.off('requirement:viewed', handleReqViewed);
      socket.off('proposal:submitted', handleProposalSubmitted);
      socket.off('proposal:accepted', handleProposalAccepted);
      socket.off('proposal:rejected', handleProposalRejected);
    };
  }, [activeReqId, refetch, refetchDetails, refetchQuotes, setSearchParams]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete requirement "${title}"?`)) return;
    try {
      await deleteRequirement(id).unwrap();
      toast.success('Requirement deleted');
      if (activeReqId === id) {
        setSearchParams({});
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  };

  const handleCloseRequirement = async (id) => {
    if (!window.confirm('Are you sure you want to close this requirement? Vendors will no longer be able to submit proposals.')) return;
    try {
      await updateRequirement({ id, status: 'Closed' }).unwrap();
      toast.success('Requirement closed successfully');
      refetch();
      if (activeReqId) refetchDetails();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to close requirement');
    }
  };

  const handleRepostRequirement = async (id) => {
    if (!window.confirm('Would you like to repost this requirement? This will extend the expiry date by 30 days and alert local vendors again.')) return;
    try {
      const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await updateRequirement({
        id,
        status: 'Pending',
        expires_at: newExpiry
      }).unwrap();
      toast.success('Requirement reposted successfully! Matching vendors have been alerted.');
      refetch();
      if (activeReqId) refetchDetails();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to repost requirement');
    }
  };

  const handleUpdateQuote = async (quoteId, status) => {
    try {
      await updateQuoteStatus({ quoteId, status, requirementId: activeReqId }).unwrap();
      toast.success(`Proposal ${status} successfully!`);
      refetchQuotes();
      refetchDetails();
    } catch (err) {
      toast.error(err?.data?.message || `Failed to ${status} proposal`);
    }
  };

  const handleOpenEditModal = (req) => {
    setEditReq(req);
    setEditTitle(req.title || '');
    setEditBudget(req.budget || '');
    setEditQty(req.quantity || '1');
    setEditDesc(req.description || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle || !editBudget || !editDesc) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await updateRequirement({
        id: editReq._id || editReq.id,
        title: editTitle,
        budget: Number(editBudget),
        quantity: Number(editQty),
        description: editDesc
      }).unwrap();
      toast.success('Requirement updated successfully');
      setEditReq(null);
      refetch();
      if (activeReqId) refetchDetails();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update requirement');
    }
  };

  const handleShare = (req) => {
    const shareUrl = `${window.location.origin}/customer/my-requirements?id=${req._id || req.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard!');
  };

  const toggleCompare = (quoteId) => {
    if (compareIds.includes(quoteId)) {
      setCompareIds(compareIds.filter(id => id !== quoteId));
    } else {
      if (compareIds.length >= 3) {
        toast.error('You can compare at most 3 proposals at a time');
        return;
      }
      setCompareIds([...compareIds, quoteId]);
    }
  };

  // Render detail view if a requirement ID is selected
  if (activeReqId && selectedReq) {
    const reqLoc = selectedReq.location || {};
    const isRemote = reqLoc.area === 'Remote' || (reqLoc.city === 'Online' && reqLoc.state === 'Remote');
    const locationText = isRemote 
      ? 'Remote (Online)' 
      : (typeof reqLoc === 'string' ? reqLoc : `${reqLoc.city || 'Local'}${reqLoc.state ? `, ${reqLoc.state}` : ''}`);
    
    // Timeline steps completion checks
    const hasNotified = (selectedReq.totalVendorsNotified || 0) > 0;
    const hasViewed = (selectedReq.views_count || 0) > 0;
    const hasBids = (selectedReq.quotesCount || selectedReq.proposals_count || 0) > 0;
    const isClosed = ['Closed', 'Proposal Accepted', 'Expired', 'Cancelled'].includes(selectedReq.status);

    const pendingQuotes = quotesList.filter(q => q.status === 'pending');
    const acceptedQuote = quotesList.find(q => q.status === 'accepted');
    const rejectedQuotes = quotesList.filter(q => q.status === 'rejected');

    return (
      <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-24 lg:pb-12">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-brand-purple transition-all"
          >
            <FiArrowLeft size={16} /> Back to My Requirements
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShare(selectedReq)}
              className="p-2 glass border border-border rounded-xl text-text-secondary hover:text-brand-purple transition"
              title="Share Link"
            >
              <FiShare2 size={14} />
            </button>
            <button
              onClick={() => handleOpenEditModal(selectedReq)}
              className="px-3 py-1.5 glass border border-border text-text-secondary rounded-xl text-xs font-bold hover:text-brand-purple transition"
            >
              Edit Details
            </button>
            {!isClosed && (
              <button
                onClick={() => handleCloseRequirement(selectedReq._id || selectedReq.id)}
                className="px-3 py-1.5 border border-error/20 bg-error/10 text-error rounded-xl text-xs font-bold hover:bg-error/25 transition"
              >
                Close Brief
              </button>
            )}
            {isClosed && (
              <button
                onClick={() => handleRepostRequirement(selectedReq._id || selectedReq.id)}
                className="px-3 py-1.5 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-90 transition"
              >
                Repost / Reopen
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Requirement Details & Distribution Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Requirement Summary */}
            <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider bg-brand-purple/10 px-2 py-0.5 rounded">
                      {selectedReq.category || 'General'}
                    </span>
                    {selectedReq.subcategory && (
                      <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider bg-brand-orange/10 px-2 py-0.5 rounded">
                        {selectedReq.subcategory}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-text-primary mt-2 font-display">{selectedReq.title}</h2>
                  {selectedReq.approvalStatus === 'pending_approval' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-700 flex items-start gap-2 text-xs font-semibold mt-2">
                      <FiClock size={16} className="shrink-0 mt-0.5 text-amber-500" />
                      <div>
                        <strong className="block mb-0.5 text-amber-800">Pending Admin Approval</strong>
                        This requirement is currently undergoing admin review. Once approved, it will be shared with vendors automatically.
                      </div>
                    </div>
                  )}
                  {selectedReq.approvalStatus === 'rejected' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-700 flex items-start gap-2 text-xs font-semibold mt-2">
                      <FiAlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
                      <div>
                        <strong className="block mb-0.5 text-red-800">Requirement Rejected by Admin</strong>
                        Reason: {selectedReq.adminRejectionReason || 'No reason provided.'}
                        <p className="mt-1 text-[10px] text-red-500 font-normal">Please modify details or post a new requirement brief.</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed whitespace-pre-wrap">{selectedReq.description}</p>
                  {selectedReq.detailedSpecifications && (
                    <div className="mt-3 p-3 bg-surface-secondary rounded-xl border border-border">
                      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Detailed Specifications</span>
                      <p className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">{selectedReq.detailedSpecifications}</p>
                    </div>
                  )}
                  {selectedReq.address && (
                    <div className="mt-2.5 text-xs text-text-secondary">
                      <span className="text-text-tertiary">Venue Address:</span> <strong className="text-text-primary">{selectedReq.address}</strong>
                    </div>
                  )}
                  {selectedReq.expectedDeliveryDate && (
                    <div className="mt-2 text-xs text-text-secondary flex gap-4">
                      <div><span className="text-text-tertiary">Expected Delivery:</span> <strong className="text-text-primary">{new Date(selectedReq.expectedDeliveryDate).toLocaleDateString('en-IN')}</strong></div>
                      {selectedReq.expectedDeliveryTime && <div><span className="text-text-tertiary">Preferred Time:</span> <strong className="text-text-primary">{selectedReq.expectedDeliveryTime}</strong></div>}
                    </div>
                  )}
                  {selectedReq.productCondition && (
                    <div className="mt-1 text-xs text-text-secondary">
                      <span className="text-text-tertiary">Condition Preference:</span> <strong className="text-text-primary capitalize">{selectedReq.productCondition === 'other' ? selectedReq.customProductCondition || 'Other' : selectedReq.productCondition}</strong>
                    </div>
                  )}
                  {selectedReq.serviceModel && (
                    <div className="mt-1 text-xs text-text-secondary">
                      <span className="text-text-tertiary">Service Model:</span> <strong className="text-text-primary capitalize">{selectedReq.serviceModel === 'other' ? selectedReq.customServiceModel || 'Other' : selectedReq.serviceModel}</strong>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <AdminStatusBadge status={selectedReq.status || 'Pending'} />
                  <div className="text-xs text-text-tertiary mt-2">ID: {selectedReq._id || selectedReq.id}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50 text-xs">
                <div className="p-3 bg-surface-secondary rounded-xl">
                  <span className="text-text-tertiary block mb-1">Budget</span>
                  <strong className="text-sm font-bold text-brand-purple">
                    {selectedReq.budget_min || selectedReq.budget_max ? (
                      `₹${(selectedReq.budget_min || 0).toLocaleString('en-IN')} - ₹${(selectedReq.budget_max || 0).toLocaleString('en-IN')}`
                    ) : (
                      `₹${(selectedReq.budget || 0).toLocaleString('en-IN')}`
                    )}
                  </strong>
                </div>
                <div className="p-3 bg-surface-secondary rounded-xl">
                  <span className="text-text-tertiary block mb-1">
                    {selectedReq.requirementType === 'service' || selectedReq.type === 'service' ? 'Required Scope' : 'Quantity Requested'}
                  </span>
                  <strong className="text-sm font-bold text-text-primary">
                    {selectedReq.quantity || 1} {selectedReq.requirementType === 'service' || selectedReq.type === 'service' ? 'Deliverables/Days' : 'Units'}
                  </strong>
                </div>
                <div className="p-3 bg-surface-secondary rounded-xl">
                  <span className="text-text-tertiary block mb-1">Target Location</span>
                  <strong className="text-sm font-bold text-text-primary flex items-center gap-1">
                    <FiMapPin className="text-brand-orange text-xs" /> {locationText}
                  </strong>
                </div>
                <div className="p-3 bg-surface-secondary rounded-xl">
                  <span className="text-text-tertiary block mb-1">Date Posted</span>
                  <strong className="text-sm font-bold text-text-primary">
                    {(selectedReq.created_at || selectedReq.createdAt) ? new Date(selectedReq.created_at || selectedReq.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Attachments Card */}
            {((selectedReq.photos && selectedReq.photos.length > 0) || selectedReq.video) && (
              <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
                  <span>Requirement Media & Attachments</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Images Grid */}
                  {selectedReq.photos && selectedReq.photos.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Photos</label>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedReq.photos.map((url, idx) => (
                          <a
                            key={idx}
                            href={resolveMediaUrl(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square rounded-xl overflow-hidden border border-border hover:border-brand-purple transition bg-surface flex items-center justify-center"
                          >
                            <img src={resolveMediaUrl(url)} alt={`Requirement attachment ${idx + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video Player */}
                  {selectedReq.video && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Reference Video</label>
                      <div className="rounded-xl overflow-hidden border border-border bg-surface-tertiary flex items-center justify-center">
                        <video
                          src={resolveMediaUrl(selectedReq.video)}
                          controls
                          className="max-h-[160px] w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Proposals Comparison List */}
            <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <div>
                  <h3 className="text-sm font-bold text-text-primary font-display">Quotations & Proposals ({quotesList.length})</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">Compare bids and choose the best offer for your requirement</p>
                </div>
                
                {compareIds.length > 0 && (
                  <button
                    onClick={() => setIsCompareModalOpen(true)}
                    className="px-3.5 py-1.5 bg-brand-purple text-white text-xs font-bold rounded-xl shadow-premium hover:bg-brand-purple/90 transition flex items-center gap-1"
                  >
                    <FiCheckSquare size={13} />
                    <span>Compare ({compareIds.length}) Proposals</span>
                  </button>
                )}
              </div>

              {isQuotesLoading ? (
                <div className="py-8 text-center text-xs text-text-tertiary">Loading proposals...</div>
              ) : quotesList.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-tertiary space-y-3">
                  <FiMessageSquare className="w-10 h-10 text-brand-purple mx-auto opacity-50" />
                  <p className="font-bold text-text-primary text-sm">No quotes submitted yet</p>
                  <p className="max-w-xs mx-auto">Matched local vendors are currently reviewing your requirement brief and preparing quotes.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotesList.map((q) => {
                    const quoteId = q.id || q._id;
                    const vendorProfile = q.vendor?.vendorProfile || {};
                    const isAccepted = q.status === 'accepted';
                    const isRejected = q.status === 'rejected';

                    return (
                      <div
                        key={quoteId}
                        className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row justify-between gap-4 ${
                          isAccepted
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : isRejected
                            ? 'bg-red-500/5 border-red-500/20 opacity-60'
                            : 'bg-surface border-border hover:border-brand-purple/40 shadow-sm'
                        }`}
                      >
                        <div className="space-y-2 flex-grow min-w-0">
                          <div className="flex items-center gap-3">
                            {/* Compare Checkbox */}
                            {!isClosed && !isRejected && (
                              <input
                                type="checkbox"
                                checked={compareIds.includes(quoteId)}
                                onChange={() => toggleCompare(quoteId)}
                                className="w-4 h-4 rounded text-brand-purple focus:ring-brand-purple cursor-pointer shrink-0"
                              />
                            )}
                            <div className="flex items-center gap-2">
                              <img
                                src={q.vendor?.avatarUrl || 'https://via.placeholder.com/100'}
                                alt={q.vendor?.name}
                                className="w-8 h-8 rounded-full border border-border object-cover shrink-0"
                              />
                              <div>
                                <h4 className="font-bold text-xs text-text-primary">{q.vendor?.name || 'Vendor Partner'}</h4>
                                <p className="text-[10px] text-text-tertiary">{vendorProfile.businessName || vendorProfile.shopName || 'Verified Store'}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5 self-start">
                              ⭐ {vendorProfile.rating || q.vendor?.rating_avg || '4.5'}
                            </span>
                          </div>

                          <p className="text-xs text-text-secondary bg-surface-secondary/40 p-2.5 rounded-lg leading-relaxed mt-2 whitespace-pre-wrap">
                            {q.notes || 'No message provided.'}
                          </p>

                          {q.attachments && q.attachments.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-text-tertiary">
                              <span>Attachments:</span>
                              {q.attachments.map((file, idx) => (
                                <a
                                  key={idx}
                                  href={file.url || file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-purple hover:underline bg-brand-purple/5 px-2 py-0.5 rounded border border-brand-purple/10"
                                >
                                  File {idx + 1}
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-[10px] text-text-tertiary pt-1">
                            <span>Delivery Time: <strong>{q.estimatedDelivery ? new Date(q.estimatedDelivery).toLocaleDateString() : 'N/A'}</strong></span>
                            <span>Submitted: <strong>{new Date(q.createdAt).toLocaleDateString()}</strong></span>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 border-border/50 pt-3 md:pt-0 shrink-0">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] text-text-tertiary uppercase tracking-wider block">Price Quote</span>
                            <span className="text-base font-black text-emerald-600">₹{(q.price || 0).toLocaleString('en-IN')}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isAccepted && (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                                Accepted & Paid
                              </span>
                            )}
                            {isRejected && (
                              <span className="text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-xl">
                                Rejected
                              </span>
                            )}

                            {!isClosed && q.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateQuote(quoteId, 'accepted')}
                                  className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow hover:bg-emerald-600 transition flex items-center gap-1"
                                >
                                  <FiCheck size={14} /> Accept
                                </button>
                                <button
                                  onClick={() => handleUpdateQuote(quoteId, 'rejected')}
                                  className="p-1.5 border border-error/20 bg-error/5 text-error rounded-lg hover:bg-error/15 transition"
                                  title="Reject Proposal"
                                >
                                  <FiX size={14} />
                                </button>
                              </>
                            )}

                            <Link
                              to={`/customer/chat?userId=${q.vendor?._id || q.vendor?.id}&name=${encodeURIComponent(q.vendor?.name || '')}&avatar=${encodeURIComponent(q.vendor?.avatarUrl || '')}`}
                              className="px-3 py-1.5 glass border border-border text-xs font-semibold rounded-lg hover:text-brand-purple hover:border-brand-purple transition-all"
                            >
                              Chat
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Distribution Metrics, Summary & Timeline */}
          <div className="space-y-6">
            {/* Vendor distribution stats */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card space-y-4">
              <h3 className="text-xs font-black text-brand-navy uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                <FiActivity className="text-brand-purple" /> Vendor Distribution
              </h3>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-surface rounded-xl border border-border">
                  <span className="text-[20px] font-black text-brand-navy block">{selectedReq.totalVendorsMatched || 0}</span>
                  <span className="text-[10px] text-text-tertiary uppercase">Vendors Matched</span>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-border">
                  <span className="text-[20px] font-black text-brand-purple block">{selectedReq.totalVendorsNotified || 0}</span>
                  <span className="text-[10px] text-text-tertiary uppercase">Notified</span>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-border">
                  <span className="text-[20px] font-black text-amber-600 block">{selectedReq.views_count || selectedReq.vendorsViewed?.length || 0}</span>
                  <span className="text-[10px] text-text-tertiary uppercase">Viewed Brief</span>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-border">
                  <span className="text-[20px] font-black text-emerald-600 block">{selectedReq.quotesCount || selectedReq.proposals_count || 0}</span>
                  <span className="text-[10px] text-text-tertiary uppercase">Responded</span>
                </div>
              </div>
            </div>

            {/* Proposal Summary Metrics */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card space-y-3 text-xs">
              <h3 className="font-black text-brand-navy uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                <FiFileText className="text-brand-orange" /> Proposal Summary
              </h3>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Proposals Received:</span>
                <strong className="text-text-primary">{quotesList.length}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Pending Proposals:</span>
                <strong className="text-amber-600">{pendingQuotes.length}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Accepted Proposal:</span>
                <strong className="text-emerald-600">{acceptedQuote ? `₹${acceptedQuote.price.toLocaleString('en-IN')}` : 'None'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Rejected Proposals:</span>
                <strong className="text-red-500">{rejectedQuotes.length}</strong>
              </div>
            </div>

            {/* Timeline widget */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card space-y-4">
              <h3 className="text-xs font-black text-brand-navy uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                <FiClock className="text-brand-orange" /> Requirement Lifecycle
              </h3>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
                {/* Step 1: Created */}
                <div className="relative">
                  <span className="absolute -left-[22px] top-0.5 w-3 h-3 rounded-full bg-brand-purple border-2 border-white shadow-sm" />
                  <div className="text-xs">
                    <strong className="text-text-primary block">Requirement Brief Created</strong>
                    <span className="text-[10px] text-text-tertiary">{selectedReq.createdAt ? new Date(selectedReq.createdAt).toLocaleString('en-IN') : 'Recent'}</span>
                  </div>
                </div>

                {/* Step 2: Sent to Vendors */}
                <div className="relative">
                  <span className={`absolute -left-[22px] top-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${hasNotified ? 'bg-brand-purple' : 'bg-slate-300'}`} />
                  <div className="text-xs">
                    <strong className="text-text-primary block">Dispatched to Matches</strong>
                    <span className="text-[10px] text-text-tertiary">
                      {hasNotified ? `Alerted ${selectedReq.totalVendorsNotified} local vendors` : 'Identifying matching vendors...'}
                    </span>
                  </div>
                </div>

                {/* Step 3: Vendors Viewed */}
                <div className="relative">
                  <span className={`absolute -left-[22px] top-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${hasViewed ? 'bg-brand-purple' : 'bg-slate-300'}`} />
                  <div className="text-xs">
                    <strong className="text-text-primary block">Vendors Viewed Brief</strong>
                    <span className="text-[10px] text-text-tertiary">
                      {hasViewed ? `${selectedReq.views_count || selectedReq.vendorsViewed?.length} vendors checked details` : 'Awaiting vendor views'}
                    </span>
                  </div>
                </div>

                {/* Step 4: Proposal Received */}
                <div className="relative">
                  <span className={`absolute -left-[22px] top-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${hasBids ? 'bg-brand-purple' : 'bg-slate-300'}`} />
                  <div className="text-xs">
                    <strong className="text-text-primary block">Proposals / Quotations Received</strong>
                    <span className="text-[10px] text-text-tertiary">
                      {hasBids ? `Received ${selectedReq.quotesCount || selectedReq.proposals_count} competitive bids` : 'Waiting for proposal bids'}
                    </span>
                  </div>
                </div>

                {/* Step 5: Closed */}
                <div className="relative">
                  <span className={`absolute -left-[22px] top-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${isClosed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div className="text-xs">
                    <strong className="text-text-primary block">Requirement Settled & Closed</strong>
                    <span className="text-[10px] text-text-tertiary">
                      {isClosed ? `Status: ${selectedReq.status} — Lifecycle complete` : 'Open for proposals'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparative Matrix Modal */}
        <AdminModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          title="Compare Vendor Proposals"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
            {quotesList
              .filter(q => compareIds.includes(q.id || q._id))
              .map((q) => {
                const vendorProfile = q.vendor?.vendorProfile || {};
                return (
                  <div key={q.id || q._id} className="p-4 bg-surface-secondary border border-border rounded-2xl flex flex-col justify-between gap-4 shadow-sm text-xs">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <img
                          src={q.vendor?.avatarUrl || 'https://via.placeholder.com/100'}
                          alt={q.vendor?.name}
                          className="w-10 h-10 rounded-full border object-cover"
                        />
                        <div>
                          <h4 className="font-bold text-text-primary">{q.vendor?.name}</h4>
                          <p className="text-[10px] text-text-tertiary">{vendorProfile.businessName || 'Verified Store'}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-text-tertiary block">Quotation Price</span>
                        <strong className="text-lg font-black text-emerald-600">₹{(q.price || 0).toLocaleString('en-IN')}</strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-text-tertiary block">Vendor Rating</span>
                        <strong className="text-amber-500 font-bold">⭐ {vendorProfile.rating || q.vendor?.rating_avg || '4.5'}</strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-text-tertiary block">Delivery Timeline</span>
                        <strong className="text-text-primary">{q.estimatedDelivery ? new Date(q.estimatedDelivery).toLocaleDateString() : 'Immediate'}</strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-text-tertiary block">Message</span>
                        <p className="text-[11px] text-text-secondary leading-relaxed bg-surface/50 p-2 rounded max-h-24 overflow-y-auto">{q.notes || 'No notes.'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-border pt-3">
                      <button
                        onClick={() => {
                          handleUpdateQuote(q.id || q._id, 'accepted');
                          setIsCompareModalOpen(false);
                        }}
                        className="flex-1 py-2 bg-emerald-500 text-white rounded-lg font-bold shadow hover:bg-emerald-600 transition text-center"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateQuote(q.id || q._id, 'rejected');
                          setIsCompareModalOpen(false);
                        }}
                        className="py-2 px-2.5 border border-error/20 bg-error/5 text-error rounded-lg hover:bg-error/15 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </AdminModal>

        {/* Global Inline Edit Modal */}
        <AdminModal
          isOpen={!!editReq}
          onClose={() => setEditReq(null)}
          title="Edit Requirement Details"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Requirement Title *</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Max Budget (₹) *</label>
                <input
                  type="number"
                  required
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Quantity Requested *</label>
                <input
                  type="number"
                  required
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Detailed Description *</label>
              <textarea
                required
                rows={4}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setEditReq(null)}
                className="px-4 py-2 glass border border-border rounded-xl text-text-secondary font-bold hover:bg-surface-tertiary transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 gradient-brand text-white font-bold rounded-xl shadow-premium hover:opacity-90 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </AdminModal>
      </div>
    );
  }

  // Else, render the standard requirements listing dashboard
  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 animate-fade-in p-2 sm:p-4 min-h-screen pb-24 lg:pb-8 font-sans">
      {/* Header Banner */}
      <div className="bg-[#241b15] text-white p-6 rounded-md border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">CUSTOMER PORTAL</span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white">
            MY REQUIREMENTS &amp; BRIEFS
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            Manage your posted product and service requirements and review vendor quote proposals.
          </p>
        </div>

        <Link
          to="/customer/post-requirement"
          className="px-4 py-2.5 bg-[#d99a3d] text-[#1a1a1a] border border-[#1a1a1a] rounded-md text-xs font-black uppercase tracking-wider shadow-xs hover:bg-[#c8872b] transition flex items-center gap-1.5 shrink-0"
        >
          <FiPlus size={16} /> Post Requirement
        </Link>
      </div>

      {/* Bento Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-md text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition cursor-pointer border ${
                isActive
                  ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                  : 'bg-white border-[#e3dccb] text-slate-700 hover:bg-[#f8f4ec]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#d99a3d]' : 'text-slate-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search, Status & Sorting Filter Panel */}
      <div className="glass rounded-xl p-4 border border-white/50 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-grow">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Title, ID, Category or City..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple placeholder:text-text-tertiary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-1 bg-surface border border-border px-3 py-1.5 rounded-xl text-xs w-full sm:w-auto">
            <FiSliders className="text-text-tertiary shrink-0" size={13} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-text-secondary focus:outline-none w-full text-xs font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending Match</option>
              <option value="Sent to Vendors">Sent to Vendors</option>
              <option value="Vendors Notified">Vendors Notified</option>
              <option value="Vendors Responded">Vendors Responded</option>
              <option value="Receiving Proposals">Receiving Proposals</option>
              <option value="Proposal Accepted">Proposal Accepted</option>
              <option value="Closed">Closed</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-secondary focus:outline-none w-full sm:w-auto shrink-0"
          >
            <option value="latest">Latest Posted</option>
            <option value="oldest">Oldest Posted</option>
            <option value="budget_high_low">Budget: High → Low</option>
            <option value="budget_low_high">Budget: Low → High</option>
            <option value="most_responses">Most Responses</option>
            <option value="least_responses">Least Responses</option>
          </select>
        </div>
      </div>

      {isFetching ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
      ) : rawList.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center space-y-3 border border-border">
          <FiFileText size={36} className="mx-auto text-brand-purple opacity-70 animate-bounce" />
          <h3 className="text-sm font-bold text-text-primary">No requirements found</h3>
          <p className="text-xs text-text-tertiary max-w-sm mx-auto">
            Try adjusting your search filters or post a new requirement brief to get direct vendor proposals.
          </p>
          <Link
            to="/customer/post-requirement"
            className="inline-block mt-2 px-5 py-2.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium"
          >
            Post Requirement Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rawList.map((req) => {
            const reqId = req._id || req.id;
            const reqLoc = req.location || {};
            const isRemote = reqLoc.area === 'Remote' || (reqLoc.city === 'Online' && reqLoc.state === 'Remote');
            const locationText = isRemote 
              ? 'Remote (Online)' 
              : (typeof reqLoc === 'string' ? reqLoc : `${reqLoc.city || 'Local'}${reqLoc.state ? `, ${reqLoc.state}` : ''}`);
            
            const createdAtDate = (req.created_at || req.createdAt) ? new Date(req.created_at || req.createdAt) : new Date();
            const rawExpiry = req.expires_at || req.deadline || new Date(createdAtDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            const expiryStr = rawExpiry ? new Date(rawExpiry).toLocaleDateString('en-IN') : '30 Days';

            return (
              <div
                key={reqId}
                className="glass rounded-2xl p-5 border border-white/50 shadow-card hover:shadow-card-hover transition-all flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-black text-brand-purple uppercase bg-brand-purple/10 px-2 py-0.5 rounded">
                        {req.category || 'General'}
                      </span>
                      {req.subcategory && (
                        <span className="text-[9px] font-black text-brand-orange uppercase bg-brand-orange/10 px-2 py-0.5 rounded">
                          {req.subcategory}
                        </span>
                      )}
                      <span className="text-[9px] font-bold text-text-tertiary">ID: {reqId.substring(18)}</span>
                    </div>
                    
                    <h3 className="text-sm font-bold text-text-primary mt-1.5 font-display hover:text-brand-purple transition cursor-pointer" onClick={() => setSearchParams({ id: reqId })}>
                      {req.title}
                    </h3>
                    
                    {req.approvalStatus === 'pending_approval' && (
                      <span className="inline-block mt-1 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                        ⌛ Pending Admin Approval
                      </span>
                    )}
                    {req.approvalStatus === 'rejected' && (
                      <div className="mt-1 text-[9px] font-bold bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full">
                        ❌ Rejected: {req.adminRejectionReason || 'Violated Guidelines'}
                      </div>
                    )}
                    
                    {req.description && (
                      <p className="text-xs text-text-tertiary mt-1 line-clamp-2 leading-relaxed">{req.description}</p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                    <AdminStatusBadge status={req.status || 'Pending'} />
                    <span className="text-xs font-black text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mt-1">
                      Budget: {req.budget_min || req.budget_max ? (
                        `₹${(req.budget_min || 0).toLocaleString('en-IN')} - ₹${(req.budget_max || 0).toLocaleString('en-IN')}`
                      ) : (
                        `₹${(req.budget || 0).toLocaleString('en-IN')}`
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] text-text-tertiary gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1">
                      <FiClock size={12} />
                      Posted: {(req.created_at || req.createdAt) ? new Date(req.created_at || req.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                    </span>
                    <span className="flex items-center gap-1 text-brand-purple font-bold">
                      <FiUser size={12} />
                      {req.totalVendorsNotified || 0} Vendors Assigned
                    </span>
                    <button
                      onClick={() => setSearchParams({ id: reqId })}
                      className="flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                    >
                      <FiMessageSquare size={12} />
                      {req.quotesCount || req.proposals_count || 0} Proposals Received
                    </button>
                    <span className="flex items-center gap-1">
                      <FiEye size={12} />
                      {req.views_count || 0} Views
                    </span>
                    <span className="text-slate-500">
                      Expiry: {expiryStr}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSearchParams({ id: reqId })}
                      className="px-3 py-1.5 gradient-brand text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition flex items-center gap-1 cursor-pointer"
                    >
                      <FiEye size={13} />
                      <span>Details & Bids</span>
                    </button>
                    <button
                      onClick={() => handleShare(req)}
                      className="p-1.5 rounded-lg text-text-secondary bg-surface border border-border hover:bg-surface-tertiary transition"
                      title="Share Brief"
                    >
                      <FiShare2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(reqId, req.title)}
                      className="p-1.5 rounded-lg text-error bg-error/10 hover:bg-error/20 transition"
                      title="Delete Brief"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Stub for skipping query logic
const skipSymbol = { skip: true };
