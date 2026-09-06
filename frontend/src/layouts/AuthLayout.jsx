import React from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, selectActiveRole } from '../features/auth/authSlice';
import { getRoleDashboard } from '../lib/roleNav';
import { FiVideo, FiZap, FiShield, FiArrowLeft } from 'react-icons/fi';
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

  const isRegister = location.pathname === '/auth/register';

  return (
    <div className="relative min-h-screen overflow-x-hidden flex items-start sm:items-center justify-center font-sans px-4 py-6 sm:py-10 sm:px-6 lg:px-8" style={{ backgroundColor: '#f2ede4' }}>
      <SEO title="Authentication" robots="noindex, nofollow" />
      
      <div className={`w-full ${isRegister ? 'max-w-6xl' : 'max-w-5xl'} grid lg:grid-cols-12 gap-6 lg:gap-10 items-center z-10 my-auto`}>
        {/* Left Side: Brand Visual (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-start text-left space-y-5 lg:sticky lg:top-10 pt-1">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-600 hover:text-[#1a1a1a] transition-all group mb-4 px-3 py-1.5 rounded-full bg-white/70 hover:bg-white border border-[#e3dccb] shadow-2xs"
            >
              <FiArrowLeft className="w-3.5 h-3.5 text-[#d99a3d] transition-transform group-hover:-translate-x-1" />
              <span>Back to Website</span>
            </Link>
          </div>

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

          <div className="grid grid-cols-2 gap-3 pt-1 max-w-md">
            <div className="p-3.5 bg-[#1c1a17] text-white rounded-xl border border-[#3a3630]">
              <div className="flex items-center gap-2 text-[#d99a3d] font-bold text-xs uppercase tracking-wider mb-1">
                <FiVideo className="w-4 h-4" />
                Visual Feed
              </div>
              <p className="text-xs text-[#c9c4bb]">Short reels &amp; live shop showcases from verified creators.</p>
            </div>

            <div className="p-3.5 bg-[#d99a3d] text-[#1a1a1a] rounded-xl border border-[#1a1a1a]/20">
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
          <div className={`w-full ${isRegister ? 'max-w-xl p-5 sm:p-7' : 'max-w-md p-6 sm:p-8'} bg-white rounded-2xl border border-[#e3dccb] shadow-sm flex flex-col gap-5 transition-all`}>
            {/* Small Logo & Back to Website for mobile viewports */}
            <div className="flex lg:hidden items-center justify-between pb-1 border-b border-[#f0eae1]">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1a1a1a] transition-colors"
              >
                <FiArrowLeft className="w-3.5 h-3.5 text-[#d99a3d]" />
                <span>Back to Website</span>
              </Link>
              <Link to="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="BizReels Logo" className="h-8 w-auto" />
                <span className="text-lg font-heading font-extrabold text-[#1a1a1a]">
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
