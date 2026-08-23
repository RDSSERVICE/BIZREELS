import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiX,
  FiVolume2, FiVolumeX, FiMapPin, FiPhone, FiMessageSquare,
  FiShield, FiUserPlus, FiCheck, FiShoppingCart, FiZap
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api, cartApi } from '../../lib/api';
import { notifyCartChanged, openCartDrawer } from '../app/CartDrawer';
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

              {/* Right-side vertical action rail */}
              <div className="absolute right-2.5 bottom-48 sm:bottom-52 z-30 flex flex-col items-center gap-4 select-none">
                {/* Like */}
                <button
                  onClick={() => onLike?.(reel._id || reel.id)}
                  className="flex flex-col items-center gap-1 cursor-pointer border-none bg-transparent"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-md ${
                    isLiked ? 'bg-red-500 text-white animate-scale-pop' : 'bg-black/50 hover:bg-black/70 text-white border border-white/10'
                  }`}>
                    <FiHeart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                  </div>
                  <span className="text-white text-[10px] font-black drop-shadow-md">{reel.likesCount || 0}</span>
                </button>

                {/* Comments */}
                <button className="flex flex-col items-center gap-1 cursor-pointer border-none bg-transparent">
                  <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center border border-white/10 shadow-md">
                    <FiMessageCircle size={20} />
                  </div>
                  <span className="text-white text-[10px] font-black drop-shadow-md">{reel.commentsCount || 0}</span>
                </button>

                {/* Save */}
                <button
                  onClick={() => onSave?.(reel._id || reel.id)}
                  className="flex flex-col items-center gap-1 cursor-pointer border-none bg-transparent"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-md ${
                    isSaved ? 'bg-[#d99a3d] text-[#1a1a1a]' : 'bg-black/50 hover:bg-black/70 text-white border border-white/10'
                  }`}>
                    <FiBookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                  </div>
                  <span className="text-white text-[10px] font-black drop-shadow-md">Save</span>
                </button>

                {/* Share */}
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/customer/home?reel=${reel._id || reel.id}`;
                    navigator.clipboard?.writeText(url);
                    toast.success('Link copied!');
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer border-none bg-transparent"
                >
                  <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center border border-white/10 shadow-md">
                    <FiShare2 size={20} />
                  </div>
                  <span className="text-white text-[10px] font-black drop-shadow-md">Share</span>
                </button>
              </div>

              {/* Bottom vendor info overlay */}
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-4 pt-20 text-left pr-16 sm:pr-18">
                {/* Vendor Profile Header Row */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-10 h-10 rounded-full border-2 border-[#d99a3d] overflow-hidden flex-shrink-0 bg-white shadow-xs">
                    {reel.creator?.profile_pic || reel.creator?.avatarUrl ? (
                      <img
                        src={reel.creator.profile_pic || reel.creator.avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-sm">
                        {(reel.creator?.name || 'V').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-xs sm:text-sm font-extrabold truncate max-w-[150px] sm:max-w-[220px]">
                        {reel.creator?.vendorProfile?.shopName || reel.creator?.name || 'Verified Creator'}
                      </p>
                      {reel.isBoosted && (
                        <span className="bg-[#d99a3d]/20 text-[#d99a3d] text-[8px] font-black px-1.5 py-0.5 rounded-full border border-[#d99a3d]/40 uppercase tracking-wide shrink-0">
                          PROMOTED
                        </span>
                      )}
                      {/* Follow button (neatly placed inline right next to PROMOTED) */}
                      <button
                        onClick={() => onFollow?.(reel.creator?._id || reel.creator?.id || reel.creator)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition shrink-0 cursor-pointer flex items-center gap-1 shadow-xs border ${
                          isFollowing
                            ? 'bg-white/20 text-white border-white/30 backdrop-blur-xs'
                            : 'bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] border-[#d99a3d]'
                        }`}
                      >
                        {isFollowing ? (
                          <><FiCheck size={11} /> Following</>
                        ) : (
                          <><FiUserPlus size={11} /> Follow</>
                        )}
                      </button>
                    </div>
                    <p className="text-white/60 text-[10px] truncate font-medium">
                      {reel.category || 'Business'} {reel.subcategory ? `• ${reel.subcategory}` : ''}
                    </p>
                  </div>
                </div>

                {/* Vendor contact + action buttons */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-white/80 text-[10px] font-semibold flex-wrap">
                    <span className="flex items-center gap-1">
                      <FiMapPin size={11} className="text-[#d99a3d]" /> {maskAddress(reel.creator)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiPhone size={11} className="text-[#d99a3d]" /> {maskPhone(reel.creator?.phone)}
                    </span>
                    {reel.creator?.is_subscribed_verified && (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <FiShield size={11} /> Verified
                      </span>
                    )}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleWhatsApp(reel)}
                      className="flex flex-col items-center gap-1 py-1.5 sm:py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition border border-emerald-500/20 cursor-pointer"
                    >
                      <FaWhatsapp size={15} />
                      <span className="text-[8px] font-bold">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleCallRequest(reel)}
                      className="flex flex-col items-center gap-1 py-1.5 sm:py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition border border-blue-500/20 cursor-pointer"
                    >
                      <FiPhone size={15} />
                      <span className="text-[8px] font-bold">Call</span>
                    </button>
                    <button
                      onClick={() => handleChat(reel)}
                      className="flex flex-col items-center gap-1 py-1.5 sm:py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition border border-purple-500/20 cursor-pointer"
                    >
                      <FiMessageSquare size={15} />
                      <span className="text-[8px] font-bold">Chat</span>
                    </button>
                    <button
                      onClick={() => handleInquiry(reel)}
                      className="flex flex-col items-center gap-1 py-1.5 sm:py-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition border border-amber-500/20 cursor-pointer"
                    >
                      <FiMessageCircle size={15} />
                      <span className="text-[8px] font-bold">Inquiry</span>
                    </button>
                  </div>

                  {/* Add to Cart & Buy Now Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const targetId = reel.taggedListing?._id || reel.taggedListing || reel._id || reel.id;
                        try {
                          await cartApi.add({ listing_id: targetId, quantity: 1 });
                          notifyCartChanged();
                          openCartDrawer();
                          toast.success(`"${reel.caption || 'Product'}" added to cart!`);
                        } catch {
                          toast.error('Could not add item to cart');
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold transition flex items-center justify-center gap-1.5 border border-white/20 shadow-xs cursor-pointer"
                    >
                      <FiShoppingCart size={14} />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const targetId = reel.taggedListing?._id || reel.taggedListing || reel._id || reel.id;
                        navigate(`/customer/listings/${targetId}`);
                      }}
                      className="py-2 px-3 rounded-xl bg-[#d99a3d] hover:bg-[#c0862b] text-[#1a1a1a] text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer border-none"
                    >
                      <FiZap size={14} />
                      <span>Buy Now</span>
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
