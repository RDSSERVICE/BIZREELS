import React from 'react';
import { FiCheckCircle, FiStar, FiMapPin, FiEye, FiSend, FiUsers, FiVideo, FiTrendingUp } from 'react-icons/fi';

export default function CreatorCard({ creator, onSelectDetails, onSelectHire }) {
  const name = creator.name || 'Verified Creator';
  const username = creator.username ? `@${creator.username}` : '';
  const category = creator.category || 'Visual Creator';
  const bio = creator.bio || 'Verified content creator on BizReels.';
  const city = creator.city || 'Mumbai';
  const isVerified = !!creator.isVerified;
  const rating = creator.rating_avg ?? 0;
  const reviewsCount = creator.rating_count ?? 0;
  const reelPrice = creator.pricing?.reel1 || 0;
  const followers = creator.followersCount || 0;
  const reelsCount = creator.totalReels || 0;
  const campaignsCount = creator.totalCampaigns || 0;

  const languagesList = Array.isArray(creator.languages) 
    ? creator.languages 
    : (typeof creator.languages === 'string' 
      ? creator.languages.split(',') 
      : []);

  const formatCount = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] shadow-2xs hover:shadow-md hover:border-[#241b15] transition-all duration-200 flex flex-col justify-between space-y-3.5 font-sans relative overflow-hidden group">
      
      <div>
        {/* Top Info Header */}
        <div className="flex items-start gap-3.5">
          <img
            src={creator.profile_pic || '/logo.png'}
            alt={name}
            className="w-14 h-14 rounded-xl object-cover border border-[#e3dccb] bg-[#f8f4ec] p-0.5 shrink-0 shadow-2xs cursor-pointer hover:scale-105 transition-transform"
            onClick={onSelectDetails}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 min-w-0 cursor-pointer" onClick={onSelectDetails}>
                <h4 className="font-extrabold text-sm text-[#1a1a1a] hover:text-[#d99a3d] transition truncate">{name}</h4>
                {isVerified && (
                  <FiCheckCircle className="text-emerald-600 shrink-0" size={14} title="Verified Profile" />
                )}
              </div>

              {/* Rating Badge */}
              <span className="flex items-center gap-1 text-[#d99a3d] bg-[#241b15] text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 shadow-2xs">
                <FiStar size={11} className="fill-[#d99a3d]" /> {rating.toFixed(1)}
              </span>
            </div>
            
            {username && <p className="text-[10px] text-slate-400 truncate font-semibold">{username}</p>}

            <p className="text-xs font-bold text-[#d99a3d] flex items-center gap-1 mt-1">
              <span className="truncate">{category}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-0.5 text-slate-500 font-semibold shrink-0">
                <FiMapPin size={11} /> {city}
              </span>
            </p>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed min-h-[32px] font-medium">{bio}</p>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 py-2 px-3 bg-[#f8f4ec] rounded-xl border border-[#e3dccb] text-center text-xs">
          <div>
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Followers</span>
            <span className="font-black text-[#1a1a1a] flex items-center justify-center gap-1 mt-0.5">
              <FiUsers size={11} className="text-[#d99a3d]" /> {formatCount(followers)}
            </span>
          </div>
          <div>
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Reels</span>
            <span className="font-black text-[#1a1a1a] flex items-center justify-center gap-1 mt-0.5">
              <FiVideo size={11} className="text-[#241b15]" /> {reelsCount}
            </span>
          </div>
          <div>
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Campaigns</span>
            <span className="font-black text-[#1a1a1a] flex items-center justify-center gap-1 mt-0.5">
              <FiTrendingUp size={11} className="text-emerald-700" /> {campaignsCount}
            </span>
          </div>
        </div>

        {/* Languages & Tags */}
        <div className="flex flex-wrap items-center gap-1 mt-3">
          {languagesList.map((l, i) => (
            <span key={i} className="text-[9.5px] font-bold bg-[#f8f4ec] border border-[#e3dccb] text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">
              {String(l).trim()}
            </span>
          ))}
          {creator.availabilityStatus === 'Available' && (
            <span className="text-[9.5px] font-black bg-emerald-100 border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded uppercase tracking-wider ml-auto">
              Available
            </span>
          )}
        </div>
      </div>

      {/* Pricing & Call-to-action Footer */}
      <div className="pt-3 border-t border-[#e3dccb] flex items-center justify-between">
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Starting Package</span>
          <p className="text-sm font-black text-emerald-700">₹{reelPrice}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSelectDetails}
            className="px-3 py-1.5 bg-[#f8f4ec] hover:bg-white text-[#1a1a1a] font-bold text-xs rounded-lg border border-[#e3dccb] transition flex items-center gap-1 cursor-pointer"
          >
            <FiEye size={13} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={onSelectHire}
            className="px-4 py-1.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] font-black text-xs rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer border-none"
          >
            <FiSend size={13} />
            <span>Hire</span>
          </button>
        </div>
      </div>
    </div>
  );
}
