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
  FiShield,
  FiCheck
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

  const handleItemClick = (itemType, itemData) => {
    if (!isAuthenticated) {
      toast('Please log in to view full reels, contact vendors, and interact!', {
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
      if (itemType === 'reel') {
        navigate('/feed');
      } else {
        navigate('/customer/search');
      }
    }
  };

  return (
    <div className="pb-16 font-sans" style={{ backgroundColor: '#f2ede4', minHeight: '100vh' }}>
      <SEO 
        title="Local Reels & Listings"
        description="Watch short-form video reels and explore product listing posts from local vendors in your area. Get custom quotes and deals!"
        url="https://bizreels.in/local-reels"
      />

      {/* ── 1. HERO SECTION — Bento 2-Column Split ────────────────── */}
      <section style={{ backgroundColor: '#f2ede4' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 14px 0' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: 16,
            backgroundColor: '#f2ede4',
          }} className="lg:!grid-cols-[1.15fr_0.85fr]">

            {/* ── LEFT COLUMN ── */}
            <div style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '24px 12px 16px',
            }}>
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
                style={{ marginTop: 20, fontSize: 15.5, lineHeight: 1.55, color: '#4a4a4a', maxWidth: 440, fontWeight: 500 }}
              >
                Explore trending video reels and product/service posts directly from verified local businesses near you. Click on any reel or post to sign in and connect.
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14.5, cursor: 'pointer', border: 'none', backgroundColor: '#d99a3d', color: '#1a1a1a', fontFamily: 'inherit', transition: 'background .15s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c8872b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#d99a3d'; }}
                >
                  Explore Feed
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                </button>

                {!isAuthenticated && (
                  <button
                    onClick={() => navigate('/auth/login')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14.5, cursor: 'pointer', border: '1.5px solid #d8d2c5', backgroundColor: 'transparent', color: '#1a1a1a', fontFamily: 'inherit', transition: 'border-color .15s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b8b0a0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d8d2c5'; }}
                  >
                    Sign In Now
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                  </button>
                )}
              </motion.div>
            </div>

            {/* ── RIGHT COLUMN (Onyx Bento Card) ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ backgroundColor: '#1c1a17', padding: '36px 32px', borderRadius: 8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff' }}
            >
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#d99a3d', textTransform: 'uppercase', marginBottom: 18 }}>
                  AUTHENTIC VISUAL FEED
                </p>

                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', lineHeight: 1.25, marginBottom: 14 }}>
                  Real videos from real local storefronts.
                </h3>

                <p style={{ fontSize: 13.5, lineHeight: 1.55, color: '#c9c4bb', marginBottom: 22 }}>
                  Watch real products in motion, request quotes, and chat directly with verified vendors in your city.
                </p>

                {/* Features list */}
                <div className="flex flex-col gap-3 pt-2 border-t border-[#3a3630]">
                  {[
                    '5-second live real-time video feed updates',
                    'Direct buyer-to-vendor chat & requirement quotes',
                    'Location-aware storefront discovery across India',
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs text-[#c9c4bb] font-medium leading-normal">
                      <div style={{ flexShrink: 0, width: 20, height: 20, border: '1.5px solid #d99a3d', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d99a3d', marginTop: 1 }}>
                        <FiCheck style={{ width: 12, height: 12 }} />
                      </div>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/auth/login')}
                  className="mt-6 w-full py-3 px-4 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border-none cursor-pointer"
                  data-testid="reels-sign-in"
                >
                  <span>Sign In To Unlock Full Feed</span>
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
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  activeTab === 'reels' ? 'bg-[#d99a3d] text-[#1a1a1a]' : 'bg-slate-200 text-slate-700'
                }`}>
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
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  activeTab === 'posts' ? 'bg-[#d99a3d] text-[#1a1a1a]' : 'bg-slate-200 text-slate-700'
                }`}>
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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {reels.map((reel) => (
                  <motion.div
                    key={reel._id}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleItemClick('reel', reel)}
                    className="group relative rounded-md overflow-hidden bg-[#1c1a17] aspect-[9/16] border border-[#3a3630] shadow-xs cursor-pointer hover:shadow-md transition-all duration-200"
                  >
                    {/* Thumbnail Image */}
                    <img
                      src={resolveMediaUrl(reel.thumbnailUrl || reel.targetListing?.images?.[0]) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'}
                      alt={reel.caption || 'Vendor Reel'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 flex flex-col justify-between p-3.5 text-white">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between z-10">
                        <span className="px-2 py-0.5 text-[9.5px] font-extrabold bg-[#d99a3d] text-[#1a1a1a] rounded uppercase tracking-wider">
                          {reel.creator?.activeRole || 'Vendor'}
                        </span>
                        {reel.isBoosted && (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold bg-amber-500 text-black rounded uppercase tracking-wider">
                            Sponsored
                          </span>
                        )}
                      </div>

                      {/* Center Play Icon Frame */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 backdrop-blur-xs border-2 border-[#d99a3d] flex items-center justify-center text-[#d99a3d] group-hover:scale-110 group-hover:bg-[#d99a3d] group-hover:text-[#1a1a1a] transition-all duration-200 shadow-md">
                        <FiPlay className="w-5 h-5 ml-0.5 fill-current" />
                      </div>

                      {/* Bottom Details */}
                      <div className="flex flex-col gap-1.5 z-10">
                        <div className="flex items-center gap-2">
                          <img
                            src={resolveMediaUrl(reel.creator?.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt={reel.creator?.name}
                            className="w-6 h-6 rounded-full object-cover border border-white/40"
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
                            <FiMapPin className="w-3 h-3 text-[#d99a3d]" /> {reel.location.address}
                          </span>
                        )}

                        {/* Counters */}
                        <div className="flex items-center gap-3 pt-1.5 border-t border-white/15 text-[10.5px] text-white/80">
                          <span className="flex items-center gap-1">
                            <FiHeart className="w-3.5 h-3.5 text-[#d99a3d]" /> {reel.likesCount || 0}
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
                    onClick={() => handleItemClick('post', item)}
                    className="bg-white rounded-md overflow-hidden border border-[#e3dccb] shadow-xs cursor-pointer flex flex-col group hover:shadow-md transition-all duration-200"
                  >
                    {/* Media Thumbnail */}
                    <div className="relative w-full h-40 bg-slate-100 overflow-hidden">
                      <img
                        src={resolveMediaUrl(item.images?.[0]) || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=600&q=80'}
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
    </div>
  );
};

export default PublicLocalReelsPage;
