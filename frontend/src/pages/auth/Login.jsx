import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiMail, FiLock, FiPhone, FiSmartphone } from 'react-icons/fi';
import { useLoginWithEmailMutation, useRequestOtpMutation, useVerifyOtpMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import API_CONFIG from '../../config';

/**
 * Premium Login Page supporting Email+Password, OTP, and Google OAuth.
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

  const from = location.state?.from?.pathname || '/feed';

  // ── Form Handlers ──────────────────────────────────────────
  const emailForm = useForm({ defaultValues: { email: '', password: '', role: 'customer' } });
  const otpForm = useForm({ defaultValues: { identifier: '', otp: '', identifierType: 'email' } });

  const onEmailSubmit = async (data) => {
    try {
      const res = await loginEmail({
        email: data.email,
        password: data.password,
        role: data.role
      }).unwrap();
      dispatch(setCredentials(res.data));
      toast.success('Welcome back to BizReels!');
      const roles = res.data?.user?.roles || [];
      if (roles.includes('admin') || res.data?.activeRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
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
      const roles = res.data?.user?.roles || [];
      if (roles.includes('admin') || res.data?.activeRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Invalid or expired OTP.');
    }
  };


  const handleGoogleLogin = () => {
    window.location.href = `${API_CONFIG.BASE_URL}/auth/google`;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title Header */}
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-black tracking-tight text-brand-navy">
          Welcome back
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Access your marketplace and watch trending content.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-surface-tertiary p-1 rounded-premium">
        <button
          onClick={() => { setLoginMode('email'); setOtpSent(false); }}
          className={`flex-1 py-2 text-xs font-bold rounded-premium transition-all
            ${loginMode === 'email' ? 'bg-surface text-brand-purple shadow-premium' : 'text-text-secondary'}
          `}
        >
          Email & Password
        </button>
        <button
          onClick={() => setLoginMode('otp')}
          className={`flex-1 py-2 text-xs font-bold rounded-premium transition-all
            ${loginMode === 'otp' ? 'bg-surface text-brand-purple shadow-premium' : 'text-text-secondary'}
          `}
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
              <label className="text-xs font-semibold tracking-wide text-brand-navy uppercase">
                Password
              </label>
              <Link to="/auth/forgot-password" className="text-xs font-bold text-brand-purple hover:underline">
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-brand-navy uppercase">
              Login as Role
            </label>
            <select
              {...emailForm.register('role', { required: 'Please select a role' })}
              className="w-full h-12 px-4 rounded-xl border border-border bg-white text-text-primary text-sm font-semibold outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all cursor-pointer shadow-sm"
            >
              <option value="customer">Customer / Buyer (Default)</option>
              <option value="creator">Creator / Content Producer</option>
            </select>
          </div>

          <Button type="submit" variant="primary" fullWidth isLoading={isEmailLoading} className="mt-2">
            Sign In
          </Button>
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
              <Button
                onClick={handleSendOtp}
                variant="primary"
                fullWidth
                isLoading={isOtpRequestLoading}
                className="mt-2"
              >
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="p-3 bg-brand-purple/5 border border-brand-purple/10 rounded-premium flex flex-col gap-1 text-center">
                <span className="text-xs font-semibold text-brand-navy">OTP sent to:</span>
                <span className="text-sm font-bold text-brand-purple">{otpIdentifier}</span>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs font-bold text-brand-orange hover:underline mt-1"
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

              <Button type="submit" variant="primary" fullWidth isLoading={isOtpVerifyLoading} className="mt-2">
                Verify & Login
              </Button>
            </>
          )}
        </form>
      )}

      {/* Social login divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-border"></div>
        <span className="flex-shrink mx-4 text-xs text-text-tertiary font-bold uppercase tracking-wider">
          Or continue with
        </span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      {/* Google Login Button */}
      <Button
        onClick={handleGoogleLogin}
        variant="glass"
        fullWidth
        icon={FcGoogle}
      >
        Sign in with Google
      </Button>

      {/* Footer Nav */}
      <p className="text-center text-xs font-semibold text-text-secondary mt-4">
        New to BizReels?{' '}
        <Link to="/auth/register" className="font-bold text-brand-purple hover:underline">
          Create Account
        </Link>
      </p>
    </div>
  );
};

export default Login;
