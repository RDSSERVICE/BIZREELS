import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowRight, FiKey } from 'react-icons/fi';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../../features/auth/authApi';
import Input from '../../components/common/Input';
import RoleQuickSwitcher from '../../components/auth/RoleQuickSwitcher';

/**
 * Premium Forgot Password screen
 * Multi-step flow: Request reset OTP, and verify with new password.
 * Styled according to Warm Editorial Bento-Brutalism system.
 */
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Send OTP | 2: Verify & Reset
  const [emailAddress, setEmailAddress] = useState('');

  const [forgotPassword, { isLoading: isRequestLoading }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetLoading }] = useResetPasswordMutation();

  const requestForm = useForm({ defaultValues: { email: '' } });
  const resetForm = useForm({ defaultValues: { otp: '', newPassword: '', confirmPassword: '' } });

  const onRequestSubmit = async (data) => {
    try {
      const res = await forgotPassword({ email: data.email }).unwrap();
      setEmailAddress(data.email);
      setStep(2);
      toast.success(res?.message || 'Password reset OTP sent to your email.');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to request password reset.');
    }
  };

  const onResetSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      await resetPassword({
        email: emailAddress,
        otp: data.otp,
        newPassword: data.newPassword,
      }).unwrap();

      toast.success('Password updated successfully. Please login.');
      navigate('/auth/login');
    } catch (err) {
      toast.error(err?.data?.message || 'Invalid OTP or expired code.');
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full font-sans text-left">
      <div className="text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 bg-[#d99a3d]/15 text-[#1a1a1a] rounded-full border border-[#d99a3d]/30">
          <FiKey className="text-[#d99a3d]" size={13} />
          <span className="text-[11px] font-bold uppercase tracking-wider">Account Recovery</span>
        </div>
        <h2 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-[#1a1a1a] uppercase tracking-tight">
          RESET PASSWORD
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          {step === 1
            ? 'Enter your registered email to receive a secure OTP code.'
            : 'Enter the code and set your new account password.'}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            placeholder="name@example.com"
            error={requestForm.formState.errors.email}
            {...requestForm.register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
            })}
          />

          <button
            type="submit"
            disabled={isRequestLoading}
            className="w-full py-3.5 px-4 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] text-xs font-extrabold uppercase tracking-wider rounded-full shadow-xs transition-colors border-none cursor-pointer mt-1 flex items-center justify-center gap-2"
          >
            {isRequestLoading ? 'Sending Code...' : 'SEND RESET OTP'}
            <FiArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="flex flex-col gap-4">
          <div className="p-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl flex flex-col gap-1 text-center">
            <span className="text-xs font-semibold text-slate-700">OTP sent to:</span>
            <span className="text-xs font-bold text-[#d99a3d]">{emailAddress}</span>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-bold text-slate-600 hover:underline mt-1 cursor-pointer border-none bg-transparent"
            >
              Change Email
            </button>
          </div>

          <Input
            label="Verification OTP"
            placeholder="000000"
            error={resetForm.formState.errors.otp}
            {...resetForm.register('otp', {
              required: 'OTP code is required',
              minLength: { value: 6, message: 'OTP must be 6 digits' },
              maxLength: { value: 6, message: 'OTP must be 6 digits' },
            })}
          />

          <Input
            type="password"
            label="New Password"
            placeholder="••••••••"
            error={resetForm.formState.errors.newPassword}
            {...resetForm.register('newPassword', {
              required: 'New password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters.' },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
                message: 'Must include uppercase, lowercase, number and special char.'
              }
            })}
          />

          <Input
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            error={resetForm.formState.errors.confirmPassword}
            {...resetForm.register('confirmPassword', {
              required: 'Confirm password is required',
            })}
          />

          <button
            type="submit"
            disabled={isResetLoading}
            className="w-full py-3.5 px-4 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] text-xs font-extrabold uppercase tracking-wider rounded-full shadow-xs transition-colors border-none cursor-pointer mt-1 flex items-center justify-center gap-2"
          >
            {isResetLoading ? 'Updating Password...' : 'UPDATE PASSWORD'}
            <FiArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      <p className="text-center text-xs font-medium text-slate-600 mt-1">
        Back to{' '}
        <Link to="/auth/login" className="font-bold text-[#d99a3d] hover:underline">
          Sign In
        </Link>
      </p>

      <RoleQuickSwitcher />
    </div>
  );
};

export default ForgotPassword;
