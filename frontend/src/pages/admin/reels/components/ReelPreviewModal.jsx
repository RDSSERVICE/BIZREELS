import React, { useRef, useState } from 'react';
import {
  FiX,
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiZap,
  FiTrash2,
  FiRefreshCw,
  FiShield,
  FiShoppingBag,
  FiExternalLink,
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';
import { formatCompactNumber } from './reelUtils';

export default function ReelPreviewModal({
  reel,
  onClose,
  onToggleBoost,
  onModerate,
  onTakedown,
  onRestore
}) {
  if (!reel) return null;

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const id = reel.id || reel._id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]">
        {/* Left: 9:16 Video Player */}
        <div className="relative bg-black flex items-center justify-center w-full md:w-[320px] shrink-0 min-h-[280px] md:min-h-[500px]">
          {reel.videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={reel.videoUrl}
                poster={reel.thumbnailUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-contain max-h-[50vh] md:max-h-[500px]"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Video control overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1 hover:text-[#d99a3d] transition-colors"
                >
                  {isPlaying ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1 hover:text-[#d99a3d] transition-colors"
                >
                  {isMuted ? <FiVolumeX className="w-4 h-4" /> : <FiVolume2 className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center p-6 text-stone-400">
              <FiPlay className="w-12 h-12 mx-auto mb-2 text-stone-600" />
              <p className="text-xs font-['Outfit']">No direct video stream available.</p>
              {reel.isLiveStream && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                  Live Stream Broadcast
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Reel Insights, E-commerce Linkage & Moderation Controls */}
        <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto">
          {/* Header with close button */}
          <div className="flex items-start justify-between gap-3 border-b border-[#e3dccb] pb-3 mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#d99a3d] font-['Outfit']">
                Reel Telemetry & Moderation
              </span>
              <h2 className="text-base font-black text-[#1a1a1a] font-['Archivo_Black'] leading-tight mt-0.5">
                {reel.creator_name || reel.creator?.name || 'Creator Reel'}
              </h2>
              {reel.creator?.phone && (
                <span className="text-xs text-[#1a1a1a]/60 font-mono">
                  {reel.creator.phone}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-[#e3dccb]/40 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Caption & Content details */}
          <div className="space-y-3 mb-4 flex-1">
            <div>
              <label className="text-[11px] font-bold text-[#1a1a1a]/50 uppercase tracking-wider block mb-1 font-['Outfit']">
                Caption
              </label>
              <p className="text-xs text-[#1a1a1a] bg-[#fbf9f4] p-3 rounded-lg border border-[#e3dccb] font-['Outfit'] leading-relaxed">
                {reel.caption || 'No caption provided.'}
              </p>
            </div>

            {/* Hashtags */}
            {reel.hashtags && reel.hashtags.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-[#1a1a1a]/50 uppercase tracking-wider block mb-1 font-['Outfit']">
                  Tags & Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {reel.category && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1a1a1a] text-[#fbf9f4]">
                      {reel.category}
                    </span>
                  )}
                  {reel.hashtags.map((h, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#e3dccb]/50 text-[#1a1a1a]/80"
                    >
                      #{h.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Commerce Listing Association */}
            {reel.targetListing && (
              <div className="bg-[#fbf9f4] border border-[#d99a3d]/30 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 font-bold text-[#1a1a1a]">
                    <FiShoppingBag className="w-3.5 h-3.5 text-[#d99a3d]" />
                    Linked Listing
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#d99a3d] px-1.5 py-0.5 rounded bg-[#d99a3d]/10">
                    {reel.postType || 'Product'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#1a1a1a] truncate mb-1">
                  {reel.targetListing.title}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#1a1a1a]">
                    ₹{reel.price || reel.targetListing.price || 0}
                  </span>
                  {reel.targetListing._id && (
                    <a
                      href={`/listing/${reel.targetListing._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#d99a3d] hover:underline font-bold"
                    >
                      <span>View Storefront</span>
                      <FiExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Moderation Diagnostics */}
            <div className="bg-[#fbf9f4] border border-[#e3dccb] rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-[#1a1a1a]/50 uppercase tracking-wider block font-['Outfit']">
                Moderation Diagnostics
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* AI Safety Check */}
                <div className="p-2 rounded-lg bg-[#f8f4ec] border border-[#e3dccb]">
                  <span className="text-[10px] text-[#1a1a1a]/60 block mb-0.5">AI Automated Check</span>
                  {reel.aiModeration?.passed === false ? (
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <FiAlertTriangle className="w-3 h-3" /> Flagged
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3" /> Passed
                    </span>
                  )}
                  {reel.aiModeration?.violationReason && (
                    <p className="text-[10px] text-rose-700 mt-1 truncate">
                      {reel.aiModeration.violationReason}
                    </p>
                  )}
                </div>

                {/* Admin Review Status */}
                <div className="p-2 rounded-lg bg-[#f8f4ec] border border-[#e3dccb]">
                  <span className="text-[10px] text-[#1a1a1a]/60 block mb-0.5">Admin Review</span>
                  <span className="font-bold text-[#1a1a1a] capitalize">
                    {reel.adminReview?.status || 'None'}
                  </span>
                  {reel.adminReview?.comments && (
                    <p className="text-[10px] text-[#1a1a1a]/70 mt-1 truncate">
                      {reel.adminReview.comments}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics Counters */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#fbf9f4] border border-[#e3dccb] rounded-lg p-2">
                <span className="text-[10px] text-[#1a1a1a]/50 uppercase block font-bold">Views</span>
                <span className="font-mono font-bold text-sm text-[#1a1a1a]">
                  {formatCompactNumber(reel.views || 0)}
                </span>
              </div>
              <div className="bg-[#fbf9f4] border border-[#e3dccb] rounded-lg p-2">
                <span className="text-[10px] text-[#1a1a1a]/50 uppercase block font-bold">Likes</span>
                <span className="font-mono font-bold text-sm text-[#1a1a1a]">
                  {formatCompactNumber(reel.likesCount || 0)}
                </span>
              </div>
              <div className="bg-[#fbf9f4] border border-[#e3dccb] rounded-lg p-2">
                <span className="text-[10px] text-[#1a1a1a]/50 uppercase block font-bold">Comments</span>
                <span className="font-mono font-bold text-sm text-[#1a1a1a]">
                  {formatCompactNumber(reel.commentsCount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="border-t border-[#e3dccb] pt-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {/* Moderate button */}
              <button
                type="button"
                onClick={() => onModerate(reel)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fbf9f4] hover:bg-[#e3dccb]/40 border border-[#e3dccb] text-[#1a1a1a] text-xs font-bold transition-all font-['Outfit']"
              >
                <FiShield className="w-3.5 h-3.5" />
                <span>Audit / Moderate</span>
              </button>

              {/* Boost toggle button */}
              {!reel.isDeleted && !reel.isLiveStream && (
                <button
                  type="button"
                  onClick={() => onToggleBoost(reel)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all font-['Outfit'] ${
                    reel.isBoosted
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-[#fbf9f4] border-[#e3dccb] hover:border-[#1a1a1a] text-[#1a1a1a]'
                  }`}
                >
                  <FiZap className="w-3.5 h-3.5" />
                  <span>{reel.isBoosted ? 'Remove Boost' : 'Boost Reel'}</span>
                </button>
              )}
            </div>

            {/* Takedown / Restore */}
            <div>
              {reel.isDeleted ? (
                <button
                  type="button"
                  onClick={() => {
                    onRestore(id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all font-['Outfit']"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  <span>Restore Reel</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onTakedown(reel);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all font-['Outfit']"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  <span>{reel.isLiveStream ? 'End Broadcast' : 'Takedown Reel'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
