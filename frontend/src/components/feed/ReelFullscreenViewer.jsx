import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiX,
  FiVolume2, FiVolumeX, FiMapPin, FiPhone, FiMessageSquare,
  FiChevronUp, FiChevronDown, FiShield, FiStar, FiUserPlus, FiCheck
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

/**
 * ReelFullscreenViewer
 * Full-screen vertical scroll viewer for video reels.
 * Shows vendor profile for boosted reels with masked contact info.
 */
export default function ReelFullscreenViewer({ reels, startIndex = 0, onClose, onLike, onSave, onFollow, likedMap = {}, savedMap = {}, followingMap = {} }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef(null);
  const videoRefs = useRef([]);

  const currentReel = reels[currentIndex];

  // Auto-play current video, pause others
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (video) {
        if (idx === currentIndex) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentIndex]);

  const goUp = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const goDown = () => {
    if (currentIndex < reels.length - 1) setCurrentIndex(prev => prev + 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowUp') goUp();
      else if (e.key === 'ArrowDown') goDown();
      else if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex]);

  // Touch swipe handling
  const touchStart = useRef(null);
  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const diff = touchStart.current - e.changedTouches[0].clientY;
    if (diff > 60) goDown();
    else if (diff < -60) goUp();
    touchStart.current = null;
  };

  // Mask phone number: show first 2 and last 4 digits
  const maskPhone = (phone) => {
    if (!phone) return '••••••••••';
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 6) return '••••••••••';
    return clean.slice(0, 2) + '••••' + clean.slice(-4);
  };

  // Mask address: show only city
  const maskAddress = (vendor) => {
    const city = vendor?.vendorProfile?.city || vendor?.city || vendor?.location?.city || '';
    const state = vendor?.vendorProfile?.state || vendor?.location?.state || '';
    return city ? `${city}${state ? ', ' + state : ''}` : 'India';
  };

  const handleTrackInteraction = async (type, reel) => {
    try {
      await api.post('/v1/users/me/track-interaction', {
        type,
        reelId: reel._id || reel.id,
        targetUserId: reel.creator?._id || reel.creator?.id || reel.creator,
        metadata: { reelTitle: reel.caption || '', isBoosted: reel.isBoosted }
      });
    } catch {}
  };

  const handleWhatsApp = (reel) => {
    handleTrackInteraction('whatsapp_contact', reel);
    const phone = reel.creator?.phone || reel.creator?.vendorProfile?.whatsapp || '';
    const text = `Hi! I saw your reel on BizReels and I'm interested.`;
    if (phone) {
      window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      toast('WhatsApp number not available');
    }
  };

  const handleCallRequest = (reel) => {
    handleTrackInteraction('click_to_call', reel);
    const phone = reel.creator?.phone || '';
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    } else {
      toast.success('Call request sent to vendor!');
    }
  };

  const handleInquiry = (reel) => {
    handleTrackInteraction('chat_inquiry', reel);
    toast.success('Inquiry sent! Vendor will respond shortly.');
  };

  if (!currentReel) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition border border-white/10"
      >
        <FiX size={20} />
      </button>

      {/* Navigation arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
        <button
          onClick={goUp}
          disabled={currentIndex === 0}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/60 transition border border-white/10"
        >
          <FiChevronUp size={20} />
        </button>
        <button
          onClick={goDown}
          disabled={currentIndex === reels.length - 1}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/60 transition border border-white/10"
        >
          <FiChevronDown size={20} />
        </button>
      </div>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-40 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold border border-white/10">
        {currentIndex + 1} / {reels.length}
      </div>

      {/* Mute toggle */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-40 p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition border border-white/10"
      >
        {muted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
      </button>

      {/* Video */}
      <div className="w-full h-full max-w-[500px] mx-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <video
              ref={el => videoRefs.current[currentIndex] = el}
              src={currentReel.videoUrl || currentReel.mediaUrls?.[0] || ''}
              loop
              muted={muted}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Right-side action buttons */}
        <div className="absolute right-3 bottom-32 z-30 flex flex-col items-center gap-5">
          {/* Like */}
          <button
            onClick={() => onLike?.(currentReel._id || currentReel.id)}
            className="flex flex-col items-center gap-1"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
              likedMap[currentReel._id || currentReel.id] ? 'bg-red-500 text-white' : 'bg-black/40 text-white'
            }`}>
              <FiHeart size={20} fill={likedMap[currentReel._id || currentReel.id] ? 'currentColor' : 'none'} />
            </div>
            <span className="text-white text-[10px] font-bold">{currentReel.likesCount || 0}</span>
          </button>

          {/* Comments */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center">
              <FiMessageCircle size={20} />
            </div>
            <span className="text-white text-[10px] font-bold">{currentReel.commentsCount || 0}</span>
          </button>

          {/* Save */}
          <button
            onClick={() => onSave?.(currentReel._id || currentReel.id)}
            className="flex flex-col items-center gap-1"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
              savedMap[currentReel._id || currentReel.id] ? 'bg-brand-purple text-white' : 'bg-black/40 text-white'
            }`}>
              <FiBookmark size={20} fill={savedMap[currentReel._id || currentReel.id] ? 'currentColor' : 'none'} />
            </div>
            <span className="text-white text-[10px] font-bold">Save</span>
          </button>

          {/* Share */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/customer/home?reel=${currentReel._id || currentReel.id}`;
              navigator.clipboard?.writeText(url);
              toast.success('Link copied!');
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center">
              <FiShare2 size={20} />
            </div>
            <span className="text-white text-[10px] font-bold">Share</span>
          </button>
        </div>

        {/* Bottom vendor info overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-20">
          {/* Vendor Profile */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden flex-shrink-0">
              {currentReel.creator?.profile_pic || currentReel.creator?.avatarUrl ? (
                <img
                  src={currentReel.creator.profile_pic || currentReel.creator.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-brand-purple/30 flex items-center justify-center text-white font-bold text-sm">
                  {(currentReel.creator?.name || 'V').charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-bold truncate">
                  {currentReel.creator?.vendorProfile?.shopName || currentReel.creator?.name || 'Vendor'}
                </p>
                {currentReel.isBoosted && (
                  <span className="bg-yellow-400/20 text-yellow-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-yellow-400/30">
                    PROMOTED
                  </span>
                )}
              </div>
              <p className="text-white/60 text-[10px] truncate">
                {currentReel.category || 'Business'} • {currentReel.subcategory || ''}
              </p>
            </div>
            {/* Follow button */}
            <button
              onClick={() => onFollow?.(currentReel.creator?._id || currentReel.creator?.id || currentReel.creator)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition border ${
                followingMap[currentReel.creator?._id || currentReel.creator?.id || currentReel.creator]
                  ? 'bg-white/10 text-white/80 border-white/20'
                  : 'bg-white text-black border-white hover:bg-white/90'
              }`}
            >
              {followingMap[currentReel.creator?._id || currentReel.creator?.id || currentReel.creator] ? (
                <><FiCheck size={10} className="inline mr-1" />Following</>
              ) : (
                <><FiUserPlus size={10} className="inline mr-1" />Follow</>
              )}
            </button>
          </div>

          {/* Boosted reel: Vendor masked info + action buttons */}
          {currentReel.isBoosted && (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-white/70 text-[10px]">
                <span className="flex items-center gap-1">
                  <FiMapPin size={10} /> {maskAddress(currentReel.creator)}
                </span>
                <span className="flex items-center gap-1">
                  <FiPhone size={10} /> {maskPhone(currentReel.creator?.phone)}
                </span>
                {currentReel.creator?.is_subscribed_verified && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <FiShield size={10} /> Verified
                  </span>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleWhatsApp(currentReel)}
                  className="flex flex-col items-center gap-1 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition border border-emerald-500/20"
                >
                  <FaWhatsapp size={16} />
                  <span className="text-[8px] font-bold">WhatsApp</span>
                </button>
                <button
                  onClick={() => handleCallRequest(currentReel)}
                  className="flex flex-col items-center gap-1 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition border border-blue-500/20"
                >
                  <FiPhone size={16} />
                  <span className="text-[8px] font-bold">Call</span>
                </button>
                <button
                  onClick={() => handleInquiry(currentReel)}
                  className="flex flex-col items-center gap-1 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition border border-purple-500/20"
                >
                  <FiMessageSquare size={16} />
                  <span className="text-[8px] font-bold">Chat</span>
                </button>
                <button
                  onClick={() => handleInquiry(currentReel)}
                  className="flex flex-col items-center gap-1 py-2 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition border border-orange-500/20"
                >
                  <FiMessageCircle size={16} />
                  <span className="text-[8px] font-bold">Inquiry</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
