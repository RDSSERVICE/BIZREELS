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
  FiAward
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import { api } from '../../lib/api';

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
      {/* ── Page Hero Banner ────────────────────────────────────────── */}
      <section className="relative px-6 py-12 md:py-16 bg-gradient-to-b from-brand-purple/10 via-surface-secondary to-surface-secondary border-b border-border overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-3 text-center md:text-left max-w-xl">
            <span className="px-3 py-1 text-[11px] font-black bg-brand-orange/15 text-brand-orange rounded-full uppercase tracking-wider w-fit mx-auto md:mx-0 flex items-center gap-1.5">
              <FiAward className="w-3.5 h-3.5 text-brand-orange" /> Real-Time Live Marketplace
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-brand-navy leading-tight">
              Creator <span className="gradient-text">Marketplace</span>
            </h1>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
              Discover real-time verified local content creators, video directors, & reel influencers. Connect directly to scale your brand presence.
            </p>
          </div>

          {!isAuthenticated && (
            <div className="glass p-5 rounded-premium border-white/40 shadow-glass flex flex-col items-center gap-3 max-w-xs text-center">
              <div className="w-10 h-10 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                <FiLock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-brand-navy">Guest Marketplace View</h3>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  Sign in or create a business account to send hire requests & negotiate reel deals.
                </p>
              </div>
              <button
                onClick={() => navigate('/auth/register')}
                className="w-full py-2 px-4 bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-bold rounded-premium transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Join Marketplace</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Main Marketplace Body ───────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Search and Filters Bar */}
        <div className="glass p-5 rounded-premium border border-white/50 shadow-glass flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by creator name or niche..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-premium text-xs text-text-primary focus:outline-none focus:border-brand-purple transition-all"
            />
          </div>

          {/* Category Dropdown & City Dropdown */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-surface border border-border rounded-premium px-3.5 py-2.5 text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer flex-1 md:flex-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-surface border border-border rounded-premium px-3.5 py-2.5 text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer flex-1 md:flex-none"
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Creators Grid Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-brand-navy flex items-center gap-2">
            <FiVideo className="text-brand-purple" /> Verified Creators (Real-Time Database)
            <span className="text-xs font-bold text-brand-purple bg-brand-purple/10 px-2.5 py-0.5 rounded-full">
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
          <div className="glass p-12 rounded-premium text-center flex flex-col items-center gap-3 max-w-md mx-auto">
            <FiCompass className="w-12 h-12 text-text-tertiary" />
            <h3 className="text-base font-bold text-brand-navy">No Creators Found</h3>
            <p className="text-xs text-text-secondary">Try adjusting your search query or city/category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <motion.div
                key={creator._id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="glass rounded-premium p-6 border border-white/50 shadow-glass flex flex-col justify-between gap-5 hover:shadow-xl transition-all group"
              >
                {/* Top Creator Info Header */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={creator.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                      alt={creator.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-purple/30 group-hover:border-brand-purple transition-all shadow-md"
                    />
                    {creator.isVerified && (
                      <span className="absolute -bottom-1 -right-1 bg-brand-purple text-white p-1 rounded-full text-[10px] shadow" title="Verified Creator">
                        <FiCheckCircle className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 flex-grow">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-sm text-brand-navy group-hover:text-brand-purple transition-colors truncate max-w-[140px]">
                        {creator.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full text-xs font-bold">
                        <FiStar className="w-3 h-3 fill-amber-500" />
                        <span>{creator.rating || '4.9'}</span>
                        <span className="text-[10px] text-text-tertiary">({creator.reviewsCount || 0})</span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-brand-purple">
                      {creator.category || 'Visual Creator'}
                    </span>

                    <span className="text-[11px] text-text-tertiary flex items-center gap-1 mt-0.5">
                      <FiMapPin className="w-3 h-3 text-brand-orange" /> {creator.city || 'India'}
                    </span>
                  </div>
                </div>

                {/* Bio & Specialties */}
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {creator.bio || 'Verified short-form video creator & brand ambassador on BizReels.'}
                </p>

                {/* Pricing & Connect Footer */}
                <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
                      Starting Package
                    </span>
                    <span className="text-sm font-black text-brand-navy">
                      ₹{creator.pricing?.reel1 ? creator.pricing.reel1.toLocaleString('en-IN') : '800'}
                      <span className="text-[10px] font-normal text-text-tertiary"> / Reel</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleConnectCreator(creator)}
                    className="px-4 py-2 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold text-xs rounded-premium transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                  >
                    <FiSend className="w-3.5 h-3.5" />
                    <span>Hire Creator</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCreatorMarketplacePage;
