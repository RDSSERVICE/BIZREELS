import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiShoppingBag, FiTool, FiMessageCircle, FiPhone, FiClock,
  FiMail, FiExternalLink, FiCornerDownRight, FiTrash, FiSend
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { resolveMediaUrl } from '../../../../lib/api';

export default function InquiryCard({ inquiry, onReply, onClose, onDelete }) {
  const customerObj = inquiry.customer || {};
  const customerName = customerObj.name || (typeof customerObj === 'string' ? customerObj : 'Client Buyer');
  const customerPhone = customerObj.phone || '';
  const customerEmail = customerObj.email || '';
  const customerAvatar = customerObj.profile_pic || customerObj.avatarUrl || null;

  const listing = inquiry.listing || {};
  const reel = inquiry.reel || {};
  const isReel = !!inquiry.reel && !inquiry.listing;
  const itemTitle = listing.title || reel.caption || reel.title || 'Marketplace Item';
  const isService = listing.type === 'service';
  const itemImage = listing.images?.[0]?.url || listing.images?.[0] || reel.thumbnail || null;
  const price = listing.sellingPrice || listing.price || null;

  const status = inquiry.status || 'sent';

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleWhatsAppReply = (phone, title, name) => {
    if (!phone) {
      toast.error('Customer phone details not available');
      return;
    }
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    const greeting = name ? `Hi ${name}!` : 'Hi!';
    const text = encodeURIComponent(`${greeting} Regarding your inquiry on BizReels for "${title || 'our listing'}"...`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleCallReply = (phone) => {
    if (!phone) {
      toast.error('Customer phone details not available');
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 border border-white/20 hover:border-brand-purple/40 shadow-sm transition-all flex flex-col gap-3.5">
      {/* Top Header: Customer Info & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {customerAvatar ? (
            <img
              src={resolveMediaUrl(customerAvatar)}
              alt={customerName}
              className="w-10 h-10 rounded-full object-cover border border-brand-purple/20 bg-surface shadow-sm shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full gradient-brand text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0 uppercase">
              {customerName.charAt(0) || 'C'}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-text-primary truncate">{customerName}</h4>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                status === 'replied' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                status === 'closed' ? 'bg-slate-500/10 text-slate-600 border-slate-500/20' :
                'bg-amber-500/10 text-amber-600 border-amber-500/20'
              }`}>
                {status === 'replied' ? '✓ Replied' : status === 'closed' ? 'Closed' : '● New Inquiry'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-text-tertiary mt-0.5 flex-wrap">
              {customerPhone && (
                <span className="flex items-center gap-1">
                  <FiPhone size={11} className="text-brand-purple" /> {customerPhone}
                </span>
              )}
              {customerEmail && (
                <span className="flex items-center gap-1 truncate max-w-[200px]">
                  <FiMail size={11} className="text-brand-orange" /> {customerEmail}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FiClock size={11} /> {formatTimestamp(inquiry.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {status !== 'closed' && (
            <button
              onClick={() => onClose(inquiry._id || inquiry.id)}
              className="px-2.5 py-1 text-[11px] font-semibold text-text-tertiary hover:text-text-primary rounded-lg border border-border bg-surface transition"
              title="Mark Closed"
            >
              Mark Closed
            </button>
          )}
          <button
            onClick={() => onDelete(inquiry._id || inquiry.id)}
            className="p-1.5 text-text-tertiary hover:text-error rounded-lg border border-border bg-surface transition"
            title="Delete Inquiry"
          >
            <FiTrash size={13} />
          </button>
        </div>
      </div>

      {/* Listing / Reel Reference Bar */}
      <div className="flex items-center gap-3 bg-surface-secondary/70 p-2.5 sm:p-3 rounded-xl border border-border/60">
        {itemImage ? (
          <img
            src={resolveMediaUrl(itemImage)}
            alt={itemTitle}
            className="w-11 h-11 rounded-lg object-cover border border-border shrink-0 bg-white"
          />
        ) : (
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
            isReel ? 'bg-brand-purple/10 text-brand-purple' :
            isService ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-orange/10 text-brand-orange'
          }`}>
            {isReel ? <FiMessageCircle size={18} /> : isService ? <FiTool size={18} /> : <FiShoppingBag size={18} />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
              isReel ? 'bg-brand-purple text-white' :
              isService ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-orange/10 text-brand-orange'
            }`}>
              {isReel ? 'Reel / Post' : isService ? 'Service' : 'Product'}
            </span>
            {listing._id ? (
              <Link
                to={`/customer/listing/${listing._id}`}
                className="font-bold text-xs text-text-primary hover:text-brand-purple transition-colors truncate flex items-center gap-1"
              >
                <span className="truncate">{itemTitle}</span>
                <FiExternalLink size={11} className="shrink-0 opacity-70" />
              </Link>
            ) : (
              <span className="font-bold text-xs text-text-primary truncate">{itemTitle}</span>
            )}
          </div>
          {price !== null && (
            <p className="text-[11px] text-text-secondary mt-0.5 font-medium">
              Price / Rate: <strong className="text-emerald-600 font-bold">₹{Number(price).toLocaleString('en-IN')}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Customer Message Box */}
      <div className="bg-surface/80 rounded-xl p-3 border border-border/50 space-y-2">
        <p className="text-xs text-text-secondary leading-relaxed font-medium">
          <span className="font-bold text-text-primary text-[11px] block uppercase tracking-wider text-text-tertiary mb-1">
            Customer Message:
          </span>
          "{inquiry.message || inquiry.msg}"
        </p>

        {/* Vendor Reply if exists */}
        {inquiry.replyMessage && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5 mt-2 flex items-start gap-2">
            <FiCornerDownRight className="text-emerald-600 shrink-0 mt-0.5" size={14} />
            <div className="min-w-0 text-xs">
              <span className="font-bold text-emerald-700 block text-[10px] uppercase tracking-wider">
                Your Reply ({formatTimestamp(inquiry.repliedAt)}):
              </span>
              <p className="text-text-primary leading-relaxed mt-0.5">{inquiry.replyMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {customerPhone && (
            <button
              onClick={() => handleWhatsAppReply(customerPhone, itemTitle, customerName)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <FiMessageCircle size={14} />
              <span>Reply on WhatsApp</span>
            </button>
          )}

          {customerPhone && (
            <button
              onClick={() => handleCallReply(customerPhone)}
              className="px-3 py-2 bg-surface hover:bg-surface-secondary text-text-primary border border-border font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <FiPhone size={13} className="text-brand-purple" />
              <span>Call Customer</span>
            </button>
          )}

          <button
            onClick={() => onReply(inquiry)}
            className="px-3.5 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
          >
            <FiSend size={13} />
            <span>{inquiry.replyMessage ? 'Update Reply' : 'Send Quick Reply'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
