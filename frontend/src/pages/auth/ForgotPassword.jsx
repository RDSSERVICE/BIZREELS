import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../../features/auth/authApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

/**
 * Premium Forgot Password screen
 * Multi-step flow: Request reset OTP, and verify with new password.
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
      await forgotPassword({ email: data.email }).unwrap();
      setEmailAddress(data.email);
      setStep(2);
      toast.success('If an account exists, a reset OTP has been sent.');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to request password reset.');
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
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-black tracking-tight text-brand-navy">
          Reset Password
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {step === 1
            ? 'Enter your email to receive a secure OTP code.'
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

          <Button type="submit" variant="primary" fullWidth isLoading={isRequestLoading} className="mt-2">
            Send Reset OTP
          </Button>
        </form>
      ) : (
        <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="flex flex-col gap-4">
          <div className="p-3 bg-brand-purple/5 border border-brand-purple/10 rounded-premium text-center">
            <span className="text-xs font-semibold text-brand-navy">OTP sent to:</span>
            <span className="text-sm font-bold text-brand-purple block">{emailAddress}</span>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-bold text-brand-orange hover:underline mt-1"
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

          <Button type="submit" variant="primary" fullWidth isLoading={isResetLoading} className="mt-2">
            Update Password
          </Button>
        </form>
      )}

      <p className="text-center text-xs font-semibold text-text-secondary">
        Back to{' '}
        <Link to="/auth/login" className="font-bold text-brand-purple hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
