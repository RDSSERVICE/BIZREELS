import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FiLock, FiShield, FiArrowRight, FiArrowLeft, FiZap } from 'react-icons/fi';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { setCredentials } from '../../features/auth/authSlice';
import Input from '../../components/common/Input';
import SEO from '../../components/common/SEO';

/**
 * Admin Login Page styled according to the Warm Editorial Bento-Brutalism system,
 * fully matching the /auth/login and AuthLayout aesthetic.
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { applyAuthResponse } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Authenticate using backend email/password login endpoint
      const response = await api.post('/v1/auth/login', data);
      const res = response.data;

      if (!res.data?.user?.roles?.includes('admin')) {
        toast.error('Access denied. You do not have administrator privileges.');
        setIsLoading(false);
        return;
      }

      // Map credentials to AuthContext format
      const authData = {
        access_token: res.data.accessToken || res.data.access_token,
        refresh_token: res.data.refreshToken || res.data.refresh_token,
        user: res.data.user,
      };

      applyAuthResponse(authData);

      // Synchronize Redux Auth State
      dispatch(
        setCredentials({
          user: res.data.user,
          accessToken: res.data.accessToken,
        })
      );

      toast.success('Access granted. Welcome to Admin Control Center!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Login failed. Please check admin credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-x-hidden flex flex-col justify-between font-sans px-4 py-4 sm:py-6 sm:px-6 lg:px-8"
      style={{ backgroundColor: '#f2ede4' }}
    >
      <SEO title="Admin Control Center — BizReels" robots="noindex, nofollow" />

      {/* Subtle ambient warm background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#d99a3d]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#1c1a17]/5 blur-3xl pointer-events-none" />

      {/* Top Bar with Back to Website Navigation */}
      <div className="w-full max-w-5xl mx-auto mb-3 sm:mb-4 lg:mb-5 flex items-center justify-between z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700 hover:text-[#1a1a1a] transition-all group px-4 py-1.5 sm:py-2 rounded-full bg-white/85 hover:bg-white border border-[#e3dccb] shadow-2xs hover:shadow-xs cursor-pointer"
        >
          <FiArrowLeft className="w-4 h-4 text-[#d99a3d] transition-transform group-hover:-translate-x-1" />
          <span>Back to Website</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 lg:hidden">
          <img src="/logo.png" alt="BizReels Logo" className="h-8 w-auto" />
          <span className="text-xl font-heading font-extrabold text-[#1a1a1a]">
            Biz<span className="text-[#d99a3d] font-black">Reels</span>
          </span>
        </Link>
      </div>

      {/* Main Grid: Left Brand Visual + Right Admin Auth Card */}
      <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-12 gap-6 lg:gap-10 items-start z-10 my-auto">
        {/* Left Side: Brand Visual (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-start text-left space-y-4 pt-1">
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <img
              src="/logo.png"
              alt="BizReels Logo"
              className="h-11 w-auto transition-transform group-hover:scale-105"
            />
            <span className="text-3xl font-heading font-extrabold tracking-tight text-[#1a1a1a]">
              Biz<span className="text-[#d99a3d] font-black">Reels</span>
            </span>
          </Link>

          <h1
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
            className="text-4xl xl:text-5xl text-[#1a1a1a] uppercase leading-[1.08] tracking-tight"
          >
            ADMIN.<br />
            CONTROL.<br />
            <span style={{ color: '#d99a3d' }}>CONSOLE.</span>
          </h1>

          <p className="text-sm text-[#4a4a4a] leading-relaxed max-w-md font-medium">
            Master administrative terminal. Oversee platform telemetry, verify merchant KYC, audit escrow contracts, and orchestrate automated marketplace operations.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1 max-w-md">
            <div className="p-3.5 bg-[#1c1a17] text-white rounded-2xl border border-[#3a3630] shadow-2xs hover:border-[#d99a3d]/40 transition">
              <div className="flex items-center gap-2 text-[#d99a3d] font-bold text-xs uppercase tracking-wider mb-1">
                <FiShield className="w-4 h-4" />
                System Telemetry
              </div>
              <p className="text-xs text-[#c9c4bb] leading-relaxed">
                User moderation, vendor KYC approval &amp; real-time immutable audit logs.
              </p>
            </div>

            <div className="p-3.5 bg-[#d99a3d] text-[#1a1a1a] rounded-2xl border border-[#b87f28] shadow-2xs hover:bg-[#cf8f31] transition">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider mb-1 text-[#1a1a1a]">
                <FiZap className="w-4 h-4" />
                Financial Escrow
              </div>
              <p className="text-xs text-[#2b2217] font-medium leading-relaxed">
                Payment gateways, commission ledgers, milestone releases &amp; disputes.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Admin Auth Card */}
        <div className="col-span-12 lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-md p-5 sm:p-7 bg-white rounded-3xl border border-[#e3dccb] shadow-2xs flex flex-col gap-4 sm:gap-5 transition-all">
            {/* Header */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-between">
                <h2
                  style={{ fontFamily: "'Archivo Black', sans-serif" }}
                  className="text-2xl sm:text-[26px] text-[#1a1a1a] uppercase tracking-tight"
                >
                  ADMIN SIGN IN
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#d99a3d]/15 text-[#9e6715] border border-[#d99a3d]/30">
                  <FiShield className="w-3 h-3 text-[#d99a3d]" /> RESTRICTED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Authorized personnel only. Sign in with administrative credentials.
              </p>
            </div>

            {/* Security Notice Banner */}
            <div className="p-3 rounded-xl bg-[#fdfaf3] border border-[#e3dccb] text-slate-700 text-xs flex items-center gap-2.5">
              <FiLock className="w-4 h-4 text-[#d99a3d] flex-shrink-0" />
              <span className="text-[11px] font-medium leading-tight">
                Secure terminal with 256-bit TLS encryption. All administrative actions and IP addresses are audited.
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
              <Input
                label="Admin Email Address"
                type="email"
                placeholder="admin@bizreels.com"
                error={errors.email}
                {...register('email', {
                  required: 'Admin email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
                })}
              />

              <Input
                label="Security Password"
                type="password"
                placeholder="••••••••"
                error={errors.password}
                {...register('password', {
                  required: 'Password is required',
                })}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#1c1a17] hover:bg-[#2b2621] text-[#d99a3d] text-xs font-black uppercase tracking-wider rounded-full shadow-2xs hover:shadow-xs transition-all border-none cursor-pointer mt-1 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#d99a3d] border-t-transparent rounded-full animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>AUTHENTICATE &amp; ENTER</span>
                    <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Security Footer Note */}
            <div className="pt-2 border-t border-[#e3dccb]/60 flex flex-col items-center gap-2 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-500">
                <FiShield className="w-3.5 h-3.5 text-[#d99a3d]" />
                <span>256-Bit Encrypted Admin Session</span>
              </div>
              <Link
                to="/auth/login"
                className="text-[11px] font-extrabold text-[#d99a3d] hover:text-[#b87b24] hover:underline"
              >
                Return to Member Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle bottom footer copyright */}
      <div className="w-full max-w-5xl mx-auto pt-3 pb-2 text-center text-xs text-slate-500 font-medium">
        © {new Date().getFullYear()} BizReels Administrative Console. All rights reserved.
      </div>
    </div>
  );
}
