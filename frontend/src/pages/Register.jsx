import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { useRegisterMutation } from '../features/auth/authApi';
import { setCredentials } from '../features/auth/authSlice';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import API_CONFIG from '../config';

/**
 * Premium Registration Page supporting standard email registration and Google OAuth.
 */
const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterMutation();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      const res = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password
      }).unwrap();

      dispatch(setCredentials(res.data));
      toast.success('Registration successful! Welcome to BizReels.');
      navigate('/feed');
    } catch (err) {
      toast.error(err?.data?.message || 'Registration failed. Please check details.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_CONFIG.BASE_URL}/auth/google`;
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-black tracking-tight text-brand-navy">
          Create Account
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Join BizReels and access India's best local marketplace.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          placeholder="John Doe"
          error={errors.name}
          {...register('name', {
            required: 'Name is required.',
            minLength: { value: 2, message: 'Name must be at least 2 characters.' }
          })}
        />

        <Input
          label="Email Address"
          placeholder="name@example.com"
          error={errors.email}
          {...register('email', {
            required: 'Email is required.',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address.' }
          })}
        />

        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          error={errors.password}
          {...register('password', {
            required: 'Password is required.',
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
          error={errors.confirmPassword}
          {...register('confirmPassword', {
            required: 'Confirm password is required.',
            validate: value => value === password || 'Passwords do not match.'
          })}
        />

        <Button type="submit" variant="primary" fullWidth isLoading={isLoading} className="mt-2">
          Sign Up
        </Button>
      </form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-border"></div>
        <span className="flex-shrink mx-4 text-xs text-text-tertiary font-bold uppercase tracking-wider">
          Or sign up with
        </span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      <Button
        onClick={handleGoogleLogin}
        variant="glass"
        fullWidth
        icon={FcGoogle}
      >
        Sign up with Google
      </Button>

      <p className="text-center text-xs font-semibold text-text-secondary mt-4">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-bold text-brand-purple hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default Register;
