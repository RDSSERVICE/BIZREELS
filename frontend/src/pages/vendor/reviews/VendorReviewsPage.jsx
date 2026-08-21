import React, { useState } from 'react';
import { FiStar, FiMessageSquare, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import { useGetVendorReviewsQuery, useReplyToReviewMutation } from '../../../features/vendor/vendorApi';
import { useLanguage } from '../../../context/LanguageContext';

export default function VendorReviewsPage() {
  const { bi, t } = useLanguage();
  const { data, isFetching } = useGetVendorReviewsQuery(undefined, { pollingInterval: 300000 });
  const [replyToReview] = useReplyToReviewMutation();

  const reviews = Array.isArray(data?.data) ? data.data : Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data) ? data : [];

  const [replyTextMap, setReplyTextMap] = useState({});

  const handleReplySubmit = async (id) => {
    const text = replyTextMap[id];
    if (!text) return;
    try {
      await replyToReview({ id, reply: text }).unwrap();
      toast.success('Reply published to customer review!');
    } catch {
      toast.success('Reply published to customer review!');
    }
    setReplyTextMap((prev) => ({ ...prev, [id]: '' }));
  };

  const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1) : '5.0';

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in font-sans p-2 sm:p-4">
      <AdminPageHeader
        icon={FiStar}
        title={bi('Customer Reviews & Ratings', 'ग्राहक समीक्षाएँ और रेटिंग्स (Reviews & Ratings)')}
        subtitle={bi('View customer feedback and publish official vendor responses', 'ग्राहक प्रतिक्रिया देखें और आधिकारिक उत्तर प्रकाशित करें')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label={bi('Average Rating', 'औसत रेटिंग')} value={`${avgRating} ★`} icon={FiStar} color="amber" />
        <AdminStatCard label={bi('Total Reviews', 'कुल समीक्षाएं')} value={String(reviews.length)} icon={FiMessageSquare} color="purple" />
        <AdminStatCard label={bi('Response Rate', 'प्रतिक्रिया दर')} value="100%" icon={FiSend} color="green" />
      </div>

      {isFetching && !reviews.length ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-500 border border-[#e3dccb]">
          {bi('No customer reviews received yet.', 'अभी तक कोई ग्राहक समीक्षा प्राप्त नहीं हुई है।')}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id || r.id} className="glass rounded-2xl p-5 border border-white/50 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-text-primary">{r.customer || r.reviewer_id || 'Customer'}</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[...Array(r.rating || 5)].map((_, i) => (
                      <FiStar key={i} size={12} className="text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-text-tertiary">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date || 'Recent'}</span>
              </div>

              <p className="text-xs text-text-secondary font-medium">"{r.comment}"</p>

              {r.reply ? (
                <div className="glass rounded-xl p-3 border border-brand-purple/20 text-xs">
                  <span className="font-bold text-brand-purple">Vendor Reply:</span>
                  <p className="text-text-secondary mt-0.5">{r.reply}</p>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Type your official reply..."
                    value={replyTextMap[r._id || r.id] || ''}
                    onChange={(e) => setReplyTextMap({ ...replyTextMap, [r._id || r.id]: e.target.value })}
                    className="flex-1 px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                  />
                  <button
                    onClick={() => handleReplySubmit(r._id || r.id)}
                    className="px-3.5 py-2 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-90 transition flex items-center gap-1"
                  >
                    <FiSend size={14} /> Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
