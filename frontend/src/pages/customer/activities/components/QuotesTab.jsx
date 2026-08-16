import React from 'react';
import { FiStar, FiPackage, FiMessageSquare, FiUserCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';
import { resolveMediaUrl } from '../../../../lib/api';

export default function QuotesTab({
  quotes = [],
  onUpdateQuote,
}) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quotes.map((q) => {
        const isPending = q.status === 'pending';
        const reqTitle = q.requirement?.title || 'Requirement Quotation Proposal';
        const shopName = q.vendor?.vendorProfile?.shopName || q.vendor?.vendorProfile?.businessName || q.vendor?.name || 'Seller';

        return (
          <div
            key={q.id || q._id}
            className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300"
          >
            <div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-2">
                <span className="text-[9px] text-text-tertiary font-bold font-mono">
                  Proposal Date: {new Date(q.createdAt).toLocaleDateString()}
                </span>
                <AdminStatusBadge status={q.status} />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <img
                  src={resolveMediaUrl(q.vendor?.avatarUrl || q.vendor?.profile_pic || 'https://via.placeholder.com/150')}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-border"
                />
                <div>
                  <h4
                    className="font-bold text-xs text-text-primary hover:text-brand-purple cursor-pointer transition"
                    onClick={() => navigate(`/customer/vendor/${q.vendor?._id || q.vendor?.id}`)}
                  >
                    {shopName}
                  </h4>
                  <div className="flex items-center gap-1 text-[9px] text-yellow-500 font-bold">
                    <FiStar size={10} fill="currentColor" />
                    <span>{q.vendor?.rating_avg || 0}</span>
                  </div>
                </div>
              </div>

              <h4 className="font-bold text-xs text-text-primary truncate mb-1">For: {reqTitle}</h4>
              <p className="text-[10px] text-text-secondary line-clamp-3 bg-surface-secondary/40 border border-border/60 rounded-xl p-3 italic">
                "{q.notes || 'No quotation notes specified.'}"
              </p>

              <div className="p-3 bg-brand-purple/5 border border-brand-purple/10 rounded-xl text-[10px] text-text-secondary space-y-1 mt-3">
                <div className="flex justify-between">
                  <span>Bidded Price:</span>
                  <span className="font-extrabold text-emerald-600 text-xs">₹{(q.price || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Delivery:</span>
                  <span className="font-semibold text-text-primary">
                    {q.estimatedDelivery ? new Date(q.estimatedDelivery).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {q.attachments && q.attachments.length > 0 && (
                  <div className="flex justify-between">
                    <span>Attachments:</span>
                    <span className="font-bold text-brand-purple cursor-pointer underline flex items-center gap-0.5">
                      <FiPackage size={10} /> View Files
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t border-border/50 pt-3">
              {isPending ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateQuote(q.id || q._id, 'accepted', shopName)}
                    className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition"
                  >
                    Accept Quote
                  </button>
                  <button
                    onClick={() => onUpdateQuote(q.id || q._id, 'rejected', shopName)}
                    className="py-2 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-bold transition"
                  >
                    Reject Quote
                  </button>
                </div>
              ) : (
                <div className="text-[10px] font-semibold text-text-tertiary text-center bg-surface py-2 rounded-xl border border-border">
                  This quotation proposal status is {q.status.toUpperCase()}
                </div>
              )}

              <div className="flex justify-between items-center text-[9px] text-text-tertiary pt-1">
                <button
                  onClick={() => navigate(`/customer/chat?vendorId=${q.vendor?._id || q.vendor?.id}`)}
                  className="hover:text-brand-purple font-semibold flex items-center gap-0.5"
                >
                  <FiMessageSquare size={10} /> Chat with Vendor
                </button>
                <button
                  onClick={() => navigate(`/customer/vendor/${q.vendor?._id || q.vendor?.id}`)}
                  className="hover:text-brand-purple font-semibold flex items-center gap-0.5"
                >
                  <FiUserCheck size={10} /> View Vendor Profile
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
