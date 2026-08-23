import { configureStore } from '@reduxjs/toolkit';
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

export default store;
