import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiShoppingCart, FiArrowRight, FiRotateCw, FiSmartphone } from 'react-icons/fi';
import { useLoginWithEmailMutation, useSendOtpMutation, useVerifyOtpMutation, useSwitchRoleMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';
import Input from '../../components/common/Input';
import RoleQuickSwitcher from '../../components/auth/RoleQuickSwitcher';
import API_CONFIG from '../../config';

/**
 * Vendor-specific Login Page.
 * Styled according to the Warm Editorial Bento-Brutalism design system.
 */
const VendorLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginMode, setLoginMode] = useState('email');
  const [otpSent, setOtpSent] = useState(false);
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpType, setOtpType] = useState('phone');
  const [otpChannel, setOtpChannel] = useState('sms'); // sms | whatsapp
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const [loginEmail, { isLoading: isEmailLoading }] = useLoginWithEmailMutation();
  const [sendOtpMutation, { isLoading: isOtpRequestLoading }] = useSendOtpMutation();
  const [verifyOtpMutation, { isLoading: isOtpVerifyLoading }] = useVerifyOtpMutation();
  const [switchRoleApi] = useSwitchRoleMutation();

  const from = location.state?.from?.pathname;

  const emailForm = useForm({ defaultValues: { email: '', password: '' } });
  const otpForm = useForm({ defaultValues: { identifier: '', otp: '' } });

  const ROLE = 'vendor';

  const handlePostLogin = async (res) => {
    dispatch(setCredentials(res.data));
    const user = res.data?.user || res.data;
    const roles = user?.roles || [];

    // Switch to vendor role if not already active
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
      toast.error('Your account does not have Vendor access. Please register as a vendor first.');
      navigate('/vendor/onboarding', { replace: true });
      return;
    }

    // Check onboarding completion
    if (!user?.vendorProfile?.shopName) {
      toast.success('Welcome! Please complete your vendor setup.');
      navigate('/vendor/onboarding', { replace: true });
      return;
    }

    toast.success('Welcome back, Vendor!');
    let targetPath = '/vendor/dashboard';
    if (from && from.startsWith('/vendor')) {
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

  const handleSendOtp = async (selectedChannel = otpChannel) => {
    if (cooldown > 0) return;
    const identifier = otpForm.getValues('identifier') || otpIdentifier;
    const isEmail = identifier.includes('@');
    const type = isEmail ? 'email' : 'phone';
    if (!identifier) { toast.error('Please enter phone number or email first.'); return; }
    try {
      setOtpType(type);
      setOtpIdentifier(identifier);
      setOtpChannel(selectedChannel);

      const payload = {
        phone: type === 'phone' ? identifier : undefined,
        identifier: type === 'email' ? identifier : undefined,
        identifierType: type,
        channel: type === 'phone' ? selectedChannel : undefined,
        purpose: 'login',
      };

      const res = await sendOtpMutation(payload).unwrap();
      setOtpSent(true);
      setCooldown(res?.data?.cooldownSeconds || 60);
      toast.success(res?.message || `OTP sent via ${selectedChannel.toUpperCase()}!`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send OTP. Please try again.');
    }
  };

  const onOtpSubmit = async (data) => {
    try {
      const res = await verifyOtpMutation({
        phone: otpType === 'phone' ? otpIdentifier : undefined,
        identifier: otpType === 'email' ? otpIdentifier : undefined,
        identifierType: otpType,
        channel: otpType === 'phone' ? otpChannel : undefined,
        purpose: 'login',
        otp: data.otp,
      }).unwrap();

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
          <FiShoppingCart className="text-[#d99a3d]" size={13} />
          <span className="text-[11px] font-bold uppercase tracking-wider">Vendor Portal</span>
        </div>
        <h2 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-[#1a1a1a] uppercase tracking-tight">
          VENDOR LOGIN
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Manage your business listings, customer leads, reels, and orders.
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
          Instant OTP Login
        </button>
      </div>

      {loginMode === 'email' ? (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex flex-col gap-3.5">
          <Input
            label="Email Address"
            placeholder="vendor@example.com"
            error={emailForm.formState.errors.email}
            {...emailForm.register('email', { required: 'Email is required' })}
          />

          <div className="flex flex-col gap-1">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={emailForm.formState.errors.password}
              {...emailForm.register('password', { required: 'Password is required' })}
            />
            <div className="text-right">
              <Link to="/auth/forgot-password" className="text-[11px] font-bold text-[#d99a3d] hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isEmailLoading}
            className="w-full py-3.5 px-4 bg-[#1c1a17] hover:bg-[#2c2824] text-[#d99a3d] text-xs font-extrabold uppercase tracking-wider rounded-full shadow-xs transition-colors border-none cursor-pointer mt-1 flex items-center justify-center gap-2"
          >
            {isEmailLoading ? 'Signing In...' : 'SIGN IN AS VENDOR'}
            <FiArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="flex flex-col gap-3.5">
          {!otpSent ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Select OTP Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpChannel('sms')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      otpChannel === 'sms'
                        ? 'bg-[#1c1a17] text-[#d99a3d] border-[#1c1a17] shadow-xs'
                        : 'bg-white text-slate-600 border-[#e3dccb] hover:bg-slate-50'
                    }`}
                  >
                    <FiSmartphone className="w-3.5 h-3.5" />
                    SMS OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpChannel('whatsapp')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      otpChannel === 'whatsapp'
                        ? 'bg-[#1c1a17] text-[#25D366] border-[#1c1a17] shadow-xs'
                        : 'bg-white text-slate-600 border-[#e3dccb] hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
                    WhatsApp OTP
                  </button>
                </div>
              </div>

              <Input
                label="Mobile Phone Number (India)"
                type="tel"
                placeholder="e.g. 9876543210"
                error={otpForm.formState.errors.identifier}
                {...otpForm.register('identifier', { required: 'Phone number is required' })}
              />

              <button
                type="button"
                onClick={() => handleSendOtp(otpChannel)}
                disabled={isOtpRequestLoading || cooldown > 0}
                className="w-full py-3.5 px-4 bg-[#1c1a17] hover:bg-[#2c2824] text-[#d99a3d] text-xs font-extrabold uppercase tracking-wider rounded-full shadow-xs transition-colors border-none cursor-pointer mt-1 flex items-center justify-center gap-2"
              >
                {isOtpRequestLoading ? 'Sending OTP...' : `SEND OTP VIA ${otpChannel.toUpperCase()}`}
                <FiArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="bg-[#fdfaf3] p-3 rounded-lg border border-[#e3dccb] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Sent to: </span>
                  <span className="text-xs font-bold text-[#d99a3d]">{otpIdentifier} ({otpChannel.toUpperCase()})</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#e3dccb]/60 text-xs">
                  {cooldown > 0 ? (
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <FiRotateCw className="w-3 h-3 animate-spin text-[#d99a3d]" />
                      Resend in <strong className="text-[#d99a3d]">{cooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp(otpChannel)}
                      disabled={isOtpRequestLoading}
                      className="text-xs font-bold text-[#d99a3d] hover:underline cursor-pointer bg-transparent border-none p-0 flex items-center gap-1"
                    >
                      <FiRotateCw className="w-3 h-3" /> Resend Code
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setCooldown(0); }}
                    className="text-xs font-bold text-slate-600 hover:underline cursor-pointer border-none bg-transparent p-0"
                  >
                    Change Phone
                  </button>
                </div>
              </div>

              <Input
                label="Enter 6-Digit Verification Code"
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
                className="w-full py-3.5 px-4 bg-[#1c1a17] hover:bg-[#2c2824] text-[#d99a3d] text-xs font-extrabold uppercase tracking-wider rounded-full shadow-xs transition-colors border-none cursor-pointer mt-1 flex items-center justify-center gap-2"
              >
                {isOtpVerifyLoading ? 'Verifying...' : 'VERIFY & LOGIN'}
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
        className="w-full py-3 px-4 bg-white border border-[#e3dccb] hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-full transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs"
      >
        <FcGoogle className="w-4 h-4" />
        <span>Sign in with Google</span>
      </button>

      <div className="text-center text-xs font-medium text-slate-600 mt-2 space-y-3">
        <p>
          New merchant or business?{' '}
          <Link to="/auth/register?role=vendor" className="font-bold text-[#d99a3d] hover:underline">
            Create Vendor Account
          </Link>
        </p>
        <RoleQuickSwitcher />
      </div>
    </div>
  );
};

export default VendorLogin;
