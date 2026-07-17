import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { useGetMeQuery } from './features/auth/authApi';
import { setCredentials, logout, setLoading, selectAuthLoading } from './features/auth/authSlice';
import AppRoutes from './routes';
import Loader from './components/common/Loader';

/**
 * Root Application Component
 * Performs initial silent login verification on mount.
 */
function App() {
  const dispatch = useDispatch();
  const isAuthLoading = useSelector(selectAuthLoading);

  // Trigger base profile query on mount to check cookie session
  const { data: profileRes, error, isSuccess, isLoading } = useGetMeQuery(undefined, {
    retryOnMountOrArgChange: false,
    refetchOnFocus: false
  });

  useEffect(() => {
    // If request is fetching, keep loading true
    if (isLoading) {
      dispatch(setLoading(true));
      return;
    }

    if (isSuccess && profileRes) {
      // Session exists, populate credentials (silent sign-in)
      dispatch(
        setCredentials({
          user: profileRes.data.user,
          accessToken: null, // access token is handled via HttpOnly cookie fallback or fetched during rotation
        })
      );
    } else if (error) {
      // No active session cookie or invalid, clear auth state
      dispatch(logout());
    }
  }, [isLoading, isSuccess, profileRes, error, dispatch]);

  if (isAuthLoading) {
    return <Loader fullPage />;
  }

  return (
    <BrowserRouter>
      {/* Toast Notification Provider */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass font-sans text-xs font-semibold text-brand-navy border border-white/50 shadow-premium',
          duration: 4000,
          style: {
            borderRadius: '1rem',
            background: 'rgba(255, 255, 255, 0.8)',
            color: '#1E1B4B',
          },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
