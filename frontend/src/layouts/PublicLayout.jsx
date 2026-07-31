import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/auth/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiArrowRight, FiInstagram, FiTwitter, FiLinkedin, FiMail, FiMapPin } from 'react-icons/fi';
import Button from '../components/common/Button';

const PublicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for navbar backdrop effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Creator Marketplace', path: '/creator-marketplace' },
    { name: 'Local Reels', path: '/local-reels' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col font-sans">
      {/* ── Floating Top Navbar ─────────────────────────────────── */}
      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-b border-border/60'
            : 'bg-white/60 backdrop-blur-md border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" data-testid="public-logo">
            <img src="/logo.png" alt="BizReels Logo" className="h-8 w-auto transition-transform duration-300 group-hover:scale-105" />
            <span className="text-lg font-extrabold tracking-tight text-brand-navy">
              Biz<span className="gradient-text font-black">Reels</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-${link.name.toLowerCase().replace(/\s/g, '-')}`}
                className={`relative px-4 py-2 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-brand-purple bg-brand-purple/[0.07]'
                    : 'text-text-secondary hover:text-brand-navy hover:bg-surface-tertiary/60'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-brand-purple"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop CTA Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated ? (
              <Button
                variant="primary"
                onClick={() => navigate('/feed')}
                className="text-[13px] py-2.5 px-5 flex items-center gap-2 group"
                data-testid="nav-go-to-dashboard"
              >
                <span>Dashboard</span>
                <FiArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="text-[13px] font-semibold text-brand-purple px-4 py-2.5 hover:bg-brand-purple/[0.06] rounded-xl transition-all duration-200"
                  data-testid="nav-sign-in"
                >
                  Sign In
                </Link>
                <Button
                  variant="accent"
                  onClick={() => navigate('/auth/register')}
                  className="text-[13px] py-2.5 px-5 rounded-xl"
                  data-testid="nav-sign-up"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden hover:bg-surface-tertiary rounded-xl text-brand-navy transition-colors duration-200 focus:outline-none"
            data-testid="mobile-menu-toggle"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileMenuOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <FiX className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <FiMenu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu Overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[57px] left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-b border-border/80 shadow-xl"
            >
              <div className="px-4 py-5 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 ${
                      isActive(link.path)
                        ? 'text-brand-purple bg-brand-purple/[0.07]'
                        : 'text-text-secondary hover:text-brand-navy hover:bg-surface-tertiary/60'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="px-4 pb-5 flex flex-col gap-2.5 border-t border-border/50 pt-4">
                {isAuthenticated ? (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/feed'); }}
                    className="text-sm py-3"
                    data-testid="mobile-go-to-dashboard"
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="accent"
                      fullWidth
                      onClick={() => { setIsMobileMenuOpen(false); navigate('/auth/register'); }}
                      className="text-sm py-3"
                      data-testid="mobile-sign-up"
                    >
                      Get Started Free
                    </Button>
                    <Link
                      to="/auth/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-center text-sm font-semibold text-brand-purple py-2.5 hover:bg-brand-purple/[0.06] rounded-xl transition-all duration-200"
                      data-testid="mobile-sign-in"
                    >
                      Already have an account? Sign In
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* ── Premium Footer ─────────────────────────────────────────── */}
      <footer className="relative bg-white border-t border-border/80">
        {/* Subtle top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-purple/20 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* Brand Column */}
            <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="BizReels Logo" className="h-8 w-auto" />
                <span className="text-lg font-extrabold text-brand-navy">
                  Biz<span className="gradient-text font-black">Reels</span>
                </span>
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed max-w-xs">
                India's first AI-powered Local Business Marketplace + Creator Reels Platform. Matching businesses with creators through visual content.
              </p>
              {/* Social Icons */}
              <div className="flex items-center gap-3 mt-1">
                {[
                  { icon: FiTwitter, label: 'Twitter', href: '#' },
                  { icon: FiInstagram, label: 'Instagram', href: '#' },
                  { icon: FiLinkedin, label: 'LinkedIn', href: '#' },
                ].map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-9 h-9 rounded-xl bg-surface-tertiary/70 hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple flex items-center justify-center transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Platform Column */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-brand-navy mb-1">Platform</h4>
              {[
                { name: 'Reels Feed', path: '/local-reels' },
                { name: 'Local Marketplace', path: '/local-reels' },
                { name: 'Creator Network', path: '/creator-marketplace' },
              ].map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="text-[13px] text-text-secondary hover:text-brand-purple transition-colors duration-200 w-fit"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Company Column */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-brand-navy mb-1">Company</h4>
              {[
                { name: 'About Us', path: '/about' },
                { name: 'Careers', path: '/about' },
                { name: 'Privacy Policy', path: '/about' },
                { name: 'Terms of Service', path: '/about' },
              ].map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="text-[13px] text-text-secondary hover:text-brand-purple transition-colors duration-200 w-fit"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Contact Column */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-brand-navy mb-1">Contact & Support</h4>
              <span className="text-[13px] text-text-secondary flex items-center gap-2">
                <FiMail className="w-3.5 h-3.5 text-brand-purple/60" />
                support@bizreels.in
              </span>
              <span className="text-[13px] text-text-secondary flex items-center gap-2">
                <FiMapPin className="w-3.5 h-3.5 text-brand-purple/60" />
                New Delhi, India
              </span>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-text-tertiary">
            <span>&copy; {new Date().getFullYear()} BizReels Technology Pvt. Ltd. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/about" className="hover:text-brand-purple transition-colors duration-200">Privacy</Link>
              <Link to="/about" className="hover:text-brand-purple transition-colors duration-200">Terms</Link>
              <Link to="/about" className="hover:text-brand-purple transition-colors duration-200">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
