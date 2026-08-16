import React from 'react';
import { FiMapPin, FiMessageSquare, FiShare2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../../../lib/api';

export default function FollowingVendorsTab({
  vendors = [],
  onUnfollow,
  onShare,
}) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.map((v) => {
        const shopName = v.vendorProfile?.shopName || v.vendorProfile?.businessName || v.name;
        const logo = v.vendorProfile?.shopLogo || v.profile_pic || v.avatarUrl || 'https://via.placeholder.com/150';
        const categoryText = v.vendorProfile?.category || v.vendorProfile?.categories?.join(', ') || v.roles?.join(', ') || 'Vendor';
        const locationText = v.vendorProfile?.address?.city || v.city || 'Local Area';
        const postsCount = v.vendorProfile?.totalPosts || 0;
        const verified = v.kyc_status === 'approved' || v.is_subscribed_verified;
        const isOnline = v.is_active;

        return (
          <div
            key={v.id || v._id}
            className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={resolveMediaUrl(logo)}
                  alt={shopName}
                  className="w-12 h-12 rounded-full object-cover border border-border"
                />
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h4
                    className="font-bold text-xs text-text-primary hover:text-brand-purple cursor-pointer truncate"
                    onClick={() => navigate(`/customer/vendor/${v.id || v._id}`)}
                  >
                    {shopName}
                  </h4>
                  {verified && <span className="text-[10px] text-blue-500 font-bold flex-shrink-0" title="Verified Badge">✓</span>}
                </div>
                <p className="text-[9px] uppercase font-bold text-brand-purple tracking-wider truncate">{categoryText}</p>
                <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                  <FiMapPin size={10} />
                  <span>{locationText}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-surface-secondary/40 border border-border/60 rounded-xl text-center text-[10px] text-text-secondary">
              <div>
                <span className="block font-bold text-text-primary text-xs">{v.followersCount || 0}</span>
                <span className="text-[8px] text-text-tertiary uppercase">Followers</span>
              </div>
              <div>
                <span className="block font-bold text-text-primary text-xs">{v.rating_avg || 0}</span>
                <span className="text-[8px] text-text-tertiary uppercase">Rating</span>
              </div>
              <div>
                <span className="block font-bold text-text-primary text-xs">{postsCount}</span>
                <span className="text-[8px] text-text-tertiary uppercase">Posts</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => navigate(`/customer/vendor/${v.id || v._id}`)}
                className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition"
              >
                Visit Profile
              </button>
              <button
                onClick={() => onUnfollow(v.id || v._id, shopName)}
                className="py-2 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-semibold transition"
              >
                Unfollow
              </button>
            </div>

            <div className="flex justify-between items-center text-[9px] text-text-tertiary border-t border-border/50 pt-2">
              <button
                onClick={() => navigate(`/customer/chat?vendorId=${v.id || v._id}`)}
                className="hover:text-brand-purple font-semibold flex items-center gap-0.5"
              >
                <FiMessageSquare size={10} /> Chat Direct
              </button>
              <button
                onClick={() => onShare('vendor', v.id || v._id, shopName)}
                className="hover:text-brand-purple font-semibold flex items-center gap-0.5"
              >
                <FiShare2 size={10} /> Share
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
