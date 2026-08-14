import React, { useState, useEffect } from 'react';
import { getSocket } from '../../../lib/socket';
import { resolveMediaUrl } from '../../../lib/api';
import {
  FiInbox, FiShoppingBag, FiTool, FiFileText, FiMessageCircle,
  FiPhone, FiClock, FiMapPin, FiCheck, FiSliders, FiDollarSign,
  FiLayers, FiEye, FiArchive, FiTrash
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminModal from '../../../features/admin/components/AdminModal';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { useAuth } from '../../../context/AuthContext';
import { useGetVendorLeadsQuery, useGetVendorWalletQuery } from '../../../features/vendor/vendorApi';
import {
  useGetRequirementsQuery,
  useSubmitQuoteMutation,
  useGetRequirementDetailsQuery
} from '../../../features/customer/requirementsApi';

const TABS = [
  { key: 'product-enquiries', label: 'Product Enquiries', icon: FiShoppingBag },
  { key: 'service-enquiries', label: 'Service Enquiries', icon: FiTool },
  { key: 'quote-requests', label: 'Quote Requests', icon: FiFileText },
  { key: 'requirement-matches', label: 'Customer Requirements', icon: FiInbox },
];

export default function VendorLeadsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requirement-matches');
  
  // Leads & Enquiries Queries
  const { data: leadsData, isFetching: isLeadsFetching } = useGetVendorLeadsQuery(undefined, { pollingInterval: 300000 });
  
  // Filters & sorting for Leads
  const [distanceKm, setDistanceKm] = useState('50');
  const [sortBy, setSortBy] = useState('distance');

  // Assigned Requirements Queries (role-aware: vendor gets assigned matches)
  const { data: reqsData, isFetching: isReqsFetching, refetch: refetchReqs } = useGetRequirementsQuery(
    {
      limit: 100,
      lat: user?.location?.coordinates?.[1] || undefined,
      lng: user?.location?.coordinates?.[0] || undefined,
      distance: distanceKm !== 'any' ? distanceKm : undefined,
      sortBy: sortBy,
    },
    { pollingInterval: 300000 }
  );

  // Vendor Wallet credits check
  const { data: walletData, refetch: refetchWallet } = useGetVendorWalletQuery(undefined, { skip: !proposalReq });
  const vendorWallet = walletData?.data || walletData || {};
  const currentCredits = vendorWallet.credits !== undefined ? vendorWallet.credits : (vendorWallet.walletBalance || 0);

  const [submitQuote, { isLoading: isSubmittingQuote }] = useSubmitQuoteMutation();

  // Local state for ignore/save requirements
  const [ignoredIds, setIgnoredIds] = useState(() => {
    return JSON.parse(localStorage.getItem('vendor_ignored_requirements') || '[]');
  });
  const [savedIds, setSavedIds] = useState(() => {
    return JSON.parse(localStorage.getItem('vendor_saved_requirements') || '[]');
  });

  // Proposal modal states
  const [proposalReq, setProposalReq] = useState(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteDelivery, setQuoteDelivery] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteAttachment, setQuoteAttachment] = useState('');

  // Requirement details modal states
  const [detailReq, setDetailReq] = useState(null);

  // Query to fetch requirement details for recording views when a vendor views details or opens proposal modal
  const [activeDetailId, setActiveDetailId] = useState(null);
  const { data: detailFetched } = useGetRequirementDetailsQuery(activeDetailId, {
    skip: !activeDetailId,
  });

  // Update activeDetailId when detailReq or proposalReq changes
  useEffect(() => {
    const id = detailReq?._id || detailReq?.id || proposalReq?._id || proposalReq?.id;
    if (id) {
      setActiveDetailId(id);
    } else {
      setActiveDetailId(null);
    }
  }, [detailReq, proposalReq]);

  const displayReq = detailFetched?.data?.requirement || detailFetched?.requirement || detailReq;
  const displayProposalReq = (proposalReq && (detailFetched?.data?.requirement || detailFetched?.requirement)) || proposalReq;

  // Socket.IO real-time update listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReqAssigned = (req) => {
      if (typeof refetchReqs === 'function') refetchReqs();
    };

    const handleReqUpdated = (req) => {
      if (typeof refetchReqs === 'function') refetchReqs();
      if (detailReq && (detailReq._id === req._id || detailReq.id === req.id)) {
        setDetailReq(req);
      }
    };

    const handleReqDeleted = ({ id }) => {
      if (typeof refetchReqs === 'function') refetchReqs();
      if (detailReq && (detailReq._id === id || detailReq.id === id)) {
        setDetailReq(null);
      }
    };

    const handleReqClosed = (req) => {
      if (typeof refetchReqs === 'function') refetchReqs();
      if (detailReq && (detailReq._id === req._id || detailReq.id === req.id)) {
        setDetailReq(req);
      }
    };

    socket.on('requirement:assigned', handleReqAssigned);
    socket.on('requirement:updated', handleReqUpdated);
    socket.on('requirement:deleted', handleReqDeleted);
    socket.on('requirement:closed', handleReqClosed);

    return () => {
      socket.off('requirement:assigned', handleReqAssigned);
      socket.off('requirement:updated', handleReqUpdated);
      socket.off('requirement:deleted', handleReqDeleted);
      socket.off('requirement:closed', handleReqClosed);
    };
  }, [detailReq, refetchReqs]);

  // Segregate backend flat list of inquiries into the matching categories
  const allInquiries = Array.isArray(leadsData?.data) ? leadsData.data : Array.isArray(leadsData) ? leadsData : [];
  
  const productEnquiries = [];
  const serviceEnquiries = [];
  const quoteRequests = [];

  allInquiries.forEach((e) => {
    const isQuoteOrCall = (e.message || '').toLowerCase().includes('callback') || 
                          (e.message || '').toLowerCase().includes('call callback') ||
                          (e.message || '').toLowerCase().includes('quote') ||
                          e.listing?.price === 0 || 
                          e.listing?.sellingPrice === 0;

    if (isQuoteOrCall) {
      quoteRequests.push(e);
    } else if (e.listing?.type === 'service') {
      serviceEnquiries.push(e);
    } else {
      productEnquiries.push(e);
    }
  });
  
  // Parse requirement matches
  const requirementMatches = (reqsData?.requirements || reqsData?.data?.requirements || reqsData?.data || [])
    .filter(req => !ignoredIds.includes(req._id || req.id));

  const handleSaveRequirement = (id) => {
    let updated;
    if (savedIds.includes(id)) {
      updated = savedIds.filter(savedId => savedId !== id);
      toast.success('Removed from saved list');
    } else {
      updated = [...savedIds, id];
      toast.success('Requirement saved successfully!');
    }
    setSavedIds(updated);
    try {
      localStorage.setItem('vendor_saved_requirements', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save vendor requirements in localStorage:', e);
    }
  };

  const handleMarkNotInterested = (id) => {
    const updated = [...ignoredIds, id];
    setIgnoredIds(updated);
    try {
      localStorage.setItem('vendor_ignored_requirements', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save ignored requirements in localStorage:', e);
    }
    toast.success('Requirement marked as Not Interested');
  };

  const handleOpenProposalModal = (req) => {
    setProposalReq(req);
    setQuotePrice('');
    setQuoteDelivery('');
    setQuoteNotes('');
    setQuoteAttachment('');
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!quotePrice || !quoteDelivery) {
      toast.error('Please enter quotation price and delivery timeline');
      return;
    }

    if (currentCredits < 5) {
      toast.error('Insufficient credits! Please recharge your wallet.');
      return;
    }

    try {
      const payload = {
        requirementId: proposalReq._id || proposalReq.id,
        price: Number(quotePrice),
        estimatedDelivery: new Date(quoteDelivery).toISOString(),
        notes: quoteNotes
      };
      if (quoteAttachment) {
        payload.attachments = [{ name: 'Document Proposal', url: quoteAttachment }];
      }

      await submitQuote(payload).unwrap();
      toast.success('Proposal submitted successfully! Buyer notified.');
      setProposalReq(null);
      refetchReqs();
      if (typeof refetchWallet === 'function') refetchWallet();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit proposal');
    }
  };

  const renderCountdown = (expiryDate) => {
    if (!expiryDate) return 'Flexible';
    const difference = +new Date(expiryDate) - +new Date();
    if (difference <= 0) return 'Expired';

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    
    if (days > 0) return `${days} Days remaining`;
    return `${hours} Hours remaining`;
  };

  const handleWhatsAppReply = (phone, itemTitle) => {
    if (!phone) {
      toast.error('Customer phone details not available');
      return;
    }
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    const text = encodeURIComponent(`Hi! Regarding your inquiry about "${itemTitle}"...`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleCallReply = (phone) => {
    if (!phone) {
      toast.error('Customer phone details not available');
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const renderEnquiryCard = (e, type = 'product') => {
    const customerObj = e.customer || {};
    const customerName = customerObj.name || (typeof customerObj === 'string' ? customerObj : 'Client Buyer');
    const customerPhone = customerObj.phone || '';
    const itemTitle = e.listing?.title || 'Listing Item';

    return (
      <div key={e._id || e.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-xs text-text-primary">{customerName} {customerPhone && `(${customerPhone})`}</h4>
          <p className={`text-xs font-semibold mt-0.5 ${type === 'product' ? 'text-brand-orange' : 'text-brand-purple'}`}>
            {type === 'product' ? 'Item' : 'Service'}: {itemTitle}
          </p>
          <p className="text-xs text-text-secondary mt-1 italic">"{e.message || e.msg}"</p>
        </div>
        <button
          onClick={() => type === 'product' ? handleWhatsAppReply(customerPhone, itemTitle) : handleCallReply(customerPhone)}
          className="px-3.5 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5 whitespace-nowrap self-start sm:self-center"
        >
          {type === 'product' ? <FiMessageCircle size={14} /> : <FiPhone size={14} />}
          {type === 'product' ? 'Reply on WhatsApp' : 'Call Customer'}
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <AdminPageHeader
        icon={FiInbox}
        title="Leads & Customer Requirements"
        subtitle="Respond to customer requirements, matching briefs, and direct quote inquiries in real-time"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="glass rounded-2xl p-5 border border-white/50 shadow-card space-y-4">
        {(isLeadsFetching || isReqsFetching) && (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
          </div>
        )}

        {activeTab === 'product-enquiries' && !isLeadsFetching && (
          productEnquiries.length === 0 ? (
            <p className="text-xs text-text-tertiary text-center py-6">No product enquiries found.</p>
          ) : (
            productEnquiries.map((e) => renderEnquiryCard(e, 'product'))
          )
        )}

        {activeTab === 'service-enquiries' && !isLeadsFetching && (
          serviceEnquiries.length === 0 ? (
            <p className="text-xs text-text-tertiary text-center py-6">No service enquiries found.</p>
          ) : (
            serviceEnquiries.map((e) => renderEnquiryCard(e, 'service'))
          )
        )}

        {activeTab === 'quote-requests' && !isLeadsFetching && (
          quoteRequests.length === 0 ? (
            <p className="text-xs text-text-tertiary text-center py-6">No quote requests found.</p>
          ) : (
            quoteRequests.map((q) => {
              const customerObj = q.customer || {};
              const customerName = customerObj.name || (typeof customerObj === 'string' ? customerObj : 'Client Buyer');
              const customerPhone = customerObj.phone || '';
              const itemTitle = q.listing?.title || 'Listing Item';
              const price = q.listing?.sellingPrice || q.listing?.price || null;

              return (
                <div key={q._id || q.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-text-primary">{customerName} {customerPhone && `(${customerPhone})`}</h4>
                    <p className="text-xs text-text-secondary mt-0.5 font-semibold">
                      {itemTitle} • Budget/Price: {price ? `₹${price.toLocaleString()}` : 'Quote Request'}
                    </p>
                    <p className="text-xs text-text-secondary mt-1 italic">"{q.message}"</p>
                  </div>
                  <button
                    onClick={() => handleWhatsAppReply(customerPhone, itemTitle)}
                    className="px-3.5 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5 whitespace-nowrap self-start sm:self-center"
                  >
                    <FiMessageCircle size={14} />
                    <span>Submit Quote Proposal</span>
                  </button>
                </div>
              );
            })
          )
        )}

        {activeTab === 'requirement-matches' && !isReqsFetching && (
          <div className="space-y-4">
            {/* Proximity & Sort Filter Panel */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface-secondary/40 p-3 rounded-xl border border-border text-xs">
              <div className="flex items-center gap-2 font-semibold text-text-secondary w-full sm:w-auto">
                <span>Distance Filter:</span>
                <select
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                >
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                  <option value="100">Within 100 km</option>
                  <option value="any">Any distance</option>
                </select>
              </div>

              <div className="flex items-center gap-2 font-semibold text-text-secondary w-full sm:w-auto sm:ml-auto">
                <span>Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                >
                  <option value="distance">Proximity (Nearest first)</option>
                  <option value="latest">Latest Posted</option>
                  <option value="budget_high_low">Budget: High → Low</option>
                  <option value="budget_low_high">Budget: Low → High</option>
                </select>
              </div>
            </div>

            {requirementMatches.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-tertiary space-y-2">
                <FiInbox size={32} className="mx-auto text-brand-purple opacity-50" />
                <p className="font-bold text-text-primary text-sm">No matched requirements found</p>
                <p className="max-w-xs mx-auto">Requirements matching your business category and service areas will automatically appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
              {requirementMatches.map((m) => {
                const reqId = m._id || m.id;
                const location = m.location || {};
                const isRemote = location.area === 'Remote' || (location.city === 'Online' && location.state === 'Remote');
                const locationText = isRemote 
                  ? 'Remote (Online)' 
                  : (typeof location === 'string' ? location : `${location.city || 'Local'}${location.state ? `, ${location.state}` : ''}`);
                const isSaved = savedIds.includes(reqId);
                const hasResponded = m.vendorsResponded && m.vendorsResponded.some(
                  vId => (vId._id || vId).toString() === (user?._id || user?.id)?.toString()
                );

                return (
                  <div key={reqId} className="glass rounded-xl p-5 border border-white/30 hover:border-brand-purple/40 shadow-sm transition-all flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/50 pb-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${m.type === 'service' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-orange/10 text-brand-orange'}`}>
                            {m.type || m.requirementType || 'product'}
                          </span>
                          <span className="text-[9px] font-black text-text-tertiary uppercase bg-surface-secondary px-2 py-0.5 rounded">
                            {m.category || 'General'}
                          </span>
                          {m.subcategory && (
                            <span className="text-[9px] font-bold text-text-secondary bg-surface-secondary px-2 py-0.5 rounded">
                              {m.subcategory}
                            </span>
                          )}
                          {isSaved && (
                            <span className="text-[9px] font-bold text-white bg-brand-purple px-2 py-0.5 rounded">
                              Saved
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-text-primary mt-2 font-display">{m.title}</h4>
                        <p className="text-xs text-text-tertiary mt-1.5 line-clamp-2 leading-relaxed">{m.description}</p>
                      </div>

                      <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                        <span className="text-xs font-black text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          Budget: {m.budget_min || m.budget_max ? (
                            `₹${(m.budget_min || 0).toLocaleString('en-IN')} - ₹${(m.budget_max || 0).toLocaleString('en-IN')}`
                          ) : (
                            `₹${(m.budget || 0).toLocaleString('en-IN')}`
                          )}
                        </span>
                        <span className="text-[10px] text-text-tertiary block mt-1">
                          {m.type === 'service' || m.requirementType === 'service' ? 'Service Scope' : 'Requested Qty'}: <strong>{m.quantity || 1} {m.type === 'service' || m.requirementType === 'service' ? 'deliverables/days' : 'units'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between text-[10px] text-text-tertiary gap-3 sm:gap-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1">
                          <FiMapPin className="text-brand-orange" /> {locationText}
                          {m.distance !== undefined && (
                            <span className="font-bold text-brand-purple">({(m.distance / 1000).toFixed(1)} km away)</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock /> {renderCountdown(m.expires_at || m.deadline)}
                        </span>
                        <span>Proposals: <strong>{m.quotesCount || m.proposals_count || 0}</strong></span>
                        <span>Date: <strong>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Recent'}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <button
                          onClick={() => setDetailReq(m)}
                          className="px-2.5 sm:px-3 py-1.5 bg-surface border border-border text-text-secondary text-[11px] sm:text-xs font-semibold rounded-lg hover:text-brand-purple transition flex items-center gap-1"
                        >
                          <FiEye size={12} />
                          <span>View Detail</span>
                        </button>
                        {hasResponded ? (
                          <span className="px-2.5 sm:px-3.5 py-1.5 bg-emerald-500/10 text-emerald-600 text-[11px] sm:text-xs font-bold rounded-lg border border-emerald-500/20 flex items-center gap-1">
                            <FiCheck size={12} />
                            <span>Proposal Sent</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenProposalModal(m)}
                            className="px-2.5 sm:px-3.5 py-1.5 gradient-brand text-white text-[11px] sm:text-xs font-bold rounded-lg shadow hover:opacity-95 transition flex items-center gap-1"
                          >
                            <FiFileText size={12} />
                            <span>Submit Proposal</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleSaveRequirement(reqId)}
                          className={`p-1.5 border rounded-lg transition ${isSaved ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' : 'bg-surface border-border text-text-tertiary hover:text-brand-purple'}`}
                          title="Save Requirement"
                        >
                          <FiArchive size={13} />
                        </button>
                        <button
                          onClick={() => handleMarkNotInterested(reqId)}
                          className="p-1.5 border border-border bg-surface text-text-tertiary hover:text-error hover:border-error/20 rounded-lg transition"
                          title="Mark Not Interested"
                        >
                          <FiTrash size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        )}
      </div>

      {/* Submit Proposal Modal */}
      <AdminModal
        isOpen={!!proposalReq}
        onClose={() => setProposalReq(null)}
        title={`Submit Proposal: ${displayProposalReq?.title || ''}`}
      >
        {proposalReq && displayProposalReq && (
          <form onSubmit={handleSubmitProposal} className="space-y-4 text-xs">
            <div className="bg-surface-secondary p-3.5 rounded-xl border border-border space-y-1.5">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Max Customer Budget:</span>
                <strong className="text-emerald-600 font-bold">₹{(displayProposalReq.budget || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Required Quantity:</span>
                <strong className="text-text-primary">{displayProposalReq.quantity || 1} units</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Customer City:</span>
                <strong className="text-text-primary">{displayProposalReq.location?.city || 'Local'}</strong>
              </div>
              <div className="border-t border-border/50 pt-2 mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Your Credit Balance:</span>
                  <strong className={`font-bold ${currentCredits < 5 ? 'text-error' : 'text-emerald-600'}`}>
                    {currentCredits} Credits
                  </strong>
                </div>
                <div className="flex justify-between text-text-secondary text-[11px]">
                  <span>Submission Cost:</span>
                  <strong className="text-error">-5 Credits</strong>
                </div>
              </div>
            </div>

            {currentCredits < 5 && (
              <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-error flex items-start gap-2 text-xs font-semibold">
                <span className="mt-0.5">⚠️</span>
                <div>
                  <strong className="block text-error font-bold">Insufficient Credits</strong>
                  You do not have enough credits to submit a proposal. Please recharge your wallet balance.
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Your Price Quotation (₹) *</label>
              <div className="relative">
                <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
                <input
                  type="number"
                  required
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Estimated Delivery Date *</label>
              <input
                type="date"
                required
                value={quoteDelivery}
                onChange={(e) => setQuoteDelivery(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Proposal Message / Notes</label>
              <textarea
                rows={3}
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="Explain why you are the best fit, warranty information, custom options, etc..."
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Proposal Document URL (Optional)</label>
              <input
                type="url"
                value={quoteAttachment}
                onChange={(e) => setQuoteAttachment(e.target.value)}
                placeholder="Link to brochures, pricing tables, or portfolio images..."
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setProposalReq(null)}
                className="px-4 py-2 glass border border-border rounded-xl text-text-secondary font-bold hover:bg-surface-tertiary transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingQuote || currentCredits < 5}
                className={`px-5 py-2 gradient-brand text-white font-bold rounded-xl shadow-premium transition ${
                  currentCredits < 5 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                }`}
              >
                {isSubmittingQuote ? 'Submitting proposal...' : 'Submit Proposal Now'}
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      {/* Requirement Details Modal */}
      <AdminModal
        isOpen={!!detailReq}
        onClose={() => setDetailReq(null)}
        title="Requirement Lead Detail"
      >
        {detailReq && displayReq && (
          <div className="space-y-4 text-xs">
            <div className="bg-surface-secondary p-4 rounded-xl space-y-2 border border-border">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-text-primary">{displayReq.title}</h4>
                <AdminStatusBadge status={displayReq.status || 'Pending'} />
              </div>
              <p className="text-text-secondary leading-relaxed mt-2 whitespace-pre-wrap">{displayReq.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 bg-surface border border-border rounded-xl">
                <span className="text-text-tertiary block mb-0.5">Budget Allocation</span>
                <strong className="text-brand-purple text-sm">
                  {displayReq.budget_min || displayReq.budget_max ? (
                    `₹${(displayReq.budget_min || 0).toLocaleString('en-IN')} - ₹${(displayReq.budget_max || 0).toLocaleString('en-IN')}`
                  ) : (
                    `₹${(displayReq.budget || 0).toLocaleString('en-IN')}`
                  )}
                </strong>
              </div>
              <div className="p-3 bg-surface border border-border rounded-xl">
                <span className="text-text-tertiary block mb-0.5">
                  {displayReq.type === 'service' || displayReq.requirementType === 'service' ? 'Service Scope' : 'Quantity Requested'}
                </span>
                <strong className="text-text-primary text-sm">
                  {displayReq.quantity || 1} {displayReq.type === 'service' || displayReq.requirementType === 'service' ? 'deliverables/days' : 'units'}
                </strong>
              </div>
              <div className="p-3 bg-surface border border-border rounded-xl">
                <span className="text-text-tertiary block mb-0.5">
                  {displayReq.type === 'service' || displayReq.requirementType === 'service' ? 'Service Location' : 'Delivery Target Location'}
                </span>
                <strong className="text-text-primary text-sm">
                  {displayReq.location?.area === 'Remote' ? 'Remote (Online)' : `${displayReq.location?.city || 'Local'}, ${displayReq.location?.state || 'Punjab'}`}
                </strong>
              </div>
              <div className="p-3 bg-surface border border-border rounded-xl">
                <span className="text-text-tertiary block mb-0.5">Category & Type</span>
                <strong className="text-text-primary text-sm capitalize">{displayReq.type || 'product'} — {displayReq.category}</strong>
              </div>
            </div>

            {/* Extended Details */}
            {(displayReq.detailedSpecifications || displayReq.address || displayReq.expectedDeliveryDate || displayReq.productCondition || displayReq.serviceModel) && (
              <div className="p-4 bg-surface border border-border rounded-xl space-y-2.5">
                <h5 className="font-bold text-brand-navy">Detailed Requirements</h5>
                {displayReq.detailedSpecifications && (
                  <div>
                    <span className="text-text-tertiary block mb-0.5">Specifications:</span>
                    <p className="text-text-secondary leading-relaxed bg-surface-secondary p-2.5 rounded-lg whitespace-pre-wrap font-mono">{displayReq.detailedSpecifications}</p>
                  </div>
                )}
                {displayReq.address && (
                  <div>
                    <span className="text-text-tertiary">Venue Address:</span>{' '}
                    <strong className="text-text-primary">{displayReq.address}</strong>
                  </div>
                )}
                {displayReq.expectedDeliveryDate && (
                  <div className="flex gap-4 text-text-primary">
                    <div>
                      <span className="text-text-tertiary">Fulfillment Date:</span>{' '}
                      <strong>{new Date(displayReq.expectedDeliveryDate).toLocaleDateString('en-IN')}</strong>
                    </div>
                    {displayReq.expectedDeliveryTime && (
                      <div>
                        <span className="text-text-tertiary">Preferred Time:</span>{' '}
                        <strong>{displayReq.expectedDeliveryTime}</strong>
                      </div>
                    )}
                  </div>
                )}
                {displayReq.productCondition && (
                  <div>
                    <span className="text-text-tertiary">Condition Preference:</span>{' '}
                    <strong className="capitalize">{displayReq.productCondition === 'other' ? displayReq.customProductCondition || 'Other' : displayReq.productCondition}</strong>
                  </div>
                )}
                {displayReq.serviceModel && (
                  <div>
                    <span className="text-text-tertiary">Service Model:</span>{' '}
                    <strong className="capitalize">{displayReq.serviceModel === 'other' ? displayReq.customServiceModel || 'Other' : displayReq.serviceModel}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Media Attachments for Vendor */}
            {((displayReq.photos && displayReq.photos.length > 0) || displayReq.video) && (
              <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
                <h5 className="font-bold text-brand-navy">Requirement Media & Attachments</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {displayReq.photos && displayReq.photos.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Photos</span>
                      <div className="grid grid-cols-3 gap-2">
                        {displayReq.photos.map((url, idx) => (
                          <a
                            key={idx}
                            href={resolveMediaUrl(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square rounded-lg overflow-hidden border border-border hover:border-brand-purple transition bg-surface flex items-center justify-center"
                          >
                            <img src={resolveMediaUrl(url)} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {displayReq.video && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Reference Video</span>
                      <div className="rounded-lg overflow-hidden border border-border bg-surface-tertiary">
                        <video
                          src={resolveMediaUrl(displayReq.video)}
                          controls
                          className="max-h-[120px] w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-brand-purple/5 p-3 sm:p-4 rounded-xl border border-brand-purple/10 space-y-1.5 sm:space-y-1">
              <h5 className="font-bold text-brand-navy">Customer Context Details</h5>
              <div className="flex flex-col sm:flex-row justify-between gap-0.5 sm:gap-0">
                <span className="text-text-secondary">Posted By:</span>
                <strong className="text-text-primary">{displayReq.customer?.name || 'Client Buyer'}</strong>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-0.5 sm:gap-0">
                <span className="text-text-secondary">Phone Details:</span>
                <strong className="text-text-primary">{displayReq.customer?.phone || 'Hidden until bid accepted'}</strong>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-0.5 sm:gap-0">
                <span className="text-text-secondary">Email Reference:</span>
                <strong className="text-text-primary">{displayReq.customer?.email || 'N/A'}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                onClick={() => setDetailReq(null)}
                className="px-4 py-2 glass border border-border rounded-xl text-text-secondary font-bold"
              >
                Close View
              </button>
              {displayReq.vendorsResponded && displayReq.vendorsResponded.some(
                vId => (vId._id || vId).toString() === (user?._id || user?.id)?.toString()
              ) ? (
                <span className="px-5 py-2 bg-emerald-500/10 text-emerald-600 font-bold rounded-xl border border-emerald-500/20 flex items-center gap-1">
                  <FiCheck size={14} /> Proposal Sent
                </span>
              ) : (
                <button
                  onClick={() => {
                    const m = displayReq;
                    setDetailReq(null);
                    handleOpenProposalModal(m);
                  }}
                  className="px-5 py-2 gradient-brand text-white font-bold rounded-xl shadow-premium"
                >
                  Respond with Proposal
                </button>
              )}
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
