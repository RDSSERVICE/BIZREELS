import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiVideo, FiClock, FiDollarSign, FiStar, FiEye, FiShield,
  FiActivity, FiCheckCircle, FiXCircle, FiPlay, FiMessageSquare,
  FiSend, FiChevronLeft, FiChevronRight, FiAlertCircle
} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import SubscriptionStatusCard from '../../../components/subscription/SubscriptionStatusCard';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import ActiveOffersPanel from '../../../components/offers/ActiveOffersPanel';
import { useGetCreatorDashboardQuery, useGetCreatorSubscriptionQuery } from '../../../features/creator/creatorApi';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';

// Reuse DirectChatContainer from vendor directory
import DirectChatContainer from '../../vendor/hire-creator/components/DirectChatContainer';

export default function CreatorDashboardPage() {
  const currentUser = useSelector(selectCurrentUser);
  const { data, isFetching, refetch: refetchMetrics } = useGetCreatorDashboardQuery(undefined, { pollingInterval: 300000 });
  const statsData = data?.data || data || {};
  const { data: subscriptionRes } = useGetCreatorSubscriptionQuery(undefined, { pollingInterval: 300000 });
  const activeFeatures = subscriptionRes?.features || [];

  const [activeTab, setActiveTab] = useState('invitations'); // invitations | campaigns | chat
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Deliverables submission state
  const [submittingCampaignId, setSubmittingCampaignId] = useState(null);
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [deliverableCaption, setDeliverableCaption] = useState('');

  // Chat Integration State
  const [chatRecipientId, setChatRecipientId] = useState(null);
  const [chatVendorName, setChatVendorName] = useState('');
  const [chatVendorAvatar, setChatVendorAvatar] = useState('');

  // Double-sided review state
  const [reviewingCampaign, setReviewingCampaign] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Socket.IO updates listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRefetch = () => {
      fetchCampaigns();
      if (typeof refetchMetrics === 'function') refetchMetrics();
      toast.success('🟢 Real-time dashboard synchronized!');
    };

    socket.on('hire_request:created', handleRefetch);
    socket.on('hire_request:updated', handleRefetch);
    socket.on('hire_request:status_changed', handleRefetch);
    socket.on('campaign:updated', handleRefetch);

    return () => {
      socket.off('hire_request:created', handleRefetch);
      socket.off('hire_request:updated', handleRefetch);
      socket.off('hire_request:status_changed', handleRefetch);
      socket.off('campaign:updated', handleRefetch);
    };
  }, [refetchMetrics]);

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await api.get('/v1/hires?role=creator');
      setCampaigns(res.data?.hireRequests || []);
    } catch (err) {
      console.error('Failed to load creator campaigns:', err);
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleAcceptInvite = async (id) => {
    const toastId = toast.loading('Accepting invitation...');
    try {
      const camp = campaigns.find(c => (c._id || c.id) === id);
      const reqId = camp?.hireRequest || id;
      
      await api.patch(`/v1/hires/${reqId}`, { status: 'accepted' });
      toast.success('🟢 Proposal accepted! Direct chat is now active.', { id: toastId });
      fetchCampaigns();
      if (typeof refetchMetrics === 'function') refetchMetrics();
    } catch (err) {
      toast.error('Failed to accept proposal.', { id: toastId });
    }
  };

  const handleRejectInvite = async (id) => {
    const confirm = window.confirm('Are you sure you want to reject this campaign invite?');
    if (!confirm) return;

    const toastId = toast.loading('Rejecting invitation...');
    try {
      const camp = campaigns.find(c => (c._id || c.id) === id);
      const reqId = camp?.hireRequest || id;

      await api.patch(`/v1/hires/${reqId}`, { status: 'rejected' });
      toast.success('Proposal invitation rejected.', { id: toastId });
      fetchCampaigns();
      if (typeof refetchMetrics === 'function') refetchMetrics();
    } catch (err) {
      toast.error('Failed to reject proposal.', { id: toastId });
    }
  };

  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    if (!deliverableUrl.trim()) {
      toast.error('Please enter a valid deliverable video URL.');
      return;
    }

    const toastId = toast.loading('Uploading submission...');
    try {
      await api.post(`/v1/hires/campaign/${submittingCampaignId}/deliverable`, {
        url: deliverableUrl.trim(),
        type: 'reel',
        caption: deliverableCaption.trim(),
      });
      toast.success('🟢 Deliverable submitted successfully to vendor!', { id: toastId });
      setSubmittingCampaignId(null);
      setDeliverableUrl('');
      setDeliverableCaption('');
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to upload submission.', { id: toastId });
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please write a brief comment.');
      return;
    }

    const toastId = toast.loading('Submitting review for vendor...');
    try {
      const camp = campaigns.find(c => (c._id || c.id) === reviewingCampaign._id || (c._id || c.id) === reviewingCampaign.id);
      const vendorId = camp?.vendor?._id || camp?.vendor?.id;

      await api.post('/v1/reviews', {
        targetUser: vendorId,
        rating,
        comment: comment.trim(),
      });
      
      // Update local state or trigger a flag so we know they reviewed
      toast.success('⭐ Review submitted! Thank you.', { id: toastId });
      
      // Trigger updates
      setReviewingCampaign(null);
      setRating(5);
      setComment('');
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to submit review.', { id: toastId });
    }
  };

  const handleOpenChat = (vendorId) => {
    const c = campaigns.find(c => String(c.vendor?._id || c.vendor?.id) === String(vendorId));
    if (c) {
      setChatRecipientId(vendorId);
      setChatVendorName(c.vendor?.name || 'Vendor Client');
      setChatVendorAvatar(c.vendor?.profile_pic || c.vendor?.avatarUrl || '');
      setActiveTab('chat');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-lg border border-amber-500/20">Pending Invite</span>;
      case 'accepted':
        return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-500/20">Active Collaboration</span>;
      case 'completed':
        return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-500/20">Completed</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-lg border border-red-500/20">Rejected</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 bg-slate-500/10 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-500/20">Cancelled</span>;
      default:
        return null;
    }
  };

  const stats = [
    { label: 'Total Projects', value: String(statsData.totalProjects ?? 0), icon: FiVideo, color: 'purple', trend: 12 },
    { label: 'Pending Requests', value: String(campaigns.filter(c => c.status === 'pending').length), icon: FiClock, color: 'amber', trend: 0 },
    { label: 'Total Earnings', value: `₹${(statsData.totalEarnings ?? 0).toLocaleString('en-IN')}`, icon: FiDollarSign, color: 'green', trend: 22 },
    { label: 'Rating Reviews', value: `${statsData.rating ?? '0.0'} ★ (${statsData.reviewCount ?? 0})`, icon: FiStar, color: 'pink', trend: 5 },
    { label: 'Portfolio Views', value: (statsData.portfolioViews ?? 0).toLocaleString(), icon: FiEye, color: 'cyan', trend: 18 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-16">
      <AdminPageHeader
        icon={FiVideo}
        title="Creator Studio & Collaborations Hub"
        subtitle="Manage brand invitation offers, upload reels submissions, and track earnings metrics"
      />

      {/* Subscription Status Card */}
      <SubscriptionStatusCard user={currentUser} />

      {/* Overview Stat Cards Grid */}
      {isFetching && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((s, idx) => (
            <AdminStatCard
              key={idx}
              label={s.label}
              value={s.value}
              icon={s.icon}
              color={s.color}
              trend={s.trend}
            />
          ))}
        </div>
      )}

      {/* Active Special Offers & Deals */}
      <ActiveOffersPanel role="creator" />

      {/* Identity status banner */}
      <div className="glass rounded-2xl p-4 border border-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/10 to-transparent">
        <div className="flex items-center gap-3">
          <FiShield className="text-emerald-500" size={24} />
          <div>
            <h4 className="text-xs font-bold text-text-primary">Creator KYC Verification Status</h4>
            <p className="text-[10px] text-text-tertiary">Verified profiles get 5x more direct campaign invitations from top local brands.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-600 font-bold text-[10px] rounded-xl uppercase">
          {statsData.verificationStatus === 'pro_verified' || statsData.verificationStatus === 'verified_creator' ? 'Verified Badge Active' : 'Get Verified'}
        </span>
      </div>

      {/* Subscription Features Status */}
      <div className="glass rounded-2xl p-5 border border-white/10 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
            <FiShield className="text-brand-purple" />
            <span>Premium Feature Access</span>
          </h3>
          <Link to="/creator/subscription" className="text-xs text-brand-purple font-bold hover:underline">
            Upgrade
          </Link>
        </div>

        <div className="space-y-2">
          {activeFeatures.length === 0 ? (
            <div className="text-center py-6 text-text-tertiary">
              <p className="text-xs">No active premium features. Upgrade to unlock all benefits!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {activeFeatures.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-brand-purple/5 border border-brand-purple/10 rounded-xl text-xs font-bold text-brand-navy">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-purple"></span>
                  {feat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CAMPAIGN INVITATIONS & COLLABORATIONS BOARD */}
      <div className="space-y-4 pt-4 border-t border-border">
        {/* Navigation tabs */}
        <div className="flex border-b border-border gap-6 text-sm font-bold text-text-tertiary">
          <button
            onClick={() => setActiveTab('invitations')}
            className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all ${activeTab === 'invitations' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
          >
            Invitations ({campaigns.filter(c => c.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all ${activeTab === 'campaigns' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
          >
            <FiActivity size={15} /> Active Shoot Campaigns ({campaigns.filter(c => c.status === 'accepted').length})
          </button>
          <button
            disabled={!chatRecipientId}
            onClick={() => setActiveTab('chat')}
            className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'chat' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
          >
            <FiMessageSquare size={15} /> Chat with Vendor
          </button>
        </div>

        {/* TAB WORKSPACES */}
        {activeTab === 'chat' ? (
          <DirectChatContainer
            recipientId={chatRecipientId}
            creatorName={chatVendorName}
            creatorAvatar={chatVendorAvatar}
          />
        ) : (
          <div className="space-y-4">
            {loadingCampaigns ? (
              [1, 2].map((i) => <div key={i} className="h-32 skeleton rounded-2xl border" />)
            ) : campaigns.filter(c => activeTab === 'invitations' ? c.status === 'pending' : c.status === 'accepted').length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border">
                <FiAlertCircle size={28} className="mx-auto text-text-tertiary" />
                <p className="font-bold text-text-secondary text-sm mt-2">No items here</p>
                <p className="mt-0.5">No active campaign items are currently listed in this category.</p>
              </div>
            ) : (
              campaigns
                .filter(c => activeTab === 'invitations' ? c.status === 'pending' : c.status === 'accepted')
                .map((c) => {
                  const vendor = c.vendor || {};
                  const vendorName = vendor.name || 'Vendor Brand';
                  const vendorAvatar = vendor.profile_pic || vendor.avatarUrl || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80';
                  
                  return (
                    <div
                      key={c._id || c.id}
                      className="glass rounded-2xl p-5 border border-white/40 shadow-card flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden"
                    >
                      {/* Left Block: Vendor details, Deliverables and description */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={vendorAvatar}
                            alt={vendorName}
                            className="w-10 h-10 rounded-xl object-cover border border-border"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-text-primary">{c.title}</h4>
                              {getStatusBadge(c.status)}
                            </div>
                            <p className="text-xs text-text-secondary">
                              Client: <span className="font-bold text-brand-purple">{vendorName}</span> • Category: {c.category}
                            </p>
                          </div>
                        </div>

                        {/* Script brief */}
                        <div className="bg-surface-secondary/40 p-3 rounded-xl border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-text-secondary">Vendor Shoot Script / Description:</span>
                          <p className="text-xs text-text-tertiary leading-relaxed">{c.description}</p>
                        </div>

                        {/* Deliverables tags */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Campaign Deliverables</span>
                          <div className="flex flex-wrap gap-1">
                            {c.deliverables?.map((item, idx) => (
                              <span key={idx} className="bg-white/40 border border-white/60 text-text-secondary px-2.5 py-0.5 rounded-full text-[10px]">
                                ✓ {item}
                              </span>
                            ))}
                            <span className="bg-brand-purple/10 border border-brand-purple/20 text-brand-purple px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              {c.numReels} Reels, {c.numPosts} Posts
                            </span>
                          </div>
                        </div>

                        {/* Submission URLs list */}
                        {c.submissionUrls?.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-border/40">
                            <span className="text-[10px] font-bold text-brand-purple uppercase block">Your Submissions ({c.submissionUrls.length})</span>
                            <div className="flex flex-wrap gap-2">
                              {c.submissionUrls.map((sub, idx) => (
                                <a
                                  key={idx}
                                  href={sub.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] bg-white border border-border px-3 py-1 rounded-xl text-text-secondary hover:underline"
                                >
                                  🎬 Submission #{idx + 1} ({sub.type})
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Block: Budget details and Actions */}
                      <div className="w-full md:w-56 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6 space-y-4">
                        <div className="text-right w-full">
                          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider block">Hiring Offer Price</span>
                          <p className="text-lg font-black text-emerald-600">₹{c.budget}</p>
                          {c.deadline && (
                            <span className="text-[10px] text-text-tertiary block mt-1">
                              Deadline: {new Date(c.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex flex-wrap gap-2 justify-end w-full">
                          {c.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleRejectInvite(c._id || c.id)}
                                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleAcceptInvite(c._id || c.id)}
                                className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition"
                              >
                                Accept Proposal
                              </button>
                            </>
                          )}

                          {c.status === 'accepted' && (
                            <>
                              <button
                                onClick={() => handleOpenChat(c.vendor?._id || c.vendor?.id)}
                                className="px-4 py-2 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple hover:bg-brand-purple/20 font-bold rounded-xl transition flex items-center gap-1.5"
                              >
                                <FiMessageSquare size={14} /> Chat
                              </button>
                              <button
                                onClick={() => setSubmittingCampaignId(c._id || c.id)}
                                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition"
                              >
                                Submit Video Reel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>

      {/* DELIVERABLES SUBMISSION OVERLAY DIALOG */}
      {submittingCampaignId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-black text-text-primary font-display">Submit Video Reel / Deliverable</h3>
              <button onClick={() => setSubmittingCampaignId(null)} className="text-text-tertiary hover:text-text-primary">
                <FiXCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitDeliverable} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-secondary">Reel/Video Public URL *</label>
                <input
                  type="text"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="Paste the URL link to your uploaded reel..."
                  className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary">Submission Notes / Caption</label>
                <textarea
                  rows={3}
                  value={deliverableCaption}
                  onChange={(e) => setDeliverableCaption(e.target.value)}
                  placeholder="Provide caption updates, instructions on review feedback, revisions etc..."
                  className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSubmittingCampaignId(null)}
                  className="px-4 py-2.5 glass border border-border font-bold text-text-secondary rounded-xl hover:bg-surface-tertiary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 gradient-brand text-white font-bold rounded-xl shadow-premium transition"
                >
                  Submit Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
