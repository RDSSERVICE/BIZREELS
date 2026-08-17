import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../features/auth/authSlice';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiMapPin,
  FiStar,
  FiVideo,
  FiCheckCircle,
  FiSend,
  FiLock,
  FiArrowRight,
  FiCompass,
  FiAward,
  FiShield,
  FiUsers,
  FiCheck
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import { api } from '../../lib/api';
import SEO from '../../components/common/SEO';

const CATEGORIES = [
  'All Categories',
  'Fashion & Lifestyle',
  'Food & Restaurants',
  'Tech & Gadgets',
  'Beauty & Skincare',
  'Fitness & Health',
  'Jewelry & Luxury'
];

const CITIES = ['All Cities', 'Delhi NCR', 'Mumbai', 'Bangalore', 'Kolkata'];

const getAvailabilityStatus = (availability) => {
  if (!availability) return 'Available';
  if (typeof availability === 'string') return availability;
  if (typeof availability === 'object') {
    if (availability.status) return String(availability.status);
    if (availability.availableNow === false) return 'Busy';
    if (availability.availableNow === true) return 'Available';
    if (availability.isAvailable === false) return 'Busy';
    if (availability.isAvailable === true) return 'Available';
  }
  if (typeof availability === 'boolean') {
    return availability ? 'Available' : 'Busy';
  }
  return 'Available';
};

const PublicCreatorMarketplacePage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState(null);

  // Fetch real-time creator profiles from DB endpoint
  const fetchCreators = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await api.get('/v1/users/creators/public', {
        params: {
          search: searchQuery || undefined,
          category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
          city: selectedCity !== 'All Cities' ? selectedCity : undefined,
        },
      });
      const list = res.data?.creators || [];
      setCreators(list);
    } catch (error) {
      console.error('Error fetching public creators:', error);
      setCreators([]);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators(true);

    const interval = setInterval(() => {
      fetchCreators(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [searchQuery, selectedCategory, selectedCity]);

  const handleConnectCreator = (creator) => {
    if (!isAuthenticated) {
      toast(`Sign in to hire ${creator.name} & request video quotes!`, {
        icon: '💼',
        duration: 3500,
        style: {
          borderRadius: '12px',
          background: '#1c1a17',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
        },
      });
      navigate('/auth/login', { state: { from: '/creator-marketplace' } });
    } else {
      navigate('/vendor/hire-creator');
    }
  };

  return (
    <div className="pb-16 font-sans" style={{ backgroundColor: '#f2ede4', minHeight: '100vh' }}>
      <SEO 
        title="Creator Marketplace"
        description="Hire professional creators to produce high-engaging video reels for your local business. Browse creator portfolios, pricing, and availability."
        url="https://bizreels.in/creator-marketplace"
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
                <FiAward className="w-3.5 h-3.5 text-[#d99a3d]" />
                Real-Time Live Marketplace
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
                CREATOR<br />
                <span style={{ color: '#d99a3d', display: 'block' }}>MARKETPLACE.</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ marginTop: 20, fontSize: 15.5, lineHeight: 1.55, color: '#4a4a4a', maxWidth: 440, fontWeight: 500 }}
              >
                Discover real-time verified local content creators, video directors &amp; reel influencers. Connect directly to scale your brand presence and drive footfall.
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
                    const el = document.getElementById('marketplace-grid');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14.5, cursor: 'pointer', border: 'none', backgroundColor: '#d99a3d', color: '#1a1a1a', fontFamily: 'inherit', transition: 'background .15s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c8872b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#d99a3d'; }}
                >
                  Browse Creators
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                </button>

                {!isAuthenticated && (
                  <button
                    onClick={() => navigate('/auth/register?role=creator')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14.5, cursor: 'pointer', border: '1.5px solid #d8d2c5', backgroundColor: 'transparent', color: '#1a1a1a', fontFamily: 'inherit', transition: 'border-color .15s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b8b0a0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d8d2c5'; }}
                  >
                    Join As Creator
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
                  VERIFIED DIRECT WORK
                </p>

                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', lineHeight: 1.25, marginBottom: 14 }}>
                  Connect with verified creators with protected payouts.
                </h3>

                <p style={{ fontSize: 13.5, lineHeight: 1.55, color: '#c9c4bb', marginBottom: 22 }}>
                  Every creator profile is identity verified. Direct hire requests go straight to the creator with funds secured in automated escrow wallets.
                </p>

                {/* Features list */}
                <div className="flex flex-col gap-3 pt-2 border-t border-[#3a3630]">
                  {[
                    '100% verified portfolio samples & engagement rates',
                    'Escrow protection: release funds upon video approval',
                    'Direct chat and instant custom requirement quotes',
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
                  onClick={() => navigate('/auth/register')}
                  className="mt-6 w-full py-3 px-4 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border-none cursor-pointer"
                  data-testid="marketplace-join"
                >
                  <span>Register To Hire Creators</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── 2. MAIN MARKETPLACE BODY ─────────────────────────────── */}
      <div id="marketplace-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '14px' }} className="flex flex-col gap-5">
        
        {/* Search & Filters Bar */}
        <div className="bg-white/90 backdrop-blur-xs rounded-md p-4 border border-[#e3dccb] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by creator name or niche..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d99a3d]/40 transition-all"
              data-testid="creator-search"
            />
          </div>

          {/* Category & City Dropdowns */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d99a3d]/40 cursor-pointer transition-all"
              data-testid="category-filter"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#d99a3d]/40 cursor-pointer transition-all"
              data-testid="city-filter"
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Creators Grid Header */}
        <div className="flex items-center justify-between">
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 18, textTransform: 'uppercase', color: '#1a1a1a' }} className="flex items-center gap-2">
            <FiVideo className="text-[#d99a3d] w-5 h-5" />
            <span>VERIFIED CREATORS</span>
            <span className="text-xs font-bold text-[#1a1a1a] bg-[#d99a3d]/20 px-2.5 py-0.5 rounded-full border border-[#d99a3d]/40 font-sans">
              {creators.length} Live
            </span>
          </h2>
        </div>

        {/* Creators Bento Grid */}
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader size="lg" />
          </div>
        ) : creators.length === 0 ? (
          <div className="bg-white rounded-md p-10 sm:p-14 text-center flex flex-col items-center gap-3 max-w-md mx-auto border border-[#e3dccb] shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-[#f2ede4] flex items-center justify-center text-[#1a1a1a]">
              <FiCompass className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1a1a1a]">No Creators Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Try adjusting your search query or city/category filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creators.map((creator) => (
              <motion.div
                key={creator._id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-md p-5 border border-[#e3dccb] shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition-all duration-200 group"
              >
                {/* Top Creator Info Header */}
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0 cursor-pointer hover:scale-105 transition-transform duration-200" onClick={() => setSelectedCreator(creator)}>
                    <div className="p-[2px] rounded-xl bg-gradient-to-br from-[#d99a3d] via-[#c8872b] to-[#1c1a17]">
                      <img
                        src={creator.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                        alt={creator.name}
                        className="w-14 h-14 rounded-[10px] object-cover bg-white"
                      />
                    </div>
                    {creator.isVerified && (
                      <span className="absolute -bottom-1 -right-1 bg-[#1c1a17] text-[#d99a3d] p-1 rounded-full shadow-sm" title="Verified Creator">
                        <FiCheckCircle className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 
                        className="font-extrabold text-sm text-[#1a1a1a] hover:text-[#d99a3d] transition-colors duration-150 truncate cursor-pointer"
                        onClick={() => setSelectedCreator(creator)}
                      >
                        {creator.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[11px] font-bold flex-shrink-0 border border-amber-200">
                        <FiStar className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{Number(creator.rating ?? 0).toFixed(1)}</span>
                        <span className="text-[9.5px] text-slate-400">({creator.reviewsCount ?? 0})</span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-[#d99a3d]">
                      {creator.category || 'Visual Creator'}
                    </span>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 min-w-0">
                        <FiMapPin className="w-3 h-3 text-[#d99a3d] flex-shrink-0" />
                        <span className="truncate">{creator.city || 'India'}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${getAvailabilityStatus(creator.availability).toLowerCase() === 'busy' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                        {getAvailabilityStatus(creator.availability)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio & Description */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {creator.bio || 'Verified short-form video creator & brand ambassador on BizReels.'}
                </p>

                {/* Pricing & Actions Footer */}
                <div className="pt-3.5 border-t border-[#e3dccb] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">
                      Starting Package
                    </span>
                    <span className="text-sm font-extrabold text-[#1a1a1a]">
                      ₹{creator.pricing?.reel1 ? creator.pricing.reel1.toLocaleString('en-IN') : '0'}
                      <span className="text-[10px] font-normal text-slate-400 ml-0.5">/ Reel</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedCreator(creator)}
                      className="px-3 py-2 bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-lg hover:bg-slate-200 transition"
                    >
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => handleConnectCreator(creator)}
                      className="px-3.5 py-2 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5 border-none cursor-pointer"
                      data-testid={`hire-${creator._id}`}
                    >
                      <FiSend className="w-3.5 h-3.5" />
                      <span>Hire</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Creator Details Modal ── */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white p-6 sm:p-7 rounded-lg border border-[#e3dccb] max-w-lg w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto font-sans">
            {/* Close button */}
            <button
              onClick={() => setSelectedCreator(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition text-xs font-bold"
            >
              ✕
            </button>

            {/* Header info */}
            <div className="flex items-center gap-4">
              <div className="p-[2px] rounded-xl bg-gradient-to-br from-[#d99a3d] to-[#1c1a17] shrink-0">
                <img
                  src={selectedCreator.avatarUrl}
                  alt={selectedCreator.name}
                  className="w-16 h-16 rounded-[10px] object-cover bg-white"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-base font-extrabold text-[#1a1a1a]">{selectedCreator.name}</h3>
                  {selectedCreator.isVerified && (
                    <FiCheckCircle className="text-[#d99a3d] shrink-0" size={16} />
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${getAvailabilityStatus(selectedCreator.availability).toLowerCase() === 'busy' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                    {getAvailabilityStatus(selectedCreator.availability)}
                  </span>
                </div>
                <p className="text-xs text-[#d99a3d] font-bold mt-0.5">{selectedCreator.category}</p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                  <FiMapPin size={12} className="text-[#d99a3d] shrink-0" /> {selectedCreator.city}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-[#f8f4ec] rounded-md border border-[#e3dccb] text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Followers</span>
                <span className="font-extrabold text-[#1a1a1a] text-sm flex items-center justify-center gap-1 mt-0.5">
                  <FiUsers size={12} className="text-[#d99a3d]" /> {selectedCreator.followers >= 1000 ? `${(selectedCreator.followers / 1000).toFixed(1)}K` : selectedCreator.followers}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Experience</span>
                <span className="font-extrabold text-[#1a1a1a] text-sm flex items-center justify-center gap-1 mt-0.5">
                  <FiAward size={12} className="text-[#d99a3d]" /> {selectedCreator.experience}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Rating</span>
                <span className="font-extrabold text-[#1a1a1a] text-sm flex items-center justify-center gap-1 mt-0.5">
                  <FiStar size={12} className="text-amber-500 fill-amber-500" /> {Number(selectedCreator.rating ?? 0).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Bio section */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Bio / Description</h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-200">
                {selectedCreator.bio}
              </p>
            </div>

            {/* Pricing Details */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pricing Packages</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-md border border-slate-200">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <FiVideo className="text-[#d99a3d]" /> 1 Video Reel Package
                  </span>
                  <span className="font-extrabold text-[#1a1a1a] text-sm">₹{(selectedCreator.pricing?.reel1 ?? 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-md border border-slate-200">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <FiVideo className="text-[#d99a3d]" /> 3 Video Reels Package
                  </span>
                  <span className="font-extrabold text-[#1a1a1a] text-sm">₹{(selectedCreator.pricing?.reel3 ?? 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedCreator.pricing?.reel10 && (
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-md border border-slate-200">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <FiVideo className="text-[#d99a3d]" /> 10 Video Reels Bundle
                    </span>
                    <span className="font-extrabold text-[#1a1a1a] text-sm">₹{(selectedCreator.pricing.reel10).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedCreator(null)}
                className="w-1/3 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-md text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedCreator(null);
                  handleConnectCreator(selectedCreator);
                }}
                className="w-2/3 py-2.5 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] rounded-md text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 border-none cursor-pointer"
              >
                <FiSend className="w-3.5 h-3.5" />
                <span>Hire Creator Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCreatorMarketplacePage;