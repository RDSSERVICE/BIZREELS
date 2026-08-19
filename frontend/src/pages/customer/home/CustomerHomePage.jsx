import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiUserPlus,
  FiMapPin, FiSearch, FiSliders, FiPlay, FiVolume2, FiVolumeX, FiCheck,
  FiChevronLeft, FiChevronRight, FiVideo, FiImage, FiMessageSquare, FiLayers,
  FiMoreHorizontal, FiSend
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import HomeFeedSearchFilter from '../../../components/feed/HomeFeedSearchFilter';
import CommentsDrawer from '../../../components/ui/CommentsDrawer';
import ChatDrawer from '../../../components/ui/ChatDrawer';
import ActiveOffersPanel from '../../../components/offers/ActiveOffersPanel';
import ReelFullscreenViewer from '../../../components/feed/ReelFullscreenViewer';
import ImageFullscreenViewer from '../../../components/feed/ImageFullscreenViewer';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * Format relative time ago (Instagram style)
 */
function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Instagram-style Skeleton Loader Component
 */
function InstagramPostSkeleton() {
  return (
    <div className="w-full bg-white border border-[#e3dccb] rounded-md overflow-hidden shadow-xs animate-pulse">
      {/* Header Skeleton */}
      <div className="p-3.5 flex items-center justify-between bg-slate-50 border-b border-[#e3dccb]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200" />
          <div className="space-y-1.5">
            <div className="w-28 h-3 bg-slate-200 rounded" />
            <div className="w-16 h-2.5 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="w-16 h-6 bg-slate-200 rounded" />
      </div>

      {/* Media Skeleton */}
      <div className="w-full aspect-[9/16] max-h-[440px] bg-slate-200 relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-slate-300/60" />
      </div>

      {/* Footer Actions Skeleton */}
      <div className="p-4 space-y-3 bg-white border-t border-[#e3dccb]">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="w-5 h-5 bg-slate-200 rounded-full" />
            <div className="w-5 h-5 bg-slate-200 rounded-full" />
            <div className="w-5 h-5 bg-slate-200 rounded-full" />
          </div>
          <div className="w-5 h-5 bg-slate-200 rounded-full" />
        </div>
        <div className="w-20 h-2.5 bg-slate-200 rounded" />
        <div className="space-y-1">
          <div className="w-3/4 h-3 bg-slate-200 rounded" />
          <div className="w-1/2 h-3 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * CustomerReelMedia Component with IntersectionObserver Auto-Play & Double-Tap Heart Pop
 */
function CustomerReelMedia({ reel, muted, setMuted, onDoubleTap }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const lastTapRef = useRef(0);

  const rawMediaList = Array.isArray(reel.mediaUrls) && reel.mediaUrls.length > 0
    ? reel.mediaUrls
    : [reel.videoUrl || reel.thumbnailUrl || 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4'];

  const mediaList = rawMediaList.filter(Boolean);
  const currentUrl = mediaList[0] || '';

  const isVideo = reel.mediaType === 'video' ||
    Boolean(currentUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i)) ||
    currentUrl.startsWith('data:video/');

  // IntersectionObserver for video auto-play on scroll
  useEffect(() => {
    if (!isVideo || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        } else {
          if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isVideo, currentUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // Handle Double Tap / Double Click to Like
  const handleContainerClick = (e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      setShowHeartPop(true);
      if (onDoubleTap) onDoubleTap();
      setTimeout(() => setShowHeartPop(false), 900);
    }
    lastTapRef.current = now;
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative aspect-[4/5] sm:aspect-[9/16] max-h-[500px] bg-[#241b15] overflow-hidden rounded-md border border-[#3a2c22] select-none cursor-pointer group w-full flex items-center justify-center"
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={currentUrl}
          loop
          muted={muted}
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

      {/* Double Tap Heart Pop Animation */}
      <AnimatePresence>
        {showHeartPop && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <FiHeart size={80} className="fill-[#d99a3d] text-[#d99a3d] drop-shadow-xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {isVideo && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMuted(!muted);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-xs text-white hover:bg-black/80 transition z-20 cursor-pointer border-none"
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <FiVolumeX size={15} /> : <FiVolume2 size={15} />}
        </button>
      )}
    </div>
  );
}

export default function CustomerHomePage() {
  const navigate = useNavigate();
  const { lang, bi, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('combined');
  const [combinedFeed, setCombinedFeed] = useState([]);
  const [reels, setReels] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedMap, setLikedMap] = useState({});
  const [savedMap, setSavedMap] = useState({});
  const [followingMap, setFollowingMap] = useState({});
  const [expandedCaptions, setExpandedCaptions] = useState({});
  const [muted, setMuted] = useState(true);
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

  // Fullscreen viewer state
  const [reelViewerOpen, setReelViewerOpen] = useState(false);
  const [reelViewerStartIndex, setReelViewerStartIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerStartIndex, setImageViewerStartIndex] = useState(0);

  // Home Feed Search & Filter State
  const [filters, setFilters] = useState({
    searchQuery: '',
    type: 'all',
    duration: 'all',
    nearby: 'near_me',
    distanceKm: '50',
    uploadDate: 'all',
    popularity: 'trending',
  });

  const fetchFollowings = async () => {
    try {
      const res = await api.get('/v1/follow/me/following');
      const items = res.data?.items || [];
      const fmap = {};
      items.forEach((item) => {
        fmap[item.id || item._id] = true;
      });
      setFollowingMap(fmap);
    } catch (e) {
      console.warn('Failed to load followings list:', e);
    }
  };

  useEffect(() => {
    fetchFollowings();

    const socket = getSocket();
    if (socket) {
      const handleFollowingUpdate = ({ vendorId, following }) => {
        setFollowingMap((prev) => ({ ...prev, [vendorId]: following }));
      };
      socket.on('following_update', handleFollowingUpdate);
      return () => {
        socket.off('following_update', handleFollowingUpdate);
      };
    }
  }, []);

  useEffect(() => {
    fetchFeedData();
  }, [activeTab]);

  const fetchFeedData = async () => {
    setLoading(true);
    try {
      let endpoint = `/v1/listings`;
      if (activeTab === 'reels') {
        endpoint = `/v1/reels`;
      } else if (activeTab === 'combined') {
        endpoint = `/v1/feed?type=all`;
      }
      
      const res = await api.get(endpoint);
      const data = res.data;

      if (activeTab === 'reels') {
        const items = Array.isArray(data.data?.reels)
          ? data.data.reels
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.reels)
              ? data.reels
              : Array.isArray(data)
                ? data
                : [];
        setReels(items);
      } else if (activeTab === 'images') {
        const items = Array.isArray(data.data?.listings)
          ? data.data.listings
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.listings)
              ? data.listings
              : Array.isArray(data)
                ? data
                : [];
        setImages(items);
      } else {
        const items = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.data?.items)
            ? data.data.items
            : Array.isArray(data.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : [];
        setCombinedFeed(items);
      }
    } catch (err) {
      toast.error('Failed to load feed data');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id, customPostType = null) => {
    const isLiked = !!likedMap[id];
    setLikedMap((prev) => ({ ...prev, [id]: !isLiked }));
    try {
      const item = combinedFeed.find(x => x._id === id || x.id === id) ||
                   reels.find(x => x._id === id || x.id === id) ||
                   images.find(x => x._id === id || x.id === id);
      const isReel = customPostType === 'reel' || (item?.postType === 'reel') || (activeTab === 'reels');
      if (isReel) {
        await api.post(`/v1/reels/${id}/like`);
      } else {
        await api.post(`/v1/listings/${id}/like`);
      }
      toast.success(!isLiked ? 'Liked post ❤️' : 'Unliked post');
    } catch (err) {
      setLikedMap((prev) => ({ ...prev, [id]: isLiked }));
      toast.error('Failed to update like status');
    }
  };

  const handleSave = async (id, customPostType = null) => {
    const isSaved = !!savedMap[id];
    setSavedMap((prev) => ({ ...prev, [id]: !isSaved }));
    try {
      const item = combinedFeed.find(x => x._id === id || x.id === id) ||
                   reels.find(x => x._id === id || x.id === id) ||
                   images.find(x => x._id === id || x.id === id);
      const isReel = customPostType === 'reel' || (item?.postType === 'reel') || (activeTab === 'reels');
      if (isReel) {
        if (isSaved) {
          await api.post(`/v1/reels/${id}/unsave`);
        } else {
          await api.post(`/v1/reels/${id}/save`);
        }
      } else {
        if (isSaved) {
          await api.post(`/v1/listings/${id}/unsave-image`);
        } else {
          await api.post(`/v1/listings/${id}/save-image`);
        }
      }
      toast.success(!isSaved ? 'Saved post' : 'Removed from saved');
    } catch (err) {
      setSavedMap((prev) => ({ ...prev, [id]: isSaved }));
      toast.error('Failed to update saved status');
    }
  };

  const handleFollow = async (vendorId) => {
    if (!vendorId) return;
    const isFollowing = !!followingMap[vendorId];
    setFollowingMap((prev) => ({ ...prev, [vendorId]: !isFollowing }));
    try {
      if (!isFollowing) {
        await api.post(`/v1/follow/${vendorId}`);
        toast.success('Following vendor');
      } else {
        await api.delete(`/v1/follow/${vendorId}`);
        toast.success('Unfollowed vendor');
      }
    } catch (err) {
      setFollowingMap((prev) => ({ ...prev, [vendorId]: isFollowing }));
      toast.error('Failed to update follow status');
    }
  };

  const handleShare = async (item) => {
    const itemId = item._id || item.id;
    const shareUrl = `${window.location.origin}/customer/home?post=${itemId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title || item.caption || 'BizReels',
          text: 'Check out this post on BizReels!',
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Post link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const toggleCaption = (id) => {
    setExpandedCaptions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const processedCombinedFeed = useMemo(() => {
    let items = combinedFeed;
    if (activeTab === 'reels') items = reels.map(r => ({ ...r, postType: 'reel' }));
    if (activeTab === 'images') items = images.map(i => ({ ...i, postType: 'listing' }));

    if (!filters) return items;

    return items.filter((item) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const title = (item.title || item.caption || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const vendorName = (item.vendor?.name || item.creator?.name || '').toLowerCase();
        if (!title.includes(query) && !desc.includes(query) && !vendorName.includes(query)) {
          return false;
        }
      }

      if (filters.type && filters.type !== 'all') {
        const itemCategory = (item.category || item.reelType || '').toLowerCase();
        if (!itemCategory.includes(filters.type.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [combinedFeed, reels, images, activeTab, filters]);

  const processedReels = useMemo(() => {
    return processedCombinedFeed.filter(item => item.postType === 'reel');
  }, [processedCombinedFeed]);

  const processedImages = useMemo(() => {
    return processedCombinedFeed.filter(item => item.postType !== 'reel');
  }, [processedCombinedFeed]);

  return (
    <div className="flex flex-col h-full w-full font-sans bg-[#f2ede4] overflow-hidden">
      
      {/* ── FIXED TOP CONTROLS & HEADER PANEL (Stationary on screen) ── */}
      <div className="shrink-0 bg-[#f2ede4] py-1 px-1.5 sm:px-3 space-y-1 border-b border-[#e3dccb] shadow-2xs z-20">
        {/* Home Feed Search & Filters Bar */}
        <HomeFeedSearchFilter
          filters={filters}
          onFilterChange={setFilters}
          onSearch={fetchFeedData}
          totalResults={processedCombinedFeed.length}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Active Special Offers & Deals */}
        <ActiveOffersPanel role="customer" />

        {/* Feed Header Section */}
        <div className="w-full max-w-5xl mx-auto px-1 py-0.5 flex items-center justify-between">
          <h3 className="text-[11px] font-black text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d99a3d]"></span>
            <span>{bi('Community Feed & Local Updates', 'समुदाय फीड और स्थानीय अपडेट')}</span>
          </h3>
          <span className="text-[10px] font-extrabold text-slate-600 bg-white/80 px-2 py-0.2 rounded border border-[#e3dccb]">
            {processedCombinedFeed.length} {processedCombinedFeed.length === 1 ? 'Post' : 'Posts'}
          </span>
        </div>
      </div>

      {/* ── SCROLLABLE POSTS CONTAINER (Only posts scroll) ── */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
        {loading ? (
          <div className="max-w-xl mx-auto space-y-6 pb-12 pt-2">
            <InstagramPostSkeleton />
            <InstagramPostSkeleton />
            <InstagramPostSkeleton />
          </div>
        ) : processedCombinedFeed.length === 0 ? (
          <div className="bg-white rounded-md p-8 sm:p-12 text-center text-xs text-slate-500 border border-[#e3dccb] max-w-xl mx-auto shadow-xs font-sans my-4">
            No posts match your filter criteria.
          </div>
        ) : (
          <div className="w-full max-w-xl mx-auto px-1 sm:px-0 space-y-6 pb-24 lg:pb-12 font-sans pt-1">
          {processedCombinedFeed.map((item) => {
            const itemId = item._id || item.id;
            const isLiked = likedMap[itemId];
            const isSaved = savedMap[itemId];
            const isExpanded = expandedCaptions[itemId];

            if (item.postType === 'reel') {
              const vendorId = item.creator?._id || item.creator?.id || item.creator;
              const isFollowing = followingMap[vendorId];

              return (
                <motion.div
                  key={itemId}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-full bg-white border border-[#e3dccb] rounded-md overflow-hidden shadow-xs relative flex flex-col justify-between"
                >
                  {/* Card Header (Instagram Style) */}
                  <div className="p-3.5 flex items-center justify-between bg-slate-50 border-b border-[#e3dccb]">
                    <div
                      onClick={() => navigate(`/customer/vendor/${vendorId}`)}
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d99a3d] to-[#241b15] p-0.5">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xs font-bold text-[#1a1a1a] overflow-hidden">
                          {item.creator?.avatarUrl || item.creator?.profile_pic ? (
                            <img src={item.creator.avatarUrl || item.creator.profile_pic} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{item.creator?.name ? item.creator.name.charAt(0) : 'V'}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-[#1a1a1a] flex items-center gap-1.5">
                          {item.creator?.name || 'Verified Creator'}
                          <span className="bg-[#d99a3d]/20 text-[#1a1a1a] text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">Reel</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <FiMapPin size={10} className="text-[#d99a3d]" />
                          {item.location?.address || 'Nearby'}
                          <span className="mx-1">•</span>
                          <span>{formatTimeAgo(item.createdAt)}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleFollow(vendorId)}
                      className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer border-none ${isFollowing
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] shadow-xs'
                        }`}
                    >
                      {isFollowing ? <><FiCheck size={12} /> Following</> : <><FiUserPlus size={12} /> Follow</>}
                    </button>
                  </div>

                  {/* Reel Media Section (Auto-Play + Double Tap Heart) */}
                  <div
                    onClick={() => {
                      const idx = processedReels.findIndex(r => r._id === itemId || r.id === itemId);
                      setReelViewerStartIndex(idx >= 0 ? idx : 0);
                      setReelViewerOpen(true);
                    }}
                  >
                    <CustomerReelMedia
                      reel={item}
                      muted={muted}
                      setMuted={setMuted}
                      onDoubleTap={() => handleLike(itemId, 'reel')}
                    />
                  </div>

                  {/* Action Bar & Details (Instagram Style) */}
                  <div className="p-4 bg-white space-y-3 border-t border-[#e3dccb]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(itemId, 'reel')}
                          className={`flex items-center gap-1.5 text-xs font-bold transition cursor-pointer border-none bg-transparent ${isLiked ? 'text-[#d99a3d]' : 'text-slate-600 hover:text-[#d99a3d]'}`}
                          title="Like"
                        >
                          <FiHeart size={20} className={isLiked ? 'fill-[#d99a3d]' : ''} />
                          <span>{(item.likesCount || 0) + (isLiked ? 1 : 0)}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedReelId(itemId);
                            setIsCommentsOpen(true);
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1a1a1a] cursor-pointer border-none bg-transparent"
                          title="Comment"
                        >
                          <FiMessageCircle size={20} />
                          <span>{item.commentsCount || 0}</span>
                        </button>

                        <button
                          onClick={() => handleShare(item)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1a1a1a] cursor-pointer border-none bg-transparent"
                          title="Share Post"
                        >
                          <FiSend size={18} />
                        </button>

                        <button
                          onClick={() => handleOpenChat(
                            vendorId,
                            item.creator?.name,
                            item.creator?.avatarUrl || item.creator?.profile_pic
                          )}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#1a1a1a] hover:text-[#d99a3d] cursor-pointer border-none bg-transparent"
                          title="Chat with Vendor"
                        >
                          <FiMessageSquare size={17} className="text-[#d99a3d]" />
                          <span>Chat</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleSave(itemId, 'reel')}
                        className={`transition cursor-pointer border-none bg-transparent ${isSaved ? 'text-[#d99a3d]' : 'text-slate-500 hover:text-[#1a1a1a]'}`}
                        title="Save"
                      >
                        <FiBookmark size={20} className={isSaved ? 'fill-[#d99a3d]' : ''} />
                      </button>
                    </div>

                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      {(item.views || 0).toLocaleString()} views
                    </p>

                    {/* Expandable Caption */}
                    <div className="text-xs text-slate-700 leading-relaxed mt-1">
                      <span className="font-extrabold text-[#1a1a1a] mr-1.5">{item.creator?.name || 'Verified Creator'}</span>
                      {isExpanded ? (
                        <span>{item.caption || item.description}</span>
                      ) : (
                        <span>
                          {((item.caption || item.description || '').slice(0, 90))}
                          {(item.caption || item.description || '').length > 90 && (
                            <button
                              onClick={() => toggleCaption(itemId)}
                              className="text-slate-400 font-bold ml-1 hover:underline border-none bg-transparent cursor-pointer"
                            >
                              ...more
                            </button>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            } else {
              const vendorId = item.vendor?._id || item.vendor?.id || item.vendor;
              const isFollowing = followingMap[vendorId];

              return (
                <motion.div
                  key={itemId}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-full bg-white border border-[#e3dccb] rounded-md overflow-hidden shadow-xs relative flex flex-col justify-between"
                >
                  {/* Card Header (Instagram Style) */}
                  <div className="p-3.5 flex items-center justify-between bg-slate-50 border-b border-[#e3dccb]">
                    <div
                      onClick={() => navigate(`/customer/vendor/${vendorId}`)}
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d99a3d] to-[#241b15] p-0.5">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xs font-bold text-[#1a1a1a] overflow-hidden">
                          {item.vendor?.avatarUrl || item.vendor?.profile_pic ? (
                            <img src={item.vendor.avatarUrl || item.vendor.profile_pic} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{item.vendor?.name ? item.vendor.name.charAt(0) : 'V'}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-[#1a1a1a] flex items-center gap-1.5">
                          {item.vendor?.name || 'Verified Vendor'}
                          <span className="bg-emerald-500/15 text-emerald-700 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">Product</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <FiMapPin size={10} className="text-[#d99a3d]" />
                          {item.vendor?.location?.address || 'Nearby'}
                          <span className="mx-1">•</span>
                          <span>{formatTimeAgo(item.createdAt)}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleFollow(vendorId)}
                      className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer border-none ${isFollowing
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] shadow-xs'
                        }`}
                    >
                      {isFollowing ? <><FiCheck size={12} /> Following</> : <><FiUserPlus size={12} /> Follow</>}
                    </button>
                  </div>

                  {/* Listing Media Section */}
                  <div
                    onClick={() => {
                      const idx = processedImages.findIndex(i => i._id === itemId || i.id === itemId);
                      setImageViewerStartIndex(idx >= 0 ? idx : 0);
                      setImageViewerOpen(true);
                    }}
                    className="cursor-pointer aspect-square bg-slate-100 relative overflow-hidden select-none"
                  >
                    <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-[#d99a3d] px-3 py-1 rounded text-xs font-extrabold text-[#1a1a1a] shadow-xs border border-[#1a1a1a]/10">
                      ₹{item.price?.toLocaleString()}
                    </div>
                  </div>

                  {/* Action Bar & Details */}
                  <div className="p-4 bg-white space-y-3 border-t border-[#e3dccb]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(itemId, 'listing');
                          }}
                          className={`flex items-center gap-1.5 text-xs font-bold transition cursor-pointer border-none bg-transparent ${isLiked ? 'text-[#d99a3d]' : 'text-slate-600 hover:text-[#d99a3d]'}`}
                          title="Like"
                        >
                          <FiHeart size={20} className={isLiked ? 'fill-[#d99a3d]' : ''} />
                          <span>{(item.likesCount || 0) + (isLiked ? 1 : 0)}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(item);
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1a1a1a] cursor-pointer border-none bg-transparent"
                          title="Share Post"
                        >
                          <FiSend size={18} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChat(
                              vendorId,
                              item.vendor?.name,
                              item.vendor?.avatarUrl || item.vendor?.profile_pic
                            );
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#1a1a1a] hover:text-[#d99a3d] cursor-pointer border-none bg-transparent"
                          title="Chat with Vendor"
                        >
                          <FiMessageSquare size={17} className="text-[#d99a3d]" />
                          <span>Chat</span>
                        </button>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(itemId, 'listing');
                        }}
                        className={`transition cursor-pointer border-none bg-transparent ${isSaved ? 'text-[#d99a3d]' : 'text-slate-500 hover:text-[#1a1a1a]'}`}
                        title="Save"
                      >
                        <FiBookmark size={20} className={isSaved ? 'fill-[#d99a3d]' : ''} />
                      </button>
                    </div>

                    {/* Product Title and Price */}
                    <div className="flex items-baseline justify-between mt-1">
                      <h4 className="font-extrabold text-sm text-[#1a1a1a]">{item.title}</h4>
                      <span className="text-xs font-extrabold text-[#d99a3d]">₹{item.price?.toLocaleString()}</span>
                    </div>

                    {/* Expandable Caption */}
                    <div className="text-xs text-slate-700 leading-relaxed mt-1">
                      <span className="font-extrabold text-[#1a1a1a] mr-1.5">{item.vendor?.name || 'Verified Vendor'}</span>
                      {isExpanded ? (
                        <span>{item.description}</span>
                      ) : (
                        <span>
                          {((item.description || '').slice(0, 90))}
                          {(item.description || '').length > 90 && (
                            <button
                              onClick={() => toggleCaption(itemId)}
                              className="text-slate-400 font-bold ml-1 hover:underline border-none bg-transparent cursor-pointer"
                            >
                              ...more
                            </button>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            }
          })}
        </div>
      )}
      </div>

      <CommentsDrawer
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        reelId={selectedReelId}
      />

      <ChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        recipientId={chatDrawerRecipientId}
        recipientName={chatDrawerRecipientName}
        recipientAvatar={chatDrawerRecipientAvatar}
      />

      {/* Fullscreen Reel Viewer */}
      {reelViewerOpen && processedReels.length > 0 && (
        <ReelFullscreenViewer
          reels={processedReels}
          startIndex={reelViewerStartIndex}
          onClose={() => setReelViewerOpen(false)}
          onLike={handleLike}
          onSave={handleSave}
          onFollow={handleFollow}
          likedMap={likedMap}
          savedMap={savedMap}
          followingMap={followingMap}
        />
      )}

      {/* Fullscreen Image Viewer */}
      {imageViewerOpen && processedImages.length > 0 && (
        <ImageFullscreenViewer
          images={processedImages}
          startIndex={imageViewerStartIndex}
          onClose={() => setImageViewerOpen(false)}
          onLike={handleLike}
          onSave={handleSave}
          onFollow={handleFollow}
          likedMap={likedMap}
          savedMap={savedMap}
          followingMap={followingMap}
        />
      )}
    </div>
  );
}