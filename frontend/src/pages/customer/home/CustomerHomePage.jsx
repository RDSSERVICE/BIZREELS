import React, { useState, useEffect, useMemo } from 'react';
import {
  FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiUserPlus,
  FiMapPin, FiSearch, FiSliders, FiPlay, FiVolume2, FiVolumeX, FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';
import HomeFeedSearchFilter from '../../../components/feed/HomeFeedSearchFilter';

export default function CustomerHomePage() {
  const [activeTab, setActiveTab] = useState('reels'); // 'reels' | 'images'
  const [reels, setReels] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedMap, setLikedMap] = useState({});
  const [savedMap, setSavedMap] = useState({});
  const [followingMap, setFollowingMap] = useState({});
  const [muted, setMuted] = useState(true);

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

  useEffect(() => {
    fetchFeedData();
  }, [activeTab]);

  const fetchFeedData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/${activeTab === 'reels' ? 'reels' : 'listings'}`);
      const data = res.data;

      if (activeTab === 'reels') {
        const items = Array.isArray(data.data?.reels) ? data.data.reels : Array.isArray(data.reels) ? data.reels : Array.isArray(data) ? data : [];
        setReels(items);
      } else {
        const items = Array.isArray(data.data?.listings) ? data.data.listings : Array.isArray(data.listings) ? data.listings : Array.isArray(data) ? data : [];
        setImages(items);
      }
    } catch (err) {
      toast.error('Failed to load feed data');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id) => {
    const isLiked = !!likedMap[id];
    setLikedMap((prev) => ({ ...prev, [id]: !isLiked }));
    try {
      if (activeTab === 'reels') {
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

  const handleSave = async (id) => {
    const isSaved = !!savedMap[id];
    setSavedMap((prev) => ({ ...prev, [id]: !isSaved }));
    try {
      await api.post(`/v1/listings/${id}/save`);
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

  // Filter & Sort Logic for Reels & Images
  const processedReels = useMemo(() => {
    let result = [...reels];

    // 1. Search Query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter((r) =>
        (r.caption && r.caption.toLowerCase().includes(q)) ||
        (r.creator?.name && r.creator.name.toLowerCase().includes(q)) ||
        (r.location?.address && r.location.address.toLowerCase().includes(q)) ||
        (r.hashtags && r.hashtags.some((h) => h.toLowerCase().includes(q)))
      );
    }

    // 2. Type Filter (Product Reel, Service Reel, Offer Reel, Announcement, Shop promotion)
    if (filters.type !== 'all') {
      const targetType = filters.type.toLowerCase();
      result = result.filter((r) => {
        const rType = (r.reelType || r.type || r.category || '').toLowerCase();
        const rCaption = (r.caption || '').toLowerCase();
        return rType.includes(targetType) || rCaption.includes(targetType);
      });
    }

    // 3. Duration Filter (Under 15 sec, Under 30 sec)
    if (filters.duration === 'under15') {
      result = result.filter((r) => !r.duration || r.duration <= 15);
    } else if (filters.duration === 'under30') {
      result = result.filter((r) => !r.duration || r.duration <= 30);
    }

    // 4. Upload Date Filter (Today, This Week, This Month)
    if (filters.uploadDate !== 'all') {
      const now = new Date();
      result = result.filter((r) => {
        if (!r.createdAt) return true;
        const created = new Date(r.createdAt);
        const diffHours = (now - created) / (1000 * 60 * 60);
        if (filters.uploadDate === 'today') return diffHours <= 24;
        if (filters.uploadDate === 'this_week') return diffHours <= 24 * 7;
        if (filters.uploadDate === 'this_month') return diffHours <= 24 * 30;
        return true;
      });
    }

    // 5. Popularity / Sort (Most Viewed, Most Liked, Most Shared, Most Saved, Trending)
    switch (filters.popularity) {
      case 'most_viewed':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'most_liked':
        result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case 'most_shared':
        result.sort((a, b) => (b.sharesCount || b.shares || 0) - (a.sharesCount || a.shares || 0));
        break;
      case 'most_saved':
        result.sort((a, b) => (b.savesCount || b.saves || 0) - (a.savesCount || a.saves || 0));
        break;
      case 'trending':
      default:
        result.sort((a, b) => {
          if (a.isBoosted && !b.isBoosted) return -1;
          if (!a.isBoosted && b.isBoosted) return 1;
          return (b.likesCount || 0) + (b.views || 0) - ((a.likesCount || 0) + (a.views || 0));
        });
        break;
    }

    return result;
  }, [reels, filters]);

  const processedImages = useMemo(() => {
    let result = [...images];

    // 1. Search Query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter((img) =>
        (img.title && img.title.toLowerCase().includes(q)) ||
        (img.description && img.description.toLowerCase().includes(q)) ||
        (img.category && img.category.toLowerCase().includes(q))
      );
    }

    // 2. Type Filter
    if (filters.type !== 'all') {
      const targetType = filters.type.toLowerCase();
      result = result.filter((img) => {
        const itemType = (img.type || img.category || '').toLowerCase();
        return itemType.includes(targetType);
      });
    }

    // 3. Popularity Sort
    switch (filters.popularity) {
      case 'most_viewed':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'most_liked':
        result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case 'most_saved':
        result.sort((a, b) => (b.savesCount || 0) - (a.savesCount || 0));
        break;
      case 'trending':
      default:
        result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
    }

    return result;
  }, [images, filters]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* HOME FEED SEARCH & FILTER BAR */}
      <HomeFeedSearchFilter
        filters={filters}
        onFilterChange={setFilters}
        onSearch={fetchFeedData}
        totalResults={activeTab === 'reels' ? processedReels.length : processedImages.length}
      />

      {/* Admin Tab Navigation */}
      <div className="flex justify-center border-b border-border">
        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs border-b-2 transition ${
            activeTab === 'reels'
              ? 'border-brand-purple text-brand-purple'
              : 'border-transparent text-text-tertiary hover:text-text-primary'
          }`}
        >
          <FiPlay size={16} />
          <span>Reels Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs border-b-2 transition ${
            activeTab === 'images'
              ? 'border-brand-purple text-brand-purple'
              : 'border-transparent text-text-tertiary hover:text-text-primary'
          }`}
        >
          <FiBookmark size={16} />
          <span>Image Feed</span>
        </button>
      </div>

      {/* Feed Contents */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-tertiary gap-3">
          <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading feed...</p>
        </div>
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
                    <div className="flex items-center gap-3">
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
                      className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition ${
                        isFollowing
                          ? 'bg-surface-tertiary text-text-secondary border border-border'
                          : 'gradient-brand text-white shadow-premium'
                      }`}
                    >
                      {isFollowing ? <><FiCheck size={12} /> Following</> : <><FiUserPlus size={12} /> Follow</>}
                    </button>
                  </div>

                  {/* Video Viewport */}
                  <div className="relative aspect-[9/16] bg-black">
                    <video
                      src={reel.videoUrl}
                      loop
                      muted={muted}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    <button
                      onClick={() => setMuted(!muted)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition"
                    >
                      {muted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
                    </button>
                  </div>

                  {/* Action Bar */}
                  <div className="p-4 glass space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(reel._id)}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition ${
                            isLiked ? 'text-brand-pink' : 'text-text-secondary hover:text-brand-pink'
                          }`}
                        >
                          <FiHeart size={20} className={isLiked ? 'fill-brand-pink' : ''} />
                          <span>{(reel.likesCount || 0) + (isLiked ? 1 : 0)}</span>
                        </button>

                        <button className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-purple">
                          <FiMessageCircle size={20} />
                          <span>{reel.commentsCount || 0}</span>
                        </button>

                        <button
                          onClick={() => toast.success('Share link copied to clipboard!')}
                          className="text-text-secondary hover:text-emerald-600 transition"
                        >
                          <FiShare2 size={20} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleSave(reel._id)}
                        className={`transition ${isSaved ? 'text-brand-purple' : 'text-text-secondary hover:text-brand-purple'}`}
                      >
                        <FiBookmark size={20} className={isSaved ? 'fill-brand-purple' : ''} />
                      </button>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">{reel.caption}</p>
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
                <div key={item._id} className="glass rounded-3xl border border-white/50 overflow-hidden shadow-card">
                  <div className="aspect-square bg-surface-tertiary relative overflow-hidden">
                    <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 glass px-3 py-1 rounded-full text-xs font-bold text-emerald-600 border border-border">
                      ₹{item.price?.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-sm text-text-primary font-display">{item.title}</h4>
                    <p className="text-xs text-text-tertiary">By {typeof item.vendor === 'object' && item.vendor?.name ? item.vendor.name : 'Verified Vendor'}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <button
                        onClick={() => handleLike(item._id)}
                        className={`flex items-center gap-1 text-xs ${isLiked ? 'text-brand-pink font-bold' : 'text-text-tertiary'}`}
                      >
                        <FiHeart size={16} className={isLiked ? 'fill-brand-pink' : ''} />
                        <span>{(item.likesCount || 0) + (isLiked ? 1 : 0)}</span>
                      </button>

                      <button
                        onClick={() => handleSave(item._id)}
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
    </div>
  );
}
