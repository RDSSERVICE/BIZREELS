import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import apiSlice from '../api/apiSlice';
import authReducer from '../features/auth/authSlice';

/**
 * Redux Store Configuration
 * Combines RTK Query API middleware with feature slices.
 */
const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
});

// Production Grade: Enable refetchOnFocus and refetchOnReconnect
setupListeners(store.dispatch);

export default store;
