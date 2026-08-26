import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiGlobe, FiShield, FiTv, FiUsers, FiTarget, FiHeart, FiCheck, FiArrowRight, FiZap } from 'react-icons/fi';
import SEO from '../../components/common/SEO';

const About = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 140, damping: 22 }
    }
  };

  const coreValues = [
    {
      title: 'Hyper-Local Focus',
      desc: 'Connecting businesses and creators within real geographical boundaries to enhance community growth and footfall.',
      icon: FiGlobe,
    },
    {
      title: 'Authentic Visuals First',
      desc: 'Replacing standard image-based catalogs with short video reels to build immediate buyer trust and engagement.',
      icon: FiTv,
    },
    {
      title: 'Secure Escrow Ledger',
      desc: 'Ensuring creators are paid fairly and businesses receive high-quality deliverables via automated escrow wallets.',
      icon: FiShield,
    },
    {
      title: 'Unified Accounts',
      desc: 'Allowing users to switch roles instantly (Buyer, Seller, or Creator) from a single unified profile.',
      icon: FiUsers,
    },
  ];

  const aboutStructuredData = React.useMemo(() => [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      'name': 'About BizReels',
      'url': 'https://bizreels.in/about',
      'description': "Learn more about BizReels - India's first visual reels commerce platform connecting local vendors, creators, and buyers.",
      'mainEntity': {
        '@type': 'Organization',
        'name': 'BizReels',
        'url': 'https://bizreels.in/',
        'logo': 'https://bizreels.in/logo.png'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': 'https://bizreels.in/'
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'About Us',
          'item': 'https://bizreels.in/about'
        }
      ]
    }
  ], []);

  return (
    <div className="overflow-x-hidden font-sans" style={{ backgroundColor: '#f2ede4', minHeight: '100vh' }}>
      <SEO 
        title="About Us"
        description="Learn more about BizReels - India's first visual reels commerce platform connecting local vendors, creators, and buyers."
        canonical="https://bizreels.in/about"
        structuredData={aboutStructuredData}
      />

      {/* ── 1. HERO SECTION — Bento 2-Column Split ──────────────── */}
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
                <span className="w-1.5 h-1.5 rounded-full bg-[#d99a3d]" />
                Who We Are
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
                REIMAGINING<br />
                LOCAL COMMERCE<br />
                <span style={{ color: '#d99a3d', display: 'block' }}>THROUGH VIDEO.</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ marginTop: 20, fontSize: 15.5, lineHeight: 1.55, color: '#4a4a4a', maxWidth: 440, fontWeight: 500 }}
              >
                BizReels bridges brick-and-mortar storefronts and local content creators. By uniting requirements and short video reels in a geolocation-based marketplace, we help local business ecosystems thrive.
              </motion.p>

              {/* Action CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4 }}
                style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}
              >
                <button
                  onClick={() => navigate('/local-reels')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14.5, cursor: 'pointer', border: 'none', backgroundColor: '#d99a3d', color: '#1a1a1a', fontFamily: 'inherit', transition: 'background .15s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c8872b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#d99a3d'; }}
                >
                  Explore Local Reels
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                </button>

                <button
                  onClick={() => navigate('/auth/register?role=vendor')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14.5, cursor: 'pointer', border: '1.5px solid #d8d2c5', backgroundColor: 'transparent', color: '#1a1a1a', fontFamily: 'inherit', transition: 'border-color .15s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b8b0a0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d8d2c5'; }}
                >
                  Join As Business
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                </button>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28, duration: 0.4 }}
                style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{ display: 'flex' }}>
                  {[12, 33, 15].map((id, i) => (
                    <img key={id} src={`https://i.pravatar.cc/64?img=${id}`} alt=""
                      style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #f2ede4', objectFit: 'cover', background: '#ccc', marginLeft: i === 0 ? 0 : -10 }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.35, color: '#1a1a1a', fontWeight: 500 }}>
                  Empowering <strong>12K+ businesses</strong> &amp; local creators across India
                </div>
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
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#d99a3d', textTransform: 'uppercase', marginBottom: 20 }}>
                  OUR MISSION &amp; VISION
                </p>

                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', lineHeight: 1.25, marginBottom: 14 }}>
                  Empowering physical storefronts to win mobile screens.
                </h3>

                <p style={{ fontSize: 13.5, lineHeight: 1.55, color: '#c9c4bb', marginBottom: 24 }}>
                  Local physical stores represent the backbone of our economy. Concurrently, thousands of talented video creators seek regular paid work. BizReels unifies these forces.
                </p>

                {/* Features list */}
                <div className="flex flex-col gap-3.5 pt-2 border-t border-[#3a3630]">
                  {[
                    'Short video reels that showcase product utility directly',
                    'Direct buyer-to-vendor chat without middleman margins',
                    'Transparent creator commissions protected via escrow wallet',
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

              {/* Small stat tracker row */}
              <div className="grid grid-cols-3 gap-2 mt-8 pt-4 border-t border-[#3a3630]">
                {[
                  { val: '50+', label: 'Active Cities' },
                  { val: '99.9%', label: 'Platform Uptime' },
                  { val: '24/7', label: 'Support Live' },
                ].map((s) => (
                  <div key={s.label} className="bg-[#242118] border border-[#3a3630] rounded-md p-2.5 text-center">
                    <div className="text-sm font-bold text-[#d99a3d]">{s.val}</div>
                    <div className="text-[9.5px] font-semibold text-[#8a8578] uppercase tracking-wider mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── 2. PLATFORM IMPACT STRIP (Bento Metric Bar) ───────── */}
      <section style={{ backgroundColor: '#f2ede4' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] bg-white/90 backdrop-blur-xs rounded-md overflow-hidden border border-[#e3dccb] shadow-xs">
            {/* .stats — 4 columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#ddd6c8]">
              {[
                {
                  number: '12K+',
                  label: 'Local Businesses',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><rect x="2" y="4" width="20" height="16" rx="2" /><polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none" /></svg>,
                },
                {
                  number: '2.4M+',
                  label: 'Reel Video Views',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><circle cx="12" cy="12" r="3" /><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /></svg>,
                },
                {
                  number: '8.7M+',
                  label: 'Products & Services',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M6 8V6a6 6 0 0 1 12 0v2" /><rect x="3" y="8" width="18" height="13" rx="2" /></svg>,
                },
                {
                  number: '₹350Cr+',
                  label: 'Business Value Generated',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><polyline points="3 17 9 11 13 15 21 6" /><polyline points="15 6 21 6 21 12" /></svg>,
                },
              ].map(({ number, label, svg }) => (
                <div key={label} className="flex items-center gap-3 p-4 sm:p-5 lg:px-6 lg:py-5">
                  <div style={{ flexShrink: 0, width: 36, height: 36, border: '1.5px solid #1a1a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a' }}>
                    {svg}
                  </div>
                  <div className="min-w-0">
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1, letterSpacing: '-0.3px' }}>{number}</div>
                    <div className="truncate" style={{ fontSize: 12, fontWeight: 500, color: '#5a5a5a', marginTop: 2 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* .cta-panel */}
            <button
              onClick={() => navigate('/auth/register')}
              className="bg-[#d99a3d] hover:bg-[#c8872b] p-5 lg:px-7 lg:py-5 flex items-center justify-between gap-4 border-none cursor-pointer text-left transition-colors font-sans w-full lg:w-auto"
            >
              <div>
                <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.25 }}>Scale Your Business<br className="hidden sm:inline" /> Today</h3>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#3a2f1f', marginTop: 3, lineHeight: 1.35 }}>Zero upfront fees. Pay only<br className="hidden sm:inline" /> on success.</p>
              </div>
              <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(26,26,26,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                  <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ── 3. CORE PRINCIPLES (Bento 4-Panel Grid) ─────────────── */}
      <section style={{ backgroundColor: '#f2ede4' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 14px 14px' }}>
          
          <div className="mb-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#d99a3d]">
              Platform Pillars
            </span>
            <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 24, textTransform: 'uppercase', color: '#1a1a1a', marginTop: 2 }}>
              OUR CORE OPERATING PRINCIPLES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* PANEL 1: Onyx Dark */}
            <div style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: '#1c1a17', padding: '24px 22px', display: 'flex', flexDirection: 'column', color: '#fff' }}>
              <div style={{ width: 36, height: 36, border: '1.5px solid #d99a3d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d99a3d', marginBottom: 16 }}>
                <FiGlobe style={{ width: 18, height: 18 }} />
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, color: '#d99a3d', textTransform: 'uppercase', marginBottom: 10 }}>
                Hyper-Local Focus
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: '#c9c4bb', fontWeight: 400, flex: 1 }}>
                Connecting businesses and creators within real geographical boundaries to enhance community economic growth.
              </p>
              <div className="mt-4 pt-3 border-t border-[#3a3630] text-[11px] font-semibold text-[#8a8578]">
                ✓ Geolocation Aware
              </div>
            </div>

            {/* PANEL 2: Amber Gold */}
            <div style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: '#d99a3d', padding: '24px 22px', display: 'flex', flexDirection: 'column', color: '#1a1a1a' }}>
              <div style={{ width: 36, height: 36, border: '1.5px solid #1a1a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a', marginBottom: 16 }}>
                <FiTv style={{ width: 18, height: 18 }} />
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase', marginBottom: 10 }}>
                Authentic Visuals
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: '#3a2f1f', fontWeight: 500, flex: 1 }}>
                Replacing static photo catalogs with short, engaging video reels to build instant buyer confidence.
              </p>
              <div className="mt-4 pt-3 border-t border-[#1a1a1a]/20 text-[11px] font-bold text-[#1a1a1a]">
                ✓ 3x Higher Conversion
              </div>
            </div>

            {/* PANEL 3: Media Card */}
            <div style={{ borderRadius: 8, overflow: 'hidden', position: 'relative', minHeight: 220 }}>
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=700&fit=crop"
                alt="Local retail marketing"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                <span className="text-[10px] font-bold text-[#d99a3d] uppercase tracking-wider">
                  Visual Commerce
                </span>
                <span className="text-xs font-bold text-white mt-0.5">
                  Real Storefronts &amp; Real Creators
                </span>
              </div>
            </div>

            {/* PANEL 4: White Bento Card */}
            <div style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e3dccb', padding: '24px 22px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ width: 36, height: 36, border: '1.5px solid #1a1a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a', marginBottom: 16 }}>
                <FiShield style={{ width: 18, height: 18 }} />
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase', marginBottom: 10 }}>
                Escrow &amp; Roles
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: '#5a5a5a', fontWeight: 500, flex: 1 }}>
                Protected payments via automated wallet ledger, with seamless role switching for buyers, vendors, and creators.
              </p>
              <div className="mt-4 pt-3 border-t border-[#e3dccb] text-[11px] font-semibold text-[#1a1a1a]">
                ✓ Instant Role Context
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. VISION & CTA BANNER ──────────────────────────────── */}
      <section style={{ backgroundColor: '#f2ede4' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 14px 14px' }}>
          <div style={{
            backgroundColor: '#c8872b',
            borderRadius: 6,
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }} className="flex-col md:flex-row text-center md:text-left">
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }} className="flex-col md:flex-row">
              <div style={{ flexShrink: 0, width: 44, height: 44, backgroundColor: '#1a1a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiZap style={{ width: 20, height: 20, color: '#d99a3d' }} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2, textTransform: 'uppercase', fontFamily: "'Archivo Black', sans-serif" }}>
                  Join The Visual Commerce Revolution
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#3a2f1f', marginTop: 4 }}>
                  List your products, create reels, or discover top local vendors today.
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/auth/register')}
              style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: '#1a1a1a', color: '#d99a3d', fontSize: 14, fontWeight: 700, padding: '13px 24px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity .15s ease', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Get Started Now
              <FiArrowRight style={{ width: 14, height: 14 }} />
            </button>

          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
