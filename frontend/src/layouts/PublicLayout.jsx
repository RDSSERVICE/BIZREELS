import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/auth/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu, FiX, FiArrowRight, FiSearch,
} from 'react-icons/fi';

/* ─── Brand tokens (from design image) ───────────────────────── */
const CREAM    = '#F2EDE4';
const GOLD     = '#C9923B';   // active nav / button fill
const GOLD_HOV = '#B07E2E';   // button hover
const DARK     = '#1C1C2E';   // logo text / primary text
const GRAY     = '#555566';   // nav link default
const BORDER   = '#D6CECC';   // Sign In button border

const PublicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navLinks = [
    { label: 'Home',        path: '/'                    },
    { label: 'About',       path: '/about'               },
    { label: 'Marketplace', path: '/creator-marketplace' },
    { label: 'Local Reels', path: '/local-reels'         },
    { label: 'Pricing',     path: '/pricing'             },
  ];

  const active = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden" style={{ backgroundColor: CREAM, fontFamily: "'Manrope', system-ui, sans-serif" }}>

      {/* ════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: CREAM,
          boxShadow: scrolled ? '0 1px 6px rgba(0,0,0,0.07)' : 'none',
          transition: 'box-shadow 0.25s',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4 w-full">
          {/* ── Logo ── */}
          <Link
            to="/"
            data-testid="public-logo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <img
              src="/logo.png"
              alt="BizReels"
              style={{ height: 38, width: 38, objectFit: 'contain', flexShrink: 0 }}
            />
            <span style={{ fontSize: 18, fontWeight: 700, color: DARK, letterSpacing: '-0.3px' }}>
              BizReels
            </span>
          </Link>

          {/* ── Desktop nav links (centered, grows to fill space) ── */}
          <nav
            className="hidden md:flex"
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 4 }}
          >
            {navLinks.map(({ label, path }) => {
              const isAct = active(path);
              return (
                <Link
                  key={path}
                  to={path}
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  style={{
                    position: 'relative',
                    padding: '6px 16px',
                    fontSize: 14,
                    fontWeight: 500,
                    color: isAct ? GOLD : GRAY,
                    textDecoration: 'none',
                    transition: 'color 0.18s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { if (!isAct) e.currentTarget.style.color = DARK; }}
                  onMouseLeave={(e) => { if (!isAct) e.currentTarget.style.color = GRAY; }}
                >
                  {label}
                  {isAct && (
                    <motion.span
                      layoutId="nav-active-bar"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 16,
                        right: 16,
                        height: 2,
                        borderRadius: 2,
                        backgroundColor: GOLD,
                      }}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Desktop right actions ── */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 10, flexShrink: 0 }}>

            {/* Search */}
            <button
              aria-label="Search"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'transparent',
                border: 'none',
                color: GRAY,
                cursor: 'pointer',
                transition: 'background 0.18s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <FiSearch size={17} />
            </button>

            {isAuthenticated ? (
              /* Dashboard button */
              <button
                onClick={() => navigate('/feed')}
                data-testid="nav-go-to-dashboard"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 20px',
                  fontSize: 13.5, fontWeight: 600,
                  color: '#fff',
                  background: GOLD,
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'background 0.18s, opacity 0.18s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = GOLD_HOV; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; }}
              >
                Dashboard <FiArrowRight size={14} />
              </button>
            ) : (
              <>
                {/* Sign In */}
                <Link
                  to="/auth/login"
                  data-testid="nav-sign-in"
                  style={{
                    padding: '7px 20px',
                    fontSize: 13.5, fontWeight: 600,
                    color: DARK,
                    textDecoration: 'none',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 10,
                    background: 'transparent',
                    transition: 'background 0.18s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Sign In
                </Link>

                {/* Get Started */}
                <button
                  onClick={() => navigate('/auth/register')}
                  data-testid="nav-sign-up"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 22px',
                    fontSize: 13.5, fontWeight: 600,
                    color: '#fff',
                    background: GOLD,
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'background 0.18s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = GOLD_HOV; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; }}
                >
                  Get Started <FiArrowRight size={14} />
                </button>
              </>
            )}
          </div>

          {/* ── Mobile hamburger — hidden on md+ screens ── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="mobile-menu-toggle"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="md:hidden flex items-center justify-center"
            style={{
              marginLeft: 'auto',
              width: 36, height: 36,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              color: DARK,
              cursor: 'pointer',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.14 }}>
                  <FiX size={20} />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.14 }}>
                  <FiMenu size={20} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          MOBILE MENU
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden"
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.15)' }}
            />

            {/* panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden"
              style={{
                position: 'fixed', top: 64, left: 0, right: 0, zIndex: 50,
                backgroundColor: CREAM,
                borderBottom: `1px solid ${BORDER}`,
                boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
              }}
            >
              {/* Links */}
              <div style={{ padding: '12px 20px 8px' }}>
                {navLinks.map(({ label, path }) => {
                  const isAct = active(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setMobileOpen(false)}
                      style={{
                        display: 'block',
                        padding: '11px 12px',
                        fontSize: 14, fontWeight: 500,
                        color: isAct ? GOLD : GRAY,
                        textDecoration: 'none',
                        borderRadius: 8,
                        background: isAct ? `${GOLD}14` : 'transparent',
                      }}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>

              {/* CTAs */}
              <div style={{ padding: '12px 20px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isAuthenticated ? (
                  <button
                    onClick={() => { setMobileOpen(false); navigate('/feed'); }}
                    data-testid="mobile-go-to-dashboard"
                    style={{ width: '100%', padding: '11px', fontSize: 14, fontWeight: 600, color: '#fff', background: GOLD, border: 'none', borderRadius: 10, cursor: 'pointer' }}
                  >
                    Go to Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setMobileOpen(false); navigate('/auth/register'); }}
                      data-testid="mobile-sign-up"
                      style={{ width: '100%', padding: '11px', fontSize: 14, fontWeight: 600, color: '#fff', background: GOLD, border: 'none', borderRadius: 10, cursor: 'pointer' }}
                    >
                      Get Started
                    </button>
                    <Link
                      to="/auth/login"
                      onClick={() => setMobileOpen(false)}
                      data-testid="mobile-sign-in"
                      style={{
                        display: 'block', textAlign: 'center',
                        padding: '11px', fontSize: 14, fontWeight: 600,
                        color: DARK, textDecoration: 'none',
                        border: `1px solid ${BORDER}`, borderRadius: 10,
                      }}
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          PAGE CONTENT
      ════════════════════════════════════════════════════════ */}
      <main className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden">
        <Outlet />
      </main>

      {/* ════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════ */}
      <footer style={{ backgroundColor: '#1c1a17', color: '#c9c4bb' }} className="w-full max-w-full overflow-x-hidden">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 20px 0' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">

            {/* Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/logo.png" alt="BizReels" style={{ height: 32, width: 32, objectFit: 'contain' }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#d99a3d' }}>BizReels</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: '#8a8578', maxWidth: 220 }}>
                The reel platform for products and services. Generate leads. Grow your business.
              </p>
              {/* Social icons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {[
                  { label: 'Instagram', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 16, height: 16 }}><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg> },
                  { label: 'YouTube', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 16, height: 16 }}><rect x="2" y="5" width="20" height="14" rx="3" /><polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none" /></svg> },
                  { label: 'LinkedIn', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 16, height: 16 }}><rect x="2" y="2" width="20" height="20" rx="3" /><line x1="8" y1="11" x2="8" y2="16" /><line x1="8" y1="8" x2="8" y2="8.5" /><path d="M12 11v5M12 11c0-1.5 4-2 4 1v4" /></svg> },
                  { label: 'Twitter', svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
                ].map(({ label, svg }) => (
                  <a key={label} href="#" aria-label={label}
                    style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8578', textDecoration: 'none', transition: 'color .15s, background .15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#d99a3d'; e.currentTarget.style.backgroundColor = 'rgba(217,154,61,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#8a8578'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
                  >
                    {svg}
                  </a>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#d99a3d', marginBottom: 6 }}>Platform</h4>
              {[
                { label: 'Home',         path: '/' },
                { label: 'Explore',      path: '/local-reels' },
                { label: 'Categories',   path: '/creator-marketplace' },
                { label: 'For Business', path: '/auth/register?role=vendor' },
                { label: 'Pricing',      path: '/pricing' },
              ].map(({ label, path }) => (
                <Link key={label} to={path} style={{ fontSize: 13, color: '#8a8578', textDecoration: 'none', transition: 'color .15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f2ede4'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#8a8578'; }}
                >{label}</Link>
              ))}
            </div>

            {/* Company */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#d99a3d', marginBottom: 6 }}>Company</h4>
              {[
                { label: 'About Us',   path: '/about' },
                { label: 'Careers',    path: '/about' },
                { label: 'Blog',       path: '/about' },
                { label: 'Contact Us', path: '/about' },
              ].map(({ label, path }) => (
                <Link key={label} to={path} style={{ fontSize: 13, color: '#8a8578', textDecoration: 'none', transition: 'color .15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f2ede4'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#8a8578'; }}
                >{label}</Link>
              ))}
            </div>

            {/* Resources */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#d99a3d', marginBottom: 6 }}>Resources</h4>
              {[
                { label: 'Help Center',      path: '/about' },
                { label: 'Success Stories',  path: '/about' },
                { label: 'Business Guide',   path: '/about' },
                { label: 'Terms of Service', path: '/about' },
                { label: 'Privacy Policy',   path: '/about' },
              ].map(({ label, path }) => (
                <Link key={label} to={path} style={{ fontSize: 13, color: '#8a8578', textDecoration: 'none', transition: 'color .15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f2ede4'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#8a8578'; }}
                >{label}</Link>
              ))}
            </div>

            {/* Stay in the Loop */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#d99a3d', marginBottom: 6 }}>Stay in the Loop</h4>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: '#8a8578' }}>
                Get tips, trends and updates to grow your business.
              </p>
              {/* Email input */}
              <div style={{ display: 'flex', gap: 0, marginTop: 4 }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  style={{ flex: 1, padding: '10px 14px', fontSize: 13, backgroundColor: '#f2ede4', border: 'none', borderRadius: '6px 0 0 6px', outline: 'none', color: '#1a1a1a', fontFamily: 'inherit' }}
                />
                <button
                  style={{ padding: '10px 14px', backgroundColor: '#d99a3d', border: 'none', borderRadius: '0 6px 6px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c8872b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#d99a3d'; }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                    <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>
              </div>
            </div>

          </div>

          {/* Bottom bar */}
          <div style={{ marginTop: 40, padding: '18px 0', borderTop: '1px solid #3a3630', textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: '#5a5652' }}>
              © {new Date().getFullYear()} BizReels. All rights reserved.
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default PublicLayout;
