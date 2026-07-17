import React, { useState, useEffect, useRef } from 'react';
import { FiHeart, FiMessageCircle, FiShare2, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  useGetReelsFeedQuery,
  useToggleLikeReelMutation,
  useViewReelMutation,
} from '../features/reels/reelsApi';
import VideoPlayer from '../components/ui/VideoPlayer';
import CommentsDrawer from '../components/ui/CommentsDrawer';
import Loader from '../components/common/Loader';

/**
 * Premium Reels Feed page.
 * Vertical scroll snap, double-tap actions, like/comment counts, share, and tab filters.
 */
const ReelsFeed = () => {
  const [activeTab, setActiveTab] = useState('trending'); // trending | nearby | following
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState(null);

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

  // Register view count on current video item mount/switch
  useEffect(() => {
    if (reels.length > 0 && reels[activeVideoIndex]) {
      const activeId = reels[activeVideoIndex]._id;
      registerView(activeId).catch(() => {});
    }
  }, [activeVideoIndex, reels, registerView]);

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

  const handleShare = (reel) => {
    const shareUrl = `${window.location.origin}/reels/${reel._id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
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

                {/* Overlaid Right Actions Sidebar */}
                <div className="absolute right-3 bottom-16 flex flex-col items-center gap-5 z-10 text-white">
                  {/* Like Button */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleLike(reel._id)}
                      className={`p-3 rounded-full backdrop-blur-md shadow-glass border transition-all active:scale-75
                        ${reel.hasLiked
                          ? 'bg-brand-pink text-white border-brand-pink'
                          : 'bg-black/40 text-white hover:bg-black/60 border-white/10'
                        }
                      `}
                    >
                      <FiHeart className={`w-5 h-5 ${reel.hasLiked ? 'fill-white' : ''}`} />
                    </button>
                    <span className="text-[10px] font-bold text-white/90">{reel.likesCount}</span>
                  </div>

                  {/* Comments Button */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => { setSelectedReelId(reel._id); setIsCommentsOpen(true); }}
                      className="p-3 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md shadow-glass border border-white/10 active:scale-75 transition-all"
                    >
                      <FiMessageCircle className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] font-bold text-white/90">{reel.commentsCount}</span>
                  </div>

                  {/* Share Button */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleShare(reel)}
                      className="p-3 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md shadow-glass border border-white/10 active:scale-75 transition-all"
                    >
                      <FiShare2 className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] font-bold text-white/90">Share</span>
                  </div>
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
    </div>
  );
};

export default ReelsFeed;
