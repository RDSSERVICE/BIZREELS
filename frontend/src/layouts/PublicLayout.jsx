import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/auth/authSlice';
import { FiMenu, FiX, FiVideo, FiBriefcase, FiUserCheck, FiHome, FiArrowRight } from 'react-icons/fi';
import Button from '../components/common/Button';

const PublicLayout = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Creator Marketplace', path: '/creator-marketplace' },
    { name: 'Local Reels', path: '/local-reels' },
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col font-sans">
      {/* ── Public Top Header Navbar ───────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full glass border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="BizReels Logo" className="h-8 w-auto" />
            <span className="text-lg font-bold tracking-tight text-brand-navy">
              Biz<span className="gradient-text font-black">Reels</span>
            </span>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-xs font-bold text-text-secondary hover:text-brand-purple transition-all"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              variant="primary"
              onClick={() => navigate('/feed')}
              className="text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <span>Go to Dashboard</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <>
              <Link to="/auth/login" className="text-xs font-bold text-brand-purple px-4 py-2 hover:bg-brand-purple/5 rounded-premium transition-all">
                Sign In
              </Link>
              <Button
                variant="primary"
                onClick={() => navigate('/auth/register')}
                className="text-xs py-2 px-5"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 md:hidden hover:bg-surface-tertiary rounded-premium text-brand-navy focus:outline-none"
        >
          {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass border-b border-border p-4 flex flex-col gap-4 animate-fade-in z-45">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-bold text-text-secondary hover:text-brand-purple py-2 px-2 rounded-md hover:bg-surface-tertiary transition-all"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-3 border-t border-border">
            {isAuthenticated ? (
              <Button
                variant="primary"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/feed');
                }}
                className="text-xs py-2.5 px-4"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center text-xs font-bold text-brand-purple py-2.5 bg-brand-purple/5 hover:bg-brand-purple/10 rounded-premium transition-all"
                >
                  Sign In
                </Link>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/auth/register');
                  }}
                  className="text-xs py-2.5 px-5"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Main Content Area ─────────────────────────────────── */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* ── Website Public Footer ─────────────────────────────── */}
      <footer className="glass border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="BizReels Logo" className="h-8 w-auto" />
              <span className="text-lg font-bold text-brand-navy">
                Biz<span className="gradient-text font-black">Reels</span>
              </span>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed">
              India's first AI-powered Local Business Marketplace + Creator Reels Platform. Matching business requirements with local creators through short-form visual content.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy">Platform</h4>
            <Link to="/local-reels" className="text-xs text-text-secondary hover:text-brand-purple transition-all">Reels Feed</Link>
            <Link to="/local-reels" className="text-xs text-text-secondary hover:text-brand-purple transition-all">Local Marketplace</Link>
            <Link to="/creator-marketplace" className="text-xs text-text-secondary hover:text-brand-purple transition-all">Creator Network</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy">Company</h4>
            <Link to="/about" className="text-xs text-text-secondary hover:text-brand-purple transition-all">About Us</Link>
            <Link to="/about" className="text-xs text-text-secondary hover:text-brand-purple transition-all">Careers</Link>
            <Link to="/about" className="text-xs text-text-secondary hover:text-brand-purple transition-all">Privacy Policy</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy">Contact & Support</h4>
            <span className="text-xs text-text-secondary">support@bizreels.in</span>
            <span className="text-xs text-text-secondary">New Delhi, India</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-border mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-text-tertiary">
          <span>&copy; {new Date().getFullYear()} BizReels Technology Pvt. Ltd. All rights reserved.</span>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-brand-purple">Twitter</a>
            <a href="#" className="hover:text-brand-purple">Instagram</a>
            <a href="#" className="hover:text-brand-purple font-bold">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
