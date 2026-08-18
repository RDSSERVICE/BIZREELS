import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiVideo, FiArrowRight } from 'react-icons/fi';
import { useLoginWithEmailMutation, useRequestOtpMutation, useVerifyOtpMutation, useSwitchRoleMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';
import Input from '../../components/common/Input';
import RoleQuickSwitcher from '../../components/auth/RoleQuickSwitcher';
import API_CONFIG from '../../config';

/**
 * Creator-specific Login Page.
 * Styled according to the Warm Editorial Bento-Brutalism design system.
 */
const CreatorLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginMode, setLoginMode] = useState('email');
  const [otpSent, setOtpSent] = useState(false);
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpType, setOtpType] = useState('email');

  const [loginEmail, { isLoading: isEmailLoading }] = useLoginWithEmailMutation();
  const [requestOtp, { isLoading: isOtpRequestLoading }] = useRequestOtpMutation();
  const [verifyOtp, { isLoading: isOtpVerifyLoading }] = useVerifyOtpMutation();
  const [switchRoleApi] = useSwitchRoleMutation();

  const from = location.state?.from?.pathname;

  const emailForm = useForm({ defaultValues: { email: '', password: '' } });
  const otpForm = useForm({ defaultValues: { identifier: '', otp: '' } });

  const ROLE = 'creator';

  const handlePostLogin = async (res) => {
    dispatch(setCredentials(res.data));
    const user = res.data?.user || res.data;
    const roles = user?.roles || [];

    // Switch to creator role if not already active
    if (roles.includes(ROLE) && user?.activeRole !== ROLE) {
      try {
        const switchRes = await switchRoleApi({ role: ROLE }).unwrap();
        const switchedUser = switchRes?.user || switchRes?.data?.user;
        if (switchedUser) {
          dispatch(setCredentials({ user: switchedUser, accessToken: res.data?.accessToken }));
        }
      } catch { /* continue */ }
    }

    if (!roles.includes(ROLE)) {
      toast.error('Your account does not have Creator access. Please register as a creator first.');
      navigate('/creator/onboarding', { replace: true });
      return;
    }

    // Check onboarding completion
    if (!user?.creatorProfile?.displayName) {
      toast.success('Welcome! Please complete your creator setup.');
      navigate('/creator/onboarding', { replace: true });
      return;
    }

    toast.success('Welcome back, Creator!');
    let targetPath = '/creator/dashboard';
    if (from && from.startsWith('/creator')) {
      targetPath = from;
    }
    navigate(targetPath, { replace: true });
  };

  const onEmailSubmit = async (data) => {
    try {
      const res = await loginEmail({ email: data.email, password: data.password, role: ROLE }).unwrap();
      await handlePostLogin(res);
    } catch (err) {
      toast.error(err?.data?.message || 'Login failed. Please check credentials.');
    }
  };

  const handleSendOtp = async () => {
    const identifier = otpForm.getValues('identifier');
    const isEmail = identifier.includes('@');
    const type = isEmail ? 'email' : 'phone';
    if (!identifier) { toast.error('Please enter email or phone number first.'); return; }
    try {
      setOtpType(type);
      setOtpIdentifier(identifier);
      await requestOtp({ identifier, identifierType: type, purpose: 'login' }).unwrap();
      setOtpSent(true);
      toast.success('OTP sent successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send OTP.');
    }
  };

  const onOtpSubmit = async (data) => {
    try {
      const res = await verifyOtp({ identifier: otpIdentifier, identifierType: otpType, otp: data.otp }).unwrap();
      await handlePostLogin(res);
    } catch (err) {
      toast.error(err?.data?.message || 'Invalid or expired OTP.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_CONFIG.BASE_URL}/auth/google`;
  };

  return (
    <div className="flex flex-col gap-5 w-full font-sans text-left">
      <div className="text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 bg-[#d99a3d]/15 text-[#1a1a1a] rounded-full border border-[#d99a3d]/30">
          <FiVideo className="text-[#d99a3d]" size={13} />
          <span className="text-[11px] font-bold uppercase tracking-wider">Creator Portal</span>
        </div>
        <h2 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-[#1a1a1a] uppercase tracking-tight">
          CREATOR LOGIN
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Manage your portfolio, content orders, reels, and marketplace earnings.
        </p>
      </div>

      {/* Tabs */}
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

      {loginMode === 'email' ? (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            placeholder="creator@example.com"
            error={emailForm.formState.errors.email}
            {...emailForm.register('email', { required: 'Email is required' })}
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold tracking-wide text-slate-700 uppercase">Password</label>
              <Link to="/auth/forgot-password" className="text-xs font-bold text-[#d99a3d] hover:underline">Forgot password?</Link>
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
            className="w-full py-3 px-4 bg-[#1c1a17] hover:bg-[#2e2a24] text-[#d99a3d] text-xs font-extrabold uppercase tracking-wider rounded-md transition-colors border-none cursor-pointer mt-1 flex items-center justify-center gap-2 shadow-xs"
          >
            {isEmailLoading ? 'Signing In...' : 'Sign In as Creator'}
            <FiArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="flex flex-col gap-4">
          {!otpSent ? (
            <>
              <Input
                label="Email or Phone Number"
                placeholder="creator@example.com or +91XXXXXXXXXX"
                error={otpForm.formState.errors.identifier}
                {...otpForm.register('identifier', { required: 'Email or Phone is required' })}
              />

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isOtpRequestLoading}
                className="w-full py-3 px-4 bg-[#1c1a17] hover:bg-[#2e2a24] text-[#d99a3d] text-xs font-extrabold uppercase tracking-wider rounded-md transition-colors border-none cursor-pointer mt-1 flex items-center justify-center gap-2 shadow-xs"
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
                {...otpForm.register('otp', { required: 'OTP is required' })}
              />

              <button
                type="submit"
                disabled={isOtpVerifyLoading}
                className="w-full py-3 px-4 bg-[#1c1a17] hover:bg-[#2e2a24] text-[#d99a3d] text-xs font-extrabold uppercase tracking-wider rounded-md transition-colors border-none cursor-pointer mt-1 flex items-center justify-center gap-2 shadow-xs"
              >
                {isOtpVerifyLoading ? 'Verifying...' : 'Verify & Login'}
                <FiArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </form>
      )}

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-[#e3dccb]"></div>
        <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Or continue with
        </span>
        <div className="flex-grow border-t border-[#e3dccb]"></div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full py-2.5 px-4 bg-white border border-[#e3dccb] hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
      >
        <FcGoogle className="w-4 h-4" />
        <span>Sign in with Google</span>
      </button>

      <RoleQuickSwitcher />
    </div>
  );
};

export default CreatorLogin;
