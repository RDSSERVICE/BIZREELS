import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../features/auth/authSlice';
import { motion } from 'framer-motion';
import {
  FiPlay,
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiMapPin,
  FiTrendingUp,
  FiShoppingBag,
  FiStar,
  FiLock,
  FiEye,
  FiGrid,
  FiVideo,
  FiArrowRight
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useGetReelsFeedQuery } from '../../features/reels/reelsApi';
import { useGetVendorListingsQuery } from '../../features/vendor/vendorApi';
import Loader from '../../components/common/Loader';

const PublicLocalReelsPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Active view: 'reels' | 'posts'
  const [activeTab, setActiveTab] = useState('reels');
  // Filter tab: 'trending' | 'all'
  const [activeFilter, setActiveFilter] = useState('trending');

  // Fetch Reels feed with 5s real-time live polling
  const { data: reelsRes, isLoading: isReelsLoading } = useGetReelsFeedQuery(
    { page: 1, limit: 12 },
    { pollingInterval: 5000 }
  );

  // Fetch Vendor Listings (Posts) feed with 5s real-time live polling
  const { data: listingsRes, isLoading: isListingsLoading } = useGetVendorListingsQuery(
    { page: 1, limit: 12 },
    { pollingInterval: 5000 }
  );

  const reels = reelsRes?.data || [];
  const listings = listingsRes?.data || [];

  /**
   * Main interaction guard:
   * When an unauthenticated visitor/customer clicks on any reel or post,
   * notify them and redirect directly to login page.
   */
  const handleItemClick = (itemType, itemData) => {
    if (!isAuthenticated) {
      toast('Please log in to view full reels, contact vendors, and interact!', {
        icon: '🔐',
        duration: 3500,
        style: {
          borderRadius: '12px',
          background: '#1e1b4b',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
        },
      });
      navigate('/auth/login', { state: { from: '/local-reels' } });
    } else {
      // If user is already authenticated
      if (itemType === 'reel') {
        navigate('/feed');
      } else {
        navigate('/customer/search');
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary pb-16">
      {/* ── Page Hero Header ────────────────────────────────────────── */}
      <section className="relative px-6 py-12 md:py-16 bg-gradient-to-b from-brand-purple/10 via-surface-secondary to-surface-secondary border-b border-border overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-3 text-center md:text-left max-w-xl">
            <span className="px-3 py-1 text-[11px] font-black bg-brand-purple/15 text-brand-purple rounded-full uppercase tracking-wider w-fit mx-auto md:mx-0 flex items-center gap-1.5">
              <FiVideo className="w-3.5 h-3.5" /> Hyper-Local Vendor Feed
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-brand-navy leading-tight">
              Local <span className="gradient-text">Reels & Listing Posts</span>
            </h1>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
              Explore trending video reels and product/service posts directly from verified local businesses near you. Click on any reel or post to sign in and connect.
            </p>
          </div>

          {!isAuthenticated && (
            <div className="glass p-5 rounded-premium border-white/40 shadow-glass flex flex-col items-center gap-3 max-w-xs text-center">
              <div className="w-10 h-10 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                <FiLock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-brand-navy">Guest Browsing Active</h3>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  Click any post or reel to sign in and unlock direct vendor chats, quotes, & orders.
                </p>
              </div>
              <button
                onClick={() => navigate('/auth/login')}
                className="w-full py-2 px-4 bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-bold rounded-premium transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Sign In Now</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Main Content Container ──────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Navigation Tabs & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/80 pb-4">
          {/* Main View Tabs (Vendor Reels vs Vendor Posts) */}
          <div className="flex items-center gap-2 bg-surface p-1 rounded-premium border border-border shadow-sm">
            <button
              onClick={() => setActiveTab('reels')}
              className={`px-5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'reels'
                  ? 'bg-brand-purple text-white shadow-md'
                  : 'text-text-secondary hover:text-brand-navy hover:bg-surface-tertiary'
              }`}
            >
              <FiVideo className="w-4 h-4" />
              <span>Vendor Reels</span>
              {reels.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'reels' ? 'bg-white/20 text-white' : 'bg-brand-purple/10 text-brand-purple'}`}>
                  {reels.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('posts')}
              className={`px-5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'posts'
                  ? 'bg-brand-purple text-white shadow-md'
                  : 'text-text-secondary hover:text-brand-navy hover:bg-surface-tertiary'
              }`}
            >
              <FiShoppingBag className="w-4 h-4" />
              <span>Vendor Posts & Listings</span>
              {listings.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'posts' ? 'bg-white/20 text-white' : 'bg-brand-purple/10 text-brand-purple'}`}>
                  {listings.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('trending')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeFilter === 'trending'
                  ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/30'
                  : 'text-text-tertiary hover:text-text-secondary border border-transparent'
              }`}
            >
              <FiTrendingUp className="w-3.5 h-3.5" /> Trending
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/30'
                  : 'text-text-tertiary hover:text-text-secondary border border-transparent'
              }`}
            >
              <FiGrid className="w-3.5 h-3.5" /> All Posts
            </button>
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
              <div className="glass p-12 rounded-premium text-center flex flex-col items-center gap-3 max-w-md mx-auto">
                <FiVideo className="w-12 h-12 text-text-tertiary" />
                <h3 className="text-base font-bold text-brand-navy">No Vendor Reels Currently Available</h3>
                <p className="text-xs text-text-secondary">
                  Check back soon or explore vendor product & service posts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {reels.map((reel) => (
                  <motion.div
                    key={reel._id}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleItemClick('reel', reel)}
                    className="group relative rounded-premium overflow-hidden bg-black aspect-[9/16] border border-border shadow-md cursor-pointer hover:shadow-xl transition-all"
                  >
                    {/* Thumbnail / Video Preview */}
                    <img
                      src={reel.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'}
                      alt={reel.caption || 'Vendor Reel'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 flex flex-col justify-between p-4 text-white">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between z-10">
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-brand-purple text-white rounded uppercase tracking-wider shadow">
                          {reel.creator?.activeRole || 'Vendor'}
                        </span>
                        {reel.isBoosted && (
                          <span className="px-2 py-0.5 text-[9px] font-black bg-brand-orange text-white rounded uppercase tracking-wider shadow animate-pulse">
                            Sponsored
                          </span>
                        )}
                      </div>

                      {/* Center Play Icon Overlay */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/30 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-brand-purple transition-all shadow-lg">
                        <FiPlay className="w-6 h-6 ml-1 fill-white" />
                      </div>

                      {/* Bottom Details */}
                      <div className="flex flex-col gap-2 z-10">
                        <div className="flex items-center gap-2">
                          <img
                            src={reel.creator?.avatarUrl || 'https://via.placeholder.com/150'}
                            alt={reel.creator?.name}
                            className="w-7 h-7 rounded-full object-cover border border-white/50"
                          />
                          <span className="text-xs font-bold truncate">
                            @{reel.creator?.name || 'Local Business'}
                          </span>
                        </div>

                        <p className="text-xs text-white/90 line-clamp-2 leading-snug font-medium">
                          {reel.caption || 'Explore vendor reel'}
                        </p>

                        {reel.location?.address && (
                          <span className="text-[10px] text-white/70 flex items-center gap-1">
                            <FiMapPin className="w-3 h-3 text-brand-orange" /> {reel.location.address}
                          </span>
                        )}

                        {/* Reaction counters */}
                        <div className="flex items-center gap-4 pt-1 border-t border-white/10 text-[11px] text-white/80">
                          <span className="flex items-center gap-1">
                            <FiHeart className="w-3.5 h-3.5 text-brand-pink" /> {reel.likesCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiMessageCircle className="w-3.5 h-3.5" /> {reel.commentsCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiEye className="w-3.5 h-3.5" /> {reel.views || 0}
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
              <div className="glass p-12 rounded-premium text-center flex flex-col items-center gap-3 max-w-md mx-auto">
                <FiShoppingBag className="w-12 h-12 text-text-tertiary" />
                <h3 className="text-base font-bold text-brand-navy">No Vendor Posts Available</h3>
                <p className="text-xs text-text-secondary">
                  Local vendors will list products and services here soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {listings.map((item) => (
                  <motion.div
                    key={item._id}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleItemClick('post', item)}
                    className="glass rounded-premium overflow-hidden border border-white/50 shadow-glass cursor-pointer flex flex-col group hover:shadow-xl transition-all"
                  >
                    {/* Media Thumbnail */}
                    <div className="relative w-full h-44 bg-surface-tertiary overflow-hidden">
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-brand-navy text-white rounded-md shadow">
                        {item.type || 'Product'}
                      </span>
                      {item.price && (
                        <span className="absolute bottom-3 right-3 px-3 py-1 text-xs font-black bg-brand-purple text-white rounded-premium shadow-md">
                          ₹{item.price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex flex-col gap-2.5 flex-grow justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                          <span className="font-bold text-brand-purple uppercase">{item.category || 'General'}</span>
                          {item.rating > 0 && (
                            <span className="flex items-center gap-1 font-bold text-amber-500">
                              <FiStar className="w-3 h-3 fill-amber-500" /> {item.rating}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-brand-navy group-hover:text-brand-purple transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                          {item.description || 'Verified local vendor post.'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-text-tertiary flex items-center gap-1">
                          <FiMapPin className="w-3 h-3 text-brand-purple" /> {item.location?.city || 'Local Vendor'}
                        </span>
                        <span className="text-xs font-bold text-brand-purple hover:underline flex items-center gap-1">
                          View Post <FiArrowRight className="w-3 h-3" />
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
    </div>
  );
};

export default PublicLocalReelsPage;
