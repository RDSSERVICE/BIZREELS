import React, { useState } from 'react';
import { FiStar, FiMessageSquare, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState([
    { id: 1, customer: 'Aakash Verma', rating: 5, comment: 'Excellent Sony OLED TV! Delivery was super fast within 2 hours in Bandra.', reply: 'Thank you Aakash! Enjoy your new OLED TV!', date: '2 days ago' },
    { id: 2, customer: 'Meera Rao', rating: 4, comment: 'Great collection of summer wear. Quality is top notch.', reply: '', date: '5 days ago' }
  ]);

  const [replyTextMap, setReplyTextMap] = useState({});

  const handleReplySubmit = (id) => {
    const text = replyTextMap[id];
    if (!text) return;
    setReviews(reviews.map((r) => r.id === id ? { ...r, reply: text } : r));
    setReplyTextMap({ ...replyTextMap, [id]: '' });
    toast.success('Reply published to customer review!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiStar className="text-amber-400 fill-amber-400" />
            <span>Customer Reviews & Ratings (4.8 ★)</span>
          </h2>
          <p className="text-xs text-slate-400">View customer ratings and publish official vendor responses</p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-white">{r.customer}</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  {[...Array(r.rating)].map((_, i) => (
                    <FiStar key={i} size={12} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-slate-500">{r.date}</span>
            </div>

            <p className="text-xs text-slate-300">"{r.comment}"</p>

            {r.reply ? (
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                <span className="font-bold text-pink-400">Vendor Reply:</span>
                <p className="text-slate-300 mt-0.5">{r.reply}</p>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Type your official reply..."
                  value={replyTextMap[r.id] || ''}
                  onChange={(e) => setReplyTextMap({ ...replyTextMap, [r.id]: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
                <button onClick={() => handleReplySubmit(r.id)} className="px-3 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                  <FiSend size={14} /> Reply
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
