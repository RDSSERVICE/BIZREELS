import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiUserPlus,
  FiMapPin, FiSearch, FiSliders, FiPlay, FiVolume2, FiVolumeX, FiCheck,
  FiChevronLeft, FiChevronRight, FiVideo, FiImage, FiMessageSquare, FiLayers,
  FiMoreHorizontal, FiSend, FiShoppingCart, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api, cartApi } from '../../../lib/api';
import { notifyCartChanged, openCartDrawer } from '../../../components/app/CartDrawer';
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
  const { user } = useSelector((state) => state.auth || {});
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
  const [coords, setCoords] = useState(null);

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

  // ── 1. Geolocation Detection on Mount & from Customer Profile ──
  useEffect(() => {
    // 1. Check user profile / address coordinates
    if (user?.location?.coordinates && Array.isArray(user.location.coordinates) && user.location.coordinates.length === 2) {
      if (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0) {
        setCoords({ lat: user.location.coordinates[1], lng: user.location.coordinates[0] });
      }
    }

    // 2. Request browser Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos.coords.latitude && pos.coords.longitude) {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
        },
        (err) => {
          console.warn('Customer home geolocation error:', err);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    }
  }, [user]);

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
  }, [activeTab, coords]);

  const fetchFeedData = async () => {
    setLoading(true);
    try {
      let endpoint = `/v1/listings`;
      if (activeTab === 'reels') {
        endpoint = `/v1/reels`;
      } else if (activeTab === 'combined') {
        endpoint = `/v1/feed?type=all`;
      }

      const params = {};
      if (coords?.lat && coords?.lng) {
        params.lat = coords.lat;
        params.lng = coords.lng;
      }
      
      const res = await api.get(endpoint, { params });
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

  const [geocodedCache, setGeocodedCache] = useState({});

  // ── 2. Geocoding Fallback for Items without Coordinates ──
  useEffect(() => {
    const geocodeLocations = async () => {
      const allItems = [...combinedFeed, ...reels, ...images];
      if (allItems.length === 0) return;

      const toGeocode = [];
      for (const item of allItems) {
        const vendorObj = item.vendor || item.creator || item.vendorId || {};
        const itemCoords = (item.location && Array.isArray(item.location.coordinates) && item.location.coordinates.length === 2 && (item.location.coordinates[0] !== 0 || item.location.coordinates[1] !== 0))
          ? item.location.coordinates
          : (vendorObj.location && Array.isArray(vendorObj.location.coordinates) && vendorObj.location.coordinates.length === 2 && (vendorObj.location.coordinates[0] !== 0 || vendorObj.location.coordinates[1] !== 0))
          ? vendorObj.location.coordinates
          : null;

        if (!itemCoords) {
          const city = item.location?.city || vendorObj.location?.city || item.city || vendorObj.city;
          const address = item.location?.address || vendorObj.location?.address || vendorObj.address;
          const state = item.location?.state || vendorObj.location?.state || vendorObj.state;
          const pincode = item.location?.pincode || vendorObj.location?.pincode || vendorObj.pincode;
          const locStr = [address, city, state, pincode].filter(Boolean).join(', ') || city || address;
          if (locStr && locStr.trim() && !geocodedCache[locStr]) {
            toGeocode.push(locStr);
          }
        }
      }

      const uniqueToGeocode = [...new Set(toGeocode)].slice(0, 10);
      if (uniqueToGeocode.length === 0) return;

      const newCache = {};
      let updated = false;

      for (const locStr of uniqueToGeocode) {
        try {
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locStr)}&key=${apiKey}`
            );
            const data = await res.json();
            if (data && data.results && data.results.length > 0) {
              const loc = data.results[0].geometry.location;
              newCache[locStr] = { lat: loc.lat, lng: loc.lng };
              updated = true;
              continue;
            }
          }
          // Nominatim OpenStreetMap geocoding fallback
          const osmRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locStr)}&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const osmData = await osmRes.json();
          if (Array.isArray(osmData) && osmData.length > 0) {
            newCache[locStr] = { lat: parseFloat(osmData[0].lat), lng: parseFloat(osmData[0].lon) };
            updated = true;
          }
        } catch (e) {
          // ignore geocoding errors
        }
      }

      if (updated) {
        setGeocodedCache(prev => ({ ...prev, ...newCache }));
      }
    };

    geocodeLocations();
  }, [combinedFeed, reels, images, geocodedCache]);

  // ── 3. Precise Haversine Distance Calculation ──
  const calculateDistanceKm = (item) => {
    if (!item) return null;

    // Check precalculated backend distance
    if (item.distance !== undefined && item.distance !== null && !isNaN(item.distance)) {
      const km = item.distance / 1000;
      if (km < 6000) return km;
    }
    if (item.distanceKm !== undefined && item.distanceKm !== null && !isNaN(item.distanceKm)) {
      const km = Number(item.distanceKm);
      if (km < 6000) return km;
    }

    // Client-side Haversine formula calculation
    if (!coords || (coords.lat === 0 && coords.lng === 0)) return null;

    const vendorObj = item.vendor || item.creator || item.vendorId || {};
    const itemCoordinates = (item.location && Array.isArray(item.location.coordinates) && item.location.coordinates.length === 2 && (item.location.coordinates[0] !== 0 || item.location.coordinates[1] !== 0))
      ? item.location.coordinates
      : (vendorObj.location && Array.isArray(vendorObj.location.coordinates) && vendorObj.location.coordinates.length === 2 && (vendorObj.location.coordinates[0] !== 0 || vendorObj.location.coordinates[1] !== 0))
      ? vendorObj.location.coordinates
      : null;

    let targetLat = null;
    let targetLng = null;

    if (itemCoordinates) {
      targetLng = itemCoordinates[0];
      targetLat = itemCoordinates[1];
    } else {
      const city = item.location?.city || vendorObj.location?.city || item.city || vendorObj.city;
      const address = item.location?.address || vendorObj.location?.address || vendorObj.address;
      const state = item.location?.state || vendorObj.location?.state || vendorObj.state;
      const pincode = item.location?.pincode || vendorObj.location?.pincode || vendorObj.pincode;
      const locStr = [address, city, state, pincode].filter(Boolean).join(', ') || city || address;
      if (locStr && geocodedCache[locStr]) {
        targetLat = geocodedCache[locStr].lat;
        targetLng = geocodedCache[locStr].lng;
      }
    }

    if (targetLat && targetLng && (targetLat !== 0 || targetLng !== 0)) {
      const R = 6371; // Earth radius in km
      const dLat = (targetLat - coords.lat) * (Math.PI / 180);
      const dLng = (targetLng - coords.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coords.lat * (Math.PI / 180)) *
          Math.cos(targetLat * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const km = R * c;
      if (km < 6000) return km;
    }

    return null;
  };

  // Format distance display string: e.g. "2.4 km", "850 m", or City/Nearby
  const formatDistance = (item) => {
    const km = calculateDistanceKm(item);
    if (km !== null) {
      if (km < 1) {
        return `${Math.max(50, Math.round(km * 1000))} m`;
      }
      return `${km.toFixed(1)} km`;
    }
    const city = item.location?.city || item.vendor?.location?.city || item.creator?.location?.city || item.city || item.vendor?.city;
    if (city) return city;
    const address = item.location?.address || item.vendor?.location?.address || item.creator?.location?.address;
    if (address && typeof address === 'string' && address.length <= 22) return address;
    return 'Nearby';
  };

  // ── 3. Complete Filtering & Sorting Logic ──
  const processedCombinedFeed = useMemo(() => {
    let items = combinedFeed;
    if (activeTab === 'reels') items = reels.map(r => ({ ...r, postType: 'reel' }));
    if (activeTab === 'images') items = images.map(i => ({ ...i, postType: 'listing' }));

    if (!filters) return items;

    // 1. FILTERING
    let filtered = items.filter((item) => {
      // 1.1 Search Query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const title = (item.title || item.caption || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const vendorName = (item.vendor?.name || item.creator?.name || item.vendor?.shopName || '').toLowerCase();
        const categoryName = (item.category || item.subcategory || item.reelType || '').toLowerCase();
        const locationStr = (item.location?.address || item.location?.city || item.city || '').toLowerCase();
        const hashtags = Array.isArray(item.hashtags) ? item.hashtags.join(' ').toLowerCase() : '';
        const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';

        const matchesQuery = 
          title.includes(query) ||
          desc.includes(query) ||
          vendorName.includes(query) ||
          categoryName.includes(query) ||
          locationStr.includes(query) ||
          hashtags.includes(query) ||
          tags.includes(query);

        if (!matchesQuery) return false;
      }

      // 1.2 Type / Category Filter
      if (filters.type && filters.type !== 'all') {
        const itemCategory = (item.category || item.reelType || item.postPurpose || item.type || '').toLowerCase();
        const itemSubCategory = (item.subcategory || '').toLowerCase();
        const typeFilter = filters.type.toLowerCase();
        if (!itemCategory.includes(typeFilter) && !itemSubCategory.includes(typeFilter)) {
          return false;
        }
      }

      // 1.3 Video Duration Filter
      if (filters.duration && filters.duration !== 'all') {
        if (item.postType === 'reel') {
          const dur = Number(item.duration || item.videoDuration || 0);
          if (filters.duration === 'under15' && dur > 0 && dur > 15) {
            return false;
          }
          if (filters.duration === 'under30' && dur > 0 && dur > 30) {
            return false;
          }
        }
      }

      // 1.4 Upload Date Filter
      if (filters.uploadDate && filters.uploadDate !== 'all' && item.createdAt) {
        const createdTime = new Date(item.createdAt).getTime();
        const now = Date.now();
        if (!isNaN(createdTime)) {
          if (filters.uploadDate === 'today' && now - createdTime > 24 * 60 * 60 * 1000) {
            return false;
          }
          if (filters.uploadDate === 'this_week' && now - createdTime > 7 * 24 * 60 * 60 * 1000) {
            return false;
          }
          if (filters.uploadDate === 'this_month' && now - createdTime > 30 * 24 * 60 * 60 * 1000) {
            return false;
          }
        }
      }

      // 1.5 Location Scope & Distance Filter
      if (filters.nearby === 'near_me') {
        if (filters.distanceKm && filters.distanceKm !== 'all') {
          const maxKm = Number(filters.distanceKm);
          const distKm = calculateDistanceKm(item);
          if (distKm !== null && distKm > maxKm) {
            return false;
          }
        }
      } else if (filters.nearby === 'city') {
        const userCity = (user?.location?.city || user?.customerProfile?.city || '').toLowerCase();
        const itemCity = (item.location?.city || item.vendor?.location?.city || item.creator?.location?.city || item.city || item.vendor?.city || '').toLowerCase();
        if (userCity && itemCity && !itemCity.includes(userCity) && !userCity.includes(itemCity)) {
          return false;
        }
      } else if (filters.nearby === 'state') {
        const userState = (user?.location?.state || user?.customerProfile?.state || '').toLowerCase();
        const itemState = (item.location?.state || item.vendor?.location?.state || item.creator?.location?.state || item.state || item.vendor?.state || '').toLowerCase();
        if (userState && itemState && !itemState.includes(userState) && !userState.includes(itemState)) {
          return false;
        }
      }

      return true;
    });

    // 2. SORTING & POPULARITY
    const popularity = filters.popularity || 'trending';
    filtered.sort((a, b) => {
      if (popularity === 'most_viewed') {
        return (b.views || b.viewCount || 0) - (a.views || a.viewCount || 0);
      }
      if (popularity === 'most_liked') {
        return (b.likesCount || b.likes || 0) - (a.likesCount || a.likes || 0);
      }
      if (popularity === 'most_shared') {
        return (b.sharesCount || b.shares || 0) - (a.sharesCount || a.shares || 0);
      }
      if (popularity === 'most_saved') {
        return (b.savedCount || b.saves || 0) - (a.savedCount || a.saves || 0);
      }
      if (popularity === 'distance') {
        const distA = calculateDistanceKm(a) ?? 99999;
        const distB = calculateDistanceKm(b) ?? 99999;
        return distA - distB;
      }
      // 'trending' (default)
      const scoreA = (a.likesCount || a.likes || 0) * 2 + (a.views || a.viewCount || 0) + (a.commentsCount || 0) * 3;
      const scoreB = (b.likesCount || b.likes || 0) * 2 + (b.views || b.viewCount || 0) + (b.commentsCount || 0) * 3;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return filtered;
  }, [combinedFeed, reels, images, activeTab, filters, coords, user]);

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
                          <span>{formatDistance(item)}</span>
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

                    {/* Quick Add to Cart & Buy Now Action Row */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#e3dccb]/60">
                      <button
                        onClick={async () => {
                          const targetId = item.taggedListing?._id || item.taggedListing || item._id || item.id;
                          try {
                            await cartApi.add({ listing_id: targetId, quantity: 1 });
                            notifyCartChanged();
                            openCartDrawer();
                            toast.success(`"${item.caption || 'Product'}" added to cart!`);
                          } catch {
                            toast.error('Could not add item to cart');
                          }
                        }}
                        className="py-2 px-3 rounded-xl bg-[#f8f4ec] hover:bg-[#eae3d2] text-[#1a1a1a] text-xs font-bold transition border border-[#e3dccb] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FiShoppingCart size={15} className="text-[#d99a3d]" />
                        <span>Add to Cart</span>
                      </button>

                      <button
                        onClick={() => {
                          const targetId = item.taggedListing?._id || item.taggedListing || item._id || item.id;
                          navigate(`/customer/listings/${targetId}`);
                        }}
                        className="py-2 px-3 rounded-xl bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <FiZap size={15} />
                        <span>Buy Now</span>
                      </button>
                    </div>

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
                          <span>{formatDistance(item)}</span>
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

                    {/* Add to Cart & Buy Now Quick Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#f0ebe0]">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const targetId = item._id || item.id;
                          try {
                            await cartApi.add({ listing_id: targetId, quantity: 1 });
                            notifyCartChanged();
                            openCartDrawer();
                            toast.success(`"${item.title || 'Product'}" added to cart!`);
                          } catch {
                            toast.error('Could not add item to cart');
                          }
                        }}
                        className="py-2 px-3 rounded-xl bg-[#f8f4ec] hover:bg-[#eae3d2] text-[#1a1a1a] text-xs font-bold transition border border-[#e3dccb] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FiShoppingCart size={15} className="text-[#d99a3d]" />
                        <span>Add to Cart</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId = item._id || item.id;
                          navigate(`/customer/listings/${targetId}`);
                        }}
                        className="py-2 px-3 rounded-xl bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <FiZap size={15} />
                        <span>Buy Now</span>
                      </button>
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
        key={chatDrawerRecipientId || 'chat-drawer'}
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