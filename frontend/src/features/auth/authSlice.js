import { createSlice } from '@reduxjs/toolkit';

/**
 * Auth Slice
 * Manages user session, tokens, and active role in Redux.
 */
const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // True until initial auth check completes
  activeRole: 'customer',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.activeRole = user?.activeRole || 'customer';
    },
    tokenRefreshed: (state, action) => {
      state.accessToken = action.payload;
    },
    setActiveRole: (state, action) => {
      state.activeRole = action.payload;
      if (state.user) {
        state.user.activeRole = action.payload;
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.activeRole = 'customer';
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setCredentials,
  tokenRefreshed,
  setActiveRole,
  updateUser,
  logout,
  setLoading,
} = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectActiveRole = (state) => state.auth.activeRole;
export const selectAuthLoading = (state) => state.auth.isLoading;

export default authSlice.reducer;
