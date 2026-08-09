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
  FiUsers
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

  // Live real-time fetch & polling setup
  useEffect(() => {
    fetchCreators(true);

    // Real-time polling every 5 seconds for live marketplace updates
    const interval = setInterval(() => {
      fetchCreators(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [searchQuery, selectedCategory, selectedCity]);

  /**
   * Action Guard:
   * When an unauthenticated visitor clicks to hire/connect with a creator,
   * notify them and redirect to sign in.
   */
  const handleConnectCreator = (creator) => {
    if (!isAuthenticated) {
      toast(`Sign in to hire ${creator.name} & request video quotes!`, {
        icon: '💼',
        duration: 3500,
        style: {
          borderRadius: '12px',
          background: '#1e1b4b',
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
    <div className="min-h-screen bg-surface-secondary pb-16">
      <SEO 
        title="Creator Marketplace"
        description="Hire professional creators to produce high-engaging video reels for your local business. Browse creator portfolios, pricing, and availability."
        url="https://bizreels.in/creator-marketplace"
      />
      {/* ── Page Hero Banner ────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16 overflow-hidden">
        {/* BG decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-brand-orange/[0.04] via-transparent to-transparent" />
          <div className="absolute top-[15%] left-[10%] w-[250px] h-[250px] bg-brand-orange/[0.06] rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[15%] w-[200px] h-[200px] bg-brand-purple/[0.05] rounded-full blur-[80px]" />
        </div>

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 relative z-10">
          <div className="flex flex-col gap-4 text-center md:text-left max-w-xl">
            <span className="px-3.5 py-1.5 text-[11px] font-bold bg-brand-orange/[0.08] text-brand-orange rounded-full uppercase tracking-widest w-fit mx-auto md:mx-0 flex items-center gap-2 border border-brand-orange/[0.12]">
              <FiAward className="w-3.5 h-3.5" /> Real-Time Live Marketplace
            </span>
            <h1 className="text-[1.75rem] leading-[1.2] sm:text-[2.25rem] md:text-[2.75rem] lg:text-[3.25rem] font-black text-brand-navy">
              Creator <span className="gradient-text">Marketplace</span>
            </h1>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Discover real-time verified local content creators, video directors,
              & reel influencers. Connect directly to scale your brand presence.
            </p>
          </div>

          {!isAuthenticated && (
            <div className="bg-white rounded-2xl p-5 border border-border/60 shadow-card flex flex-col items-center gap-3 w-full max-w-xs text-center">
              <div className="w-11 h-11 rounded-xl bg-brand-orange/[0.08] text-brand-orange flex items-center justify-center">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-brand-navy">Guest Marketplace View</h3>
                <p className="text-xs text-text-tertiary mt-1 leading-relaxed">
                  Sign in or create a business account to send hire requests & negotiate reel deals.
                </p>
              </div>
              <button
                onClick={() => navigate('/auth/register')}
                className="w-full py-2.5 px-4 bg-brand-orange hover:bg-brand-orange-600 text-white text-[13px] font-bold rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                data-testid="marketplace-join"
              >
                <span>Join Marketplace</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Main Marketplace Body ───────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-5 sm:gap-6">
        {/* Search and Filters Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border/60 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by creator name or niche..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-tertiary/50 border border-border/40 rounded-xl text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple/50 focus:bg-white transition-all duration-200"
              data-testid="creator-search"
            />
          </div>

          {/* Category & City Dropdowns */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-surface-tertiary/50 border border-border/40 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-text-primary focus:outline-none focus:border-brand-purple/50 cursor-pointer transition-all duration-200 w-full sm:w-auto"
              data-testid="category-filter"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-surface-tertiary/50 border border-border/40 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-text-primary focus:outline-none focus:border-brand-purple/50 cursor-pointer transition-all duration-200 w-full sm:w-auto"
              data-testid="city-filter"
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Creators Grid Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-black text-brand-navy flex items-center gap-2 flex-wrap">
            <FiVideo className="text-brand-purple w-5 h-5" />
            <span>Verified Creators</span>
            <span className="text-xs font-bold text-brand-purple bg-brand-purple/[0.08] px-2.5 py-0.5 rounded-full border border-brand-purple/[0.12]">
              {creators.length} Live
            </span>
          </h2>
        </div>

        {/* Creators Grid */}
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader size="lg" />
          </div>
        ) : creators.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center gap-4 max-w-md mx-auto border border-border/60 shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-surface-tertiary flex items-center justify-center">
              <FiCompass className="w-7 h-7 text-text-tertiary" />
            </div>
            <h3 className="text-base font-bold text-brand-navy">No Creators Found</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Try adjusting your search query or city/category filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {creators.map((creator) => (
              <motion.div
                key={creator._id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-border/60 shadow-card flex flex-col justify-between gap-4 sm:gap-5 hover:shadow-card-hover transition-all duration-300 group"
              >
                {/* Top Creator Info Header */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="relative shrink-0 cursor-pointer hover:scale-105 transition-transform duration-200" onClick={() => setSelectedCreator(creator)}>
                    {/* Avatar with gradient ring */}
                    <div className="p-[2px] rounded-2xl bg-gradient-to-br from-brand-purple via-brand-pink to-brand-orange">
                      <img
                        src={creator.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                        alt={creator.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] object-cover bg-white"
                      />
                    </div>
                    {creator.isVerified && (
                      <span className="absolute -bottom-1 -right-1 bg-brand-purple text-white p-1 rounded-full shadow-sm" title="Verified Creator">
                        <FiCheckCircle className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 
                        className="font-bold text-sm text-brand-navy hover:text-brand-purple transition-colors duration-200 truncate cursor-pointer"
                        onClick={() => setSelectedCreator(creator)}
                      >
                        {creator.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg text-xs font-bold flex-shrink-0 border border-amber-100">
                        <FiStar className="w-3 h-3 fill-amber-500" />
                        <span>{Number(creator.rating ?? 0).toFixed(1)}</span>
                        <span className="text-[10px] text-text-tertiary">({creator.reviewsCount ?? 0})</span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-brand-purple">
                      {creator.category || 'Visual Creator'}
                    </span>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-[11px] text-text-tertiary flex items-center gap-1 min-w-0">
                        <FiMapPin className="w-3 h-3 text-brand-orange flex-shrink-0" />
                        <span className="truncate">{creator.city || 'India'}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${creator.availability?.toLowerCase() === 'busy' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                        {creator.availability || 'Available'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio & Specialties */}
                <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">
                  {creator.bio || 'Verified short-form video creator & brand ambassador on BizReels.'}
                </p>

                {/* Pricing & Connect Footer */}
                <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
                      Starting Package
                    </span>
                    <span className="text-sm font-black text-brand-navy">
                      ₹{creator.pricing?.reel1 ? creator.pricing.reel1.toLocaleString('en-IN') : '0'}
                      <span className="text-[10px] font-normal text-text-tertiary ml-0.5">/ Reel</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedCreator(creator)}
                      className="px-3 py-2.5 bg-surface-secondary border border-border text-text-primary font-bold text-xs rounded-xl hover:bg-surface-tertiary transition flex items-center gap-1.5"
                    >
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => handleConnectCreator(creator)}
                      className="px-4 py-2.5 bg-brand-purple hover:bg-brand-purple-800 text-white font-bold text-xs rounded-xl transition-all duration-200 shadow-sm flex items-center gap-1.5 active:scale-[0.97]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-border/80 max-w-lg w-full shadow-premium relative space-y-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setSelectedCreator(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-secondary text-text-secondary transition text-sm font-bold"
            >
              ✕
            </button>

            {/* Header info */}
            <div className="flex items-center gap-4">
              <div className="p-[2px] rounded-2xl bg-gradient-to-br from-brand-purple via-brand-pink to-brand-orange shrink-0">
                <img
                  src={selectedCreator.avatarUrl}
                  alt={selectedCreator.name}
                  className="w-16 h-16 rounded-[14px] object-cover bg-white"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-lg font-black text-brand-navy">{selectedCreator.name}</h3>
                  {selectedCreator.isVerified && (
                    <FiCheckCircle className="text-brand-purple shrink-0" size={16} />
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${selectedCreator.availability?.toLowerCase() === 'busy' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                    {selectedCreator.availability || 'Available'}
                  </span>
                </div>
                <p className="text-xs text-brand-purple font-semibold mt-0.5">{selectedCreator.category}</p>
                <p className="text-[11px] text-text-tertiary flex items-center gap-1 mt-1">
                  <FiMapPin size={12} className="text-brand-orange shrink-0" /> {selectedCreator.city}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-surface-secondary/40 rounded-xl border border-border/40 text-center text-xs">
              <div>
                <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Followers</span>
                <span className="font-extrabold text-brand-navy text-sm flex items-center justify-center gap-1 mt-0.5">
                  <FiUsers size={12} className="text-brand-purple" /> {selectedCreator.followers >= 1000 ? `${(selectedCreator.followers / 1000).toFixed(1)}K` : selectedCreator.followers}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Experience</span>
                <span className="font-extrabold text-brand-navy text-sm flex items-center justify-center gap-1 mt-0.5">
                  <FiAward size={12} className="text-violet-500" /> {selectedCreator.experience}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Rating</span>
                <span className="font-extrabold text-brand-navy text-sm flex items-center justify-center gap-1 mt-0.5">
                  <FiStar size={12} className="text-amber-500 fill-amber-500" /> {Number(selectedCreator.rating ?? 0).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Bio section */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">Bio / Description</h4>
              <p className="text-xs text-text-secondary leading-relaxed bg-surface-secondary/35 p-3 rounded-xl border border-border/30">
                {selectedCreator.bio}
              </p>
            </div>

            {/* Pricing Details */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">Pricing Packages</h4>
              <div className="grid grid-cols-1 gap-2.5">
                <div className="flex items-center justify-between text-xs bg-surface-secondary/40 p-3 rounded-xl border border-border/50">
                  <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                    <FiVideo className="text-purple-500" /> 1 Video Reel Package
                  </span>
                  <span className="font-black text-brand-navy text-sm">₹{(selectedCreator.pricing?.reel1 ?? 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-surface-secondary/40 p-3 rounded-xl border border-border/50">
                  <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                    <FiVideo className="text-violet-500" /> 3 Video Reels Package
                  </span>
                  <span className="font-black text-brand-navy text-sm">₹{(selectedCreator.pricing?.reel3 ?? 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedCreator.pricing?.reel10 && (
                  <div className="flex items-center justify-between text-xs bg-surface-secondary/40 p-3 rounded-xl border border-border/50">
                    <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                      <FiVideo className="text-emerald-500" /> 10 Video Reels Bundle
                    </span>
                    <span className="font-black text-brand-navy text-sm">₹{(selectedCreator.pricing.reel10).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Languages spoken */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">Languages</span>
              <span className="font-semibold text-text-secondary">{selectedCreator.languages}</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedCreator(null)}
                className="w-1/3 py-3 border border-border hover:bg-surface-secondary text-text-primary rounded-xl text-xs font-bold transition active:scale-[0.98]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedCreator(null);
                  handleConnectCreator(selectedCreator);
                }}
                className="w-2/3 py-3 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition shadow-premium flex items-center justify-center gap-1.5 active:scale-[0.98]"
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