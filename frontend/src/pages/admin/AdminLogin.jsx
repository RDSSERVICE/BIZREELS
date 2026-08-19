import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FiLock, FiMail, FiEye, FiEyeOff, FiShield, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { setCredentials } from '../../features/auth/authSlice';

/**
 * Clean, Centered Admin Login Page (Dark Blue & Gold Yellow Theme)
 * Standalone without extra hero components
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { applyAuthResponse } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: { email: '', password: '' }
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
        user: res.data.user
      };

      applyAuthResponse(authData);

      // Synchronize Redux Auth State
      dispatch(setCredentials({
        user: res.data.user,
        accessToken: res.data.accessToken
      }));

      toast.success('Access granted. Welcome to Admin Control Center!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed. Please check admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0F172A] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1E293B] via-[#0F172A] to-[#090D16] flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="bg-[#EAB308]/10 blur-3xl rounded-full w-96 h-96 absolute -top-20 -left-20 pointer-events-none" />
      <div className="bg-[#1D4ED8]/15 blur-3xl rounded-full w-96 h-96 absolute -bottom-20 -right-20 pointer-events-none" />

      {/* Centered Admin Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border-2 border-[#EAB308]/40 text-[#0F172A] relative z-10 overflow-hidden animate-scale-in">
        {/* Top Accent Gradient Line */}
        <div className="h-2.5 bg-gradient-to-r from-[#0F172A] via-[#EAB308] to-[#1D4ED8] w-full absolute top-0 left-0" />

        {/* Brand Badge & Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-[#0F172A] p-2.5 flex items-center justify-center shadow-xl border border-[#EAB308]/40 mb-3 ring-4 ring-[#EAB308]/10 transition-transform hover:scale-105">
            <img src="/logo.png" alt="BizReels Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-2xl font-black tracking-tight text-[#0F172A]">Biz<span className="text-[#EAB308]">Reels</span></span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
            Admin Control Center
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Authorized personnel only. Sign in to proceed.
          </p>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="text-[10.5px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="email"
                placeholder="admin@bizreels.com"
                className={`w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border ${
                  errors.email ? 'border-rose-500' : 'border-slate-300'
                } rounded-xl text-xs font-bold text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20 transition-all shadow-2xs`}
                {...register('email', {
                  required: 'Admin email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' }
                })}
              />
            </div>
            {errors.email && (
              <span className="text-[10px] font-bold text-rose-500 mt-1 block">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="text-[10.5px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`w-full pl-11 pr-11 py-3 bg-[#F8FAFC] border ${
                  errors.password ? 'border-rose-500' : 'border-slate-300'
                } rounded-xl text-xs font-bold text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20 transition-all shadow-2xs`}
                {...register('password', {
                  required: 'Password is required'
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-[10px] font-bold text-rose-500 mt-1 block">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* CTA Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] active:bg-[#090D16] text-[#EAB308] font-black text-xs uppercase tracking-wider shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-2 border border-[#EAB308]/40 cursor-pointer disabled:opacity-50 mt-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <FiRefreshCw className="animate-spin w-4 h-4 text-[#EAB308]" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <FiShield className="w-4 h-4 text-[#EAB308]" />
                <span>Authenticate & Enter</span>
                <FiArrowRight className="w-4 h-4 text-[#EAB308]" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer Note */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10.5px] font-bold text-slate-400">
          <FiShield className="w-3.5 h-3.5 text-[#EAB308]" />
          <span>256-Bit Encrypted Admin Session</span>
        </div>
      </div>
    </div>
  );
}
