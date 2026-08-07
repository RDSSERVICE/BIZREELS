import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { setCredentials, tokenRefreshed } from '../../features/auth/authSlice';
import { useGetMeQuery } from '../../features/auth/authApi';
import { tokenStore } from '../../lib/api';
import { getRoleDashboard } from '../../lib/roleNav';
import Loader from '../../components/common/Loader';

/**
 * Handle Google OAuth callback redirects.
 * Extracts JWT token from query params and loads user profile info.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('accessToken') || searchParams.get('token') || searchParams.get('access_token');
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    if (token) {
      dispatch(tokenRefreshed(token));
      setTokenReady(true);
    } else {
      toast.error('Authentication failed. No token received.');
      navigate('/auth/login', { replace: true });
    }
  }, [token, dispatch, navigate]);

  // Trigger lazy query only after token has been set in tokenStore
  const { data: userProfile, error, isSuccess } = useGetMeQuery(undefined, {
    skip: !tokenReady,
  });

  useEffect(() => {
    if (tokenReady && isSuccess && userProfile) {
      const user = userProfile?.data?.user || userProfile?.user;
      dispatch(
        setCredentials({
          user,
          accessToken: token,
        })
      );
      toast.success('Successfully logged in with Google!');
      const activeRole = user?.activeRole || user?.current_role || (user?.roles || [])[0] || 'customer';
      let targetPath = getRoleDashboard(activeRole);
      if (activeRole === 'vendor' && !user?.vendorProfile?.shopName) {
        targetPath = '/vendor/profile';
      } else if (activeRole === 'creator' && !user?.creatorProfile?.displayName) {
        targetPath = '/creator/profile';
      }
      navigate(targetPath, { replace: true });
    }

    if (tokenReady && error) {
      toast.error('Failed to retrieve user profile.');
      navigate('/auth/login', { replace: true });
    }
  }, [tokenReady, isSuccess, userProfile, error, token, dispatch, navigate]);

  return <Loader fullPage />;
};

export default AuthCallback;
