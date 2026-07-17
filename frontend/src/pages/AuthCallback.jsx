import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { setCredentials } from '../features/auth/authSlice';
import { useGetMeQuery } from '../features/auth/authApi';
import Loader from '../components/common/Loader';

/**
 * Handle Google OAuth callback redirects.
 * Extracts JWT token from query params and loads user profile info.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('accessToken');

  // Trigger lazy query when token is parsed
  const { data: userProfile, error, isSuccess, isLoading } = useGetMeQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (!token) {
      toast.error('Authentication failed. No token received.');
      navigate('/auth/login', { replace: true });
      return;
    }

    if (isSuccess && userProfile) {
      dispatch(
        setCredentials({
          user: userProfile.data.user,
          accessToken: token,
        })
      );
      toast.success('Successfully logged in with Google!');
      navigate('/feed', { replace: true });
    }

    if (error) {
      toast.error('Failed to retrieve user profile.');
      navigate('/auth/login', { replace: true });
    }
  }, [token, isSuccess, userProfile, error, dispatch, navigate]);

  return <Loader fullPage />;
};

export default AuthCallback;
