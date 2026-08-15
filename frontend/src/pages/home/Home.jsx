import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import SEO from '../../components/common/SEO';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-hidden">
      <SEO
        title="Watch. Discover. Shop."
        description="Discover local vendors, chat direct, deal fair. India's first visual reels commerce platform."
        url="https://bizreels.in/"
      />
      {/* ── HERO SECTION — exact translation of reference HTML ── */}
      <section style={{ backgroundColor: '#f2ede4' }}>
        {/* .wrapper */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 14 }}>
          {/* .hero */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            backgroundColor: '#f2ede4',
            borderRadius: 6,
            overflow: 'hidden',
            position: "relative",
            zIndex: 10,
            minHeight: 420,
          }}>

            {/* ── LEFT .left ── */}
            <div style={{
              position: 'relative',
              // padding: '56px 48px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>

              {/* .headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontFamily: "'Archivo Black', sans-serif",
                  fontSize: 'clamp(34px, 4.5vw, 56px)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.5px',
                  color: '#1a1a1a',
                  textTransform: 'uppercase',
                }}
              >
                PRODUCTS.<br />
                SERVICES.<br />
                {/* .accent */}
                <span style={{ color: '#d99a3d', display: 'block' }}>REAL RESULTS.</span>
              </motion.div>

              {/* .subtext */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ marginTop: 22, fontSize: 15.5, lineHeight: 1.55, color: '#4a4a4a', maxWidth: 340, fontWeight: 500 }}
              >
                Reels that showcase what you offer. Generate leads. Grow your business. Close more sales.
              </motion.p>

              {/* .cta-row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap' }}
              >
                {/* .btn.btn-primary */}
                <button
                  onClick={() => navigate('/local-reels')}
                  data-testid="hero-start-exploring"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14.5, cursor: 'pointer', border: '1.5px solid transparent', backgroundColor: '#d99a3d', color: '#1a1a1a', transition: 'background .15s ease, transform .15s ease', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c8872b'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#d99a3d'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Start Exploring
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                </button>

                {/* .btn.btn-outline */}
                <button
                  onClick={() => navigate('/auth/register?role=vendor')}
                  data-testid="hero-business-cta"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14.5, cursor: 'pointer', border: '1.5px solid #d8d2c5', backgroundColor: 'transparent', color: '#1a1a1a', transition: 'border-color .15s ease, transform .15s ease', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b8b0a0'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d8d2c5'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  I'm a Business
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                </button>
              </motion.div>

              {/* .social-proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                style={{ marginTop: 34, display: 'flex', alignItems: 'center', gap: 12 }}
              >
                {/* .avatars */}
                <div style={{ display: 'flex' }}>
                  {[12, 33, 15].map((id, i) => (
                    <img key={id} src={`https://i.pravatar.cc/64?img=${id}`} alt=""
                      style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #f2ede4', objectFit: 'cover', background: '#ccc', marginLeft: i === 0 ? 0 : -10 }}
                    />
                  ))}
                </div>
                {/* .social-text */}
                <div style={{ fontSize: 13, lineHeight: 1.35, color: '#1a1a1a', fontWeight: 500 }}>
                  Join 12K+ businesses<br />growing with BizReels
                </div>
              </motion.div>

              {/* .logo-mark */}
              <img
                src="/hero-logo.png"
                alt=""
                aria-hidden="true"
                style={{ position: 'absolute', right: '0%', top: '50%', transform: 'translateY(-50%)', width: 220, height: 'auto', pointerEvents: 'none', userSelect: 'none', zIndex: -1, opacity: 0.6 }}
              />
            </div>

            {/* ── RIGHT .right ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ backgroundColor: '#1c1a17', padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#fff' }}
            >
              {/* .eyebrow */}
              <p style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 1, color: '#d99a3d', textTransform: 'uppercase', marginBottom: 26 }}>
                Made for Business Growth
              </p>

              {/* .feature rows */}
              {[
                {
                  title: 'Showcase Products',
                  desc: 'Highlight your products and services in short reels.',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 19, height: 19 }}><rect x="2" y="4" width="20" height="16" rx="2" /><polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none" /></svg>,
                },
                {
                  title: 'Generate Leads',
                  desc: 'Capture quality leads interested in what you offer.',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 19, height: 19 }}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>,
                },
                {
                  title: 'Close More Sales',
                  desc: 'Convert views into real customers and revenue.',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 19, height: 19 }}><polyline points="3 17 9 11 13 15 21 6" /><polyline points="15 6 21 6 21 12" /></svg>,
                },
              ].map(({ title, desc, svg }, i, arr) => (
                <div key={title} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                  paddingBottom: i < arr.length - 1 ? 18 : 0,
                  marginBottom: i < arr.length - 1 ? 18 : 28,
                  borderBottom: i < arr.length - 1 ? '1px solid #3a3630' : 'none',
                }}>
                  {/* .icon-box */}
                  <div style={{ flexShrink: 0, width: 42, height: 42, border: '1.5px solid #d99a3d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d99a3d' }}>
                    {svg}
                  </div>
                  {/* .feature-text */}
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#fff' }}>{title}</h3>
                    <p style={{ fontSize: 13.5, lineHeight: 1.5, color: '#c9c4bb', fontWeight: 400 }}>{desc}</p>
                  </div>
                </div>
              ))}

              {/* .cta-full */}
              <button
                onClick={() => navigate('/auth/register?role=vendor')}
                data-testid="hero-list-product"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#d99a3d', color: '#1a1a1a', padding: '16px 22px', borderRadius: 8, fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer', transition: 'background .15s ease', fontFamily: 'inherit' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c8872b'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#d99a3d'; }}
              >
                List Your Product / Service
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#e9e4d8', padding: '0 14px 14px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* .stats-bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', backgroundColor: '#f2ede4', borderRadius: 6, overflow: 'hidden' }}>

            {/* .stats — 4 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {[
                {
                  number: '12K+',
                  label: 'Businesses',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><rect x="2" y="4" width="20" height="16" rx="2" /><polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none" /></svg>,
                },
                {
                  number: '2.4M+',
                  label: 'Leads Generated',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" /><path d="M16 8.2a3 3 0 1 1 0 5.8" /><path d="M21.5 20c0-3-1.9-5.5-4.5-6.2" /></svg>,
                },
                {
                  number: '8.7M+',
                  label: 'Products & Services',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M6 8V6a6 6 0 0 1 12 0v2" /><rect x="3" y="8" width="18" height="13" rx="2" /></svg>,
                },
                {
                  number: '₹350Cr+',
                  label: 'Business Generated',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><polyline points="3 17 9 11 13 15 21 6" /><polyline points="15 6 21 6 21 12" /></svg>,
                },
              ].map(({ number, label, svg }, i, arr) => (
                /* .stat */
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '26px 28px', borderRight: i < arr.length - 1 ? '1px solid #ddd6c8' : 'none' }}>
                  {/* .stat-icon */}
                  <div style={{ flexShrink: 0, width: 38, height: 38, border: '1.5px solid #1a1a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a' }}>
                    {svg}
                  </div>
                  <div>
                    {/* .stat-number */}
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1, letterSpacing: '-0.3px' }}>{number}</div>
                    {/* .stat-label */}
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#5a5a5a', marginTop: 2 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* .cta-panel */}
            <button
              onClick={() => navigate('/auth/register')}
              style={{ backgroundColor: '#d99a3d', padding: '22px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, minWidth: 280, border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background .15s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c8872b'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#d99a3d'; }}
            >
              {/* .cta-text */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3 }}>For Businesses of<br />Every Size</h3>
                <p style={{ fontSize: 12.5, fontWeight: 500, color: '#3a2f1f', marginTop: 4, lineHeight: 1.4 }}>Start for free. Pay only<br />when you grow.</p>
              </div>
              {/* .cta-arrow */}
              <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(26,26,26,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                  <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                </svg>
              </div>
            </button>

          </div>
        </div>
      </section>

      {/* ── TRENDING PRODUCTS SECTION ─────────────────────────────── */}
      <section style={{ backgroundColor: '#e9e4d8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 14px 14px' }}>
          {/* .section — 3-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 2.05fr 0.8fr', gap: 6 }}>

            {/* ── LEFT: Trending list ── */}
            <div style={{ backgroundColor: '#1c1a17', padding: '24px 20px', color: '#fff', borderRadius: 8 }}>
              {/* .trending-head */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
                <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 19, lineHeight: 1.2, textTransform: 'uppercase' }}>
                  <span style={{ color: '#d99a3d', display: 'block' }}>Trending</span>
                  <span style={{ display: 'block', color: '#fff' }}>Products</span>
                </div>
                <button
                  onClick={() => navigate('/local-reels')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#d99a3d', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', marginTop: 2, fontFamily: 'inherit' }}
                >
                  View All
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                </button>
              </div>

              {/* Trend items */}
              {[
                { num: '01', img: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=100&h=100&fit=crop', title: 'Premium Office Chair',       sub: 'ErgoComfort Pro',         meta: '1.2K views · 86 leads' },
                { num: '02', img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop', title: 'Digital Marketing Service',  sub: 'Grow Your Brand Online',  meta: '980 views · 64 leads' },
                { num: '03', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=100&h=100&fit=crop', title: 'Solar Rooftop System',       sub: 'Save Electricity Bills',  meta: '875 views · 59 leads' },
                { num: '04', img: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=100&h=100&fit=crop', title: 'Modern Modular Kitchen',     sub: 'Designs That Inspire',    meta: '765 views · 51 leads' },
                { num: '05', img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=100&h=100&fit=crop', title: 'Corporate Gift Hampers',     sub: 'For Every Occasion',      meta: '680 views · 48 leads' },
              ].map(({ num, img, title, sub, meta }, i, arr) => (
                <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid #3a3630' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#d99a3d', width: 20, flexShrink: 0 }}>{num}</div>
                  <img src={img} alt={title} style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#333' }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#8a8578', marginTop: 1 }}>{sub}</div>
                    <div style={{ fontSize: 10.5, color: '#8a8578', marginTop: 2, fontWeight: 500 }}>{meta}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── MIDDLE: Product cards ── */}
            <div style={{ backgroundColor: '#1c1a17', padding: '24px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, borderRadius: 8 }}>
              {[
                { badge: 'Featured', img: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500&h=650&fit=crop', views: '2.1K', title: 'ErgoComfort Pro Premium Office Chair', category: 'Furniture' },
                { badge: null,       img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&h=650&fit=crop', views: '1.8K', title: 'Social Media Growth Service',          category: 'Digital Marketing' },
                { badge: null,       img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&h=650&fit=crop', views: '3.4K', title: 'Solar Rooftop System 3kW On-Grid',    category: 'Energy' },
              ].map(({ badge, img, views, title, category }) => (
                <div key={title} style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 10, overflow: 'hidden', backgroundColor: '#242118' }}>
                  {/* Card media */}
                  <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {badge && (
                      <span style={{ position: 'absolute', top: 10, left: 10, background: '#d99a3d', color: '#1a1a1a', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', padding: '4px 9px', borderRadius: 999, textTransform: 'uppercase' }}>
                        {badge}
                      </span>
                    )}
                    <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)', color: '#fff', fontSize: 11.5, fontWeight: 600, padding: '5px 9px', borderRadius: 999 }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 11, height: 11 }}><polygon points="6,4 20,12 6,20" /></svg>
                      {views}
                    </div>
                  </div>
                  {/* Card body */}
                  <div style={{ padding: '14px 12px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>{title}</h3>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#d99a3d', marginBottom: 12, display: 'block', flexShrink: 0 }}>{category}</span>
                    <button
                      onClick={() => navigate('/auth/register')}
                      style={{ display: 'block', textAlign: 'center', background: '#d99a3d', color: '#1a1a1a', fontSize: 12.5, fontWeight: 700, padding: 9, borderRadius: 6, border: 'none', cursor: 'pointer', marginTop: 'auto', fontFamily: 'inherit', transition: 'background .15s ease', width: '100%' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#c8872b'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#d99a3d'; }}
                    >
                      Get Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── RIGHT: CTA panel ── */}
            <div style={{ backgroundColor: '#d99a3d', padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#1a1a1a', borderRadius: 8 }}>
              <div>
                <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 25, lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
                  Create.<br />Share.<br />Generate<br />Leads.
                </h2>
                <div style={{ width: 26, height: 3, background: '#1a1a1a', margin: '16px 0 14px' }} />
                <p style={{ fontSize: 13.5, lineHeight: 1.55, fontWeight: 500, color: '#3a2f1f', maxWidth: 220 }}>
                  Upload reels of your products or services and connect with potential customers.
                </p>
              </div>
              {/* Upload row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 28 }}>
                <button
                  onClick={() => navigate('/auth/register?tab=upload')}
                  style={{ width: 52, height: 52, background: '#1a1a1a', color: '#d99a3d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', border: 'none' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 22, height: 22 }}>
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button
                  onClick={() => navigate('/auth/register?tab=upload')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: '#1a1a1a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Upload Reel
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                    <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── BROWSE BY CATEGORIES ──────────────────────────────────── */}
      <section style={{ backgroundColor: '#e9e4d8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 14px 14px' }}>
          {/* .categories-bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '220px repeat(7, 1fr)',
            alignItems: 'center',
            backgroundColor: '#f2ede4',
            border: '1px solid #e3dccb',
            borderRadius: 6,
            padding: '24px 28px',
            gap: 10,
          }}>

            {/* .browse-intro */}
            <div style={{ paddingRight: 20, borderRight: '1px solid #e3dccb' }}>
              <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.2px', color: '#1a1a1a', textTransform: 'uppercase' }}>
                Browse by<br />Categories
              </h2>
              <div style={{ width: 18, height: 2.5, background: '#1a1a1a', margin: '8px 0' }} />
              <p style={{ fontSize: 11.5, lineHeight: 1.4, color: '#5a5a5a', fontWeight: 500, maxWidth: 150 }}>
                Find products &amp; services that fit your needs.
                <span style={{ display: 'inline-block', marginLeft: 4, color: '#1a1a1a' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11, verticalAlign: '-1px' }}>
                    <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                  </svg>
                </span>
              </p>
            </div>

            {/* Category items */}
            {[
              {
                label: 'Electronics',
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 28, height: 28 }}><rect x="7" y="2" width="10" height="20" rx="2" /><line x1="11" y1="18" x2="13" y2="18" /></svg>,
              },
              {
                label: 'Home & Living',
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 28, height: 28 }}><path d="M4 13a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3H4z" /><path d="M5 16v3M19 16v3" /><path d="M6 13V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" /></svg>,
              },
              {
                label: 'Fashion',
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 28, height: 28 }}><path d="M6 8h12l-1 13H7z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>,
              },
              {
                label: 'Automotive',
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 28, height: 28 }}><path d="M3 16v-2.5a2 2 0 0 1 1.3-1.9l1.8-.6L7.6 7.8A2 2 0 0 1 9.4 7h5.2a2 2 0 0 1 1.8 1.1l1.7 3.3 2 .8a2 2 0 0 1 1.3 1.9V16" /><line x1="3" y1="16" x2="21" y2="16" /><circle cx="7.5" cy="16.5" r="1.7" fill="currentColor" stroke="none" /><circle cx="16.5" cy="16.5" r="1.7" fill="currentColor" stroke="none" /></svg>,
              },
              {
                label: 'Business Services',
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 28, height: 28 }}><rect x="3" y="8" width="18" height="11" rx="2" /><path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8" /><line x1="3" y1="13" x2="21" y2="13" /></svg>,
              },
              {
                label: 'Health & Wellness',
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 28, height: 28 }}><path d="M12 21s-7-4.6-9.5-9C1 8.5 2.5 5 6 5c2 0 3.4 1.2 4 2.2C10.6 6.2 12 5 14 5c3.5 0 5 3.5 3.5 7-2.5 4.4-9.5 9-9.5 9z" /><polyline points="6 12 9 12 10.5 9 13 15 14.5 12 18 12" /></svg>,
              },
              {
                label: 'More',
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 28, height: 28 }}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>,
              },
            ].map(({ label, svg }) => (
              <button
                key={label}
                onClick={() => navigate('/creator-marketplace')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {/* .cat-icon */}
                <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a' }}>
                  {svg}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{label}</span>
              </button>
            ))}

          </div>
        </div>
      </section>

      {/* ── WHY BUSINESSES CHOOSE BIZREELS ───────────────────────── */}
      <section style={{ backgroundColor: '#e9e4d8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 14px 14px' }}>
          {/* .section — 4-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>

            {/* PANEL 1: Why Choose — dark */}
            <div style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: '#1c1a17', padding: '24px 22px', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: 16.5, fontWeight: 800, lineHeight: 1.3, color: '#d99a3d', textTransform: 'uppercase', marginBottom: 18 }}>
                Why Businesses<br />Choose BizReels
              </h2>
              {/* check-list */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22, flex: 1 }}>
                {[
                  'Targeted audience actively looking to buy',
                  'Short reels that explain and sell better',
                  'Quality leads delivered to your dashboard',
                  'Affordable pricing. Real business impact',
                ].map((text) => (
                  <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5, lineHeight: 1.4, color: '#c9c4bb', fontWeight: 500 }}>
                    {/* .check-icon */}
                    <span style={{ flexShrink: 0, width: 16, height: 16, borderRadius: 4, border: '1.5px solid #d99a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d99a3d', marginTop: 1 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              {/* .btn-learn */}
              <button
                onClick={() => navigate('/about')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: '#d99a3d', color: '#1a1a1a', fontSize: 13, fontWeight: 700, padding: '11px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'background .15s ease', fontFamily: 'inherit' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c8872b'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#d99a3d'; }}
              >
                Learn More
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                  <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                </svg>
              </button>
            </div>

            {/* PANEL 2: Testimonial — amber */}
            <div style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: '#d99a3d', padding: '24px 22px', display: 'flex', flexDirection: 'column', color: '#1a1a1a' }}>
              {/* .quote-mark */}
              <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: '#1a1a1a', opacity: 0.85, marginBottom: 8, fontFamily: 'Georgia, serif' }}>&ldquo;</div>
              <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.45, color: '#1a1a1a', flex: 1 }}>
                BizReels helped us generate 500+ quality leads in just 30 days. Sales increased by 40%.
              </p>
              {/* .testimonial-rule */}
              <div style={{ width: 20, height: 2, backgroundColor: '#1a1a1a', opacity: 0.6, margin: '18px 0 12px' }} />
              {/* .author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop"
                  alt="Rohit Mehra"
                  style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', background: '#333', flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a1a1a' }}>Rohit Mehra</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#3a2f1f', marginTop: 1 }}>Founder, SolarBright</div>
                </div>
              </div>
            </div>

            {/* PANEL 3: Image */}
            <div style={{ borderRadius: 8, overflow: 'hidden', position: 'relative', minHeight: 220 }}>
              <img
                src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=700&fit=crop"
                alt="BizReels app on phone"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>

            {/* PANEL 4: Stats — cream */}
            <div style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: '#f2ede4', border: '1px solid #e3dccb', padding: '24px 22px' }}>
              <h2 style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.3, color: '#161513', textTransform: 'uppercase' }}>
                Success by the<br />Numbers
              </h2>
              {/* .stats-rule */}
              <div style={{ width: 20, height: 2.5, backgroundColor: '#161513', margin: '10px 0 18px' }} />

              {[
                {
                  num: '12K+', label: 'Active Businesses',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>,
                },
                {
                  num: '2.4M+', label: 'Leads Generated',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M6 8V6a6 6 0 0 1 12 0v2" /><rect x="3" y="8" width="18" height="13" rx="2" /></svg>,
                },
                {
                  num: '8.7M+', label: 'Reel Views',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>,
                },
                {
                  num: '₹350Cr+', label: 'Business Generated',
                  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M12 21s-7-4.6-9.5-9C1 8.5 2.5 5 6 5c2 0 3.4 1.2 4 2.2C10.6 6.2 12 5 14 5c3.5 0 5 3.5 3.5 7-2.5 4.4-9.5 9-9.5 9z" /></svg>,
                },
              ].map(({ num, label, svg }, i, arr) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #e3dccb' : 'none' }}>
                  {/* .icon */}
                  <div style={{ flexShrink: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#161513' }}>
                    {svg}
                  </div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: '#161513', lineHeight: 1.2 }}>{num}</div>
                    <div style={{ fontSize: 11, color: '#5a5a5a', fontWeight: 500, marginTop: 1 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>


      {/* ── CTA BANNER ───────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#e9e4d8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 14px 14px' }}>
          <div style={{
            backgroundColor: '#c8872b',
            borderRadius: 6,
            padding: '22px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}>
            {/* Left: icon + text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Arrow icon box */}
              <div style={{ flexShrink: 0, width: 42, height: 42, backgroundColor: '#1a1a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#d99a3d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                  <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>
                  Ready to grow your business?
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#3a2f1f', marginTop: 3 }}>
                  List your product or service and start getting leads today.
                </div>
              </div>
            </div>

            {/* Right: CTA button */}
            <button
              onClick={() => navigate('/auth/register')}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#1a1a1a', color: '#d99a3d', fontSize: 14, fontWeight: 700, padding: '13px 24px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity .15s ease', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Get Started Free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
              </svg>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
