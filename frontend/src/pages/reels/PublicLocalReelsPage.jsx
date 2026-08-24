import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../features/auth/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay,
  FiPause,
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiMapPin,
  FiTrendingUp,
  FiShoppingBag,
  FiStar,
  FiEye,
  FiGrid,
  FiVideo,
  FiArrowRight,
  FiShield,
  FiCheck,
  FiX,
  FiChevronUp,
  FiChevronDown,
  FiVolume2,
  FiVolumeX,
  FiExternalLink
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import {
  useGetReelsFeedQuery,
  useToggleLikeReelMutation,
  useViewReelMutation
} from '../../features/reels/reelsApi';
import { useGetVendorListingsQuery } from '../../features/vendor/vendorApi';
import Loader from '../../components/common/Loader';
import { resolveMediaUrl } from '../../lib/api';
import SEO from '../../components/common/SEO';
import CommentsDrawer from '../../components/ui/CommentsDrawer';

const GOLD = '#C9923B';
const GOLD_HOVER = '#B07E2E';

const PublicLocalReelsPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Active view: 'reels' | 'posts'
  const [activeTab, setActiveTab] = useState('reels');
  // Filter tab: 'trending' | 'all'
  const [activeFilter, setActiveFilter] = useState('trending');

  // Reel Player state
  const [selectedReelIndex, setSelectedReelIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Listing / Post Modal State
  const [selectedPost, setSelectedPost] = useState(null);

  const videoRef = useRef(null);
  const watchStartRef = useRef(null);

  // Fetch Reels feed with optimized polling
  const { data: reelsRes, isLoading: isReelsLoading } = useGetReelsFeedQuery(
    { page: 1, limit: 20 },
    { refetchOnFocus: false }
  );

  // Fetch Vendor Listings (Posts) feed with optimized polling
  const { data: listingsRes, isLoading: isListingsLoading } = useGetVendorListingsQuery(
    { page: 1, limit: 20 },
    { refetchOnFocus: false }
  );

  const [toggleLikeReel] = useToggleLikeReelMutation();
  const [registerView] = useViewReelMutation();

  const reels = reelsRes?.data || [];
  const listings = listingsRes?.data || [];

  const reelsStructuredData = React.useMemo(() => [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': 'Local Reels & Business Video Feed | BizReels',
      'url': 'https://bizreels.in/local-reels',
      'description': 'Watch short video reels from verified local businesses, products, and services across India.',
      'mainEntity': {
        '@type': 'ItemList',
        'itemListElement': reels.slice(0, 10).map((r, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'item': {
            '@type': 'VideoObject',
            'name': r.caption || `Reel by ${r.creator?.name || 'Local Business'}`,
            'description': r.caption || 'Watch local video reel on BizReels.',
            'thumbnailUrl': resolveMediaUrl(r.thumbnailUrl || r.targetListing?.images?.[0]) || 'https://bizreels.in/logo.png',
            'uploadDate': r.created_at || r.createdAt || new Date().toISOString(),
            'contentUrl': r.videoUrl ? resolveMediaUrl(r.videoUrl) : undefined,
          }
        }))
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://bizreels.in/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'Local Reels', 'item': 'https://bizreels.in/local-reels' }
      ]
    }
  ], [reels]);

  const currentReel = selectedReelIndex !== null && reels[selectedReelIndex] ? reels[selectedReelIndex] : null;

  // View tracking for currently open reel
  useEffect(() => {
    if (currentReel) {
      watchStartRef.current = Date.now();
      setIsPlaying(true);
    }

    return () => {
      if (watchStartRef.current && currentReel) {
        const watchDuration = Math.round((Date.now() - watchStartRef.current) / 1000);
        if (watchDuration >= 3) {
          registerView({ id: currentReel._id, watchDuration }).catch(() => {});
        }
        watchStartRef.current = null;
      }
    };
  }, [selectedReelIndex, currentReel, registerView]);

  // Keyboard navigation for reel viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedReelIndex === null) return;

      if (e.key === 'Escape') {
        setSelectedReelIndex(null);
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        handleNextReel();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        handlePrevReel();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReelIndex, reels.length]);

  const handleOpenReel = (index) => {
    setSelectedReelIndex(index);
    setIsPlaying(true);
  };

  const handleCloseReel = () => {
    if (watchStartRef.current && currentReel) {
      const watchDuration = Math.round((Date.now() - watchStartRef.current) / 1000);
      if (watchDuration >= 3) {
        registerView({ id: currentReel._id, watchDuration }).catch(() => {});
      }
      watchStartRef.current = null;
    }
    setSelectedReelIndex(null);
    setIsCommentsOpen(false);
  };

  const handlePrevReel = () => {
    if (selectedReelIndex > 0) {
      setSelectedReelIndex((prev) => prev - 1);
    }
  };

  const handleNextReel = () => {
    if (selectedReelIndex < reels.length - 1) {
      setSelectedReelIndex((prev) => prev + 1);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // ── Protected Interactivity Logic ─────────────────────────
  const handleLikeClick = (e, reel) => {
    if (e) e.stopPropagation();

    if (!isAuthenticated) {
      toast('Please log in to like this reel!', {
        icon: '❤️',
        duration: 3500,
        style: {
          borderRadius: '12px',
          background: '#1c1a17',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
        },
      });
      navigate('/auth/login', { state: { from: '/local-reels' } });
      return;
    }

    if (reel?._id) {
      toggleLikeReel(reel._id);
    }
  };

  const handleCommentClick = (e, reel) => {
    if (e) e.stopPropagation();

    if (!isAuthenticated) {
      toast('Please log in to comment on this reel!', {
        icon: '💬',
        duration: 3500,
        style: {
          borderRadius: '12px',
          background: '#1c1a17',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
        },
      });
      navigate('/auth/login', { state: { from: '/local-reels' } });
      return;
    }

    setIsCommentsOpen(true);
  };

  const handleShareClick = (e, reel) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/local-reels`;

    if (navigator.share) {
      navigator
        .share({
          title: reel?.caption || 'BizReels Video',
          text: `Check out this reel on BizReels: ${reel?.caption || ''}`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Reel link copied to clipboard!', { icon: '🔗' });
    }
  };

  const handleContactVendor = (vendorId) => {
    if (!isAuthenticated) {
      toast('Please log in to contact this vendor directly!', {
        icon: '🔐',
        duration: 3500,
        style: {
          borderRadius: '12px',
          background: '#1c1a17',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
        },
      });
      navigate('/auth/login', { state: { from: '/local-reels' } });
    } else {
      navigate('/customer/search');
    }
  };

  return (
    <div className="pb-16 font-sans" style={{ backgroundColor: '#f2ede4', minHeight: '100vh' }}>
      <SEO
        title="Local Business Reels & Video Feed"
        description="Watch short-form video reels and explore product listing posts from local vendors in your area. Watch directly and connect with verified businesses!"
        canonical="https://bizreels.in/local-reels"
        structuredData={reelsStructuredData}
      />

      {/* ── 1. HERO SECTION — Bento 2-Column Split ────────────────── */}
      <section style={{ backgroundColor: '#f2ede4' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 14px 0' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(1, 1fr)',
              gap: 16,
              backgroundColor: '#f2ede4',
            }}
            className="lg:!grid-cols-[1.15fr_0.85fr]"
          >
            {/* ── LEFT COLUMN ── */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '24px 12px 16px',
              }}
            >
              {/* Eyebrow badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#d99a3d]/15 text-[#1a1a1a] border border-[#d99a3d]/30 mb-4"
              >
                <FiVideo className="w-3.5 h-3.5 text-[#d99a3d]" />
                Hyper-Local Vendor Feed
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontFamily: "'Archivo Black', sans-serif",
                  fontSize: 'clamp(32px, 4.2vw, 54px)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.5px',
                  color: '#1a1a1a',
                  textTransform: 'uppercase',
                }}
              >
                LOCAL REELS &amp;<br />
                <span style={{ color: '#d99a3d', display: 'block' }}>LISTING POSTS.</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  marginTop: 20,
                  fontSize: 15.5,
                  lineHeight: 1.55,
                  color: '#4a4a4a',
                  maxWidth: 440,
                  fontWeight: 500,
                }}
              >
                Watch real product videos from verified businesses in your area for free! Click any reel to play instantly, or sign in to like, comment &amp; message vendors.
              </motion.p>

              {/* Action CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4 }}
                style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}
              >
                <button
                  onClick={() => {
                    const el = document.getElementById('reels-feed-container');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '13px 22px',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14.5,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: '#d99a3d',
                    color: '#1a1a1a',
                    fontFamily: 'inherit',
                    transition: 'background .15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#c8872b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#d99a3d';
                  }}
                >
                  <FiPlay className="w-4 h-4 fill-current" />
                  Watch Reels Now
                </button>

                {!isAuthenticated && (
                  <button
                    onClick={() => navigate('/auth/login', { state: { from: '/local-reels' } })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '13px 22px',
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 14.5,
                      cursor: 'pointer',
                      border: '1.5px solid #d8d2c5',
                      backgroundColor: 'transparent',
                      color: '#1a1a1a',
                      fontFamily: 'inherit',
                      transition: 'border-color .15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#b8b0a0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d8d2c5';
                    }}
                  >
                    Sign In to Interact
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            </div>

            {/* ── RIGHT COLUMN (Onyx Bento Card) ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{
                backgroundColor: '#1c1a17',
                padding: '36px 32px',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#fff',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: '#d99a3d',
                    textTransform: 'uppercase',
                    marginBottom: 18,
                  }}
                >
                  FREE TO WATCH FOR EVERYONE
                </p>

                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', lineHeight: 1.25, marginBottom: 14 }}>
                  Real videos from real local storefronts.
                </h3>

                <p style={{ fontSize: 13.5, lineHeight: 1.55, color: '#c9c4bb', marginBottom: 22 }}>
                  Watch real products in motion, discover top rated vendors, and sign in whenever you want to like, comment, or request custom quotes.
                </p>

                {/* Features list */}
                <div className="flex flex-col gap-3 pt-2 border-t border-[#3a3630]">
                  {[
                    'Instant video playback with audio and full controls',
                    'Direct buyer-to-vendor inquiry and quote requests',
                    'Interactive likes & comments for registered users',
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs text-[#c9c4bb] font-medium leading-normal">
                      <div
                        style={{
                          flexShrink: 0,
                          width: 20,
                          height: 20,
                          border: '1.5px solid #d99a3d',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#d99a3d',
                          marginTop: 1,
                        }}
                      >
                        <FiCheck style={{ width: 12, height: 12 }} />
                      </div>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/auth/login', { state: { from: '/local-reels' } })}
                  className="mt-6 w-full py-3 px-4 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border-none cursor-pointer"
                  data-testid="reels-sign-in"
                >
                  <span>Sign In To Like, Comment &amp; Chat</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. MAIN FEED CONTAINER ─────────────────────────────────── */}
      <div id="reels-feed-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '14px' }} className="flex flex-col gap-5">
        {/* Navigation Tabs & Filter Bar */}
        <div className="bg-white/90 backdrop-blur-xs rounded-md p-4 border border-[#e3dccb] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Main View Tabs */}
          <div className="flex items-center gap-2 bg-[#f8f4ec] p-1 rounded-md border border-[#e3dccb] w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('reels')}
              className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-none ${
                activeTab === 'reels'
                  ? 'bg-[#1c1a17] text-[#d99a3d] shadow-xs'
                  : 'text-slate-600 hover:text-[#1a1a1a] bg-transparent'
              }`}
              data-testid="tab-vendor-reels"
            >
              <FiVideo className="w-4 h-4" />
              <span>Vendor Reels</span>
              {reels.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    activeTab === 'reels' ? 'bg-[#d99a3d] text-[#1a1a1a]' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {reels.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-none ${
                activeTab === 'posts'
                  ? 'bg-[#1c1a17] text-[#d99a3d] shadow-xs'
                  : 'text-slate-600 hover:text-[#1a1a1a] bg-transparent'
              }`}
              data-testid="tab-vendor-posts"
            >
              <FiShoppingBag className="w-4 h-4" />
              <span>Vendor Posts</span>
              {listings.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    activeTab === 'posts' ? 'bg-[#d99a3d] text-[#1a1a1a]' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {listings.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {[
              { key: 'trending', icon: FiTrendingUp, label: 'Trending' },
              { key: 'all', icon: FiGrid, label: 'All Posts' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3.5 py-2 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeFilter === f.key
                    ? 'bg-[#d99a3d]/20 text-[#1a1a1a] border border-[#d99a3d]/50 font-bold'
                    : 'text-slate-500 hover:text-slate-800 border border-transparent hover:bg-slate-100'
                }`}
                data-testid={`filter-${f.key}`}
              >
                <f.icon className="w-3.5 h-3.5 text-[#d99a3d]" /> {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── REELS TAB CONTENT ───────────────────────────────────────── */}
        {activeTab === 'reels' && (
          <div>
            {isReelsLoading ? (
              <div className="py-20 flex justify-center items-center">
                <Loader size="lg" />
              </div>
            ) : reels.length === 0 ? (
              <div className="bg-white rounded-md p-10 sm:p-14 text-center flex flex-col items-center gap-3 max-w-md mx-auto border border-[#e3dccb] shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-[#f2ede4] flex items-center justify-center text-[#1a1a1a]">
                  <FiVideo className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#1a1a1a]">No Vendor Reels Available</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Check back soon or explore vendor product &amp; service posts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {reels.map((reel, idx) => (
                  <motion.div
                    key={reel._id || idx}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleOpenReel(idx)}
                    className="group relative rounded-xl overflow-hidden bg-[#1c1a17] aspect-[9/16] border border-[#3a3630] shadow-sm cursor-pointer hover:shadow-xl transition-all duration-200"
                  >
                    {/* Thumbnail Image */}
                    <img
                      src={
                        resolveMediaUrl(reel.thumbnailUrl || reel.targetListing?.images?.[0]) ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={reel.caption || 'Vendor Reel'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/40 flex flex-col justify-between p-3.5 text-white">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between z-10">
                        <span className="px-2 py-0.5 text-[9.5px] font-extrabold bg-[#d99a3d] text-[#1a1a1a] rounded uppercase tracking-wider">
                          {reel.creator?.activeRole || 'Vendor'}
                        </span>
                        {reel.isBoosted && (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold bg-amber-500 text-black rounded uppercase tracking-wider">
                            Featured
                          </span>
                        )}
                      </div>

                      {/* Center Play Icon Frame */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border-2 border-[#d99a3d] flex items-center justify-center text-[#d99a3d] group-hover:scale-110 group-hover:bg-[#d99a3d] group-hover:text-[#1a1a1a] transition-all duration-200 shadow-lg">
                        <FiPlay className="w-6 h-6 ml-0.5 fill-current" />
                      </div>

                      {/* Bottom Details */}
                      <div className="flex flex-col gap-1.5 z-10">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              resolveMediaUrl(reel.creator?.avatarUrl) ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                            }
                            alt={reel.creator?.name}
                            className="w-6 h-6 rounded-full object-cover border border-white/40"
                          />
                          <span className="text-xs font-bold truncate">
                            @{reel.creator?.name || reel.creator?.business_name || 'Local Business'}
                          </span>
                        </div>

                        <p className="text-xs text-white/90 line-clamp-2 leading-snug font-medium">
                          {reel.caption || 'Explore vendor reel'}
                        </p>

                        {reel.location?.address && (
                          <span className="text-[10px] text-white/70 flex items-center gap-1">
                            <FiMapPin className="w-3 h-3 text-[#d99a3d]" /> {reel.location.address}
                          </span>
                        )}

                        {/* Interactive Counters / Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/15 text-[11px] text-white/90">
                          <button
                            onClick={(e) => handleLikeClick(e, reel)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition ${
                              reel.hasLiked ? 'text-red-500 font-bold' : 'hover:bg-white/10 text-white/90'
                            }`}
                            title="Like reel"
                          >
                            <FiHeart className={`w-3.5 h-3.5 ${reel.hasLiked ? 'fill-current text-red-500' : 'text-[#d99a3d]'}`} />
                            <span>{reel.likesCount || 0}</span>
                          </button>

                          <button
                            onClick={(e) => handleCommentClick(e, reel)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 text-white/90 transition"
                            title="Comment on reel"
                          >
                            <FiMessageCircle className="w-3.5 h-3.5 text-sky-400" />
                            <span>{reel.commentsCount || 0}</span>
                          </button>

                          <span className="flex items-center gap-1 text-[10px] text-white/60">
                            <FiEye className="w-3 h-3" /> {reel.views || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LISTINGS / POSTS TAB CONTENT ───────────────────────────── */}
        {activeTab === 'posts' && (
          <div>
            {isListingsLoading ? (
              <div className="py-20 flex justify-center items-center">
                <Loader size="lg" />
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-md p-10 sm:p-14 text-center flex flex-col items-center gap-3 max-w-md mx-auto border border-[#e3dccb] shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-[#f2ede4] flex items-center justify-center text-[#1a1a1a]">
                  <FiShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#1a1a1a]">No Vendor Posts Available</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Local vendors will list products and services here soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((item) => (
                  <motion.div
                    key={item._id}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setSelectedPost(item)}
                    className="bg-white rounded-xl overflow-hidden border border-[#e3dccb] shadow-xs cursor-pointer flex flex-col group hover:shadow-md transition-all duration-200"
                  >
                    {/* Media Thumbnail */}
                    <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
                      <img
                        src={
                          resolveMediaUrl(item.images?.[0]) ||
                          'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-[#1c1a17] text-white rounded">
                        {item.type || 'Product'}
                      </span>
                      {item.price && (
                        <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 text-xs font-extrabold bg-[#d99a3d] text-[#1a1a1a] rounded shadow-xs">
                          ₹{item.price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex flex-col gap-2 flex-grow justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="font-bold text-[#d99a3d] uppercase">{item.category || 'General'}</span>
                          {item.rating > 0 && (
                            <span className="flex items-center gap-1 font-bold text-amber-600">
                              <FiStar className="w-3 h-3 fill-amber-500 text-amber-500" /> {item.rating}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-extrabold text-[#1a1a1a] group-hover:text-[#d99a3d] transition-colors duration-150 line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {item.description || 'Verified local vendor post.'}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-[#e3dccb] flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <FiMapPin className="w-3 h-3 text-[#d99a3d]" /> {item.location?.city || 'Local Vendor'}
                        </span>
                        <span className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1 group-hover:gap-1.5 transition-all">
                          View Details <FiArrowRight className="w-3 h-3 text-[#d99a3d]" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. FULLSCREEN / MODAL REEL WATCH PLAYER (WATCHABLE FOR EVERYONE)
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {currentReel && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md">
            {/* Background click to close */}
            <div className="absolute inset-0" onClick={handleCloseReel} />

            {/* Top Close Button */}
            <button
              onClick={handleCloseReel}
              className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition cursor-pointer"
              title="Close Reel (Esc)"
            >
              <FiX className="w-6 h-6" />
            </button>

            {/* Next / Previous Navigation Controls (Desktop) */}
            <div className="hidden md:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-40">
              <button
                disabled={selectedReelIndex === 0}
                onClick={handlePrevReel}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-30 text-white flex items-center justify-center backdrop-blur-md transition cursor-pointer border border-white/20"
                title="Previous Reel (Up Arrow)"
              >
                <FiChevronUp className="w-6 h-6" />
              </button>
              <button
                disabled={selectedReelIndex === reels.length - 1}
                onClick={handleNextReel}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-30 text-white flex items-center justify-center backdrop-blur-md transition cursor-pointer border border-white/20"
                title="Next Reel (Down Arrow)"
              >
                <FiChevronDown className="w-6 h-6" />
              </button>
            </div>

            {/* Main Video Reel Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-[420px] h-[92vh] max-h-[820px] bg-black rounded-2xl overflow-hidden shadow-2xl z-30 flex flex-col border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HTML5 Video Element */}
              <div className="relative w-full h-full bg-neutral-950 flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={resolveMediaUrl(currentReel.videoUrl)}
                  poster={resolveMediaUrl(currentReel.thumbnailUrl || currentReel.targetListing?.images?.[0])}
                  autoPlay
                  playsInline
                  loop
                  muted={isMuted}
                  onClick={togglePlayPause}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-full object-cover cursor-pointer"
                />

                {/* Pause icon overlay when video is paused */}
                {!isPlaying && (
                  <div
                    onClick={togglePlayPause}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer pointer-events-none"
                  >
                    <div className="w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm border border-white/20">
                      <FiPlay className="w-8 h-8 ml-1 fill-current text-[#d99a3d]" />
                    </div>
                  </div>
                )}

                {/* Top overlay bar: Vendor Profile & Sound Toggle */}
                <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        resolveMediaUrl(currentReel.creator?.avatarUrl) ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                      }
                      alt={currentReel.creator?.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-[#d99a3d]"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-sm leading-tight text-white">
                          {currentReel.creator?.name || currentReel.creator?.business_name || 'Verified Vendor'}
                        </span>
                        <FiShield className="w-3.5 h-3.5 text-[#d99a3d] fill-current" />
                      </div>
                      <span className="text-[11px] text-white/70">
                        {currentReel.location?.city || 'Local Store'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Volume Mute Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <FiVolumeX className="w-4 h-4" /> : <FiVolume2 className="w-4 h-4 text-[#d99a3d]" />}
                    </button>
                  </div>
                </div>

                {/* Right Action Rail (Like, Comment, Share, Vendor Chat) */}
                <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4 text-white">
                  {/* Like Button */}
                  <div className="flex flex-col items-center">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={(e) => handleLikeClick(e, currentReel)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition backdrop-blur-md ${
                        currentReel.hasLiked
                          ? 'bg-red-500/30 text-red-500 border border-red-500'
                          : 'bg-black/40 hover:bg-black/60 text-white border border-white/10'
                      }`}
                      title={isAuthenticated ? 'Like' : 'Login to Like'}
                    >
                      <FiHeart className={`w-6 h-6 ${currentReel.hasLiked ? 'fill-current' : ''}`} />
                    </motion.button>
                    <span className="text-[11px] font-bold mt-1 text-white drop-shadow">
                      {currentReel.likesCount || 0}
                    </span>
                  </div>

                  {/* Comment Button */}
                  <div className="flex flex-col items-center">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={(e) => handleCommentClick(e, currentReel)}
                      className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 flex items-center justify-center transition backdrop-blur-md"
                      title={isAuthenticated ? 'Comments' : 'Login to Comment'}
                    >
                      <FiMessageCircle className="w-6 h-6 text-sky-400" />
                    </motion.button>
                    <span className="text-[11px] font-bold mt-1 text-white drop-shadow">
                      {currentReel.commentsCount || 0}
                    </span>
                  </div>

                  {/* Share Button */}
                  <div className="flex flex-col items-center">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={(e) => handleShareClick(e, currentReel)}
                      className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 flex items-center justify-center transition backdrop-blur-md"
                      title="Share"
                    >
                      <FiShare2 className="w-5 h-5 text-emerald-400" />
                    </motion.button>
                    <span className="text-[11px] font-bold mt-1 text-white drop-shadow">Share</span>
                  </div>
                </div>

                {/* Bottom Caption & Action Banner */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-20 flex flex-col gap-2.5 text-white">
                  <p className="text-xs text-white/95 leading-relaxed font-medium line-clamp-3 pr-14">
                    {currentReel.caption || 'Explore vendor product reel.'}
                  </p>

                  {/* Location Tag */}
                  {currentReel.location?.address && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold">
                      <FiMapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{currentReel.location.address}</span>
                    </div>
                  )}

                  {/* Connect / Get Quote Button */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleContactVendor(currentReel.creator?._id)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <FiShoppingBag className="w-4 h-4" />
                      <span>{isAuthenticated ? 'Get Quote / Chat with Vendor' : 'Sign In to Connect with Vendor'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Comments Drawer component */}
            <CommentsDrawer
              isOpen={isCommentsOpen}
              onClose={() => setIsCommentsOpen(false)}
              reelId={currentReel._id}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          4. POST / LISTING PREVIEW MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setSelectedPost(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl z-20 flex flex-col max-h-[90vh]"
            >
              {/* Image Preview */}
              <div className="relative w-full h-56 bg-slate-900">
                <img
                  src={
                    resolveMediaUrl(selectedPost.images?.[0]) ||
                    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition"
                >
                  <FiX className="w-4 h-4" />
                </button>
                {selectedPost.price && (
                  <span className="absolute bottom-3 right-3 px-3 py-1 bg-[#d99a3d] text-[#1a1a1a] font-extrabold text-sm rounded-lg shadow-md">
                    ₹{selectedPost.price.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-[#d99a3d] uppercase tracking-wider">
                    {selectedPost.category || 'Product / Service'}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedPost.title}</h3>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{selectedPost.description}</p>

                {selectedPost.location?.city && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <FiMapPin className="w-4 h-4 text-[#d99a3d]" />
                    <span>{selectedPost.location.city}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedPost(null);
                    handleContactVendor(selectedPost.vendor?._id || selectedPost.vendor);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <span>{isAuthenticated ? 'Get Quote / Order' : 'Sign In to Contact'}</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicLocalReelsPage;
