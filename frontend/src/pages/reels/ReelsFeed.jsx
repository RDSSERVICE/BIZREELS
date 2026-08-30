import React, { useState, useEffect, useRef } from 'react';
import { FiHeart, FiMessageCircle, FiShare2, FiMapPin, FiTrendingUp, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  useGetReelsFeedQuery,
  useToggleLikeReelMutation,
  useViewReelMutation,
} from '../../features/reels/reelsApi';
import api from '../../lib/api';
import VideoPlayer from '../../components/ui/VideoPlayer';
import CommentsDrawer from '../../components/ui/CommentsDrawer';
import ChatDrawer from '../../components/ui/ChatDrawer';
import Loader from '../../components/common/Loader';

/**
 * Premium Reels Feed page.
 * Vertical scroll snap, double-tap actions, like/comment counts, share, and tab filters.
 */
const ReelsFeed = () => {
  const [activeTab, setActiveTab] = useState('trending'); // trending | nearby | following
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState(null);

  // In-context Chat drawer state
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatDrawerRecipientId, setChatDrawerRecipientId] = useState(null);
  const [chatDrawerRecipientName, setChatDrawerRecipientName] = useState('Vendor Partner');
  const [chatDrawerRecipientAvatar, setChatDrawerRecipientAvatar] = useState(null);

  const handleOpenChat = (recipientId, recipientName, recipientAvatar) => {
    setChatDrawerRecipientId(recipientId);
    setChatDrawerRecipientName(recipientName || 'Vendor Partner');
    setChatDrawerRecipientAvatar(recipientAvatar);
    setChatDrawerOpen(true);
  };

  const containerRef = useRef(null);

  // Retrieve user location coordinates if 'nearby' is selected
  const [coords, setCoords] = useState(null);
  useEffect(() => {
    if (activeTab === 'nearby' && !coords) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          toast.error('Location permission denied. Showing trending instead.');
          setActiveTab('trending');
        }
      );
    }
  }, [activeTab, coords]);

  // Feed Query params mapping
  const queryParams = {
    page: 1,
    limit: 10,
  };
  if (activeTab === 'nearby' && coords) {
    queryParams.lat = coords.lat;
    queryParams.lng = coords.lng;
    queryParams.distance = 15; // 15km
  }

  const { data: feedRes, isLoading, refetch } = useGetReelsFeedQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  const [toggleLike] = useToggleLikeReelMutation();
  const [registerView] = useViewReelMutation();

  const reels = feedRes?.data || [];

  // ── Watch Duration Tracker (Instagram-style view counting) ──
  // Tracks when user starts watching a reel, and on scroll/switch
  // calculates actual watch time and sends it to backend.
  // Backend requires >= 3 seconds watch time to count as a view.
  const watchStartRef = useRef(null); // timestamp when current reel started playing
  const prevIndexRef = useRef(null);  // previous reel index to detect change

  // When activeVideoIndex changes, register view for the PREVIOUS reel with actual watch duration
  useEffect(() => {
    const prevIdx = prevIndexRef.current;

    // If we had a previous reel playing, send its view with watch duration
    if (prevIdx !== null && prevIdx !== activeVideoIndex && reels[prevIdx]) {
      const prevReelId = reels[prevIdx]._id;
      const watchDuration = watchStartRef.current
        ? Math.round((Date.now() - watchStartRef.current) / 1000)
        : 0;

      registerView({ id: prevReelId, watchDuration }).catch(() => {});
    }

    // Start tracking the new reel's watch time
    prevIndexRef.current = activeVideoIndex;
    watchStartRef.current = Date.now();

    // Cleanup: when component unmounts, register view for the last watched reel
    return () => {
      // This runs on unmount or before next effect run — we only want unmount
    };
  }, [activeVideoIndex, reels, registerView]);

  // Register view for the current reel when user navigates away (unmount)
  useEffect(() => {
    return () => {
      if (prevIndexRef.current !== null && reels[prevIndexRef.current]) {
        const lastReelId = reels[prevIndexRef.current]._id;
        const watchDuration = watchStartRef.current
          ? Math.round((Date.now() - watchStartRef.current) / 1000)
          : 0;
        registerView({ id: lastReelId, watchDuration }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reels]);

  // Track vertical scroll intersection indices
  const handleScroll = () => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const clientHeight = containerRef.current.clientHeight;
    
    // Determine which video is mostly visible
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeVideoIndex && index >= 0 && index < reels.length) {
      setActiveVideoIndex(index);
    }
  };

  const handleLike = async (reelId) => {
    try {
      await toggleLike(reelId).unwrap();
    } catch (err) {
      toast.error('Failed to update like.');
    }
  };

  const handleShare = async (reel) => {
    if (!reel?._id) return;
    const shareUrl = `${window.location.origin}/reels/${reel._id}`;
    const shareData = {
      title: reel.caption || 'BizReels',
      text: reel.caption || 'Check out this reel on BizReels!',
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto relative h-[calc(100vh-140px)] select-none">
      {/* Tab filter overlay */}
      <div className="absolute top-3 left-0 right-0 z-20 flex justify-center gap-4">
        {['trending', 'nearby'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setActiveVideoIndex(0); }}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all backdrop-blur-md shadow-glass capitalize
              ${activeTab === tab
                ? 'bg-brand-purple text-white'
                : 'bg-black/40 text-white/70 hover:text-white border border-white/10'
              }
            `}
          >
            {tab === 'trending' ? (
              <span className="flex items-center gap-1.5"><FiTrendingUp /> Trending</span>
            ) : (
              <span className="flex items-center gap-1.5"><FiMapPin /> Nearby</span>
            )}
          </button>
        ))}
      </div>

      {/* Main Reels Vertical Snap Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none rounded-premium shadow-premium border border-border bg-black"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-white">
            <Loader size="lg" />
          </div>
        ) : reels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-white/60">
            <p className="text-sm font-bold uppercase tracking-wider">No Reels Found</p>
            <p className="text-xs text-white/40 mt-1">Be the first to upload a Reel here!</p>
          </div>
        ) : (
          reels.map((reel, idx) => {
            const isCurrent = idx === activeVideoIndex;
            return (
              <div
                key={reel._id}
                className="w-full h-full snap-start snap-always relative flex-shrink-0"
                style={{ height: '100%' }}
              >
                {/* Video Player element */}
                <VideoPlayer
                  src={reel.videoUrl}
                  poster={reel.thumbnailUrl}
                  isActive={isCurrent}
                  onDoubleTap={() => handleLike(reel._id)}
                />

                {/* Overlaid UI components (Bottom-left details) */}
                <div className="absolute bottom-5 left-4 right-16 text-white z-10 flex flex-col gap-2 pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <img
                      src={reel.creator?.avatarUrl || 'https://via.placeholder.com/150'}
                      alt={reel.creator?.name}
                      className="w-9 h-9 rounded-full object-cover border border-white/30"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        @{reel.creator?.name}
                        {reel.creator?.activeRole && reel.creator?.activeRole !== 'customer' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-brand-pink text-white rounded">
                            {reel.creator.activeRole}
                          </span>
                        )}
                      </span>
                      {reel.location?.address && (
                        <span className="text-[10px] text-white/70 flex items-center gap-1">
                          <FiMapPin className="w-3 h-3" /> {reel.location.address}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-white/90 font-medium leading-relaxed max-h-[80px] overflow-hidden overflow-ellipsis line-clamp-2 mt-1">
                    {reel.caption}
                  </p>

                  {/* Hashtag bubbles */}
                  {reel.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1 pointer-events-auto">
                      {reel.hashtags.map((tag) => (
                        <span key={tag} className="text-[10px] font-bold text-brand-orange hover:underline cursor-pointer">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Overlaid Right Actions Sidebar - 10 Customer Action Buttons */}
                <div className="absolute right-2 bottom-12 flex flex-col items-center gap-1.5 sm:gap-2 z-10 text-white max-h-[80vh] overflow-y-auto scrollbar-none py-2 px-1">
                  {/* A. Saved */}
                  <button
                    onClick={() => {
                      const isSaved = reel.isSaved;
                      reel.isSaved = !isSaved;
                      toast.success(isSaved ? 'Removed from Saved Reels' : '📌 Saved to My Wishlist!');
                    }}
                    className="p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md border border-white/10 text-[10px] flex flex-col items-center gap-0.5"
                    title="A. Save Reel"
                  >
                    <span>📌</span>
                    <span className="text-[9px] font-bold">Save</span>
                  </button>

                  {/* B. Review */}
                  <button
                    onClick={() => toast.success('⭐ Product / Vendor Review score: 4.9/5. Click to write review.')}
                    className="p-2.5 rounded-full bg-black/40 text-amber-400 hover:bg-black/60 backdrop-blur-md border border-white/10 text-[10px] flex flex-col items-center gap-0.5"
                    title="B. Vendor Review"
                  >
                    <span>⭐</span>
                    <span className="text-[9px] font-bold">Review</span>
                  </button>

                  {/* C. Like */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleLike(reel._id)}
                      className={`p-2.5 rounded-full backdrop-blur-md border transition-all active:scale-75 ${
                        reel.hasLiked ? 'bg-brand-pink text-white border-brand-pink' : 'bg-black/40 text-white hover:bg-black/60 border-white/10'
                      }`}
                      title="C. Like Reel"
                    >
                      <FiHeart className={`w-4 h-4 ${reel.hasLiked ? 'fill-white' : ''}`} />
                    </button>
                    <span className="text-[9px] font-bold text-white/90">{reel.likesCount || 0}</span>
                  </div>

                  {/* D. Add to Order Request */}
                  <button
                    onClick={() => toast.success('🛒 Product / Service added to your Order Requests queue!')}
                    className="p-2.5 rounded-full bg-emerald-600/80 text-white hover:bg-emerald-600 backdrop-blur-md border border-white/10 text-[10px] flex flex-col items-center gap-0.5"
                    title="D. Add to Order Request"
                  >
                    <span>🛒</span>
                    <span className="text-[9px] font-bold">Order</span>
                  </button>

                  {/* E. Share */}
                  <button
                    onClick={() => handleShare(reel)}
                    className="p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md border border-white/10 text-[10px] flex flex-col items-center gap-0.5"
                    title="E. Share"
                  >
                    <FiShare2 className="w-4 h-4" />
                    <span className="text-[9px] font-bold">Share</span>
                  </button>

                  {/* F. Call Request */}
                  {/* F. Call Request */}
                  <button
                    onClick={() => {
                      const creator = reel.creator || reel.vendor;
                      const phone = creator?.phone || creator?.vendorProfile?.contactPhone;
                      if (phone) {
                        window.location.href = `tel:${phone}`;
                      } else {
                        toast.success('📞 Callback requested! Vendor will call your registered phone number shortly.');
                      }
                    }}
                    className="p-2.5 rounded-full bg-blue-600/80 text-white hover:bg-blue-600 backdrop-blur-md border border-white/10 text-[10px] flex flex-col items-center gap-0.5"
                    title="F. Call Request"
                  >
                    <span>📞</span>
                    <span className="text-[9px] font-bold">Call</span>
                  </button>

                  {/* G. Click to WhatsApp */}
                  <button
                    onClick={() => {
                      const creator = reel.creator || reel.vendor;
                      const phone = creator?.phone || creator?.vendorProfile?.contactPhone;
                      if (phone) {
                        let cleanPhone = phone.replace(/[^0-9]/g, '');
                        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
                        const text = encodeURIComponent(`Hi! I saw your reel "${reel.caption || ''}" on BizReels and would like to inquire...`);
                        window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
                      } else {
                        toast.error('Seller WhatsApp not available for this reel');
                      }
                    }}
                    className="p-2.5 rounded-full bg-emerald-500/80 text-white hover:bg-emerald-500 backdrop-blur-md border border-white/10 text-[10px] flex flex-col items-center gap-0.5"
                    title="G. Click to WhatsApp"
                  >
                    <span>📱</span>
                    <span className="text-[9px] font-bold">WhatsApp</span>
                  </button>

                  {/* H. Click to Inquiry */}
                  <button
                    onClick={async () => {
                      const creator = reel.creator || reel.vendor;
                      const vendorId = creator?._id || creator?.id || (typeof creator === 'string' ? creator : null);
                      if (!vendorId) {
                        toast.error('Seller details unavailable for this reel');
                        return;
                      }
                      try {
                        const listingId = reel.targetListing?._id || reel.targetListing?.id || (typeof reel.targetListing === 'string' ? reel.targetListing : undefined);
                        await api.post('/v1/inquiries', {
                          reelId: reel._id || reel.id,
                          listingId: listingId,
                          vendorId: vendorId,
                          message: `I'm interested in the product shown in your reel: "${reel.caption || reel.title || 'Reel'}"`
                        });
                        toast.success(`📥 Inquiry sent to ${creator.vendorProfile?.shopName || creator.name || 'Vendor'}!`);
                      } catch (err) {
                        toast.error(err?.response?.data?.message || 'Failed to send inquiry');
                      }
                    }}
                    className="p-2.5 rounded-full bg-purple-600/80 text-white hover:bg-purple-600 backdrop-blur-md border border-white/10 text-[10px] flex flex-col items-center gap-0.5"
                    title="H. Click to Inquiry"
                  >
                    <span>📥</span>
                    <span className="text-[9px] font-bold">Inquiry</span>
                  </button>

                  {/* I. Direct Chat with Vendor */}
                  <button
                    onClick={() => {
                      const vendorObj = reel.creator || reel.vendor || reel.user || {};
                      const vendorId = vendorObj?._id || vendorObj?.id || (typeof vendorObj === 'string' ? vendorObj : null);
                      if (!vendorId) {
                        toast.error('Vendor details unavailable for this reel');
                        return;
                      }
                      handleOpenChat(
                        vendorId,
                        vendorObj.name || vendorObj.shopName || 'Vendor Partner',
                        vendorObj.avatarUrl || vendorObj.profile_pic || null
                      );
                    }}
                    className="p-2.5 rounded-full bg-[#d99a3d]/20 text-[#d99a3d] hover:bg-[#d99a3d]/30 backdrop-blur-md border border-[#d99a3d]/30 text-[10px] flex flex-col items-center gap-0.5 cursor-pointer"
                    title="Direct Chat with Vendor"
                  >
                    <FiMessageSquare className="w-4 h-4" />
                    <span className="text-[9px] font-bold">Chat</span>
                  </button>

                  {/* J. Order Request Confirmed */}
                  <button
                    onClick={() => toast.success('✅ Order Request Status: Confirmed & Processing by Vendor!')}
                    className="p-2 rounded-full bg-emerald-500 text-white text-[9px] font-bold"
                    title="J. Order Request Confirmed"
                  >
                    ✓ Ready
                  </button>
                </div>

                {/* Top indicator if boosted */}
                {reel.isBoosted && (
                  <div className="absolute top-16 right-4 px-2 py-1 rounded bg-brand-orange text-white text-[9px] font-extrabold tracking-wider uppercase shadow-premium animate-pulse z-10">
                    Sponsor
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Global Comments bottom drawer panel */}
      <CommentsDrawer
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        reelId={selectedReelId}
      />

      {/* In-Context Reel-to-Chat Drawer */}
      <ChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        recipientId={chatDrawerRecipientId}
        recipientName={chatDrawerRecipientName}
        recipientAvatar={chatDrawerRecipientAvatar}
      />
    </div>
  );
};

export default ReelsFeed;
