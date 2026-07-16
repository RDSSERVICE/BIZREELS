import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/auth/authSlice';

/**
 * Premium layout for Authentication views (Login, Register, Reset Password)
 * Features glassmorphic cards, gradient animated mesh background, and visual brand presence.
 */
const AuthLayout = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // If already authenticated, redirect to workspace
  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-surface-secondary px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative gradient backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-brand-purple/10 blur-[120px] pointer-events-none animate-float" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-orange/10 blur-[100px] pointer-events-none animate-float" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[30%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-brand-pink/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-6xl grid lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Side: Brand Visual (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center text-left space-y-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="BizReels Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-brand-navy leading-tight">
            Watch. Discover. <span className="gradient-text">Shop.</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-md">
            The ultimate AI-powered local business marketplace and creator platform. Watch engaging reels, discover nearby stores, request services, and shop directly.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4 max-w-md">
            <div className="p-4 glass rounded-premium border-white/40 shadow-glass">
              <h3 className="font-bold text-brand-purple">Instagram Feed</h3>
              <p className="text-xs text-text-secondary mt-1">Short clips, reviews, and dynamic content from local creators.</p>
            </div>
            <div className="p-4 glass rounded-premium border-white/40 shadow-glass">
              <h3 className="font-bold text-brand-orange">Lead Engine</h3>
              <p className="text-xs text-text-secondary mt-1">Post your job requirements and compare instant vendor quotes.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="col-span-12 lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md p-8 glass-strong rounded-super shadow-premium border border-white/40 flex flex-col gap-6 animate-scale-in">
            {/* Small Logo for mobile viewports */}
            <div className="flex lg:hidden justify-center mb-2">
              <img src="/logo.png" alt="BizReels Logo" className="h-12 w-auto" />
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
