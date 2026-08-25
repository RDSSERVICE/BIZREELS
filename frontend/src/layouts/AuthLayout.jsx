import React from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, selectActiveRole } from '../features/auth/authSlice';
import { getRoleDashboard } from '../lib/roleNav';
import { FiVideo, FiZap, FiShield } from 'react-icons/fi';
import SEO from '../components/common/SEO';

/**
 * Layout for Authentication views (Login, Register, Reset Password)
 * Styled according to the Warm Editorial Bento-Brutalism design system.
 */
const AuthLayout = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const activeRole = useSelector(selectActiveRole);
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith('/admin') || location.pathname === '/adminlogin';

  // If already authenticated, redirect appropriately
  if (isAuthenticated) {
    const isAdmin = (user?.roles || []).includes('admin');
    if (isAdminPath) {
      if (isAdmin) {
        return <Navigate to="/admin/dashboard" replace />;
      }
    } else {
      return <Navigate to={getRoleDashboard(activeRole)} replace />;
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden flex items-center justify-center font-sans px-4 py-10 sm:px-6 lg:px-8" style={{ backgroundColor: '#f2ede4' }}>
      <SEO title="Authentication" robots="noindex, nofollow" />
      
      <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Side: Brand Visual (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center text-left space-y-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="BizReels Logo" className="h-12 w-auto" />
            <span className="text-2xl font-heading font-extrabold tracking-tight text-[#1a1a1a]">
              Biz<span className="gradient-text font-black">Reels</span>
            </span>
          </Link>

          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-4xl xl:text-5xl text-[#1a1a1a] uppercase leading-[1.05] tracking-tight">
            WATCH.<br />
            DISCOVER.<br />
            <span style={{ color: '#d99a3d' }}>CONNECT.</span>
          </h1>

          <p className="text-sm text-[#4a4a4a] leading-relaxed max-w-md font-medium">
            India's first visual reels commerce platform. Watch short clips, discover local vendors, request services, and close fair deals directly.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 max-w-md">
            <div className="p-4 bg-[#1c1a17] text-white rounded-md border border-[#3a3630]">
              <div className="flex items-center gap-2 text-[#d99a3d] font-bold text-xs uppercase tracking-wider mb-1">
                <FiVideo className="w-4 h-4" />
                Visual Feed
              </div>
              <p className="text-xs text-[#c9c4bb]">Short reels &amp; live shop showcases from verified creators.</p>
            </div>

            <div className="p-4 bg-[#d99a3d] text-[#1a1a1a] rounded-md border border-[#1a1a1a]/20">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-1">
                <FiZap className="w-4 h-4" />
                Direct Deals
              </div>
              <p className="text-xs text-[#3a2f1f] font-medium">Post job requirements and get instant vendor quotes.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="col-span-12 lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-md border border-[#e3dccb] shadow-xs flex flex-col gap-6">
            {/* Small Logo for mobile viewports */}
            <div className="flex lg:hidden justify-center mb-1">
              <Link to="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="BizReels Logo" className="h-10 w-auto" />
                <span className="text-xl font-heading font-extrabold text-[#1a1a1a]">
                  Biz<span className="gradient-text font-black">Reels</span>
                </span>
              </Link>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
