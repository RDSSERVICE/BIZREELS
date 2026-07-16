import React, { useRef, useEffect, useState } from 'react';
import { FiVolume2, FiVolumeX, FiHeart } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Premium vertical VideoPlayer component.
 * Features IntersectionObserver autoplay, double-tap to like animation, and volume syncing.
 */
const VideoPlayer = ({
  src,
  poster,
  isActive, // set by parent based on scroll snapping index
  onDoubleTap,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);

  // Synchronize playing state with isActive index trigger
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // reset playback
      setIsPlaying(false);
    }
  }, [isActive]);

  // Autoplay/pause trigger when viewport moves away (safety guard)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!videoRef.current) return;

        if (entry.isIntersecting && isActive) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.6 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isActive]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleVolumeToggle = (e) => {
    e.stopPropagation(); // prevent play/pause click trigger
    if (!videoRef.current) return;

    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Double tap handler
  let lastTap = 0;
  const handleVideoTap = (e) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (now - lastTap < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      setShowHeart(true);
      if (onDoubleTap) onDoubleTap();
      setTimeout(() => setShowHeart(false), 800); // hide after animation finishes
    } else {
      // Single tap triggers play/pause
      handlePlayPause();
    }
    lastTap = now;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-brand-navy-dark overflow-hidden flex items-center justify-center cursor-pointer"
      onClick={handleVideoTap}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover"
      />

      {/* Play/Pause state HUD indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-navy-dark/20 pointer-events-none">
          <span className="p-4 rounded-full bg-black/45 text-white/90 text-sm font-bold tracking-widest uppercase backdrop-blur-xs">
            Paused
          </span>
        </div>
      )}

      {/* Double Tap Heart Pop animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.2, 1], opacity: [0, 1, 1] }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <FiHeart className="w-24 h-24 text-brand-pink fill-brand-pink filter drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Speaker control overlay */}
      <button
        onClick={handleVolumeToggle}
        className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/50 text-white backdrop-blur-xs hover:bg-black/70 transition-all border border-white/10 z-10"
      >
        {isMuted ? <FiVolumeX className="w-4 h-4" /> : <FiVolume2 className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default VideoPlayer;
