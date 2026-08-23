import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiX,
  FiMapPin, FiPhone, FiMessageSquare, FiChevronUp, FiChevronDown,
  FiShield, FiStar, FiUserPlus, FiCheck, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import ChatDrawer from '../ui/ChatDrawer';

/**
 * ImageFullscreenViewer
 * Full-screen vertical scroll viewer for image posts only.
 * Similar to ReelFullscreenViewer but for static image content.
 */
export default function ImageFullscreenViewer({ images, startIndex = 0, onClose, onLike, onSave, onFollow, likedMap = {}, savedMap = {}, followingMap = {} }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // In-context Chat drawer state
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatDrawerRecipientId, setChatDrawerRecipientId] = useState(null);
  const [chatDrawerRecipientName, setChatDrawerRecipientName] = useState('Vendor Partner');
  const [chatDrawerRecipientAvatar, setChatDrawerRecipientAvatar] = useState(null);

  const currentPost = images[currentIndex];

  const goUp = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCurrentMediaIndex(0);
    }
  };

  const goDown = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentMediaIndex(0);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowUp') goUp();
      else if (e.key === 'ArrowDown') goDown();
      else if (e.key === 'ArrowLeft') prevMedia();
      else if (e.key === 'ArrowRight') nextMedia();
      else if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, currentMediaIndex]);

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

  // Get media list for current post
  const getMediaList = (post) => {
    if (Array.isArray(post?.mediaUrls) && post.mediaUrls.length > 0) return post.mediaUrls;
    if (Array.isArray(post?.images) && post.images.length > 0) return post.images;
    if (post?.thumbnailUrl) return [post.thumbnailUrl];
    return ['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600'];
  };

  const mediaList = currentPost ? getMediaList(currentPost) : [];

  const prevMedia = () => {
    if (currentMediaIndex > 0) setCurrentMediaIndex(prev => prev - 1);
  };

  const nextMedia = () => {
    if (currentMediaIndex < mediaList.length - 1) setCurrentMediaIndex(prev => prev + 1);
  };

  // Mask utilities
  const maskPhone = (phone) => {
    if (!phone) return '••••••••••';
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 6) return '••••••••••';
    return clean.slice(0, 2) + '••••' + clean.slice(-4);
  };

  const maskAddress = (vendor) => {
    const city = vendor?.vendorProfile?.city || vendor?.city || vendor?.location?.city || '';
    const state = vendor?.vendorProfile?.state || vendor?.location?.state || '';
    return city ? `${city}${state ? ', ' + state : ''}` : 'India';
  };

  const handleTrackInteraction = async (type, post) => {
    try {
      await api.post('/v1/users/me/track-interaction', {
        type,
        listingId: post._id || post.id,
        targetUserId: post.creator?._id || post.creator?.id || post.vendor?._id || post.vendor?.id || post.creator,
        metadata: { title: post.title || post.caption || '', isBoosted: post.isBoosted }
      });
    } catch {}
  };

  const handleWhatsApp = (post) => {
    const vendor = post.creator || post.vendor;
    const isVerified =
      vendor?.kyc_status === 'approved' ||
      vendor?.is_subscribed_verified === true ||
      vendor?.isVerified === true ||
      vendor?.is_verified === true ||
      vendor?.vendorProfile?.isVerified === true ||
      vendor?.verified_badge === true ||
      ['verified_vendor', 'premium_verified', 'trusted_vendor', 'premium_vendor', 'verified'].includes(
        vendor?.vendorProfile?.verificationStatus || vendor?.verificationStatus || vendor?.vendorProfile?.tier || vendor?.tier
      ) ||
      Boolean(vendor?.vendorProfile?.contactVerified?.whatsapp || vendor?.vendorProfile?.contactVerified?.mobile);

    if (!isVerified) {
      toast.error('⚠️ This vendor is not verified yet. Direct WhatsApp inquiry is only available for verified vendors.', {
        id: 'unverified-vendor-whatsapp'
      });
      return;
    }

    const rawPhone =
      vendor?.vendorProfile?.whatsapp ||
      vendor?.vendorProfile?.whatsappNumber ||
      vendor?.phone ||
      vendor?.vendorProfile?.mobileNumber ||
      vendor?.vendorProfile?.phone ||
      vendor?.whatsapp ||
      '';

    if (!rawPhone) {
      toast.error('WhatsApp contact number not available for this vendor', { id: 'no-vendor-phone' });
      return;
    }

    let cleanPhone = String(rawPhone).replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = `91${cleanPhone.slice(1)}`;
    }

    handleTrackInteraction('whatsapp_contact', post);
    const text = `Hi! I saw your post "${post.title || post.caption || 'post'}" on BizReels and I'm interested.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCallRequest = (post) => {
    handleTrackInteraction('click_to_call', post);
    const vendor = post.creator || post.vendor;
    const phone = vendor?.phone || vendor?.vendorProfile?.whatsapp || '';
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    } else {
      toast.success('Call request sent to vendor!');
    }
  };

  const handleChat = (post) => {
    handleTrackInteraction('chat_direct', post);
    const vendorObj = post.creator || post.vendor;
    const vendorId = vendorObj?._id || vendorObj?.id || (typeof vendorObj === 'string' ? vendorObj : null);

    if (!vendorId) {
      toast.error('Vendor details unavailable');
      return;
    }

    setChatDrawerRecipientId(vendorId);
    setChatDrawerRecipientName(vendorObj?.vendorProfile?.shopName || vendorObj?.name || 'Vendor Partner');
    setChatDrawerRecipientAvatar(vendorObj?.profile_pic || vendorObj?.avatarUrl || null);
    setChatDrawerOpen(true);
  };

  const handleInquiry = async (post) => {
    handleTrackInteraction('chat_inquiry', post);
    const vendorObj = post.creator || post.vendor;
    const vendorId = vendorObj?._id || vendorObj?.id || (typeof vendorObj === 'string' ? vendorObj : null);

    if (!vendorId) {
      toast.error('Vendor details unavailable');
      return;
    }

    const isListing = post.type === 'product' || post.type === 'service';
    const isReel = post.mediaType === 'image' || post.videoUrl;

    try {
      await api.post('/v1/inquiries', {
        listingId: isListing ? (post._id || post.id) : undefined,
        reelId: isReel ? (post._id || post.id) : undefined,
        vendorId: vendorId,
        message: `I'm interested in your post: "${post.title || post.caption || 'Image Post'}"`
      });
      toast.success(`Inquiry sent to ${vendorObj.vendorProfile?.shopName || vendorObj.name || 'Vendor'}!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit inquiry');
    }
  };

  if (!currentPost) return null;

  const vendor = currentPost.creator || currentPost.vendor || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition border border-white/10"
      >
        <FiX size={20} />
      </button>

      {/* Up/Down navigation */}
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
          disabled={currentIndex === images.length - 1}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/60 transition border border-white/10"
        >
          <FiChevronDown size={20} />
        </button>
      </div>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-40 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold border border-white/10">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Image Content */}
      <div className="w-full h-full max-w-[500px] mx-auto relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${currentMediaIndex}`}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex items-center justify-center"
          >
            <img
              src={mediaList[currentMediaIndex] || ''}
              alt={currentPost.title || currentPost.caption || 'Post'}
              className="w-full h-full object-contain"
            />
          </motion.div>
        </AnimatePresence>

        {/* Multi-image carousel arrows */}
        {mediaList.length > 1 && (
          <>
            <button
              onClick={prevMedia}
              disabled={currentMediaIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center disabled:opacity-30 hover:bg-black transition border border-white/20 z-30"
            >
              <FiChevronLeft size={18} />
            </button>
            <button
              onClick={nextMedia}
              disabled={currentMediaIndex === mediaList.length - 1}
              className="absolute right-14 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center disabled:opacity-30 hover:bg-black transition border border-white/20 z-30"
            >
              <FiChevronRight size={18} />
            </button>
            <div className="absolute bottom-36 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
              {mediaList.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${currentMediaIndex === idx ? 'w-4 bg-brand-purple' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Right-side vertical action rail */}
        <div className="absolute right-2.5 bottom-48 sm:bottom-52 z-30 flex flex-col items-center gap-4 select-none">
          {/* Like */}
          <button
            onClick={() => onLike?.(currentPost._id || currentPost.id)}
            className="flex flex-col items-center gap-1 cursor-pointer border-none bg-transparent"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-md ${
              likedMap[currentPost._id || currentPost.id] ? 'bg-red-500 text-white animate-scale-pop' : 'bg-black/50 hover:bg-black/70 text-white border border-white/10'
            }`}>
              <FiHeart size={20} fill={likedMap[currentPost._id || currentPost.id] ? 'currentColor' : 'none'} />
            </div>
            <span className="text-white text-[10px] font-black drop-shadow-md">{currentPost.likesCount || currentPost.likes || 0}</span>
          </button>

          {/* Save */}
          <button
            onClick={() => onSave?.(currentPost._id || currentPost.id)}
            className="flex flex-col items-center gap-1 cursor-pointer border-none bg-transparent"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-md ${
              savedMap[currentPost._id || currentPost.id] ? 'bg-[#d99a3d] text-[#1a1a1a]' : 'bg-black/50 hover:bg-black/70 text-white border border-white/10'
            }`}>
              <FiBookmark size={20} fill={savedMap[currentPost._id || currentPost.id] ? 'currentColor' : 'none'} />
            </div>
            <span className="text-white text-[10px] font-black drop-shadow-md">Save</span>
          </button>

          {/* Share */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/customer/search?id=${currentPost._id || currentPost.id}`;
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
              {vendor.profile_pic || vendor.avatarUrl ? (
                <img src={vendor.profile_pic || vendor.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-sm">
                  {(vendor.name || 'V').charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white text-xs sm:text-sm font-extrabold truncate max-w-[150px] sm:max-w-[220px]">
                  {vendor.vendorProfile?.shopName || vendor.name || 'Verified Vendor'}
                </p>
                {currentPost.isBoosted && (
                  <span className="bg-[#d99a3d]/20 text-[#d99a3d] text-[8px] font-black px-1.5 py-0.5 rounded-full border border-[#d99a3d]/40 uppercase tracking-wide shrink-0">
                    PROMOTED
                  </span>
                )}
                {/* Follow button (neatly placed inline right next to PROMOTED) */}
                <button
                  onClick={() => onFollow?.(vendor._id || vendor.id)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition shrink-0 cursor-pointer flex items-center gap-1 shadow-xs border ${
                    followingMap[vendor._id || vendor.id]
                      ? 'bg-white/20 text-white border-white/30 backdrop-blur-xs'
                      : 'bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] border-[#d99a3d]'
                  }`}
                >
                  {followingMap[vendor._id || vendor.id] ? (
                    <><FiCheck size={11} /> Following</>
                  ) : (
                    <><FiUserPlus size={11} /> Follow</>
                  )}
                </button>
              </div>
              <p className="text-white/60 text-[10px] truncate font-medium">
                {currentPost.category || 'Business'}
              </p>
            </div>
          </div>

          {/* Vendor contact + actions */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-white/80 text-[10px] font-semibold flex-wrap">
              <span className="flex items-center gap-1">
                <FiMapPin size={11} className="text-[#d99a3d]" /> {maskAddress(vendor)}
              </span>
              <span className="flex items-center gap-1">
                <FiPhone size={11} className="text-[#d99a3d]" /> {maskPhone(vendor.phone)}
              </span>
              {vendor.is_subscribed_verified && (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <FiShield size={11} /> Verified
                </span>
              )}
            </div>

            {/* Bottom 4 CTA buttons */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                onClick={() => handleWhatsApp(currentPost)}
                className="flex flex-col items-center justify-center gap-0.5 py-1.5 sm:py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-black transition border border-emerald-500/40 shadow-xs cursor-pointer active:scale-95"
              >
                <FaWhatsapp size={15} />
                <span className="text-[9px] font-extrabold tracking-tight">WhatsApp</span>
              </button>
              <button
                onClick={() => handleCallRequest(currentPost)}
                className="flex flex-col items-center justify-center gap-0.5 py-1.5 sm:py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-black transition border border-blue-500/40 shadow-xs cursor-pointer active:scale-95"
              >
                <FiPhone size={15} />
                <span className="text-[9px] font-extrabold tracking-tight">Call</span>
              </button>
              <button
                onClick={() => handleChat(currentPost)}
                className="flex flex-col items-center justify-center gap-0.5 py-1.5 sm:py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 font-black transition border border-purple-500/40 shadow-xs cursor-pointer active:scale-95"
              >
                <FiMessageSquare size={15} />
                <span className="text-[9px] font-extrabold tracking-tight">Chat</span>
              </button>
              <button
                onClick={() => handleInquiry(currentPost)}
                className="flex flex-col items-center justify-center gap-0.5 py-1.5 sm:py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 font-black transition border border-amber-500/40 shadow-xs cursor-pointer active:scale-95"
              >
                <FiMessageCircle size={15} />
                <span className="text-[9px] font-extrabold tracking-tight">Inquiry</span>
              </button>
            </div>
          </div>
        </div>
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
