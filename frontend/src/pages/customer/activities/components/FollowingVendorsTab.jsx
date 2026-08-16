import React from 'react';
import { FiUserCheck, FiExternalLink, FiStar, FiMapPin, FiUserMinus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../../../lib/api';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

export default function FollowingVendorsTab({
  following = [],
  onUnfollow,
}) {
  const navigate = useNavigate();

  if (following.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#e3dccb] space-y-2 p-6 shadow-xs font-sans">
        <div className="w-12 h-12 rounded-full bg-[#f8f4ec] text-[#d99a3d] flex items-center justify-center mx-auto mb-2 border border-[#e3dccb]">
          <FiUserCheck size={22} />
        </div>
        <p className="text-sm font-bold text-[#1a1a1a]">You are not following any vendors yet</p>
        <p className="text-xs">Follow favorite local businesses to stay updated with their latest catalog items and reels.</p>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
      {following.map((f) => {
        const vendor = f.vendor || f.user || f;
        const vendorId = vendor._id || vendor.id;
        const vendorName = vendor.vendorProfile?.shopName || vendor.shopName || vendor.name || 'Verified Vendor';
        const avatar = resolveMediaUrl(vendor.avatarUrl || vendor.profile_pic || vendor.vendorProfile?.logo || DEFAULT_AVATAR);
        const city = vendor.city || vendor.location?.city || 'Local';

        return (
          <div
            key={vendorId}
            className="bg-white rounded-xl border border-[#e3dccb] p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt={vendorName}
                className="w-12 h-12 rounded-full object-cover border border-[#e3dccb] shrink-0"
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              />

              <div className="min-w-0">
                <h4 className="font-bold text-sm text-[#1a1a1a] truncate">{vendorName}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <FiMapPin size={11} className="text-[#d99a3d] shrink-0" />
                  <span>{city}</span>
                </p>
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#d99a3d] mt-1">
                  <FiStar size={11} className="fill-[#d99a3d]" />
                  <span>{vendor.rating_avg || vendor.rating || '4.9'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e3dccb]">
              <button
                type="button"
                onClick={() => navigate(`/customer/vendor/${vendorId}`)}
                className="py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <span>Visit Store</span>
                <FiExternalLink size={12} />
              </button>

              <button
                type="button"
                onClick={() => onUnfollow(vendorId)}
                className="py-1.5 rounded-lg bg-[#f8f4ec] hover:bg-red-50 hover:text-red-600 text-slate-600 border border-[#e3dccb] text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <FiUserMinus size={12} />
                <span>Unfollow</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
