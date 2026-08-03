import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiVideo, FiMapPin, FiCompass, FiShield, FiBriefcase, FiZap, FiTrendingUp, FiUsers, FiPlay } from 'react-icons/fi';
import Button from '../../components/common/Button';
import SEO from '../../components/common/SEO';

const Home = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 120, damping: 20 }
    }
  };

  const metrics = [
    { value: '10k+', label: 'Local Vendors', color: 'brand-purple' },
    { value: '5,000+', label: 'Active Creators', color: 'brand-navy' },
    { value: '₹2.5M+', label: 'Paid in Escrow', color: 'brand-orange' },
    { value: '500k+', label: 'Reels Watched', color: 'brand-pink' },
  ];

  return (
    <div className="overflow-x-hidden min-h-screen bg-surface-secondary">
      <SEO 
        title="Watch. Discover. Shop."
        description="Discover local vendors, chat direct, deal fair. India's first visual reels commerce platform."
        url="https://bizreels.in/"
      />
      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-28 pb-12 sm:pb-16 md:pb-20 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(109,40,217,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(109,40,217,0.3) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
          {/* Glow blobs */}
          <div className="absolute top-[15%] left-[15%] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-brand-purple/[0.08] rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] bg-brand-orange/[0.08] rounded-full blur-[100px]" />
          <div className="absolute top-[60%] left-[55%] w-[200px] h-[200px] bg-brand-pink/[0.06] rounded-full blur-[90px]" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto flex flex-col items-center gap-6 sm:gap-7 z-10"
        >
          {/* Badge */}
          <motion.span
            variants={itemVariants}
            className="px-4 py-2 text-[11px] sm:text-xs font-bold bg-brand-purple/[0.08] text-brand-purple rounded-full uppercase tracking-widest flex items-center gap-2 border border-brand-purple/[0.12]"
          >
            <FiZap className="w-3.5 h-3.5" />
            Empowering Local Ecosystems
          </motion.span>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-[2rem] leading-[1.15] sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.75rem] font-black text-brand-navy"
          >
            Unleash Local Commerce
            <br className="hidden sm:block" />
            {' '}Through{' '}
            <span className="gradient-text font-black">Visual Reels</span>
          </motion.h1>

          {/* Sub-heading */}
          <motion.p
            variants={itemVariants}
            className="text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl leading-relaxed"
          >
            India's first AI-powered marketplace merging short-form video reels
            with local requirements. Connect with nearby customers, collaborate with
            professional creators, and scale your business.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 w-full sm:w-auto"
          >
            <Button
              variant="accent"
              onClick={() => navigate('/auth/register')}
              className="py-3.5 sm:py-4 px-7 sm:px-8 text-sm font-bold shadow-premium flex items-center justify-center gap-2 group rounded-2xl"
              data-testid="hero-get-started"
            >
              <span>Get Started Now</span>
              <FiArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
            <Button
              variant="glass"
              onClick={() => navigate('/local-reels')}
              className="py-3.5 sm:py-4 px-7 sm:px-8 text-sm font-bold border border-border/80 flex items-center justify-center gap-2 rounded-2xl"
              data-testid="hero-explore-reels"
            >
              <FiPlay className="w-4 h-4" />
              <span>Explore Local Reels</span>
            </Button>
          </motion.div>

          {/* Trust line */}
          <motion.p
            variants={itemVariants}
            className="text-[11px] sm:text-xs text-text-tertiary mt-1"
          >
            Free to join · No credit card required · 10,000+ vendors trust us
          </motion.p>
        </motion.div>
      </section>

      {/* ── METRICS COUNTERS ───────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl p-4 sm:p-6 border border-border/60 text-center hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
              >
                <h3 className={`text-xl sm:text-2xl md:text-3xl font-black text-${m.color}`}>{m.value}</h3>
                <p className="text-[10px] sm:text-[11px] font-bold text-text-tertiary uppercase tracking-wider mt-1.5">{m.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR BUSINESSES vs CREATORS ────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto flex flex-col gap-10 sm:gap-14">
          {/* Section header */}
          <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
            <span className="text-[11px] font-bold text-brand-purple uppercase tracking-widest">Built For Everyone</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-brand-navy leading-tight">
              A Workspace Tailored<br className="hidden sm:block" /> For Everyone
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              BizReels supports unified accounts. Swap seamlessly between being a customer, vendor, or content creator.
            </p>
          </div>

          {/* Two feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* For Local Businesses */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
              className="relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border/60 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col gap-5"
            >
              {/* Accent top bar */}
              <div className="absolute top-0 left-6 right-6 sm:left-8 sm:right-8 h-[3px] rounded-b-full bg-gradient-to-r from-brand-purple via-brand-purple-500 to-brand-purple-300" />

              <div className="w-12 h-12 bg-brand-purple/[0.08] text-brand-purple rounded-2xl flex items-center justify-center">
                <FiBriefcase className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg sm:text-xl font-black text-brand-navy">For Local Businesses & Shops</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  Post customer requirement briefs and get competitive quotes from local vendors instantly. Showcase your products and services through geolocation-targeted reels to drive physical walk-ins.
                </p>
              </div>
              <ul className="flex flex-col gap-3 text-[13px] text-text-secondary border-t border-border/40 pt-5 mt-auto">
                {[
                  { icon: FiMapPin, text: 'Real-time Geocoded Store Locations' },
                  { icon: FiZap, text: 'Instant Bidding and Lead Notifications' },
                  { icon: FiShield, text: 'Secure Escrow Payments System' },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brand-purple/[0.07] text-brand-purple flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* For Content Creators */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
              className="relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border/60 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col gap-5"
            >
              {/* Accent top bar */}
              <div className="absolute top-0 left-6 right-6 sm:left-8 sm:right-8 h-[3px] rounded-b-full bg-gradient-to-r from-brand-orange via-brand-orange-400 to-brand-orange-200" />

              <div className="w-12 h-12 bg-brand-orange/[0.08] text-brand-orange rounded-2xl flex items-center justify-center">
                <FiVideo className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg sm:text-xl font-black text-brand-navy">For Influencers & Videographers</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  Create promotional reels for local brands, restaurants, or businesses. Bid on creator marketing briefs and unlock regular monetization opportunities near you.
                </p>
              </div>
              <ul className="flex flex-col gap-3 text-[13px] text-text-secondary border-t border-border/40 pt-5 mt-auto">
                {[
                  { icon: FiCompass, text: 'Browse Local Paid Gigs Instantly' },
                  { icon: FiVideo, text: 'Built-in Shorts and Reels Upload' },
                  { icon: FiTrendingUp, text: 'Dynamic Portfolio Page & Tiered Pricing' },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brand-orange/[0.07] text-brand-orange flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── GEOLOCATION SHOWCASE ──────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-surface-tertiary/30 border-t border-b border-border/60 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Text side */}
          <div className="flex-1 flex flex-col gap-5 lg:gap-6 text-center lg:text-left">
            <span className="px-3.5 py-1.5 text-[11px] font-bold bg-brand-orange/[0.08] text-brand-orange rounded-full uppercase tracking-widest w-fit mx-auto lg:mx-0 border border-brand-orange/[0.12]">
              Location Aware Platform
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-brand-navy leading-tight">
              Hyper-Local Mapping With
              <br className="hidden sm:block" /> Real-Time Geolocation
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed max-w-lg mx-auto lg:mx-0">
              We leverage browser GPS and Google Maps API to match you with opportunities within a 5km to 20km radius. Turn on your location to find trending reels, vendor outlets, and creator requirements in your neighborhood.
            </p>
            <div className="flex flex-col gap-4 mt-2">
              {[
                { icon: FiMapPin, title: 'Reverse Geocoding', desc: 'We convert latitude/longitude into human-readable addresses automatically.' },
                { icon: FiCompass, title: 'Radius Filters', desc: 'Filter requirements, products, and reels within strict kilometer bounds.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 text-left">
                  <span className="w-9 h-9 rounded-xl bg-brand-purple/[0.08] text-brand-purple flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-[13px] font-bold text-brand-navy">{item.title}</h4>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map visual side */}
          <div className="flex-1 w-full max-w-md mx-auto lg:mx-0 relative">
            {/* Ambient glow */}
            <div className="absolute -inset-8 bg-brand-purple/[0.04] rounded-full blur-[60px] pointer-events-none" />

            <div className="relative bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-border/60 shadow-card z-10 flex flex-col gap-4">
              {/* Header row */}
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <FiMapPin className="text-brand-purple w-4 h-4" />
                  <span className="text-[13px] font-bold text-brand-navy">Live Coordinates</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-brand-purple animate-pulse" />
              </div>
              {/* Map placeholder */}
              <div className="h-[180px] sm:h-[200px] w-full rounded-2xl overflow-hidden border border-border/40 relative bg-surface-tertiary">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=500&q=80"
                  alt="Simulated map"
                  className="w-full h-full object-cover brightness-[0.97]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <motion.span
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="p-2.5 bg-brand-purple text-white rounded-full shadow-lg flex items-center justify-center"
                  >
                    <FiMapPin className="w-4 h-4" />
                  </motion.span>
                  <div className="bg-brand-navy text-white px-2.5 py-1 rounded-lg text-[10px] font-bold mt-2 shadow-md">
                    You are here
                  </div>
                </div>
              </div>
              {/* Coordinates bar */}
              <div className="text-[11px] text-text-secondary flex flex-wrap justify-between bg-surface-tertiary/50 p-3 rounded-xl border border-border/40 gap-2">
                <span className="font-medium">Lat: 28.6139° N</span>
                <span className="font-medium">Lng: 77.2090° E</span>
                <span className="font-bold text-brand-purple">Delhi, IN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center relative overflow-hidden">
        {/* BG gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/[0.04] via-transparent to-brand-orange/[0.04] pointer-events-none" />

        <div className="max-w-2xl mx-auto flex flex-col items-center gap-5 sm:gap-6 z-10 relative">
          <span className="px-3.5 py-1.5 text-[11px] font-bold bg-brand-purple/[0.08] text-brand-purple rounded-full uppercase tracking-widest border border-brand-purple/[0.12]">
            Join BizReels Today
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-brand-navy leading-tight">
            Ready to Boost Your Business?
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-lg">
            Create your account today. Post requirement briefs, view nearby video reels, bid on open leads, and manage payments securely through our wallets.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
            <Button
              variant="accent"
              onClick={() => navigate('/auth/register')}
              className="py-3.5 px-8 text-sm font-bold shadow-premium rounded-2xl"
              data-testid="cta-sign-up"
            >
              Sign Up For Free
            </Button>
            <Button
              variant="glass"
              onClick={() => navigate('/auth/login')}
              className="py-3.5 px-8 text-sm font-bold border border-border/80 rounded-2xl"
              data-testid="cta-log-in"
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
