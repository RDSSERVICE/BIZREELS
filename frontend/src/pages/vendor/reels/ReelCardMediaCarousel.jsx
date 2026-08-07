import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiVideo, FiImage } from 'react-icons/fi';

/**
 * ReelCardMediaCarousel Component
 * Displays videos or images with left/right navigation controls
 */
export default function ReelCardMediaCarousel({ reel }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const rawMediaList = Array.isArray(reel.mediaUrls) && reel.mediaUrls.length > 0
    ? reel.mediaUrls
    : [reel.videoUrl || reel.thumbnailUrl || 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4'];

  const mediaList = rawMediaList.filter(Boolean);
  const currentUrl = mediaList[currentIndex] || mediaList[0] || '';

  const checkIsVideo = (url) => {
    if (!url) return false;
    if (url.startsWith('data:video/')) return true;
    try {
      const path = url.split('?')[0].split('#')[0];
      return /\.(mp4|webm|mov|m4v|avi|mkv|3gp|flv|ogv)$/i.test(path);
    } catch {
      return /\.(mp4|webm|mov|m4v|avi|mkv|3gp|flv|ogv)/i.test(url);
    }
  };

  const isVideo = reel.mediaType === 'video' || checkIsVideo(currentUrl);

  const handlePrev = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % mediaList.length);
  };

  return (
    <div className="aspect-[9/16] bg-black relative group overflow-hidden">
      {isVideo ? (
        <video
          src={currentUrl}
          controls
          muted
          autoPlay
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={currentUrl}
          alt={reel.caption || reel.title || 'Reel Post'}
          className="w-full h-full object-cover"
        />
      )}

      {/* Purpose badge */}
      {reel.postPurpose && (
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-400 border border-amber-400/30 z-10">
          {reel.postPurpose}
        </div>
      )}

      {/* CAROUSEL ARROW BUTTONS & MEDIA COUNTER (IF > 1 MEDIA ITEMS) */}
      {mediaList.length > 1 && (
        <>
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-sm transition border border-white/20 shadow-md z-20 hover:scale-110"
            title="Previous Image/Video"
          >
            <FiChevronLeft size={20} />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-sm transition border border-white/20 shadow-md z-20 hover:scale-110"
            title="Next Image/Video"
          >
            <FiChevronRight size={20} />
          </button>

          {/* Media Count Badge */}
          <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white border border-white/20 z-10 flex items-center gap-1">
            {isVideo ? <FiVideo size={10} /> : <FiImage size={10} />}
            <span>{currentIndex + 1} / {mediaList.length}</span>
          </div>

          {/* Bottom Dot Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
            {mediaList.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === idx ? 'w-4 bg-brand-purple' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
