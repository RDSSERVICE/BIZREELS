import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiVideo, FiMapPin, FiCompass, FiShield, FiBriefcase, FiZap } from 'react-icons/fi';
import Button from '../../components/common/Button';

const Home = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="overflow-x-hidden min-h-screen bg-surface-secondary">
      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative px-6 py-20 md:py-32 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Subtle background glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-purple/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto flex flex-col items-center gap-6 z-10"
        >
          <motion.span
            variants={itemVariants}
            className="px-4 py-1.5 text-xs font-black bg-brand-purple/10 text-brand-purple rounded-full uppercase tracking-wider flex items-center gap-1.5"
          >
            <FiZap className="w-3.5 h-3.5 fill-brand-purple/20" />
            Empowering Local Ecosystems
          </motion.span>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-black text-brand-navy leading-tight"
          >
            Unleash Local Commerce Through <span className="gradient-text font-black">Visual Reels</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-sm sm:text-base text-text-secondary max-w-2xl leading-relaxed"
          >
            BizReels is India's first AI-powered marketplace merging short-form video reels with local requirements. Connect with nearby customers, collaborate with professional creators, and scale your business.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto justify-center"
          >
            <Button
              variant="primary"
              onClick={() => navigate('/auth/register')}
              className="py-3.5 px-8 text-xs font-black shadow-premium flex items-center justify-center gap-2 group"
            >
              <span>Get Started Now</span>
              <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="glass"
              onClick={() => navigate('/local-reels')}
              className="py-3.5 px-8 text-xs font-black border border-border flex items-center justify-center gap-2"
            >
              <FiVideo className="w-4 h-4" />
              <span>Explore Local Reels</span>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── METRICS COUNTERS (Premium visual band) ───────────────── */}
      <section className="px-6 py-8 border-t border-b border-border bg-surface/30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <h3 className="text-3xl font-black text-brand-purple">10k+</h3>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mt-1">Local Vendors</p>
          </div>
          <div>
            <h3 className="text-3xl font-black text-brand-navy">5,000+</h3>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mt-1">Active Creators</p>
          </div>
          <div>
            <h3 className="text-3xl font-black text-brand-orange">₹2.5M+</h3>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mt-1">Paid in Escrow</p>
          </div>
          <div>
            <h3 className="text-3xl font-black text-brand-pink">500k+</h3>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mt-1">Reels Watched</p>
          </div>
        </div>
      </section>

      {/* ── FOR BUSINESSES VS CREATORS (Dual Feature grids) ────────── */}
      <section className="px-6 py-20 max-w-6xl mx-auto flex flex-col gap-16">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
          <h2 className="text-3xl font-black text-brand-navy">A Workspace Tailored For Everyone</h2>
          <p className="text-xs text-text-secondary">BizReels supports unified accounts. Swap seamlessly between being a customer, vendor, or content creator.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Local Businesses Card */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className="glass p-8 rounded-premium border-white/50 shadow-glass flex flex-col gap-6"
          >
            <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-premium flex items-center justify-center">
              <FiBriefcase className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-black text-brand-navy">For Local Businesses & Shops</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Post customer requirement briefs and get competitive quotes from local vendors instantly. Showcase your products and services through geolocation-targeted reels to drive physical walk-ins.
              </p>
            </div>
            <ul className="flex flex-col gap-2.5 text-xs text-text-secondary border-t border-border/50 pt-4">
              <li className="flex items-center gap-2">
                <FiMapPin className="text-brand-purple" /> Real-time Geocoded Store Locations
              </li>
              <li className="flex items-center gap-2">
                <FiZap className="text-brand-purple" /> Instant Bidding and Lead Notifications
              </li>
              <li className="flex items-center gap-2">
                <FiShield className="text-brand-purple" /> Secure Escrow Payments System
              </li>
            </ul>
          </motion.div>

          {/* For Content Creators Card */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className="glass p-8 rounded-premium border-white/50 shadow-glass flex flex-col gap-6"
          >
            <div className="w-12 h-12 bg-brand-orange/10 text-brand-orange rounded-premium flex items-center justify-center">
              <FiVideo className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-black text-brand-navy">For Influencers & Videographers</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Create promotional reels for local brands, restaurants, or businesses. Bid on creator marketing briefs and unlock regular monetization opportunities near you.
              </p>
            </div>
            <ul className="flex flex-col gap-2.5 text-xs text-text-secondary border-t border-border/50 pt-4">
              <li className="flex items-center gap-2">
                <FiCompass className="text-brand-orange" /> Browse Local Paid Gigs Instantly
              </li>
              <li className="flex items-center gap-2">
                <FiVideo className="text-brand-orange" /> Built-in Shorts and Reels Upload Client
              </li>
              <li className="flex items-center gap-2">
                <FiZap className="text-brand-orange" /> Dynamic Portfolio Page and Tiers Pricing
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ── INTEGRATED GEOLOCATION SHOWCASE SECTION ────────────── */}
      <section className="px-6 py-20 bg-surface-tertiary/20 border-t border-border overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 flex flex-col gap-6">
            <span className="px-3.5 py-1 text-[10px] font-black bg-brand-orange/10 text-brand-orange rounded-full uppercase tracking-wider w-fit">
              Location Aware Platform
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-brand-navy leading-tight">
              Hyper-Local Mapping With Real-Time Geolocation
            </h2>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
              We leverage browser GPS and Google Maps API to match you with opportunities within a 5km to 20km radius. Simply turn on your location or drag the map pin to find trending reels, local vendor outlets, and creator requirements in your specific neighborhood.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand-purple/10 text-brand-purple rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiMapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-navy">Reverse Geocoding</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">We convert latitude/longitude into human-readable city addresses automatically.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand-purple/10 text-brand-purple rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiCompass className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-navy">Radius Filters</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">Filter requirements, products, and reels within strict kilometer bounds.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full flex items-center justify-center relative">
            <div className="absolute w-[350px] h-[350px] bg-brand-purple/5 rounded-full blur-[60px]" />
            <div className="glass p-6 rounded-premium border-white/50 shadow-glass w-full max-w-md z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FiMapPin className="text-brand-purple" />
                  <span className="text-xs font-bold text-brand-navy">Simulated Map Coordinates</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-brand-purple animate-ping" />
              </div>
              <div className="h-[180px] w-full rounded-premium overflow-hidden border border-border relative bg-surface-secondary flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=500&q=80"
                  alt="Simulated map"
                  className="w-full h-full object-cover brightness-95 contrast-105"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <span className="p-2.5 bg-brand-purple text-white rounded-full shadow-premium flex items-center justify-center animate-bounce">
                    <FiMapPin className="w-4 h-4" />
                  </span>
                  <div className="bg-brand-navy-dark text-white px-2 py-1 rounded text-[9px] font-bold mt-1.5 shadow-md">
                    You are here
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-text-secondary flex justify-between bg-surface-secondary/40 p-2.5 rounded-premium border border-border">
                <span>Lat: 28.6139° N</span>
                <span>Lng: 77.2090° E</span>
                <span className="font-bold text-brand-purple">Delhi, IN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CALL TO ACTION ─────────────────────────────────── */}
      <section className="px-6 py-20 text-center relative overflow-hidden border-t border-border bg-gradient-to-br from-brand-purple/5 to-brand-orange/5">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6 z-10 relative">
          <h2 className="text-3xl sm:text-4xl font-black text-brand-navy leading-tight">Ready to Boost Your Business?</h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Create your account today. Post requirement briefs, view nearby video reels, bid on open leads, and manage all your payments securely through our wallets.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
            <Button
              variant="primary"
              onClick={() => navigate('/auth/register')}
              className="py-3 px-8 text-xs font-bold shadow-premium"
            >
              Sign Up For Free
            </Button>
            <Button
              variant="glass"
              onClick={() => navigate('/auth/login')}
              className="py-3 px-8 text-xs font-bold border border-border"
            >
              Log In
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
