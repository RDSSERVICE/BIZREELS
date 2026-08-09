import React, { useState } from 'react';
import {
  FiClock, FiCheckCircle, FiXCircle, FiPlay, FiSend, FiMessageSquare,
  FiEdit, FiTrash2, FiFileText, FiAward, FiAlertCircle, FiStar
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VendorCampaignsTab({
  campaigns,
  onEditCampaign,
  onCancelCampaign,
  onCompleteCampaign,
  onOpenChat,
  onSubmitReview,
  currentUser,
  onApproveMilestone
}) {
  const [activeSubTab, setActiveSubTab] = useState('active'); // active | pending | finished
  const [reviewingCampaign, setReviewingCampaign] = useState(null); // campaign object to rate
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [playingVideo, setPlayingVideo] = useState(null);

  React.useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      const hasActive = campaigns.some(c => c.status === 'accepted');
      const hasPending = campaigns.some(c => c.status === 'pending');
      if (activeSubTab === 'active' && !hasActive && hasPending) {
        setActiveSubTab('pending');
      }
    }
  }, [campaigns]);

  const filtered = campaigns.filter((c) => {
    if (activeSubTab === 'pending') return c.status === 'pending';
    if (activeSubTab === 'active') return c.status === 'accepted';
    return c.status === 'completed' || c.status === 'cancelled' || c.status === 'rejected';
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 font-bold rounded-lg border border-amber-500/20 flex items-center gap-1"><FiClock size={11} /> Pending Invitation</span>;
      case 'accepted':
        return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 font-bold rounded-lg border border-blue-500/20 flex items-center gap-1"><FiAward size={11} /> Active Campaign</span>;
      case 'completed':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 font-bold rounded-lg border border-emerald-500/20 flex items-center gap-1"><FiCheckCircle size={11} /> Completed</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 bg-red-500/10 text-red-500 font-bold rounded-lg border border-red-500/20 flex items-center gap-1"><FiXCircle size={11} /> Rejected</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-slate-500/10 text-slate-500 font-bold rounded-lg border border-slate-500/20 flex items-center gap-1"><FiXCircle size={11} /> Cancelled</span>;
      default:
        return null;
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please write a brief comment review.');
      return;
    }
    onSubmitReview(reviewingCampaign._id || reviewingCampaign.id, rating, comment.trim());
    setReviewingCampaign(null);
    setRating(5);
    setComment('');
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs navigation */}
      <div className="flex border-b border-border gap-6 text-xs font-bold text-text-tertiary">
        <button
          onClick={() => setActiveSubTab('active')}
          className={`pb-3 border-b-2 transition-all ${activeSubTab === 'active' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
        >
          Active Campaigns ({campaigns.filter(c => c.status === 'accepted').length})
        </button>
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`pb-3 border-b-2 transition-all ${activeSubTab === 'pending' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
        >
          Sent Proposals ({campaigns.filter(c => c.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveSubTab('finished')}
          className={`pb-3 border-b-2 transition-all ${activeSubTab === 'finished' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
        >
          History ({campaigns.filter(c => ['completed', 'cancelled', 'rejected'].includes(c.status)).length})
        </button>
      </div>

      {/* Campaigns Listing */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border space-y-2">
          <FiAlertCircle size={32} className="mx-auto text-text-tertiary" />
          <p className="font-bold text-text-secondary text-sm">No campaigns found</p>
          <p>No collaborations currently match this status filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const creator = c.creator || {};
            const creatorName = creator.name || 'Creator';
            const creatorAvatar = creator.profile_pic || creator.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
            
            return (
              <div
                key={c._id || c.id}
                className="glass rounded-2xl p-5 border border-white/40 shadow-card flex flex-col md:flex-row justify-between gap-6 hover:shadow-card-hover transition-all duration-300 relative overflow-hidden"
              >
                {/* Left Side: Creator info and script brief */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={creatorAvatar}
                      alt={creatorName}
                      className="w-12 h-12 rounded-xl object-cover border border-border"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-text-primary">{c.title}</h4>
                        {getStatusBadge(c.status)}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Creator: <span className="font-bold text-brand-purple">{creatorName}</span> • Category: {c.category || 'General'}
                      </p>
                    </div>
                  </div>

                  {/* Description Script brief */}
                  <div className="bg-surface-secondary/40 p-3.5 rounded-xl border border-white/5 space-y-2">
                    <p className="text-xs font-bold text-text-secondary">Project Script Brief:</p>
                    <p className="text-xs text-text-tertiary leading-relaxed line-clamp-3">{c.description}</p>
                  </div>

                  {/* Deliverables List */}
                  <div className="space-y-1.5 w-full">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Deliverables Milestones</span>
                    <div className="flex flex-col gap-2">
                      {(c.deliverables || []).map((item, idx) => {
                        const title = typeof item === 'string' ? item : item.title;
                        const status = typeof item === 'string' ? 'pending' : (item.status || 'pending');
                        const mId = typeof item === 'string' ? String(idx) : (item._id || item.id);

                        return (
                          <div key={idx} className="flex items-center justify-between bg-surface/50 border border-border/40 p-2.5 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${status === 'approved' ? 'bg-emerald-500' : status === 'submitted' ? 'bg-brand-purple animate-pulse' : 'bg-text-tertiary'}`} />
                              <span className={`font-semibold ${status === 'approved' ? 'line-through text-text-tertiary' : 'text-text-secondary'}`}>{title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                status === 'submitted' ? 'bg-brand-purple/10 text-brand-purple' :
                                'bg-surface border border-border text-text-tertiary'
                              }`}>
                                {status}
                              </span>
                              {status === 'submitted' && c.status === 'accepted' && (
                                <button
                                  onClick={() => onApproveMilestone && onApproveMilestone(c._id || c.id, mId)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-lg transition"
                                >
                                  Approve
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <span className="text-[9px] text-text-tertiary font-bold mt-1 block">
                        Expected Scope: {c.numReels || 0} Reels, {c.numPosts || 0} Posts
                      </span>
                    </div>
                  </div>

                  {/* Submissions List */}
                  {c.submissionUrls?.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider block">Creator Submissions</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {c.submissionUrls.map((sub, idx) => (
                          <div
                            key={idx}
                            onClick={() => setPlayingVideo(sub)}
                            className="bg-black/80 aspect-video rounded-xl overflow-hidden border border-border flex items-center justify-center cursor-pointer hover:border-brand-purple transition relative group"
                          >
                            {sub.type === 'reel' || sub.type === 'video' ? (
                              <>
                                <span className="text-[10px] text-white font-bold flex items-center gap-1"><FiPlay size={12} /> Watch Reel</span>
                                <div className="absolute inset-0 bg-brand-purple/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </>
                            ) : (
                              <span className="text-[10px] text-white font-bold">View Image Link</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Pricing / Progress / Actions */}
                <div className="w-full md:w-60 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6 space-y-4">
                  {/* Budget details */}
                  <div className="text-right w-full">
                    <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider block">Campaign Escrow Budget</span>
                    <p className="text-lg font-black text-emerald-600">₹{c.budget}</p>
                    {c.deadline && (
                      <span className="text-[10px] text-text-tertiary block mt-1">
                        Deadline: {new Date(c.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-text-secondary">
                      <span>Milestone Progress</span>
                      <span>{c.progress}%</span>
                    </div>
                    <div className="h-2 bg-surface-secondary border border-border rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-brand transition-all duration-500"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Interactive Action Buttons */}
                  <div className="flex flex-wrap gap-2 justify-end w-full">
                    {c.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onEditCampaign(c)}
                          className="p-2.5 glass border border-border hover:bg-surface-tertiary text-text-primary rounded-xl transition flex items-center gap-1"
                          title="Edit Proposal"
                        >
                          <FiEdit size={14} /> <span className="text-[10px] font-bold">Edit</span>
                        </button>
                        <button
                          onClick={() => onCancelCampaign(c._id || c.id)}
                          className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded-xl transition flex items-center gap-1"
                          title="Cancel Proposal"
                        >
                          <FiTrash2 size={14} /> <span className="text-[10px] font-bold">Cancel</span>
                        </button>
                      </>
                    )}

                    {c.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => onOpenChat(c.creator?._id || c.creator?.id)}
                          className="px-3.5 py-2 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple hover:bg-brand-purple/20 font-bold rounded-xl transition flex items-center gap-1.5"
                        >
                          <FiMessageSquare size={14} /> Chat
                        </button>
                        <button
                          onClick={() => onCompleteCampaign(c._id || c.id)}
                          className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition flex items-center gap-1.5"
                        >
                          <FiCheckCircle size={14} /> Release Escrow Payout
                        </button>
                      </>
                    )}

                    {c.status === 'completed' && !c.vendorReview && (
                      <button
                        onClick={() => setReviewingCampaign(c)}
                        className="px-4 py-2 gradient-brand text-white font-bold rounded-xl transition flex items-center gap-1.5"
                      >
                        <FiStar size={14} /> Leave Creator Review
                      </button>
                    )}

                    {c.status === 'completed' && c.vendorReview && (
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                        Escrow Payout Complete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RATING & REVIEW FORM DIALOG MODAL */}
      {reviewingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-black text-text-primary font-display flex items-center gap-1">
                <FiStar className="text-amber-500" /> Review Creator Collaboration
              </h3>
              <button onClick={() => setReviewingCampaign(null)} className="text-text-tertiary hover:text-text-primary">
                <FiXCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <p className="text-text-secondary leading-relaxed">
                Provide a rating and leave feedback about your campaign collaboration experience with{' '}
                <strong className="text-brand-purple">{reviewingCampaign.creator?.name || 'this creator'}</strong>.
              </p>

              {/* Stars selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-text-secondary">Rating Stars *</label>
                <div className="flex gap-1.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      size={24}
                      className={`cursor-pointer ${rating >= star ? 'fill-amber-500' : 'text-text-tertiary'}`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>

              {/* Review Comment text */}
              <div className="space-y-1.5">
                <label className="font-bold text-text-secondary">Review Message *</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details of the collaboration, content quality, revisions response time..."
                  className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setReviewingCampaign(null)}
                  className="px-4 py-2.5 glass border border-border font-bold text-text-secondary rounded-xl hover:bg-surface-tertiary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 gradient-brand text-white font-bold rounded-xl shadow-premium transition"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REEL DELIVERABLE WATCH MODAL OVERLAY */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between">
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-xl bg-black/60 text-white hover:bg-black/85 transition text-[10px] font-bold uppercase tracking-wider"
            >
              Close
            </button>
            <video src={playingVideo.url} autoPlay controls playsInline className="w-full h-full object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}
