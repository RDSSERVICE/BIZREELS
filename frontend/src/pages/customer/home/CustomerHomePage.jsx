import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiUserPlus,
  FiMapPin, FiSearch, FiSliders, FiPlay, FiVolume2, FiVolumeX, FiCheck,
  FiChevronLeft, FiChevronRight, FiVideo, FiImage, FiMessageSquare, FiLayers
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

/**
 * CustomerReelMedia Component
 * Displays video or image media with arrow buttons for multi-photo reels
 */
function CustomerReelMedia({ reel, muted, setMuted }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const rawMediaList = Array.isArray(reel.mediaUrls) && reel.mediaUrls.length > 0
    ? reel.mediaUrls
    : [reel.videoUrl || reel.thumbnailUrl || 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4'];

  const mediaList = rawMediaList.filter(Boolean);
  const currentUrl = mediaList[currentIndex] || mediaList[0] || '';

  const isVideo = reel.mediaType === 'video' ||
    Boolean(currentUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i)) ||
    currentUrl.startsWith('data:video/');

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
    <div className="relative aspect-[9/16] bg-black group overflow-hidden">
      {isVideo ? (
        <video
          src={currentUrl}
          loop
          muted={muted}
          autoPlay
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

      {isVideo && (
        <button
          onClick={() => setMuted(!muted)}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition z-20"
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
        </button>
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
                className={`h-1.5 rounded-full transition-all ${currentIndex === idx ? 'w-4 bg-brand-purple' : 'w-1.5 bg-white/60'
                  }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CustomerHomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('combined'); // 'combined' | 'reels' | 'images'
  const [combinedFeed, setCombinedFeed] = useState([]);
  const [reels, setReels] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedMap, setLikedMap] = useState({});
  const [savedMap, setSavedMap] = useState({});
  const [followingMap, setFollowingMap] = useState({});
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
      toast.success(!isLiked ? 'Liked post' : 'Unliked post');
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
      toast.success(!isSaved ? 'Saved to activities' : 'Removed from saved');
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

  const handleShare = async (reel) => {
    if (!reel?._id) return;
    const shareUrl = `${window.location.origin}/reels/${reel._id}`;
    const shareData = {
      title: reel.title || 'BizReels',
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

  // Unified Filter & Sort Logic for Combined Feed (Instagram-style)
  const processedCombinedFeed = useMemo(() => {
    let result = [...combinedFeed];

    // 1. Search Query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter((item) => {
        if (item.postType === 'reel') {
          return (
            (item.caption && item.caption.toLowerCase().includes(q)) ||
            (item.creator?.name && item.creator.name.toLowerCase().includes(q)) ||
            (item.location?.address && item.location.address.toLowerCase().includes(q)) ||
            (item.hashtags && item.hashtags.some((h) => h.toLowerCase().includes(q)))
          );
        } else {
          return (
            (item.title && item.title.toLowerCase().includes(q)) ||
            (item.description && item.description.toLowerCase().includes(q)) ||
            (item.category && item.category.toLowerCase().includes(q)) ||
            (item.vendor?.name && item.vendor.name.toLowerCase().includes(q))
          );
        }
      });
    }

    // 2. Type Filter (Product, Service, etc.)
    if (filters.type !== 'all') {
      const targetType = filters.type.toLowerCase();
      result = result.filter((item) => {
        if (item.postType === 'reel') {
          const rType = (item.reelType || item.type || item.category || '').toLowerCase();
          const rCaption = (item.caption || '').toLowerCase();
          return rType.includes(targetType) || rCaption.includes(targetType);
        } else {
          const itemType = (item.type || item.category || '').toLowerCase();
          return itemType.includes(targetType);
        }
      });
    }

    // 3. Upload Date Filter
    if (filters.uploadDate !== 'all') {
      const now = new Date();
      result = result.filter((item) => {
        const dateKey = item.createdAt || item.created_at;
        if (!dateKey) return true;
        const created = new Date(dateKey);
        const diffHours = (now - created) / (1000 * 60 * 60);
        if (filters.uploadDate === 'today') return diffHours <= 24;
        if (filters.uploadDate === 'this_week') return diffHours <= 24 * 7;
        if (filters.uploadDate === 'this_month') return diffHours <= 24 * 30;
        return true;
      });
    }

    // 4. Popularity / Sort
    switch (filters.popularity) {
      case 'most_viewed':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'most_liked':
        result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case 'most_saved':
        result.sort((a, b) => (b.savesCount || b.saves || 0) - (a.savesCount || a.saves || 0));
        break;
      case 'trending':
      default:
        result.sort((a, b) => {
          if (a.isBoosted && !b.isBoosted) return -1;
          if (!a.isBoosted && b.isBoosted) return 1;
          const popA = (a.likesCount || 0) + (a.views || 0);
          const popB = (b.likesCount || 0) + (b.views || 0);
          return popB - popA;
        });
        break;
    }

    return result;
  }, [combinedFeed, filters]);

  const processedReels = useMemo(() => {
    return processedCombinedFeed.filter(item => item.postType === 'reel');
  }, [processedCombinedFeed]);

  const processedImages = useMemo(() => {
    return processedCombinedFeed.filter(item => item.postType !== 'reel');
  }, [processedCombinedFeed]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* HOME FEED SEARCH & FILTER BAR */}
      <HomeFeedSearchFilter
        filters={filters}
        onFilterChange={setFilters}
        onSearch={fetchFeedData}
        totalResults={processedCombinedFeed.length}
      />

      {/* Active Special Offers & Deals */}
      <ActiveOffersPanel role="customer" />

      {/* Feed Contents */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-tertiary gap-3">
          <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading feed...</p>
        </div>
      ) : activeTab === 'combined' ? (
        processedCombinedFeed.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border">
            No combined posts match your filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {processedCombinedFeed.map((item) => {
              const isLiked = likedMap[item._id || item.id];
              const isSaved = savedMap[item._id || item.id];
              const itemId = item._id || item.id;

              if (item.postType === 'reel') {
                const isFollowing = followingMap[item.creator?._id || item.creator?.id || item.creator];
                return (
                  <div
                    key={itemId}
                    className="w-full glass border border-white/50 rounded-3xl overflow-hidden shadow-card relative self-stretch flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div className="p-3.5 flex items-center justify-between glass border-b border-border">
                      <div
                        onClick={() => navigate(`/customer/vendor/${item.creator?._id || item.creator?.id || item.creator}`)}
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                      >
                        <div className="w-9 h-9 rounded-full gradient-brand p-0.5">
                          <div className="w-full h-full bg-surface rounded-full flex items-center justify-center text-xs font-bold text-text-primary">
                            {item.creator?.name ? item.creator.name.charAt(0) : 'V'}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5 font-display">
                            {item.creator?.name || 'Verified Creator'}
                            <span className="bg-brand-purple/10 text-brand-purple text-[9px] px-1 rounded font-bold">Reel</span>
                          </h4>
                          <p className="text-[10px] text-text-tertiary flex items-center gap-1">
                            <FiMapPin size={10} className="text-brand-orange" />
                            {item.location?.address || 'Nearby'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleFollow(item.creator?._id || item.creator?.id || item.creator)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition ${isFollowing
                          ? 'bg-surface-tertiary text-text-secondary border border-border'
                          : 'gradient-brand text-white shadow-premium'
                          }`}
                      >
                        {isFollowing ? <><FiCheck size={12} /> Following</> : <><FiUserPlus size={12} /> Follow</>}
                      </button>
                    </div>

                    {/* Reel Media */}
                    <div
                      onClick={() => {
                        const idx = processedReels.findIndex(r => r._id === itemId || r.id === itemId);
                        setReelViewerStartIndex(idx >= 0 ? idx : 0);
                        setReelViewerOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <CustomerReelMedia reel={item} muted={muted} setMuted={setMuted} />
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 glass space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLike(itemId, 'reel')}
                            className={`flex items-center gap-1.5 text-xs font-semibold transition ${isLiked ? 'text-brand-pink' : 'text-text-secondary hover:text-brand-pink'}`}
                          >
                            <FiHeart size={20} className={isLiked ? 'fill-brand-pink' : ''} />
                            <span>{(item.likesCount || 0) + (isLiked ? 1 : 0)}</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedReelId(itemId);
                              setIsCommentsOpen(true);
                            }}
                            className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-purple"
                          >
                            <FiMessageCircle size={20} />
                            <span>{item.commentsCount || 0}</span>
                          </button>

                          <button
                            onClick={() => handleOpenChat(
                              item.creator?._id || item.creator?.id || item.creator,
                              item.creator?.name,
                              item.creator?.avatarUrl || item.creator?.profile_pic
                            )}
                            className="flex items-center gap-1.5 text-xs font-bold text-brand-purple hover:underline"
                            title="Chat with Vendor"
                          >
                            <FiMessageSquare size={18} />
                            <span>Chat</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleSave(itemId, 'reel')}
                          className={`transition ${isSaved ? 'text-brand-purple' : 'text-text-secondary hover:text-brand-purple'}`}
                        >
                          <FiBookmark size={20} className={isSaved ? 'fill-brand-purple' : ''} />
                        </button>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mt-1">{item.caption || item.description}</p>
                    </div>
                  </div>
                );
              } else {
                // Listing card (Image/Products)
                return (
                  <div
                    key={itemId}
                    className="glass rounded-3xl border border-white/50 overflow-hidden shadow-card cursor-pointer hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between self-stretch"
                    onClick={() => {
                      const idx = processedImages.findIndex(i => i._id === itemId || i.id === itemId);
                      setImageViewerStartIndex(idx >= 0 ? idx : 0);
                      setImageViewerOpen(true);
                    }}
                  >
                    <div className="aspect-square bg-surface-tertiary relative overflow-hidden shrink-0">
                      <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 glass px-3 py-1 rounded-full text-xs font-bold text-emerald-600 border border-border">
                        ₹{item.price?.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-text-primary font-display">{item.title}</h4>
                        <p
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customer/vendor/${item.vendor?._id || item.vendor?.id || item.vendor}`);
                          }}
                          className="text-xs text-text-tertiary hover:text-brand-purple cursor-pointer transition font-medium mt-1"
                        >
                          By {item.vendor?.name || 'Verified Vendor'}
                        </p>
                        {item.description && (
                          <p className="text-xs text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border mt-3 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(itemId, 'listing');
                          }}
                          className={`flex items-center gap-1 text-xs ${isLiked ? 'text-brand-pink font-bold' : 'text-text-tertiary'}`}
                        >
                          <FiHeart size={16} className={isLiked ? 'fill-brand-pink' : ''} />
                          <span>{(item.likesCount || 0) + (isLiked ? 1 : 0)}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChat(
                              item.vendor?._id || item.vendor?.id || item.vendor,
                              item.vendor?.name,
                              item.vendor?.avatarUrl || item.vendor?.profile_pic
                            );
                          }}
                          className="text-xs text-brand-purple font-bold hover:underline flex items-center gap-1"
                        >
                          <FiMessageSquare size={14} />
                          <span>Chat</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave(itemId, 'listing');
                          }}
                          className={`text-xs flex items-center gap-1 ${isSaved ? 'text-brand-purple font-bold' : 'text-text-tertiary'}`}
                        >
                          <FiBookmark size={16} className={isSaved ? 'fill-brand-purple' : ''} />
                          <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )
      ) : activeTab === 'reels' ? (
        processedReels.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border">
            No video reels match your search and filter criteria.
          </div>
        ) : (
          <div className="space-y-8 flex flex-col items-center">
            {processedReels.map((reel) => {
              const isLiked = likedMap[reel._id];
              const isSaved = savedMap[reel._id];
              const isFollowing = followingMap[reel.creator?._id || reel.creator];

              return (
                <div
                  key={reel._id}
                  className="w-full max-w-md glass border border-white/50 rounded-3xl overflow-hidden shadow-card relative"
                >
                  {/* Header */}
                  <div className="p-3.5 flex items-center justify-between glass border-b border-border">
                    <div
                      onClick={() => navigate(`/customer/vendor/${reel.creator?._id || reel.creator}`)}
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                    >
                      <div className="w-9 h-9 rounded-full gradient-brand p-0.5">
                        <div className="w-full h-full bg-surface rounded-full flex items-center justify-center text-xs font-bold text-text-primary">
                          {typeof reel.creator === 'object' && reel.creator?.name ? reel.creator.name.charAt(0) : 'V'}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5 font-display">
                          {typeof reel.creator === 'object' && reel.creator?.name ? reel.creator.name : 'Verified Creator'}
                          <span className="bg-brand-purple/10 text-brand-purple text-[9px] px-1 rounded font-bold">Vendor</span>
                        </h4>
                        <p className="text-[10px] text-text-tertiary flex items-center gap-1">
                          <FiMapPin size={10} className="text-brand-orange" />
                          {reel.location?.address || 'Nearby'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleFollow(reel.creator?._id || reel.creator)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition ${isFollowing
                        ? 'bg-surface-tertiary text-text-secondary border border-border'
                        : 'gradient-brand text-white shadow-premium'
                        }`}
                    >
                      {isFollowing ? <><FiCheck size={12} /> Following</> : <><FiUserPlus size={12} /> Follow</>}
                    </button>
                  </div>

                  {/* Reel Media Carousel Viewport — Click to open fullscreen */}
                  <div
                    onClick={() => {
                      const idx = processedReels.findIndex(r => r._id === reel._id);
                      setReelViewerStartIndex(idx >= 0 ? idx : 0);
                      setReelViewerOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <CustomerReelMedia reel={reel} muted={muted} setMuted={setMuted} />
                  </div>

                  {/* Action Bar */}
                  <div className="p-4 glass space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(reel._id, 'reel')}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition ${isLiked ? 'text-brand-pink' : 'text-text-secondary hover:text-brand-pink'
                            }`}
                        >
                          <FiHeart size={20} className={isLiked ? 'fill-brand-pink' : ''} />
                          <span>{(reel.likesCount || 0) + (isLiked ? 1 : 0)}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedReelId(reel._id);
                            setIsCommentsOpen(true);
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-purple"
                        >
                          <FiMessageCircle size={20} />
                          <span>{reel.commentsCount || 0}</span>
                        </button>

                        <button
                          onClick={() => handleOpenChat(
                            reel.creator?._id || reel.creator,
                            reel.creator?.name,
                            reel.creator?.avatarUrl || reel.creator?.profile_pic
                          )}
                          className="flex items-center gap-1.5 text-xs font-bold text-brand-purple hover:underline"
                          title="Chat with Vendor"
                        >
                          <FiMessageSquare size={18} />
                          <span>Chat</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleSave(reel._id, 'reel')}
                        className={`transition ${isSaved ? 'text-brand-purple' : 'text-text-secondary hover:text-brand-purple'}`}
                      >
                        <FiBookmark size={20} className={isSaved ? 'fill-brand-purple' : ''} />
                      </button>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-1 opacity-60">{reel.category || ''} {reel.subcategory ? '• ' + reel.subcategory : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Image Feed Grid */
        processedImages.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border">
            No image listings match your search and filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {processedImages.map((item) => {
              const isLiked = likedMap[item._id];
              const isSaved = savedMap[item._id];

              return (
                <div key={item._id} className="glass rounded-3xl border border-white/50 overflow-hidden shadow-card cursor-pointer hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  onClick={() => {
                    const idx = processedImages.findIndex(i => i._id === item._id);
                    setImageViewerStartIndex(idx >= 0 ? idx : 0);
                    setImageViewerOpen(true);
                  }}
                >
                  <div className="aspect-square bg-surface-tertiary relative overflow-hidden">
                    <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 glass px-3 py-1 rounded-full text-xs font-bold text-emerald-600 border border-border">
                      ₹{item.price?.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-sm text-text-primary font-display">{item.title}</h4>
                    <p
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customer/vendor/${item.vendor?._id || item.vendor}`);
                      }}
                      className="text-xs text-text-tertiary hover:text-brand-purple cursor-pointer transition font-medium"
                    >
                      By {typeof item.vendor === 'object' && item.vendor?.name ? item.vendor.name : 'Verified Vendor'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(item._id, 'listing');
                        }}
                        className={`flex items-center gap-1 text-xs ${isLiked ? 'text-brand-pink font-bold' : 'text-text-tertiary'}`}
                      >
                        <FiHeart size={16} className={isLiked ? 'fill-brand-pink' : ''} />
                        <span>{(item.likesCount || 0) + (isLiked ? 1 : 0)}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenChat(
                            item.vendor?._id || item.vendor?.id || item.vendor,
                            item.vendor?.name,
                            item.vendor?.avatarUrl || item.vendor?.profile_pic
                          );
                        }}
                        className="text-xs text-brand-purple font-bold hover:underline flex items-center gap-1"
                      >
                        <FiMessageSquare size={14} />
                        <span>Chat</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(item._id, 'listing');
                        }}
                        className={`text-xs flex items-center gap-1 ${isSaved ? 'text-brand-purple font-bold' : 'text-text-tertiary'}`}
                      >
                        <FiBookmark size={16} className={isSaved ? 'fill-brand-purple' : ''} />
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
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