import React, { useState } from 'react';
import {
  FiPhone, FiPhoneCall, FiPhoneForwarded, FiCopy, FiCheck, FiX,
  FiMessageSquare, FiShield, FiCheckCircle, FiClock, FiAlertTriangle
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { resolveMediaUrl, api } from '../../../../lib/api';
import { useLanguage } from '../../../../context/LanguageContext';

export default function ClickToCallModal({
  isOpen,
  item,
  onClose,
  onInquire,
  onWhatsApp,
  onCallbackRequest
}) {
  const { bi } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [requestingCallback, setRequestingCallback] = useState(false);

  if (!isOpen || !item) return null;

  const vendorObj = item.vendor || item.vendorId || {};
  const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || item.vendorName || 'Verified Vendor';
  const city = item.city || vendorObj.city || item.location?.city || 'Local Area';
  const vendorAvatar = vendorObj.avatarUrl || vendorObj.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
  const isService = item.type === 'service';
  const priceVal = Number(item.salePrice || item.price || 0);

  const rawPhone =
    vendorObj.vendorProfile?.mobileNumber ||
    vendorObj.phone ||
    vendorObj.vendorProfile?.whatsapp ||
    vendorObj.vendorProfile?.whatsappNumber ||
    vendorObj.vendorProfile?.phone ||
    vendorObj.whatsapp ||
    item.phone ||
    '';

  let cleanPhone = String(rawPhone).replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
    cleanPhone = `91${cleanPhone.slice(1)}`;
  }

  const displayPhone = rawPhone
    ? (rawPhone.startsWith('+') ? rawPhone : (cleanPhone.length === 12 ? `+${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 7)} ${cleanPhone.slice(7)}` : rawPhone))
    : '+91 98765 43210 (Direct Line)';

  const handleDirectCall = async () => {
    try {
      const listingId = item._id || item.id;
      const targetUserId = vendorObj._id || vendorObj.id;
      if (listingId && targetUserId) {
        api.post('/v1/users/me/track-interaction', {
          type: 'click_to_call',
          listingId,
          targetUserId,
        }).catch(() => {});
      }
    } catch {}

    if (cleanPhone && cleanPhone.length >= 10) {
      window.location.href = `tel:+${cleanPhone}`;
    } else {
      window.location.href = `tel:${rawPhone || '+919876543210'}`;
    }
  };

  const handleCopyPhone = () => {
    const toCopy = rawPhone || cleanPhone || '9876543210';
    navigator.clipboard?.writeText(toCopy);
    setCopied(true);
    toast.success(bi('Phone number copied!', 'फ़ोन नंबर कॉपी हो गया!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendCallback = async () => {
    setRequestingCallback(true);
    try {
      if (onCallbackRequest) {
        await onCallbackRequest(item);
      }
    } finally {
      setRequestingCallback(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#e3dccb] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scaleUp space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="bg-[#241b15] text-white p-4.5 sm:p-5 relative flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <img
                src={resolveMediaUrl(vendorAvatar)}
                alt={vendorName}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#d99a3d]"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
                }}
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#241b15] rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-extrabold text-[#d99a3d] truncate">
                  {vendorName}
                </h3>
                <FiCheckCircle size={14} className="text-[#d99a3d] shrink-0" />
              </div>
              <p className="text-xs text-slate-300 truncate flex items-center gap-1 mt-0.5">
                <span>📍 {city}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{bi('Available for Calls', 'कॉल के लिए उपलब्ध')}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* ── Context Listing Bar ── */}
        <div className="px-5 py-3 bg-[#f8f4ec] border-b border-[#e3dccb] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {bi('Inquiring About', 'पूछताछ विषय')}
            </span>
            <p className="text-xs font-black text-[#1a1a1a] truncate">{item.title}</p>
          </div>
          <span className="text-xs font-black text-[#1a1a1a] bg-white px-2.5 py-1 rounded-md border border-[#e3dccb] shrink-0">
            ₹{priceVal.toLocaleString('en-IN')}
          </span>
        </div>

        {/* ── Call & Contact Action Menu ── */}
        <div className="p-5 space-y-3.5">
          {/* Primary Action 1: Direct Call */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-2 border-emerald-500/40 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
                  <FiPhoneCall size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1a1a1a]">
                    {bi('Direct Voice Call', 'सीधा फ़ोन कॉल')}
                  </h4>
                  <p className="text-[11px] font-mono font-bold text-slate-600">{displayPhone}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyPhone}
                className="p-2 rounded-lg bg-white border border-[#e3dccb] hover:border-[#d99a3d] text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                title={bi('Copy Phone Number', 'नंबर कॉपी करें')}
              >
                {copied ? <FiCheck size={13} className="text-emerald-600" /> : <FiCopy size={13} />}
                <span className="text-[10px]">{copied ? bi('Copied', 'कॉपी') : bi('Copy', 'कॉपी')}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDirectCall}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer tracking-wide"
            >
              <FiPhone size={15} className="animate-bounce" />
              <span>{bi('Call Now (Direct Dial)', 'अभी कॉल करें (डायरेक्ट डायल)')}</span>
            </button>
          </div>

          {/* Quick Alternative Contact Options */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => {
                onWhatsApp(item);
                onClose();
              }}
              className="p-3 rounded-xl bg-[#f8f4ec] hover:bg-emerald-50 border border-[#e3dccb] hover:border-emerald-300 text-slate-800 text-xs font-bold transition flex items-center gap-2.5 cursor-pointer shadow-2xs group"
            >
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-110 transition">
                <FaWhatsapp size={16} />
              </div>
              <div className="text-left min-w-0">
                <span className="block font-black text-xs text-[#1a1a1a]">WhatsApp</span>
                <span className="text-[10px] text-slate-500 block truncate">{bi('Instant Chat', 'तुरंत चैट')}</span>
              </div>
            </button>

            {/* In-App Direct Chat */}
            <button
              type="button"
              onClick={() => {
                onInquire(item);
                onClose();
              }}
              className="p-3 rounded-xl bg-[#f8f4ec] hover:bg-purple-50 border border-[#e3dccb] hover:border-purple-300 text-slate-800 text-xs font-bold transition flex items-center gap-2.5 cursor-pointer shadow-2xs group"
            >
              <div className="p-1.5 rounded-lg bg-purple-100 text-[#7c3aed] group-hover:scale-110 transition">
                <FiMessageSquare size={16} />
              </div>
              <div className="text-left min-w-0">
                <span className="block font-black text-xs text-[#1a1a1a]">{bi('BizReels Chat', 'प्लेटफ़ॉर्म चैट')}</span>
                <span className="text-[10px] text-slate-500 block truncate">{bi('Secure & Free', 'सुरक्षित संदेश')}</span>
              </div>
            </button>
          </div>

          {/* Callback Request Card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FiPhoneForwarded className="text-blue-600 shrink-0" size={16} />
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#1a1a1a] block truncate">
                  {bi('Busy? Request Callback', 'व्यस्त हैं? कॉलबैक अनुरोध भेजें')}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {bi('Vendor will call you back shortly', 'विक्रेता जल्द आपको कॉल करेगा')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendCallback}
              disabled={requestingCallback}
              className="py-1.5 px-3 rounded-lg bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-[11px] font-extrabold transition cursor-pointer shrink-0 disabled:opacity-50"
            >
              {requestingCallback ? bi('Sending...', 'भेज रहे हैं...') : bi('Request Callback', 'कॉलबैक भेजें')}
            </button>
          </div>

          {/* Trust & Safety Advisory */}
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 flex items-start gap-2 text-[10px] text-amber-900 leading-snug">
            <FiShield size={13} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              {bi(
                'BizReels connects you directly with verified local businesses. Verify products and services before making any financial transfers.',
                'BizReels आपको सीधे सत्यापित स्थानीय विक्रेताओं से जोड़ता है। किसी भी भुगतान से पहले उत्पाद/सेवा की पुष्टि अवश्य करें।'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
