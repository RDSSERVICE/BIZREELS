import React from 'react';
import { FiMessageSquare, FiClock, FiTrash2, FiExternalLink, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../../../lib/api';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

export default function InquiriesTab({
  inquiries = [],
  onCloseInquiry,
  onDeleteInquiry,
}) {
  const navigate = useNavigate();

  if (inquiries.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#e3dccb] space-y-2 p-6 shadow-xs font-sans">
        <div className="w-12 h-12 rounded-full bg-[#f8f4ec] text-[#d99a3d] flex items-center justify-center mx-auto mb-2 border border-[#e3dccb]">
          <FiMessageSquare size={20} />
        </div>
        <p className="text-sm font-bold text-[#1a1a1a]">No direct inquiries sent</p>
        <p className="text-xs">Inquiries sent to vendors for catalog products or custom quotes will appear here.</p>
        <button
          onClick={() => navigate('/customer/search')}
          className="mt-3 px-4 py-2 bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
        >
          Browse Vendors
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans">
      {inquiries.map((inq) => {
        const inqId = inq._id || inq.id;
        const vendor = inq.vendor || {};
        const vendorName = vendor.shopName || vendor.name || 'Local Vendor';
        const vendorAvatar = resolveMediaUrl(vendor.avatarUrl || vendor.profile_pic || DEFAULT_AVATAR);
        const isOpen = inq.status !== 'closed' && inq.status !== 'resolved';

        return (
          <div
            key={inqId}
            className="bg-white rounded-xl border border-[#e3dccb] p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <img
                src={vendorAvatar}
                alt={vendorName}
                className="w-11 h-11 rounded-full object-cover border border-[#e3dccb] shrink-0 mt-0.5 sm:mt-0"
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase ${
                    isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isOpen ? 'Active' : 'Closed'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-[#1a1a1a] mt-0.5 truncate">{vendorName}</h4>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {inq.message || inq.subject || 'Product/Service inquiry'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {vendor._id && (
                <button
                  type="button"
                  onClick={() => navigate(`/customer/chat?vendorId=${vendor._id || vendor.id}`)}
                  className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <FiMessageSquare size={12} />
                  <span>Open Chat</span>
                </button>
              )}

              {isOpen && (
                <button
                  type="button"
                  onClick={() => onCloseInquiry(inqId)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#f8f4ec] hover:bg-[#e3dccb] text-slate-600 text-xs font-semibold border border-[#e3dccb] transition cursor-pointer"
                >
                  Close
                </button>
              )}

              <button
                type="button"
                onClick={() => onDeleteInquiry(inqId)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                title="Delete Inquiry"
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
