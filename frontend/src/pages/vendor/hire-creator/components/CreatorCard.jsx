import React from 'react';
import { FiCheckCircle, FiStar, FiMapPin, FiEye, FiSend, FiUsers, FiVideo, FiTrendingUp } from 'react-icons/fi';

export default function CreatorCard({ creator, onSelectDetails, onSelectHire }) {
  const name = creator.name || 'Verified Creator';
  const username = creator.username ? `@${creator.username}` : '';
  const category = creator.category || 'Visual Creator';
  const bio = creator.bio || 'Verified content creator on BizReels.';
  const city = creator.city || 'Mumbai';
  const isVerified = !!creator.isVerified;
  const rating = creator.rating_avg || 5.0;
  const reviewsCount = creator.rating_count || 0;
  const reelPrice = creator.pricing?.reel1 || 800;
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
    <div className="glass rounded-3xl p-5 border border-white/40 shadow-card flex flex-col justify-between space-y-4 hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group">
      {/* Background Glow Effect */}
      <div className="absolute -right-16 -top-16 w-32 h-32 bg-brand-purple/10 rounded-full blur-2xl group-hover:bg-brand-purple/20 transition-all duration-300" />
      
      <div>
        {/* Top Info Header */}
        <div className="flex items-start gap-4">
          <img
            src={creator.profile_pic}
            alt={name}
            className="w-16 h-16 rounded-2xl object-cover border border-border shrink-0 shadow-sm cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={onSelectDetails}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate cursor-pointer" onClick={onSelectDetails}>
                <h4 className="font-bold text-sm text-text-primary hover:text-brand-purple transition truncate">{name}</h4>
                {isVerified && (
                  <FiCheckCircle className="text-emerald-500 shrink-0" size={14} title="Verified Profile" />
                )}
              </div>
              <span className="flex items-center gap-0.5 text-amber-500 text-xs font-bold shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-500/20">
                <FiStar size={11} className="fill-amber-500" /> {rating.toFixed(1)}
              </span>
            </div>
            
            {username && <p className="text-[10px] text-text-tertiary truncate -mt-0.5 font-medium">{username}</p>}

            <p className="text-xs text-brand-purple font-semibold flex items-center gap-1 mt-1">
              <span>{category}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-text-tertiary font-normal">
                <FiMapPin size={11} /> {city}
              </span>
            </p>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-text-secondary mt-3 line-clamp-2 leading-relaxed min-h-[32px]">{bio}</p>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 py-2 px-3 bg-surface-secondary/40 rounded-xl border border-white/5 text-center text-xs">
          <div>
            <span className="text-[10px] text-text-tertiary font-medium block">Followers</span>
            <span className="font-extrabold text-text-primary flex items-center justify-center gap-1">
              <FiUsers size={11} className="text-brand-purple" /> {formatCount(followers)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary font-medium block">Total Reels</span>
            <span className="font-extrabold text-text-primary flex items-center justify-center gap-1">
              <FiVideo size={11} className="text-violet-500" /> {reelsCount}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary font-medium block">Campaigns</span>
            <span className="font-extrabold text-text-primary flex items-center justify-center gap-1">
              <FiTrendingUp size={11} className="text-emerald-500" /> {campaignsCount}
            </span>
          </div>
        </div>

        {/* Languages & Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {languagesList.map((l, i) => (
            <span key={i} className="text-[9px] font-bold bg-white/40 border border-white/50 text-text-secondary px-2 py-0.5 rounded-full uppercase tracking-wider">
              {String(l).trim()}
            </span>
          ))}
          {creator.availabilityStatus === 'Available' && (
            <span className="text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-wider ml-auto">
              Available
            </span>
          )}
        </div>
      </div>

      {/* Pricing & Call-to-action Footer */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between">
        <div>
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider block">Starting Package</span>
          <p className="text-sm font-extrabold text-emerald-600">₹{reelPrice}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSelectDetails}
            className="px-3 py-2 glass border border-border text-text-primary font-bold text-xs rounded-xl hover:bg-surface-tertiary transition flex items-center gap-1.5"
          >
            <FiEye size={13} /> View Profile
          </button>

          <button
            onClick={onSelectHire}
            className="px-4 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
          >
            <FiSend size={13} /> Hire
          </button>
        </div>
      </div>
    </div>
  );
}
