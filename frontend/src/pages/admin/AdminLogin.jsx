import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { setCredentials } from '../../features/auth/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

/**
 * Premium Admin Login Page matching the standard login aesthetics
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { applyAuthResponse } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

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

      // Map credentials to AuthContext format (expects snake_case for token set)
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

      toast.success('Access granted. Welcome to Admin Control!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed. Please check admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-scale-in">
      {/* Title Header */}
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-black tracking-tight text-brand-navy">
          Admin Control Center
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Authorized personnel only. Please sign in with admin credentials.
        </p>
      </div>

      {/* Form Segment */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Admin Email Address"
          placeholder="admin@bidzord.com"
          error={errors.email}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' }
          })}
        />

        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          error={errors.password}
          {...register('password', {
            required: 'Password is required'
          })}
        />

        <Button type="submit" variant="primary" fullWidth isLoading={isLoading} className="mt-2">
          Authenticate & Enter
        </Button>
      </form>
    </div>
  );
}
