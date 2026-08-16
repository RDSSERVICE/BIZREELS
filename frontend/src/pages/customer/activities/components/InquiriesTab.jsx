import React from 'react';
import { FiMessageSquare, FiTrash2, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';

export default function InquiriesTab({
  inquiries = [],
  onCloseInquiry,
  onDeleteInquiry,
}) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {inquiries.map((inq) => {
        const isClosed = inq.status === 'closed';
        const sellerName = inq.vendor?.vendorProfile?.shopName || inq.vendor?.name || 'Seller';
        const itemTitle = inq.listing?.title || inq.reel?.caption || inq.reel?.title || 'Listing / Post';
        const isReel = !!inq.reel && !inq.listing;

        return (
          <div
            key={inq._id || inq.id}
            className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300"
          >
            <div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-text-tertiary font-bold tracking-wider uppercase font-mono">
                    Inq ID: {inq._id?.substring(16)}
                  </span>
                  {isReel && (
                    <span className="px-1.5 py-0.5 rounded bg-brand-purple/10 text-brand-purple text-[9px] font-black uppercase">
                      Reel
                    </span>
                  )}
                </div>
                <AdminStatusBadge status={inq.status} />
              </div>

              <h4 className="font-bold text-xs text-text-primary truncate">{itemTitle}</h4>
              <p className="text-[10px] text-text-tertiary mt-0.5">
                Seller: <span className="font-semibold text-text-secondary">{sellerName}</span>
              </p>

              {/* Customer Sent Message */}
              <div className="p-3 bg-surface-secondary/50 rounded-xl border border-border/60 mt-3 space-y-1">
                <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">
                  Your Question:
                </span>
                <p className="text-[10px] text-text-secondary italic line-clamp-3">"{inq.message}"</p>
              </div>

              {/* Vendor's Reply */}
              {inq.replyMessage ? (
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 mt-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <span>💬</span> Seller's Reply:
                    </span>
                    {inq.repliedAt && (
                      <span className="text-[9px] text-emerald-600 font-medium">
                        {new Date(inq.repliedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-900 font-medium leading-relaxed mt-0.5">
                    "{inq.replyMessage}"
                  </p>
                </div>
              ) : (
                <div className="mt-2 text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <span>⏳</span> Awaiting seller response...
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 text-[10px] text-text-tertiary">
                <FiCalendar size={11} />
                <span>Sent: {new Date(inq.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-border/50 pt-3">
              <button
                onClick={() => navigate(`/customer/chat?vendorId=${inq.vendor?._id || inq.vendor?.id}`)}
                className="w-full py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition flex items-center justify-center gap-1"
              >
                <FiMessageSquare size={11} /> Open Direct Chat
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onCloseInquiry(inq._id || inq.id)}
                  disabled={isClosed}
                  className="py-1.5 glass border border-border text-text-secondary hover:text-brand-purple disabled:opacity-40 rounded-xl text-[10px] font-semibold transition"
                >
                  Close Inquiry
                </button>
                <button
                  onClick={() => onDeleteInquiry(inq._id || inq.id)}
                  className="py-1.5 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
                >
                  <FiTrash2 size={11} /> Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
