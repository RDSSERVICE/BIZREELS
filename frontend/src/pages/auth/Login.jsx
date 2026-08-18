import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiMail, FiLock, FiPhone, FiSmartphone, FiShoppingBag, FiShoppingCart, FiFilm, FiArrowRight } from 'react-icons/fi';
import { useLoginWithEmailMutation, useRequestOtpMutation, useVerifyOtpMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';
import { getRoleDashboard, getPostLoginDestination } from '../../lib/roleNav';
import Input from '../../components/common/Input';
import RoleQuickSwitcher from '../../components/auth/RoleQuickSwitcher';
import API_CONFIG from '../../config';

/**
 * Login Page supporting Email+Password, OTP, and Google OAuth.
 * Styled in Warm Editorial Bento-Brutalism format.
 */
const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loginMode, setLoginMode] = useState('email'); // email | otp
  const [otpSent, setOtpSent] = useState(false);
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpType, setOtpType] = useState('email'); // email | phone

  const [loginEmail, { isLoading: isEmailLoading }] = useLoginWithEmailMutation();
  const [requestOtp, { isLoading: isOtpRequestLoading }] = useRequestOtpMutation();
  const [verifyOtp, { isLoading: isOtpVerifyLoading }] = useVerifyOtpMutation();

  const from = location.state?.from?.pathname;

  // ── Form Handlers ──────────────────────────────────────────
  const emailForm = useForm({ defaultValues: { email: '', password: '' } });
  const otpForm = useForm({ defaultValues: { identifier: '', otp: '', identifierType: 'email' } });

  const onEmailSubmit = async (data) => {
    try {
      const res = await loginEmail({
        email: data.email,
        password: data.password
      }).unwrap();
      dispatch(setCredentials(res.data));
      toast.success('Welcome back to BizReels!');
      const user = res.data?.user || res.data;
      const activeRole = user?.activeRole || user?.current_role || 'customer';
      const roles = user?.roles || [];
      if (roles.includes('admin') || activeRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        let targetPath = getPostLoginDestination(user, activeRole);
        if (from && from !== '/feed' && from !== '/auth/login') {
          if (activeRole === 'customer' && !from.startsWith('/vendor') && !from.startsWith('/creator')) {
            targetPath = from;
          } else if (from.startsWith(`/${activeRole}`)) {
            targetPath = from;
          }
        }
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Login failed. Please check credentials.');
    }
  };

  const handleSendOtp = async () => {
    const identifier = otpForm.getValues('identifier');
    const isEmail = identifier.includes('@');
    const type = isEmail ? 'email' : 'phone';

    if (!identifier) {
      toast.error('Please enter email or phone number first.');
      return;
    }

    try {
      setOtpType(type);
      setOtpIdentifier(identifier);
      await requestOtp({
        identifier,
        identifierType: type,
        purpose: 'login',
      }).unwrap();

      setOtpSent(true);
      toast.success('OTP sent successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send OTP.');
    }
  };

  const onOtpSubmit = async (data) => {
    try {
      const res = await verifyOtp({
        identifier: otpIdentifier,
        identifierType: otpType,
        otp: data.otp,
      }).unwrap();

      dispatch(setCredentials(res.data));
      toast.success('Welcome back to BizReels!');
      const user = res.data?.user || res.data;
      const activeRole = user?.activeRole || user?.current_role || 'customer';

      const roles = user?.roles || [];
      if (roles.includes('admin') || activeRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        let targetPath = getPostLoginDestination(user, activeRole);
        if (from && from !== '/feed' && from !== '/auth/login') {
          if (activeRole === 'customer' && !from.startsWith('/vendor') && !from.startsWith('/creator')) {
            targetPath = from;
          } else if (from.startsWith(`/${activeRole}`)) {
            targetPath = from;
          }
        }
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Invalid or expired OTP.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_CONFIG.BASE_URL}/auth/google`;
  };

  return (
    <div className="flex flex-col gap-5 w-full font-sans">
      {/* Title Header */}
      <div className="text-center md:text-left">
        <h2 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-[#1a1a1a] uppercase tracking-tight">
          WELCOME BACK
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Access your marketplace dashboard and watch trending content.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-[#f8f4ec] p-1 rounded-md border border-[#e3dccb]">
        <button
          type="button"
          onClick={() => { setLoginMode('email'); setOtpSent(false); }}
          className={`flex-1 py-2 text-xs font-bold rounded transition-all cursor-pointer border-none ${
            loginMode === 'email' ? 'bg-[#1c1a17] text-[#d99a3d] shadow-xs' : 'text-slate-600 bg-transparent'
          }`}
        >
          Email &amp; Password
        </button>
        <button
          type="button"
          onClick={() => setLoginMode('otp')}
          className={`flex-1 py-2 text-xs font-bold rounded transition-all cursor-pointer border-none ${
            loginMode === 'otp' ? 'bg-[#1c1a17] text-[#d99a3d] shadow-xs' : 'text-slate-600 bg-transparent'
          }`}
        >
          One-Time Password (OTP)
        </button>
      </div>

      {/* Forms Segment */}
      {loginMode === 'email' ? (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            placeholder="name@example.com"
            error={emailForm.formState.errors.email}
            {...emailForm.register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
            })}
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold tracking-wide text-slate-700 uppercase">
                Password
              </label>
              <Link to="/auth/forgot-password" className="text-xs font-bold text-[#d99a3d] hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              error={emailForm.formState.errors.password}
              {...emailForm.register('password', { required: 'Password is required' })}
            />
          </div>

          <button
            type="submit"
            disabled={isEmailLoading}
            className="w-full py-3 px-4 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] text-xs font-extrabold uppercase tracking-wider rounded-md transition-colors border-none cursor-pointer mt-1 flex items-center justify-center gap-2"
          >
            {isEmailLoading ? 'Signing In...' : 'Sign In'}
            <FiArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="flex flex-col gap-4">
          {!otpSent ? (
            <>
              <Input
                label="Email or Phone Number"
                placeholder="name@example.com or +91XXXXXXXXXX"
                error={otpForm.formState.errors.identifier}
                {...otpForm.register('identifier', { required: 'Email or Phone is required' })}
              />

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isOtpRequestLoading}
                className="w-full py-3 px-4 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] text-xs font-extrabold uppercase tracking-wider rounded-md transition-colors border-none cursor-pointer mt-1 flex items-center justify-center gap-2"
              >
                {isOtpRequestLoading ? 'Sending OTP...' : 'Send OTP'}
                <FiArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="p-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-md flex flex-col gap-1 text-center">
                <span className="text-xs font-semibold text-slate-700">OTP sent to:</span>
                <span className="text-xs font-bold text-[#d99a3d]">{otpIdentifier}</span>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs font-bold text-slate-600 hover:underline mt-1 cursor-pointer border-none bg-transparent"
                >
                  Change Email/Phone
                </button>
              </div>

              <Input
                label="Enter 6-Digit OTP"
                placeholder="000000"
                error={otpForm.formState.errors.otp}
                {...otpForm.register('otp', {
                  required: 'OTP is required',
                  minLength: { value: 6, message: 'OTP must be 6 digits' },
                  maxLength: { value: 6, message: 'OTP must be 6 digits' },
                })}
              />

              <button
                type="submit"
                disabled={isOtpVerifyLoading}
                className="w-full py-3 px-4 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] text-xs font-extrabold uppercase tracking-wider rounded-md transition-colors border-none cursor-pointer mt-1 flex items-center justify-center gap-2"
              >
                {isOtpVerifyLoading ? 'Verifying...' : 'Verify & Login'}
                <FiArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </form>
      )}

      {/* Social login divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-[#e3dccb]"></div>
        <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Or continue with
        </span>
        <div className="flex-grow border-t border-[#e3dccb]"></div>
      </div>

      {/* Google Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full py-2.5 px-4 bg-white border border-[#e3dccb] hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
      >
        <FcGoogle className="w-4 h-4" />
        <span>Sign in with Google</span>
      </button>

      {/* Footer Nav */}
      <div className="text-center text-xs font-medium text-slate-600 mt-2 space-y-3">
        <p>
          New to BizReels?{' '}
          <Link to="/auth/register" className="font-bold text-[#d99a3d] hover:underline">
            Create Account
          </Link>
        </p>
        
      <RoleQuickSwitcher />
      </div>
    </div>
  );
};

export default Login;
