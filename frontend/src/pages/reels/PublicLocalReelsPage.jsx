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
  FiArrowRight,
  FiShield
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useGetReelsFeedQuery } from '../../features/reels/reelsApi';
import { useGetVendorListingsQuery } from '../../features/vendor/vendorApi';
import Loader from '../../components/common/Loader';
import { resolveMediaUrl } from '../../lib/api';
import SEO from '../../components/common/SEO';

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
    <div className="pb-16">
      <SEO 
        title="Local Reels & Listings"
        description="Watch short-form video reels and explore product listing posts from local vendors in your area. Get custom quotes and deals!"
        url="https://bizreels.in/local-reels"
      />
      {/* ── Page Hero Header ────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16 overflow-hidden">
        {/* BG decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-brand-purple/[0.05] via-transparent to-transparent" />
          <div className="absolute top-[20%] right-[10%] w-[250px] h-[250px] bg-brand-purple/[0.06] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 relative z-10">
          <div className="flex flex-col gap-4 text-center md:text-left max-w-xl">
            <span className="px-3.5 py-1.5 text-[11px] font-bold bg-brand-purple/[0.08] text-brand-purple rounded-full uppercase tracking-widest w-fit mx-auto md:mx-0 flex items-center gap-2 border border-brand-purple/[0.12]">
              <FiVideo className="w-3.5 h-3.5" /> Hyper-Local Vendor Feed
            </span>
            <h1 className="text-[1.75rem] leading-[1.2] sm:text-[2.25rem] md:text-[2.75rem] lg:text-[3.25rem] font-black text-brand-navy">
              Local <span className="gradient-text">Reels & Listing Posts</span>
            </h1>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Explore trending video reels and product/service posts directly
              from verified local businesses near you. Click on any reel or post
              to sign in and connect.
            </p>
          </div>

          {!isAuthenticated && (
            <div className="bg-white rounded-2xl p-5 border border-border/60 shadow-card flex flex-col items-center gap-3 w-full max-w-xs text-center">
              <div className="w-11 h-11 rounded-xl bg-brand-purple/[0.08] text-brand-purple flex items-center justify-center">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-brand-navy">Guest Browsing Active</h3>
                <p className="text-xs text-text-tertiary mt-1 leading-relaxed">
                  Click any post or reel to sign in and unlock direct vendor chats, quotes, & orders.
                </p>
              </div>
              <button
                onClick={() => navigate('/auth/login')}
                className="w-full py-2.5 px-4 bg-brand-purple hover:bg-brand-purple-800 text-white text-[13px] font-bold rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                data-testid="reels-sign-in"
              >
                <span>Sign In Now</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Main Content Container ──────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-5 sm:gap-6">
        {/* Navigation Tabs & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          {/* Main View Tabs */}
          <div className="flex items-center gap-1.5 bg-surface-tertiary/50 p-1 rounded-xl border border-border/40 w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('reels')}
              className={`px-4 sm:px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'reels'
                  ? 'bg-brand-purple text-white shadow-sm'
                  : 'text-text-secondary hover:text-brand-navy hover:bg-white/60'
              }`}
              data-testid="tab-vendor-reels"
            >
              <FiVideo className="w-4 h-4" />
              <span>Vendor Reels</span>
              {reels.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeTab === 'reels' ? 'bg-white/20 text-white' : 'bg-brand-purple/10 text-brand-purple'
                }`}>
                  {reels.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 sm:px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'posts'
                  ? 'bg-brand-purple text-white shadow-sm'
                  : 'text-text-secondary hover:text-brand-navy hover:bg-white/60'
              }`}
              data-testid="tab-vendor-posts"
            >
              <FiShoppingBag className="w-4 h-4" />
              <span>Vendor Posts</span>
              {listings.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeTab === 'posts' ? 'bg-white/20 text-white' : 'bg-brand-purple/10 text-brand-purple'
                }`}>
                  {listings.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {[
              { key: 'trending', icon: FiTrendingUp, label: 'Trending' },
              { key: 'all', icon: FiGrid, label: 'All Posts' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  activeFilter === f.key
                    ? 'bg-brand-purple/[0.08] text-brand-purple border border-brand-purple/20'
                    : 'text-text-tertiary hover:text-text-secondary border border-transparent hover:bg-surface-tertiary/60'
                }`}
                data-testid={`filter-${f.key}`}
              >
                <f.icon className="w-3.5 h-3.5" /> {f.label}
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
              <div className="bg-white rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center gap-4 max-w-md mx-auto border border-border/60 shadow-card">
                <div className="w-14 h-14 rounded-2xl bg-surface-tertiary flex items-center justify-center">
                  <FiVideo className="w-7 h-7 text-text-tertiary" />
                </div>
                <h3 className="text-base font-bold text-brand-navy">No Vendor Reels Available</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  Check back soon or explore vendor product & service posts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {reels.map((reel) => (
                  <motion.div
                    key={reel._id}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleItemClick('reel', reel)}
                    className="group relative rounded-2xl overflow-hidden bg-black aspect-[9/16] border border-white/10 shadow-card cursor-pointer hover:shadow-xl transition-all duration-300"
                  >
                    {/* Thumbnail / Video Preview */}
                    <img
                      src={resolveMediaUrl(reel.thumbnailUrl || reel.targetListing?.images?.[0]) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'}
                      alt={reel.caption || 'Vendor Reel'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/25 flex flex-col justify-between p-3 sm:p-4 text-white">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between z-10">
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-brand-purple/90 text-white rounded-md uppercase tracking-wider backdrop-blur-sm">
                          {reel.creator?.activeRole || 'Vendor'}
                        </span>
                        {reel.isBoosted && (
                          <span className="px-2 py-0.5 text-[9px] font-black bg-brand-orange/90 text-white rounded-md uppercase tracking-wider backdrop-blur-sm">
                            Sponsored
                          </span>
                        )}
                      </div>

                      {/* Center Play Icon Overlay */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-brand-purple/80 transition-all duration-300 shadow-lg">
                        <FiPlay className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5 fill-white" />
                      </div>

                      {/* Bottom Details */}
                      <div className="flex flex-col gap-2 z-10">
                        <div className="flex items-center gap-2">
                          <img
                            src={resolveMediaUrl(reel.creator?.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt={reel.creator?.name}
                            className="w-7 h-7 rounded-full object-cover border border-white/40"
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
                        <div className="flex items-center gap-3 sm:gap-4 pt-1.5 border-t border-white/10 text-[11px] text-white/80">
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
              <div className="bg-white rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center gap-4 max-w-md mx-auto border border-border/60 shadow-card">
                <div className="w-14 h-14 rounded-2xl bg-surface-tertiary flex items-center justify-center">
                  <FiShoppingBag className="w-7 h-7 text-text-tertiary" />
                </div>
                <h3 className="text-base font-bold text-brand-navy">No Vendor Posts Available</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  Local vendors will list products and services here soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {listings.map((item) => (
                  <motion.div
                    key={item._id}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleItemClick('post', item)}
                    className="bg-white rounded-2xl overflow-hidden border border-border/60 shadow-card cursor-pointer flex flex-col group hover:shadow-card-hover transition-all duration-300"
                  >
                    {/* Media Thumbnail */}
                    <div className="relative w-full h-40 sm:h-44 bg-surface-tertiary overflow-hidden">
                      <img
                        src={resolveMediaUrl(item.images?.[0]) || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-brand-navy/90 text-white rounded-lg backdrop-blur-sm">
                        {item.type || 'Product'}
                      </span>
                      {item.price && (
                        <span className="absolute bottom-3 right-3 px-3 py-1 text-xs font-bold bg-brand-purple text-white rounded-xl shadow-md">
                          ₹{item.price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex flex-col gap-2.5 flex-grow justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                          <span className="font-bold text-brand-purple uppercase">{item.category || 'General'}</span>
                          {item.rating > 0 && (
                            <span className="flex items-center gap-1 font-bold text-amber-500">
                              <FiStar className="w-3 h-3 fill-amber-500" /> {item.rating}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-brand-navy group-hover:text-brand-purple transition-colors duration-200 line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                          {item.description || 'Verified local vendor post.'}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-border/40 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-text-tertiary flex items-center gap-1">
                          <FiMapPin className="w-3 h-3 text-brand-purple" /> {item.location?.city || 'Local Vendor'}
                        </span>
                        <span className="text-xs font-bold text-brand-purple flex items-center gap-1 group-hover:gap-1.5 transition-all duration-200">
                          View <FiArrowRight className="w-3 h-3" />
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
