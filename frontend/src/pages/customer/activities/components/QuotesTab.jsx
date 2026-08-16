import React from 'react';
import { FiDollarSign, FiCheck, FiX, FiClock, FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../../../lib/api';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

export default function QuotesTab({
  quotes = [],
  onUpdateQuoteStatus,
}) {
  const navigate = useNavigate();

  if (quotes.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#e3dccb] space-y-2 p-6 shadow-xs font-sans">
        <div className="w-12 h-12 rounded-full bg-[#f8f4ec] text-[#d99a3d] flex items-center justify-center mx-auto mb-2 border border-[#e3dccb]">
          <FiDollarSign size={20} />
        </div>
        <p className="text-sm font-bold text-[#1a1a1a]">No quotes received yet</p>
        <p className="text-xs">When local businesses send customized estimates or proposals, they will appear here.</p>
        <button
          onClick={() => navigate('/customer/requirements/new')}
          className="mt-3 px-4 py-2 bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
        >
          Post a Requirement
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 font-sans">
      {quotes.map((q) => {
        const quoteId = q._id || q.id;
        const vendor = q.vendor || {};
        const vendorName = vendor.shopName || vendor.name || 'Custom Quote Provider';
        const vendorAvatar = resolveMediaUrl(vendor.avatarUrl || vendor.profile_pic || DEFAULT_AVATAR);
        const status = (q.status || 'pending').toLowerCase();

        return (
          <div
            key={quoteId}
            className="bg-white rounded-xl border border-[#e3dccb] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2.5">
              <div className="flex items-center gap-2.5">
                <img
                  src={vendorAvatar}
                  alt={vendorName}
                  className="w-10 h-10 rounded-full object-cover border border-[#e3dccb]"
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                />
                <div>
                  <h4 className="font-bold text-sm text-[#1a1a1a]">{vendorName}</h4>
                  <span className="text-[10.5px] text-slate-400">
                    Quote sent on {new Date(q.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-black text-[#1a1a1a]">
                  ₹{Number(q.amount || q.price || 0).toLocaleString('en-IN')}
                </span>
                <span className={`block text-[9.5px] font-black uppercase mt-0.5 px-2 py-0.5 rounded ${
                  status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                  status === 'rejected' ? 'bg-red-50 text-red-700' :
                  'bg-amber-50 text-[#d99a3d]'
                }`}>
                  {status}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-[#f8f4ec] p-3 rounded-lg border border-[#e3dccb]">
              {q.notes || q.message || q.details || 'Custom proposal customized for your requested requirement.'}
            </p>

            {status === 'pending' && (
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateQuoteStatus(quoteId, 'rejected')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold transition cursor-pointer"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateQuoteStatus(quoteId, 'accepted')}
                  className="px-4 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Accept Quote
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
