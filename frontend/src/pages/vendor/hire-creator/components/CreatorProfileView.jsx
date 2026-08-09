import React, { useState } from 'react';
import {
  FiCheckCircle, FiStar, FiMapPin, FiArrowLeft, FiClock, FiVideo,
  FiShield, FiDollarSign, FiSend, FiPlay, FiHeart, FiMessageSquare,
  FiShare2, FiGrid, FiUser, FiInfo, FiTag
} from 'react-icons/fi';

export default function CreatorProfileView({ profile, onBack, onSelectHire }) {
  const [activeTab, setActiveTab] = useState('reels'); // reels | portfolio | campaigns | reviews | about
  const [playingVideo, setPlayingVideo] = useState(null); // URL of currently playing video

  const reels = profile.reels || [];
  const portfolioImages = profile.portfolioImages || [];
  const reviews = profile.reviews || [];
  const pricing = profile.pricing || { reel1: 0, reel3: 0 };

  const formatCount = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back Navigation Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2.5 glass border border-border text-text-primary rounded-xl hover:bg-surface-tertiary transition flex items-center gap-1.5 text-xs font-bold"
        >
          <FiArrowLeft size={16} /> Back to Creators
        </button>
        <span className="text-xs text-text-tertiary">Creator Profile Details / @{profile.username}</span>
      </div>

      {/* Profile Header & Covers */}
      <div className="glass rounded-3xl overflow-hidden border border-white/40 shadow-card relative">
        {/* Cover Backdrop */}
        <div className="h-44 sm:h-56 bg-cover bg-center relative" style={{ backgroundImage: `url(${profile.coverImage})` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Profile Info Overlay Container */}
        <div className="p-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 sm:-mt-12 text-center sm:text-left border-b border-border/40">
          <img
            src={profile.profile_pic}
            alt={profile.name}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-surface shadow-lg shrink-0"
          />

          <div className="flex-1 min-w-0 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-text-primary font-display">{profile.name}</h2>
                  {profile.isVerified && (
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold rounded-full flex items-center gap-0.5">
                      <FiCheckCircle size={11} /> Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-purple font-semibold mt-0.5">@{profile.username} • {profile.category}</p>
                <p className="text-xs text-text-tertiary flex items-center justify-center sm:justify-start gap-1 mt-1">
                  <FiMapPin size={13} /> {profile.city}, {profile.state}, {profile.country}
                </p>
              </div>

              <div className="flex items-center gap-2 justify-center shrink-0">
                <button
                  onClick={onSelectHire}
                  className="px-6 py-2.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
                >
                  <FiSend size={14} /> Hire Creator
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Social Metrics Section */}
        <div className="grid grid-cols-4 divide-x divide-border/30 py-4 text-center bg-surface-secondary/20">
          <div>
            <span className="text-sm sm:text-base font-black text-text-primary block">{formatCount(profile.followersCount)}</span>
            <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Followers</span>
          </div>
          <div>
            <span className="text-sm sm:text-base font-black text-text-primary block">{formatCount(profile.totalViews)}</span>
            <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Total Views</span>
          </div>
          <div>
            <span className="text-sm sm:text-base font-black text-text-primary block">{formatCount(profile.totalLikes)}</span>
            <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Likes Recd</span>
          </div>
          <div>
            <span className="text-sm sm:text-base font-black text-emerald-600 block">{profile.campaignsCompleted}</span>
            <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Shoots Done</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-border overflow-x-auto scrollbar-hide gap-6 text-xs font-bold text-text-tertiary">
        <button
          onClick={() => setActiveTab('reels')}
          className={`pb-3 flex items-center gap-1.5 shrink-0 border-b-2 transition-all ${activeTab === 'reels' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
        >
          <FiVideo size={15} /> Reels ({reels.length})
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`pb-3 flex items-center gap-1.5 shrink-0 border-b-2 transition-all ${activeTab === 'portfolio' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
        >
          <FiGrid size={15} /> Photos ({portfolioImages.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 flex items-center gap-1.5 shrink-0 border-b-2 transition-all ${activeTab === 'reviews' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
        >
          <FiStar size={15} /> Client Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`pb-3 flex items-center gap-1.5 shrink-0 border-b-2 transition-all ${activeTab === 'about' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
        >
          <FiUser size={15} /> Pricing & About
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[300px]">
        {/* REELS TAB PANEL */}
        {activeTab === 'reels' && (
          <div className="space-y-4">
            {reels.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border">
                <p className="font-bold text-text-secondary text-sm">No video reels uploaded</p>
                <p className="mt-1">This creator hasn't published any sample video shoots yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {reels.map((reel) => (
                  <div
                    key={reel._id || reel.id}
                    onClick={() => setPlayingVideo(reel)}
                    className="group aspect-[9/16] rounded-2xl overflow-hidden border border-border bg-black relative cursor-pointer shadow-sm hover:scale-[1.02] hover:shadow-md transition-all duration-300"
                  >
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.caption}
                      className="w-full h-full object-cover opacity-85 group-hover:opacity-75 transition-opacity"
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/90 text-brand-purple flex items-center justify-center shadow-lg">
                        <FiPlay size={20} className="ml-1" />
                      </div>
                    </div>

                    {/* Stats overlay bottom */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1"><FiPlay size={10} /> {formatCount(reel.views)}</span>
                      <span className="flex items-center gap-1"><FiHeart size={10} /> {formatCount(reel.likes)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PHOTO PORTFOLIO TAB PANEL */}
        {activeTab === 'portfolio' && (
          <div>
            {portfolioImages.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border">
                <p className="font-bold text-text-secondary text-sm">No photo portfolio images</p>
                <p className="mt-1">No photography items are uploaded to the portfolio.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {portfolioImages.map((img) => (
                  <div
                    key={img._id || img.id}
                    className="aspect-square rounded-2xl overflow-hidden border border-border relative group shadow-sm"
                  >
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 text-white text-xs font-bold">
                      <p className="truncate">{img.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB PANEL */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <span className="text-base font-black text-amber-500 flex items-center gap-1">
                <FiStar className="fill-amber-500" /> {(profile.rating_avg ?? 0).toFixed(1)}
              </span>
              <span className="text-xs text-text-tertiary">({reviews.length} Client Ratings Left)</span>
            </div>

            {reviews.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-xs text-text-tertiary border border-border">
                <p className="font-bold text-text-secondary text-sm">No reviews yet</p>
                <p className="mt-1">Work with this creator to leave their first marketplace review!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev._id || rev.id} className="glass rounded-2xl p-4 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.author?.avatarUrl}
                          alt={rev.author?.name}
                          className="w-8 h-8 rounded-full object-cover border border-border"
                        />
                        <div>
                          <h5 className="font-bold text-xs text-text-primary">{rev.author?.name}</h5>
                          <span className="text-[10px] text-text-tertiary">Verified Brand Collaboration</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-amber-500">
                        {Array.from({ length: Math.round(rev.rating) }).map((_, i) => (
                          <FiStar key={i} size={11} className="fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed bg-surface-secondary/40 p-2.5 rounded-xl border border-white/5">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABOUT & PRICING TAB PANEL */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bio & Details Column */}
            <div className="md:col-span-2 space-y-4">
              <div className="glass rounded-2xl p-4 border border-border/60 space-y-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <FiInfo size={14} className="text-brand-purple" />
                  <span>Bio & Specialty</span>
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">{profile.bio}</p>
              </div>

              <div className="glass rounded-2xl p-4 border border-border/60 space-y-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Creator Skills & Talents</h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills?.map((s, i) => (
                    <span key={i} className="text-xs font-bold bg-surface-secondary text-brand-purple px-3 py-1 rounded-xl border border-border">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Performance Statistics Card */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 glass rounded-xl border border-border text-center">
                  <span className="text-[9px] font-semibold text-text-tertiary uppercase block">Response</span>
                  <span className="text-xs font-extrabold text-brand-purple flex items-center justify-center gap-0.5 mt-1">
                    <FiClock size={12} /> {profile.responseTime}
                  </span>
                </div>
                <div className="p-3 glass rounded-xl border border-border text-center">
                  <span className="text-[9px] font-semibold text-text-tertiary uppercase block">KYC Verification</span>
                  <span className="text-xs font-extrabold text-blue-600 flex items-center justify-center gap-0.5 mt-1">
                    <FiShield size={12} /> Verified
                  </span>
                </div>
                <div className="p-3 glass rounded-xl border border-border text-center">
                  <span className="text-[9px] font-semibold text-text-tertiary uppercase block">Availability</span>
                  <span className="text-xs font-extrabold text-emerald-600 flex items-center justify-center gap-0.5 mt-1">
                    {profile.availabilityStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing Packages Sidebar Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <FiTag className="text-emerald-500" /> Pricing Packages
              </h4>

              <div className="glass rounded-2xl p-4 border border-border/60 space-y-4 bg-gradient-to-b from-brand-purple/5 to-transparent">
                <div className="border-b border-border/40 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">1 Video Reel Shoot</span>
                    <span className="text-sm font-black text-emerald-600">₹{pricing.reel1}</span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-1">Commercial license short-form promo video. Includes up to 2 revisions.</p>
                </div>

                <div className="border-b border-border/40 pb-3 relative">
                  <span className="absolute -top-3.5 -right-3.5 bg-brand-purple text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full">BEST</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-text-primary">3 Reels Bundle</span>
                    <span className="text-sm font-black text-emerald-600">₹{pricing.reel3}</span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-1">Full brand campaign kit of 3 high-engaging video shoots. Script included.</p>
                </div>

                {pricing.reel10 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">10 Reels Bulk Plan</span>
                      <span className="text-sm font-black text-emerald-600">₹{pricing.reel10}</span>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1">Monthly brand ambassador package of 10 promotional shoots.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FULL SCREEN REEL OVERLAY PLAYER MODAL */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between">
            {/* Top Back close button */}
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
            >
              Close
            </button>

            {/* Video Player */}
            <video
              src={playingVideo.videoUrl}
              autoPlay
              controls
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Video metadata overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-4 rounded-2xl text-white space-y-2">
              <p className="text-xs font-extrabold truncate">{playingVideo.caption || 'Commercial Shoot Sample'}</p>
              <div className="flex justify-between items-center text-[10px] text-text-tertiary">
                <span className="flex items-center gap-1"><FiPlay /> {playingVideo.views} Views</span>
                <span className="flex items-center gap-1"><FiHeart /> {playingVideo.likes} Likes</span>
                <span className="flex items-center gap-1"><FiMessageSquare /> {playingVideo.comments} Comments</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
