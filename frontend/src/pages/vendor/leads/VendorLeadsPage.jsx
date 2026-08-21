import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSocket } from '../../../lib/socket';
import {
  FiInbox, FiShoppingBag, FiTool, FiFileText, FiSliders
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import { useAuth } from '../../../context/AuthContext';
import {
  useGetVendorLeadsQuery,
  useGetVendorWalletQuery,
  useReplyToLeadMutation,
  useCloseLeadMutation,
  useDeleteLeadMutation
} from '../../../features/vendor/vendorApi';
import {
  useGetRequirementsQuery,
  useSubmitQuoteMutation,
  useGetRequirementDetailsQuery
} from '../../../features/customer/requirementsApi';

// Subcomponents
import InquiryList from './components/InquiryList';
import RequirementMatchesTab from './components/RequirementMatchesTab';
import QuickReplyModal from './components/QuickReplyModal';
import SubmitProposalModal from './components/SubmitProposalModal';
import RequirementDetailModal from './components/RequirementDetailModal';
import { useLanguage } from '../../../context/LanguageContext';

export default function VendorLeadsPage() {
  const { bi, t } = useLanguage();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all-enquiries';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL search parameter
  useEffect(() => {
    const currentTabParam = searchParams.get('tab');
    if (currentTabParam && currentTabParam !== activeTab) {
      setActiveTab(currentTabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };
  
  // ── Leads & Direct Customer Inquiries Query ───────────────────────
  const { data: leadsData, isFetching: isLeadsFetching, refetch: refetchLeads } = useGetVendorLeadsQuery(
    { limit: 100 },
    { pollingInterval: 300000 }
  );

  // Lead Mutations
  const [replyToLead, { isLoading: isReplying }] = useReplyToLeadMutation();
  const [closeLead] = useCloseLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();

  // Quick Reply Modal state
  const [replyModalInquiry, setReplyModalInquiry] = useState(null);

  // ── Broadcast Customer Requirements (RFQs) ───────────────────────
  const [distanceKm, setDistanceKm] = useState('50');
  const [sortBy, setSortBy] = useState('distance');

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

  // Proposal modal states
  const [proposalReq, setProposalReq] = useState(null);
  const [submitQuote, { isLoading: isSubmittingQuote }] = useSubmitQuoteMutation();

  // Vendor Wallet credits check
  const { data: walletData, refetch: refetchWallet } = useGetVendorWalletQuery(undefined, { skip: !proposalReq });
  const vendorWallet = walletData?.data || walletData || {};
  const currentCredits = vendorWallet.credits !== undefined ? vendorWallet.credits : (vendorWallet.walletBalance || 0);

  // Local state for ignored/saved requirements
  const [ignoredIds, setIgnoredIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vendor_ignored_requirements') || '[]');
    } catch {
      return [];
    }
  });
  const [savedIds, setSavedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vendor_saved_requirements') || '[]');
    } catch {
      return [];
    }
  });

  // Requirement details modal states
  const [detailReq, setDetailReq] = useState(null);
  const [activeDetailId, setActiveDetailId] = useState(null);
  const { data: detailFetched } = useGetRequirementDetailsQuery(activeDetailId, {
    skip: !activeDetailId,
  });

  useEffect(() => {
    const id = detailReq?._id || detailReq?.id || proposalReq?._id || proposalReq?.id;
    setActiveDetailId(id || null);
  }, [detailReq, proposalReq]);

  const displayReq = detailFetched?.data?.requirement || detailFetched?.requirement || detailReq;
  const displayProposalReq = (proposalReq && (detailFetched?.data?.requirement || detailFetched?.requirement)) || proposalReq;

  // ── Socket.IO Real-time Synchronization ───────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleInquiryChange = () => {
      if (typeof refetchLeads === 'function') refetchLeads();
    };

    const handleReqAssigned = () => {
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

    socket.on('inquiry:created', handleInquiryChange);
    socket.on('inquiry:updated', handleInquiryChange);
    socket.on('inquiry:deleted', handleInquiryChange);
    socket.on('notification', handleInquiryChange);
    socket.on('notification:new', handleInquiryChange);

    socket.on('requirement:assigned', handleReqAssigned);
    socket.on('requirement:updated', handleReqUpdated);
    socket.on('requirement:deleted', handleReqDeleted);
    socket.on('requirement:closed', handleReqClosed);

    return () => {
      socket.off('inquiry:created', handleInquiryChange);
      socket.off('inquiry:updated', handleInquiryChange);
      socket.off('inquiry:deleted', handleInquiryChange);
      socket.off('notification', handleInquiryChange);
      socket.off('notification:new', handleInquiryChange);

      socket.off('requirement:assigned', handleReqAssigned);
      socket.off('requirement:updated', handleReqUpdated);
      socket.off('requirement:deleted', handleReqDeleted);
      socket.off('requirement:closed', handleReqClosed);
    };
  }, [detailReq, refetchReqs, refetchLeads]);

  // ── Segregate Inquiries into Categories ───────────────────────────
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
  
  const requirementMatches = (reqsData?.requirements || reqsData?.data?.requirements || reqsData?.data || [])
    .filter(req => !ignoredIds.includes(req._id || req.id));

  // ── Tab Config with Live Badges ───────────────────────────────────
  const TABS = [
    { key: 'all-enquiries', label: bi('All Enquiries', 'सभी पूछताछ (All Enquiries)'), count: allInquiries.length, icon: FiInbox },
    { key: 'product-enquiries', label: bi('Product Enquiries', 'उत्पाद पूछताछ (Product Enquiries)'), count: productEnquiries.length, icon: FiShoppingBag },
    { key: 'service-enquiries', label: bi('Service Enquiries', 'सेवा पूछताछ (Service Enquiries)'), count: serviceEnquiries.length, icon: FiTool },
    { key: 'quote-requests', label: bi('Quote Requests', 'कोटेशन अनुरोध (Quote Requests)'), count: quoteRequests.length, icon: FiFileText },
    { key: 'requirement-matches', label: bi('Customer Requirements', 'ग्राहक आवश्यकताएं (Customer Requirements)'), count: requirementMatches.length, icon: FiSliders },
  ];

  // ── Inquiries Handlers ────────────────────────────────────────────
  const handleOpenReplyModal = (inquiry) => {
    setReplyModalInquiry(inquiry);
  };

  const handleSendQuickReply = async (inquiry, message) => {
    try {
      await replyToLead({
        id: inquiry._id || inquiry.id,
        message
      }).unwrap();
      toast.success('Reply sent to customer successfully!');
      setReplyModalInquiry(null);
      refetchLeads();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send reply');
    }
  };

  const handleCloseInquiry = async (inquiryId) => {
    if (!window.confirm('Mark this customer inquiry as resolved / closed?')) return;
    try {
      await closeLead(inquiryId).unwrap();
      toast.success('Inquiry marked as closed');
      refetchLeads();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to close inquiry');
    }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm('Are you sure you want to remove this inquiry from your list?')) return;
    try {
      await deleteLead(inquiryId).unwrap();
      toast.success('Inquiry removed');
      refetchLeads();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete inquiry');
    }
  };

  // ── Requirements Handlers ─────────────────────────────────────────
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
  };

  const handleSubmitProposal = async ({ quotePrice, quoteDelivery, quoteNotes, quoteAttachment }) => {
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

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <AdminPageHeader
        icon={FiInbox}
        title="Leads & Customer Inquiries"
        subtitle="Manage direct product/service customer inquiries, quote requests, and broadcast buyer requirements"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="glass rounded-2xl p-4 sm:p-6 border border-white/50 shadow-card space-y-4">
        {(isLeadsFetching || isReqsFetching) && (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
          </div>
        )}

        {/* TAB 1: ALL ENQUIRIES */}
        {activeTab === 'all-enquiries' && !isLeadsFetching && (
          <InquiryList
            inquiries={allInquiries}
            emptyText="No customer enquiries received yet."
            onReply={handleOpenReplyModal}
            onClose={handleCloseInquiry}
            onDelete={handleDeleteInquiry}
          />
        )}

        {/* TAB 2: PRODUCT ENQUIRIES */}
        {activeTab === 'product-enquiries' && !isLeadsFetching && (
          <InquiryList
            inquiries={productEnquiries}
            emptyText="No product enquiries found."
            onReply={handleOpenReplyModal}
            onClose={handleCloseInquiry}
            onDelete={handleDeleteInquiry}
          />
        )}

        {/* TAB 3: SERVICE ENQUIRIES */}
        {activeTab === 'service-enquiries' && !isLeadsFetching && (
          <InquiryList
            inquiries={serviceEnquiries}
            emptyText="No service enquiries found."
            onReply={handleOpenReplyModal}
            onClose={handleCloseInquiry}
            onDelete={handleDeleteInquiry}
          />
        )}

        {/* TAB 4: QUOTE REQUESTS */}
        {activeTab === 'quote-requests' && !isLeadsFetching && (
          <InquiryList
            inquiries={quoteRequests}
            emptyText="No callback or quote requests found."
            onReply={handleOpenReplyModal}
            onClose={handleCloseInquiry}
            onDelete={handleDeleteInquiry}
          />
        )}

        {/* TAB 5: BROADCAST CUSTOMER REQUIREMENTS */}
        {activeTab === 'requirement-matches' && !isReqsFetching && (
          <RequirementMatchesTab
            requirements={requirementMatches}
            distanceKm={distanceKm}
            setDistanceKm={setDistanceKm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            currentUserId={user?._id || user?.id}
            savedIds={savedIds}
            onViewDetail={(req) => setDetailReq(req)}
            onOpenProposal={handleOpenProposalModal}
            onToggleSave={handleSaveRequirement}
            onMarkNotInterested={handleMarkNotInterested}
          />
        )}
      </div>

      {/* Quick Reply Modal */}
      <QuickReplyModal
        isOpen={!!replyModalInquiry}
        onClose={() => setReplyModalInquiry(null)}
        inquiry={replyModalInquiry}
        onSendReply={handleSendQuickReply}
        isReplying={isReplying}
      />

      {/* Submit Proposal Modal */}
      <SubmitProposalModal
        isOpen={!!proposalReq}
        onClose={() => setProposalReq(null)}
        proposalReq={proposalReq}
        displayProposalReq={displayProposalReq}
        currentCredits={currentCredits}
        onSubmit={handleSubmitProposal}
        isSubmitting={isSubmittingQuote}
      />

      {/* Requirement Details Modal */}
      <RequirementDetailModal
        isOpen={!!detailReq}
        onClose={() => setDetailReq(null)}
        detailReq={detailReq}
        displayReq={displayReq}
        currentUserId={user?._id || user?.id}
        onOpenProposal={handleOpenProposalModal}
      />
    </div>
  );
}
