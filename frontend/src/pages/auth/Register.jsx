import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiArrowRight, FiArrowLeft, FiShoppingBag, FiShoppingCart, FiVideo } from 'react-icons/fi';
import { useRegisterMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';
import { getRoleDashboard } from '../../lib/roleNav';
import Input from '../../components/common/Input';
import API_CONFIG from '../../config';

/**
 * Premium Registration Page supporting standard email registration and Google OAuth.
 * Designed with a streamlined 2-column grid for standard screen heights and Back to Website navigation.
 */
const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [registerUser, { isLoading }] = useRegisterMutation();

  const refCodeFromUrl = searchParams.get('ref') || '';
  const rawRoleParam = (searchParams.get('role') || '').toLowerCase().trim();
  const initialRole = ['customer', 'vendor', 'creator'].includes(rawRoleParam) ? rawRoleParam : 'customer';

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '', role: initialRole, referralCode: refCodeFromUrl }
  });

  useEffect(() => {
    if (refCodeFromUrl) {
      setValue('referralCode', refCodeFromUrl);
    }
  }, [refCodeFromUrl, setValue]);

  useEffect(() => {
    if (rawRoleParam && ['customer', 'vendor', 'creator'].includes(rawRoleParam)) {
      setValue('role', rawRoleParam, { shouldValidate: true });
    }
  }, [rawRoleParam, setValue]);

  const password = watch('password');
  const selectedRole = watch('role') || 'customer';

  const onSubmit = async (data) => {
    try {
      // Format phone: prepend +91 if user entered 10 digits
      let phone = (data.phone || '').replace(/\s+/g, '');
      if (phone && !phone.startsWith('+')) {
        phone = `+91${phone}`;
      }

      const res = await registerUser({
        name: data.name,
        email: data.email,
        phone: phone || undefined,
        password: data.password,
        role: data.role,
        referralCode: data.referralCode
      }).unwrap();

      dispatch(setCredentials(res.data));
      toast.success('Registration successful! Welcome to BizReels.');
      const user = res.data?.user || res.data;
      const activeRole = data.role || user?.activeRole || user?.current_role || 'customer';
      let targetPath = getRoleDashboard(activeRole);
      if (activeRole === 'customer') {
        targetPath = '/customer/choose-interests';
      } else if (activeRole === 'vendor' && !user?.vendorProfile?.shopName) {
        targetPath = '/vendor/profile';
      } else if (activeRole === 'creator' && !user?.creatorProfile?.displayName) {
        targetPath = '/creator/onboarding';
      }
      navigate(targetPath, { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || 'Registration failed. Please check details.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_CONFIG.BASE_URL}/auth/google`;
  };

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-in font-sans">
      {/* Top Header: Back to Website + Step Indicator */}
      <div className="flex items-center justify-between pb-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500 hover:text-[#1a1a1a] transition-colors group"
        >
          <FiArrowLeft className="w-3.5 h-3.5 text-[#d99a3d] transition-transform group-hover:-translate-x-1" />
          <span>Back to Website</span>
        </Link>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          New Account
        </span>
      </div>

      {/* Title */}
      <div className="text-left">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1a1a1a]">
          Create Account
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Join BizReels to discover local deals, hire creators, or grow your business.
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-extrabold tracking-wider text-slate-700 uppercase">
          I Want to Join As
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f5efe4] rounded-xl border border-[#e3dccb]">
          {[
            { value: 'customer', label: 'Customer', icon: FiShoppingBag },
            { value: 'vendor', label: 'Vendor', icon: FiShoppingCart },
            { value: 'creator', label: 'Creator', icon: FiVideo },
          ].map(({ value, label, icon: Icon }) => {
            const isSelected = selectedRole === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setValue('role', value, { shouldValidate: true });
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('role', value);
                  navigate(`?${newParams.toString()}`, { replace: true });
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#1c1a17] text-[#d99a3d] border-[#1c1a17] shadow-2xs'
                    : 'bg-transparent text-slate-700 border-transparent hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-[#d99a3d]' : 'text-slate-600'}`} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register('role', { required: 'Please select a role' })} />
        {errors.role && (
          <span className="text-xs font-medium text-red-500 pl-2">{errors.role.message}</span>
        )}
      </div>

      {/* Registration Form in Standard 2-Column Grid */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Row 1: Name & Email */}
          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            error={errors.name}
            {...register('name', {
              required: 'Name is required.',
              minLength: { value: 2, message: 'At least 2 characters.' }
            })}
          />

          <Input
            type="email"
            label="Email Address"
            placeholder="name@example.com"
            error={errors.email}
            {...register('email', {
              required: 'Email is required.',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address.' }
            })}
          />

          {/* Row 2: Mobile Number & Referral Code */}
          <div className="flex flex-col w-full gap-1.5">
            <label className="text-[11px] font-extrabold tracking-wider text-slate-700 uppercase">
              Mobile Number <span className="text-[10px] font-normal text-slate-400 lowercase">(optional)</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-extrabold text-slate-500 select-none border-r border-[#e3dccb] pr-2.5">
                +91
              </span>
              <input
                type="tel"
                placeholder="9876543210"
                {...register('phone', {
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Enter a valid 10-digit Indian mobile number.'
                  }
                })}
                className={`w-full pl-14 pr-4 py-3 text-xs font-medium transition-all duration-200 border border-[#e3dccb] rounded-full bg-white text-slate-800 focus:outline-none focus:border-[#d99a3d] focus:ring-2 focus:ring-[#d99a3d]/20 placeholder:text-slate-400 shadow-2xs ${
                  errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'hover:border-slate-400'
                }`}
                maxLength={10}
              />
            </div>
            {errors.phone && (
              <span className="text-xs font-medium text-red-500 pl-3">{errors.phone.message}</span>
            )}
          </div>

          <Input
            label="Referral Code (Optional)"
            placeholder="e.g. BIZ100"
            error={errors.referralCode}
            {...register('referralCode')}
          />

          {/* Row 3: Password & Confirm Password */}
          <Input
            type="password"
            label="Password"
            placeholder="Min. 8 characters"
            error={errors.password}
            {...register('password', {
              required: 'Password is required.',
              minLength: { value: 8, message: 'Min. 8 characters.' },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
                message: 'Include uppercase, lowercase, digit & symbol.'
              }
            })}
          />

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Re-enter password"
            error={errors.confirmPassword}
            {...register('confirmPassword', {
              required: 'Confirm password is required.',
              validate: value => value === password || 'Passwords do not match.'
            })}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] text-xs font-extrabold uppercase tracking-wider rounded-full shadow-xs transition-colors border-none cursor-pointer mt-1.5 flex items-center justify-center gap-2"
        >
          {isLoading ? 'Creating Account...' : 'CREATE ACCOUNT'}
          <FiArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Social Divider */}
      <div className="relative flex py-0.5 items-center">
        <div className="flex-grow border-t border-[#e3dccb]"></div>
        <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
          Or sign up with
        </span>
        <div className="flex-grow border-t border-[#e3dccb]"></div>
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full py-2.5 px-4 bg-white border border-[#e3dccb] hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-full transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs"
      >
        <FcGoogle className="w-4 h-4" />
        <span>Sign up with Google</span>
      </button>

      {/* Sign In Redirect Link */}
      <p className="text-center text-xs font-medium text-slate-600">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-bold text-[#d99a3d] hover:underline">
          Sign In
        </Link>
      </p>

      {/* Compact Quick Portal Navigation */}
      <div className="pt-2 border-t border-[#f0eae1] flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
        <span>Direct sign in:</span>
        <Link to="/auth/customer-login" className="font-bold text-slate-700 hover:text-[#d99a3d] transition-colors">Customer</Link>
        <span>•</span>
        <Link to="/auth/vendor-login" className="font-bold text-slate-700 hover:text-[#d99a3d] transition-colors">Vendor</Link>
        <span>•</span>
        <Link to="/auth/creator-login" className="font-bold text-slate-700 hover:text-[#d99a3d] transition-colors">Creator</Link>
      </div>
    </div>
  );
};

export default Register;

