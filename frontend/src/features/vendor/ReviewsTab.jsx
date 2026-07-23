import React, { useState, useMemo } from 'react';
import { FiStar, FiMessageSquare, FiUser, FiSend, FiCheck } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { toast } from 'react-hot-toast';
import { useGetVendorReviewsQuery, useReplyToReviewMutation } from './vendorApi';

const ReviewsTab = ({ user }) => {
  const { data: reviewsRes, isLoading, refetch } = useGetVendorReviewsQuery(
    { page: 1, limit: 50 },
    { pollingInterval: 30000 }
  );
  const [replyToReview, { isLoading: isReplying }] = useReplyToReviewMutation();

  const [replyInput, setReplyInput] = useState({});

  const reviews = useMemo(() => {
    const raw = reviewsRes?.data?.reviews || reviewsRes?.data || reviewsRes?.reviews || [];
    return Array.isArray(raw) ? raw : [];
  }, [reviewsRes]);

  const handlePostReply = async (revId) => {
    const text = replyInput[revId];
    if (!text || !text.trim()) {
      return toast.error('Please enter a response message.');
    }
    try {
      await replyToReview({ id: revId, reply: text.trim() }).unwrap();
      setReplyInput(prev => ({ ...prev, [revId]: '' }));
      toast.success('Reply submitted to customer feedback!');
      refetch();
    } catch (err) {
      toast.error('Failed to submit reply.');
    }
  };

  // Compute average rating and distribution from real data
  const { averageRating, ratingDistribution } = useMemo(() => {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        ratingDistribution: [5, 4, 3, 2, 1].map(s => ({ stars: s, count: 0, percent: 0 })),
      };
    }
    const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avg = (total / reviews.length).toFixed(1);
    const dist = [5, 4, 3, 2, 1].map(stars => {
      const count = reviews.filter(r => r.rating === stars).length;
      return { stars, count, percent: Math.round((count / reviews.length) * 100) };
    });
    return { averageRating: avg, ratingDistribution: dist };
  }, [reviews]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center px-1 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Customer Reviews & Ratings</h3>
          <p className="text-xs text-slate-500 mt-1">Review verified purchase feedback logs and respond directly.</p>
        </div>
      </div>

      {/* Ratings Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-white/50 shadow-glass flex flex-col items-center justify-center text-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Store Rating</span>
          <h1 className="text-5xl font-black text-brand-navy font-display">{averageRating}</h1>
          <div className="flex text-brand-orange gap-1 my-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <FiStar key={s} className={`w-5 h-5 ${s <= Math.round(averageRating) ? 'fill-current' : 'text-slate-200'}`} />
            ))}
          </div>
          <span className="text-xs text-slate-500 font-semibold">Based on {reviews.length} verified purchases</span>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/50 shadow-glass md:col-span-2 flex flex-col gap-2 justify-center">
          {ratingDistribution.map((dist) => (
            <div key={dist.stars} className="flex items-center gap-3 text-xs">
              <span className="w-10 text-slate-500 font-bold text-right">{dist.stars} Stars</span>
              <div className="h-2.5 flex-grow bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-orange rounded-full" style={{ width: `${dist.percent}%` }} />
              </div>
              <span className="w-8 text-slate-400 text-right font-semibold">{dist.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Customer review items list */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider px-1">Recent Customer Feedback</h4>

        {isLoading ? (
          <div className="py-16 flex justify-center"><Loader /></div>
        ) : reviews.length === 0 ? (
          <div className="glass p-12 text-center rounded-2xl text-slate-500 border border-white/50 shadow-glass">
            No customer reviews yet. Reviews will appear here once customers post feedback.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((rev) => {
              const revId = rev._id || rev.id;
              const authorName = rev.author?.name || rev.user?.name || rev.reviewer || 'Anonymous';
              const authorAvatar = rev.author?.avatarUrl || rev.author?.profile_pic || rev.user?.avatarUrl || '/logo.png';
              const rating = rev.rating || 0;
              const content = rev.comment || rev.content || rev.text || '';
              const date = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : '';
              const reply = rev.reply || rev.vendorReply || '';

              return (
                <div
                  key={revId}
                  className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4 hover:shadow-premium transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div className="flex flex-col">
                        <h4 className="text-xs font-bold text-brand-navy">{authorName}</h4>
                        <span className="text-[9px] text-slate-400 mt-0.5">{date}</span>
                      </div>
                    </div>

                    <div className="flex text-brand-orange gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FiStar
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= rating ? 'fill-current' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">{content}</p>

                  {/* Replied context bubble */}
                  {reply ? (
                    <div className="bg-brand-purple/5 border border-brand-purple/10 p-4 rounded-xl flex gap-3 text-xs items-start">
                      <div className="p-1 bg-brand-purple/10 text-brand-purple rounded-lg shrink-0 mt-0.5">
                        <FiCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-brand-purple font-bold block uppercase tracking-wide">Your response</span>
                        <p className="text-slate-600 mt-1 leading-relaxed">{reply}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center mt-1 border-t border-slate-100 pt-4">
                      <input
                        type="text"
                        value={replyInput[revId] || ''}
                        onChange={(e) => setReplyInput(prev => ({ ...prev, [revId]: e.target.value }))}
                        placeholder="Write a response to this review..."
                        className="flex-grow p-2.5 bg-slate-50 border border-slate-200 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 focus:outline-none rounded-xl text-xs transition-all h-[38px]"
                      />
                      <button
                        type="button"
                        onClick={() => handlePostReply(revId)}
                        disabled={isReplying}
                        className="p-2.5 bg-brand-purple hover:bg-brand-purple-800 text-white rounded-xl shadow-premium cursor-pointer transition-all shrink-0 flex items-center justify-center disabled:opacity-50"
                      >
                        <FiSend className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsTab;
