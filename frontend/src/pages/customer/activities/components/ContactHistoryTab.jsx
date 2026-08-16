import React from 'react';
import { FiPhone, FiMessageSquare, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../../../lib/api';

export default function ContactHistoryTab({
  activeTab,
  items = [],
}) {
  const navigate = useNavigate();

  const getLabel = () => {
    if (activeTab === 'click-to-called') return '📞 Click to Call Log';
    if (activeTab === 'whatsapp-contacted') return '💬 WhatsApp Contact Log';
    return '✉️ Chat Inquiry Log';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div
          key={item.id || item._id}
          className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img
                src={resolveMediaUrl(item.vendor?.avatarUrl || 'https://via.placeholder.com/150')}
                alt=""
                className="w-12 h-12 rounded-full object-cover border border-border"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="font-bold text-xs text-text-primary hover:text-brand-purple cursor-pointer truncate"
                onClick={() => navigate(`/customer/vendor/${item.vendor?.id || item.vendor?._id}`)}
              >
                {item.vendor?.vendorProfile?.shopName || item.vendor?.name || 'Verified Vendor'}
              </h4>
              <span className="text-[9px] uppercase font-bold text-brand-purple tracking-wider truncate block">
                {getLabel()}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-text-tertiary mt-1">
                <FiClock size={10} />
                <span>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {item.vendor?.phone ? (
              <a
                href={`tel:${item.vendor.phone}`}
                className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition flex items-center justify-center gap-1"
              >
                <FiPhone size={11} /> Call Again
              </a>
            ) : (
              <div className="py-2 bg-surface-tertiary text-text-tertiary text-center rounded-xl text-[10px] font-bold">
                No Phone
              </div>
            )}
            <button
              onClick={() => navigate(`/customer/chat?vendorId=${item.vendor?.id || item.vendor?._id}`)}
              className="py-2 glass border border-border text-text-secondary hover:text-brand-purple rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
            >
              <FiMessageSquare size={11} /> Chat Direct
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
