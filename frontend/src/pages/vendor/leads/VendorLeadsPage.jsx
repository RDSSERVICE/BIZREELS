import React, { useState, useEffect } from 'react';
import { getSocket } from '../../../lib/socket';
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
import { useGetVendorLeadsQuery } from '../../../features/vendor/vendorApi';
import {
  useGetRequirementsQuery,
  useSubmitQuoteMutation
} from '../../../features/customer/requirementsApi';

const TABS = [
  { key: 'product-enquiries', label: 'Product Enquiries', icon: FiShoppingBag },
  { key: 'service-enquiries', label: 'Service Enquiries', icon: FiTool },
  { key: 'quote-requests', label: 'Quote Requests', icon: FiFileText },
  { key: 'requirement-matches', label: 'Customer Requirements', icon: FiInbox },
];

export default function VendorLeadsPage() {
  const [activeTab, setActiveTab] = useState('requirement-matches');
  
  // Leads & Enquiries Queries
  const { data: leadsData, isFetching: isLeadsFetching } = useGetVendorLeadsQuery(undefined, { pollingInterval: 5000 });
  
  // Assigned Requirements Queries (role-aware: vendor gets assigned matches)
  const { data: reqsData, isFetching: isReqsFetching, refetch: refetchReqs } = useGetRequirementsQuery(
    { limit: 100 },
    { pollingInterval: 4000 }
  );

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

  const productEnquiries = Array.isArray(leadsData?.productEnquiries) ? leadsData.productEnquiries : Array.isArray(leadsData?.data) ? leadsData.data : [];
  const serviceEnquiries = Array.isArray(leadsData?.serviceEnquiries) ? leadsData.serviceEnquiries : [];
  const quoteRequests = Array.isArray(leadsData?.quoteRequests) ? leadsData.quoteRequests : [];
  
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
    localStorage.setItem('vendor_saved_requirements', JSON.stringify(updated));
  };

  const handleMarkNotInterested = (id) => {
    const updated = [...ignoredIds, id];
    setIgnoredIds(updated);
    localStorage.setItem('vendor_ignored_requirements', JSON.stringify(updated));
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

  const renderEnquiryCard = (e, type = 'product') => (
    <div key={e._id || e.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
      <div>
        <h4 className="font-bold text-xs text-text-primary">{e.customer || 'Customer'} ({e.phone || 'Phone hidden'})</h4>
        <p className={`text-xs font-semibold mt-0.5 ${type === 'product' ? 'text-brand-orange' : 'text-brand-purple'}`}>
          {type === 'product' ? 'Item' : 'Service'}: {e.item || e.message}
        </p>
        <p className="text-xs text-text-secondary mt-1">"{e.message || e.msg}"</p>
      </div>
      <button
        onClick={() => toast.success(`Opened contact option for ${e.customer || 'customer'}`)}
        className="px-3.5 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
      >
        {type === 'product' ? <FiMessageCircle size={14} /> : <FiPhone size={14} />}
        {type === 'product' ? 'Reply on WhatsApp' : 'Call Customer'}
      </button>
    </div>
  );

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
            quoteRequests.map((q) => (
              <div key={q._id || q.id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-xs text-text-primary">{q.customer}</h4>
                  <p className="text-xs text-text-secondary mt-0.5">{q.item} • Target Budget: {q.budget}</p>
                </div>
                <button
                  onClick={() => toast.success('Quote submitted to customer!')}
                  className="px-3.5 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition"
                >
                  Submit Proposal Quote
                </button>
              </div>
            ))
          )
        )}

        {activeTab === 'requirement-matches' && !isReqsFetching && (
          requirementMatches.length === 0 ? (
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
                const locationText = typeof location === 'string' ? location : `${location.city || 'Local'}${location.state ? `, ${location.state}` : ''}`;
                const isSaved = savedIds.includes(reqId);

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
                          Budget: ₹{(m.budget || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-text-tertiary block mt-1">Requested Qty: <strong>{m.quantity || 1}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[10px] text-text-tertiary gap-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1">
                          <FiMapPin className="text-brand-orange" /> {locationText}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock /> {renderCountdown(m.expires_at || m.deadline)}
                        </span>
                        <span>Proposals: <strong>{m.quotesCount || m.proposals_count || 0}</strong></span>
                        <span>Date: <strong>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Recent'}</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetailReq(m)}
                          className="px-3 py-1.5 bg-surface border border-border text-text-secondary text-xs font-semibold rounded-lg hover:text-brand-purple transition flex items-center gap-1"
                        >
                          <FiEye size={12} />
                          <span>View Detail</span>
                        </button>
                        <button
                          onClick={() => handleOpenProposalModal(m)}
                          className="px-3.5 py-1.5 gradient-brand text-white text-xs font-bold rounded-lg shadow hover:opacity-95 transition flex items-center gap-1"
                        >
                          <FiFileText size={12} />
                          <span>Submit Proposal</span>
                        </button>
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
          )
        )}
      </div>

      {/* Submit Proposal Modal */}
      <AdminModal
        isOpen={!!proposalReq}
        onClose={() => setProposalReq(null)}
        title={`Submit Proposal: ${proposalReq?.title || ''}`}
      >
        {proposalReq && (
          <form onSubmit={handleSubmitProposal} className="space-y-4 text-xs">
            <div className="bg-surface-secondary p-3.5 rounded-xl border border-border space-y-1.5">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Max Customer Budget:</span>
                <strong className="text-emerald-600 font-bold">₹{(proposalReq.budget || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Required Quantity:</span>
                <strong className="text-text-primary">{proposalReq.quantity || 1} units</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Customer City:</span>
                <strong className="text-text-primary">{proposalReq.location?.city || 'Local'}</strong>
              </div>
            </div>

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
                disabled={isSubmittingQuote}
                className="px-5 py-2 gradient-brand text-white font-bold rounded-xl shadow-premium hover:opacity-90 transition"
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
        {detailReq && (
          <div className="space-y-4 text-xs">
            <div className="bg-surface-secondary p-4 rounded-xl space-y-2 border border-border">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-text-primary">{detailReq.title}</h4>
                <AdminStatusBadge status={detailReq.status || 'Pending'} />
              </div>
              <p className="text-text-secondary leading-relaxed mt-2 whitespace-pre-wrap">{detailReq.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-surface border border-border rounded-xl">
                <span className="text-text-tertiary block mb-0.5">Budget Allocation</span>
                <strong className="text-brand-purple text-sm">₹{(detailReq.budget || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="p-3 bg-surface border border-border rounded-xl">
                <span className="text-text-tertiary block mb-0.5">Quantity Requested</span>
                <strong className="text-text-primary text-sm">{detailReq.quantity || 1} units</strong>
              </div>
              <div className="p-3 bg-surface border border-border rounded-xl">
                <span className="text-text-tertiary block mb-0.5">Delivery Target Location</span>
                <strong className="text-text-primary text-sm">{detailReq.location?.city || 'Local'}, {detailReq.location?.state || 'Punjab'}</strong>
              </div>
              <div className="p-3 bg-surface border border-border rounded-xl">
                <span className="text-text-tertiary block mb-0.5">Category & Type</span>
                <strong className="text-text-primary text-sm capitalize">{detailReq.type || 'product'} — {detailReq.category}</strong>
              </div>
            </div>

            <div className="bg-brand-purple/5 p-4 rounded-xl border border-brand-purple/10 space-y-1">
              <h5 className="font-bold text-brand-navy">Customer Context Details</h5>
              <div className="flex justify-between">
                <span className="text-text-secondary">Posted By:</span>
                <strong className="text-text-primary">{detailReq.customer?.name || 'Client Buyer'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Phone Details:</span>
                <strong className="text-text-primary">{detailReq.customer?.phone || 'Hidden until bid accepted'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Email Reference:</span>
                <strong className="text-text-primary">{detailReq.customer?.email || 'N/A'}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                onClick={() => setDetailReq(null)}
                className="px-4 py-2 glass border border-border rounded-xl text-text-secondary font-bold"
              >
                Close View
              </button>
              <button
                onClick={() => {
                  const m = detailReq;
                  setDetailReq(null);
                  handleOpenProposalModal(m);
                }}
                className="px-5 py-2 gradient-brand text-white font-bold rounded-xl shadow-premium"
              >
                Respond with Proposal
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
