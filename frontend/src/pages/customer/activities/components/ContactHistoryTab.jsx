import React from 'react';
import { FiPhone, FiMessageSquare, FiExternalLink, FiClock, FiMapPin } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '../../../../components/common/OptimizedImage';
import { resolveMediaUrl } from '../../../../lib/api';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
const DEFAULT_LISTING_IMG = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=80';

export default function ContactHistoryTab({
  interactions = [],
  activeTab = 'click-to-called',
}) {
  const navigate = useNavigate();

  const isCall = activeTab === 'click-to-called';
  const isWhatsapp = activeTab === 'whatsapp-contacted';
  const isChat = activeTab === 'chat-inquiries';

  const typeTitle = isCall ? 'Call Requests' : isWhatsapp ? 'WhatsApp Inquiries' : 'Chat Messages';
  const Icon = isCall ? FiPhone : isWhatsapp ? FaWhatsapp : FiMessageSquare;

  if (interactions.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#e3dccb] space-y-2 p-6 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#f8f4ec] text-[#d99a3d] flex items-center justify-center mx-auto mb-2 border border-[#e3dccb]">
          <Icon size={20} />
        </div>
        <p className="text-sm font-bold text-[#1a1a1a]">No {typeTitle.toLowerCase()} yet</p>
        <p className="text-xs">When you call or chat with local vendors, your contact history will appear here.</p>
        <button
          onClick={() => navigate('/customer/search')}
          className="mt-3 px-4 py-2 bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
        >
          Discover Vendors
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans">
      {interactions.map((item) => {
        const itemId = item._id || item.id;
        const vendor = item.target_user || item.vendor || {};
        const listing = item.listing || {};
        const vendorName = vendor.shopName || vendor.name || 'Local Vendor';
        const vendorAvatar = resolveMediaUrl(vendor.avatarUrl || vendor.profile_pic || DEFAULT_AVATAR);
        const listingImg = resolveMediaUrl(listing.images?.[0] || listing.image || DEFAULT_LISTING_IMG);

        return (
          <div
            key={itemId}
            className="bg-white rounded-xl border border-[#e3dccb] p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={vendorAvatar}
                alt={vendorName}
                className="w-12 h-12 rounded-full object-cover border border-[#e3dccb] shrink-0"
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold flex items-center gap-1 uppercase ${
                    isCall ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    isWhatsapp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-purple-50 text-[#7c3aed] border border-purple-200'
                  }`}>
                    <Icon size={10} />
                    <span>{isCall ? 'Call Made' : isWhatsapp ? 'WhatsApp' : 'Chat Inquiry'}</span>
                  </span>
                  <span className="text-[10.5px] text-slate-400">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recently'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-[#1a1a1a] mt-0.5 truncate">{vendorName}</h4>
                {listing.title && (
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                    <span>Re: <strong>{listing.title}</strong></span>
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {vendor._id && (
                <button
                  type="button"
                  onClick={() => navigate(`/customer/vendor/${vendor._id || vendor.id}`)}
                  className="px-3 py-1.5 rounded-lg bg-[#f8f4ec] hover:bg-[#e3dccb] text-[#1a1a1a] text-xs font-bold transition flex items-center gap-1 border border-[#e3dccb] cursor-pointer"
                >
                  <span>Visit Shop</span>
                  <FiExternalLink size={12} />
                </button>
              )}

              {isChat && vendor._id && (
                <button
                  type="button"
                  onClick={() => navigate(`/customer/chat?vendorId=${vendor._id || vendor.id}`)}
                  className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <FiMessageSquare size={12} />
                  <span>Open Chat</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
