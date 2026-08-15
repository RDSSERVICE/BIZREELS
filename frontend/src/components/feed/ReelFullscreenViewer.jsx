import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiX,
  FiVolume2, FiVolumeX, FiMapPin, FiPhone, FiMessageSquare,
  FiShield, FiUserPlus, FiCheck
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import ChatDrawer from '../ui/ChatDrawer';

/**
 * ReelFullscreenViewer
 * Full-screen vertical scroll-snap viewer for video reels.
 * Shows vendor profile for boosted reels with masked contact info.
 */
export default function ReelFullscreenViewer({ reels, startIndex = 0, onClose, onLike, onSave, onFollow, likedMap = {}, savedMap = {}, followingMap = {} }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef(null);

  // In-context Chat drawer state
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatDrawerRecipientId, setChatDrawerRecipientId] = useState(null);
  const [chatDrawerRecipientName, setChatDrawerRecipientName] = useState('Vendor Partner');
  const [chatDrawerRecipientAvatar, setChatDrawerRecipientAvatar] = useState(null);
  const videoRefs = useRef([]);

  const currentReel = reels[currentIndex];

  // Scroll to startIndex on mount
  useEffect(() => {
    if (containerRef.current && startIndex > 0) {
      const scrollContainer = containerRef.current;
      setTimeout(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = startIndex * scrollContainer.clientHeight;
        }
      }, 100);
    }
  }, [startIndex]);

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
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      if (containerRef.current) {
        containerRef.current.scrollTop = prevIndex * containerRef.current.clientHeight;
      }
    }
  };

  const goDown = () => {
    if (currentIndex < reels.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (containerRef.current) {
        containerRef.current.scrollTop = nextIndex * containerRef.current.clientHeight;
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        goDown();
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex]);

  // Scroll event handler to track active index
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const clientHeight = containerRef.current.clientHeight;
    const index = Math.round(scrollTop / (clientHeight || 1));
    if (index !== currentIndex && index >= 0 && index < reels.length) {
      setCurrentIndex(index);
    }
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
    const phone = reel.creator?.phone || reel.creator?.vendorProfile?.whatsapp || '';
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    } else {
      toast.success('Call request sent to vendor!');
    }
  };

  const handleChat = (reel) => {
    handleTrackInteraction('chat_direct', reel);
    const vendorObj = reel.creator;
    const vendorId = vendorObj?._id || vendorObj?.id || (typeof vendorObj === 'string' ? vendorObj : null);

    if (!vendorId) {
      toast.error('Vendor details unavailable for this reel');
      return;
    }

    setChatDrawerRecipientId(vendorId);
    setChatDrawerRecipientName(vendorObj?.vendorProfile?.shopName || vendorObj?.name || 'Vendor Partner');
    setChatDrawerRecipientAvatar(vendorObj?.profile_pic || vendorObj?.avatarUrl || null);
    setChatDrawerOpen(true);
  };

  const handleInquiry = async (reel) => {
    handleTrackInteraction('chat_inquiry', reel);
    const vendorObj = reel.creator || reel.vendor;
    const vendorId = vendorObj?._id || vendorObj?.id || (typeof vendorObj === 'string' ? vendorObj : null);

    if (!vendorId) {
      toast.error('Vendor details unavailable for this reel');
      return;
    }

    const listingId = reel.targetListing?._id || reel.targetListing?.id || (typeof reel.targetListing === 'string' ? reel.targetListing : undefined);
    try {
      await api.post('/v1/inquiries', {
        reelId: reel._id || reel.id,
        listingId: listingId || undefined,
        vendorId: vendorId,
        message: `I'm interested in the product shown in your reel: "${reel.caption || reel.title || 'Reel'}"`
      });
      toast.success(`Inquiry sent to ${vendorObj.vendorProfile?.shopName || vendorObj.name || 'Vendor'}!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit inquiry');
    }
  };

  if (!currentReel) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition border border-white/10"
      >
        <FiX size={20} />
      </button>

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

      {/* Scroll Snapping Reels Feed Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full max-w-[500px] mx-auto overflow-y-scroll snap-y snap-mandatory scrollbar-none scroll-smooth bg-black relative"
      >
        {reels.map((reel, idx) => {
          const isLiked = likedMap[reel._id || reel.id];
          const isSaved = savedMap[reel._id || reel.id];
          const isFollowing = followingMap[reel.creator?._id || reel.creator?.id || reel.creator];

          return (
            <div
              key={reel._id || reel.id || idx}
              className="w-full h-full snap-start snap-always flex-shrink-0 flex items-center justify-center relative bg-black"
            >
              {/* Video Element */}
              <video
                ref={el => videoRefs.current[idx] = el}
                src={reel.videoUrl || reel.mediaUrls?.[0] || ''}
                loop
                muted={muted}
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Right-side action buttons */}
              <div className="absolute right-3 bottom-32 z-30 flex flex-col items-center gap-5">
                {/* Like */}
                <button
                  onClick={() => onLike?.(reel._id || reel.id)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                    isLiked ? 'bg-red-500 text-white animate-scale-pop' : 'bg-black/40 text-white'
                  }`}>
                    <FiHeart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                  </div>
                  <span className="text-white text-[10px] font-bold">{reel.likesCount || 0}</span>
                </button>

                {/* Comments */}
                <button className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center">
                    <FiMessageCircle size={20} />
                  </div>
                  <span className="text-white text-[10px] font-bold">{reel.commentsCount || 0}</span>
                </button>

                {/* Save */}
                <button
                  onClick={() => onSave?.(reel._id || reel.id)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                    isSaved ? 'bg-brand-purple text-white' : 'bg-black/40 text-white'
                  }`}>
                    <FiBookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                  </div>
                  <span className="text-white text-[10px] font-bold">Save</span>
                </button>

                {/* Share */}
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/customer/home?reel=${reel._id || reel.id}`;
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
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 pt-24 text-left">
                {/* Vendor Profile */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden flex-shrink-0">
                    {reel.creator?.profile_pic || reel.creator?.avatarUrl ? (
                      <img
                        src={reel.creator.profile_pic || reel.creator.avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-purple/30 flex items-center justify-center text-white font-bold text-sm">
                        {(reel.creator?.name || 'V').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-bold truncate">
                        {reel.creator?.vendorProfile?.shopName || reel.creator?.name || 'Vendor'}
                      </p>
                      {reel.isBoosted && (
                        <span className="bg-yellow-400/20 text-yellow-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-yellow-400/30">
                          PROMOTED
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-[10px] truncate">
                      {reel.category || 'Business'} • {reel.subcategory || ''}
                    </p>
                  </div>
                  {/* Follow button */}
                  <button
                    onClick={() => onFollow?.(reel.creator?._id || reel.creator?.id || reel.creator)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition border ${
                      isFollowing
                        ? 'bg-white/10 text-white/80 border-white/20'
                        : 'bg-white text-black border-white hover:bg-white/90'
                    }`}
                  >
                    {isFollowing ? (
                      <><FiCheck size={10} className="inline mr-1" />Following</>
                    ) : (
                      <><FiUserPlus size={10} className="inline mr-1" />Follow</>
                    )}
                  </button>
                </div>

                {/* Vendor contact + action buttons */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-white/70 text-[10px]">
                    <span className="flex items-center gap-1">
                      <FiMapPin size={10} className="text-brand-orange" /> {maskAddress(reel.creator)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiPhone size={10} className="text-brand-purple" /> {maskPhone(reel.creator?.phone)}
                    </span>
                    {reel.creator?.is_subscribed_verified && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <FiShield size={10} /> Verified
                      </span>
                    )}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleWhatsApp(reel)}
                      className="flex flex-col items-center gap-1 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition border border-emerald-500/20"
                    >
                      <FaWhatsapp size={16} />
                      <span className="text-[8px] font-bold">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleCallRequest(reel)}
                      className="flex flex-col items-center gap-1 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition border border-blue-500/20"
                    >
                      <FiPhone size={16} />
                      <span className="text-[8px] font-bold">Call</span>
                    </button>
                    <button
                      onClick={() => handleChat(reel)}
                      className="flex flex-col items-center gap-1 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition border border-purple-500/20"
                    >
                      <FiMessageSquare size={16} />
                      <span className="text-[8px] font-bold">Chat</span>
                    </button>
                    <button
                      onClick={() => handleInquiry(reel)}
                      className="flex flex-col items-center gap-1 py-2 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition border border-orange-500/20"
                    >
                      <FiMessageCircle size={16} />
                      <span className="text-[8px] font-bold">Inquiry</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* In-context Chat Drawer */}
      <ChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        recipientId={chatDrawerRecipientId}
        recipientName={chatDrawerRecipientName}
        recipientAvatar={chatDrawerRecipientAvatar}
      />
    </motion.div>
  );
}
