import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiFilm } from 'react-icons/fi';
import { useLoginWithEmailMutation, useRequestOtpMutation, useVerifyOtpMutation, useSwitchRoleMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import API_CONFIG from '../../config';

/**
 * Creator-specific Login Page.
 * Auto-selects 'creator' role.
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
    <div className="flex flex-col gap-6 w-full">
      <div className="text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-3 bg-pink-500/10 rounded-full">
          <FiFilm className="text-pink-500" size={14} />
          <span className="text-xs font-bold text-pink-500 uppercase tracking-wider">Creator Login</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-brand-navy">
          Welcome back, Creator
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Manage your portfolio, orders, and content creation services.
        </p>
      </div>

      <div className="flex bg-surface-tertiary p-1 rounded-premium">
        <button onClick={() => { setLoginMode('email'); setOtpSent(false); }}
          className={`flex-1 py-2 text-xs font-bold rounded-premium transition-all ${loginMode === 'email' ? 'bg-surface text-pink-500 shadow-premium' : 'text-text-secondary'}`}>
          Email & Password
        </button>
        <button onClick={() => setLoginMode('otp')}
          className={`flex-1 py-2 text-xs font-bold rounded-premium transition-all ${loginMode === 'otp' ? 'bg-surface text-pink-500 shadow-premium' : 'text-text-secondary'}`}>
          OTP Login
        </button>
      </div>

      {loginMode === 'email' ? (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex flex-col gap-4">
          <Input label="Email Address" placeholder="creator@example.com" error={emailForm.formState.errors.email}
            {...emailForm.register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' } })} />
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold tracking-wide text-brand-navy uppercase">Password</label>
              <Link to="/auth/forgot-password" className="text-xs font-bold text-pink-500 hover:underline">Forgot password?</Link>
            </div>
            <Input type="password" placeholder="••••••••" error={emailForm.formState.errors.password}
              {...emailForm.register('password', { required: 'Password is required' })} />
          </div>
          <Button type="submit" variant="accent" fullWidth isLoading={isEmailLoading} className="mt-2">Sign In as Creator</Button>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="flex flex-col gap-4">
          {!otpSent ? (
            <>
              <Input label="Email or Phone Number" placeholder="creator@example.com or +91XXXXXXXXXX" error={otpForm.formState.errors.identifier}
                {...otpForm.register('identifier', { required: 'Email or Phone is required' })} />
              <Button onClick={handleSendOtp} variant="accent" fullWidth isLoading={isOtpRequestLoading} className="mt-2">Send OTP</Button>
            </>
          ) : (
            <>
              <div className="p-3 bg-pink-500/5 border border-pink-500/10 rounded-premium flex flex-col gap-1 text-center">
                <span className="text-xs font-semibold text-brand-navy">OTP sent to:</span>
                <span className="text-sm font-bold text-pink-500">{otpIdentifier}</span>
                <button type="button" onClick={() => setOtpSent(false)} className="text-xs font-bold text-brand-orange hover:underline mt-1">Change</button>
              </div>
              <Input label="Enter 6-Digit OTP" placeholder="000000" error={otpForm.formState.errors.otp}
                {...otpForm.register('otp', { required: 'OTP is required', minLength: { value: 6, message: 'OTP must be 6 digits' }, maxLength: { value: 6, message: 'OTP must be 6 digits' } })} />
              <Button type="submit" variant="accent" fullWidth isLoading={isOtpVerifyLoading} className="mt-2">Verify & Login</Button>
            </>
          )}
        </form>
      )}

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-border"></div>
        <span className="flex-shrink mx-4 text-xs text-text-tertiary font-bold uppercase tracking-wider">Or continue with</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      <Button onClick={handleGoogleLogin} variant="glass" fullWidth icon={FcGoogle}>Sign in with Google</Button>

      <div className="text-center text-xs font-semibold text-text-secondary mt-4 space-y-2">
        <p>
          New to BizReels?{' '}
          <Link to="/auth/register" className="font-bold text-brand-purple hover:underline">Create Account</Link>
        </p>
        <p>
          Not a creator?{' '}
          <Link to="/auth/customer-login" className="font-bold text-brand-purple hover:underline">Customer Login</Link>
          {' '}·{' '}
          <Link to="/auth/vendor-login" className="font-bold text-brand-orange hover:underline">Vendor Login</Link>
        </p>
      </div>
    </div>
  );
};

export default CreatorLogin;
