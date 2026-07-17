import React, { useState } from 'react';
import { FiStar, FiMessageSquare, FiUser, FiSend, FiCheck } from 'react-icons/fi';
import Button from '../../components/common/Button';
import { toast } from 'react-hot-toast';

const ReviewsTab = ({ user }) => {
  const [activeReviews, setActiveReviews] = useState([
    {
      id: 'rev-1',
      author: 'Rohit Sharma',
      avatar: 'https://via.placeholder.com/60?text=RS',
      rating: 5,
      content: 'Excellent product quality and prompt responses! I ordered the custom CCTV LED and they installed it in New Delhi within 2 days. Highly recommended local shop.',
      date: '2026-07-15',
      reply: 'Thank you Rohit! Glad we could install the LED setup quickly.'
    },
    {
      id: 'rev-2',
      author: 'Aditi Rao',
      avatar: 'https://via.placeholder.com/60?text=AR',
      rating: 4,
      content: 'The leather shoes look premium, size was a bit tight but they offered a free replacement nearby. Excellent customer service.',
      date: '2026-07-11',
      reply: ''
    }
  ]);

  const [replyInput, setReplyInput] = useState({});

  const handlePostReply = (revId) => {
    const text = replyInput[revId];
    if (!text || !text.trim()) {
      return toast.error('Please enter a response message.');
    }
    setActiveReviews(prev =>
      prev.map(r => (r.id === revId ? { ...r, reply: text } : r))
    );
    setReplyInput(prev => ({ ...prev, [revId]: '' }));
    toast.success('Reply submitted to customer feedback!');
  };

  const averageRating = 4.8;
  const ratingDistribution = [
    { stars: 5, count: 24, percent: 80 },
    { stars: 4, count: 4, percent: 13 },
    { stars: 3, count: 2, percent: 7 },
    { stars: 2, count: 0, percent: 0 },
    { stars: 1, count: 0, percent: 0 },
  ];

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
              <FiStar key={s} className="fill-current w-5 h-5" />
            ))}
          </div>
          <span className="text-xs text-slate-500 font-semibold">Based on 30 verified purchases</span>
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
        <div className="flex flex-col gap-4">
          {activeReviews.map((rev) => (
            <div
              key={rev.id}
              className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4 hover:shadow-premium transition-all duration-300"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.avatar}
                    alt={rev.author}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex flex-col">
                    <h4 className="text-xs font-bold text-brand-navy">{rev.author}</h4>
                    <span className="text-[9px] text-slate-400 mt-0.5">{rev.date}</span>
                  </div>
                </div>

                <div className="flex text-brand-orange gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FiStar
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-current' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-semibold">{rev.content}</p>

              {/* Replied context bubble */}
              {rev.reply ? (
                <div className="bg-brand-purple/5 border border-brand-purple/10 p-4 rounded-xl flex gap-3 text-xs items-start">
                  <div className="p-1 bg-brand-purple/10 text-brand-purple rounded-lg shrink-0 mt-0.5">
                    <FiCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-purple font-bold block uppercase tracking-wide">Your response</span>
                    <p className="text-slate-600 mt-1 leading-relaxed">{rev.reply}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-center mt-1 border-t border-slate-100 pt-4">
                  <input
                    type="text"
                    value={replyInput[rev.id] || ''}
                    onChange={(e) => setReplyInput(prev => ({ ...prev, [rev.id]: e.target.value }))}
                    placeholder="Write a response to this review..."
                    className="flex-grow p-2.5 bg-slate-50 border border-slate-200 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 focus:outline-none rounded-xl text-xs transition-all h-[38px]"
                  />
                  <button
                    type="button"
                    onClick={() => handlePostReply(rev.id)}
                    className="p-2.5 bg-brand-purple hover:bg-brand-purple-800 text-white rounded-xl shadow-premium cursor-pointer transition-all shrink-0 flex items-center justify-center"
                  >
                    <FiSend className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewsTab;
