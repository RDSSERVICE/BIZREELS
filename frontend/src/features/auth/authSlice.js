import { createSlice } from '@reduxjs/toolkit';
import { tokenStore } from '../../lib/api';

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
      const payload = action.payload || {};
      const user = payload.user || payload;
      const accessToken = payload.accessToken || payload.access_token || state.accessToken;
      const refreshToken = payload.refreshToken || payload.refresh_token;

      state.user = user || state.user;
      if (accessToken) state.accessToken = accessToken;
      state.isAuthenticated = !!(user || state.user || accessToken);
      state.isLoading = false;
      state.activeRole = user?.activeRole || user?.current_role || state.activeRole || 'customer';

      tokenStore.set({
        access_token: accessToken || tokenStore.getAccess(),
        refresh_token: refreshToken || tokenStore.getRefresh(),
        user: user || state.user,
      });
    },
    tokenRefreshed: (state, action) => {
      state.accessToken = action.payload;
      tokenStore.set({
        access_token: action.payload,
        refresh_token: tokenStore.getRefresh(),
      });
    },
    setActiveRole: (state, action) => {
      state.activeRole = action.payload;
      if (state.user) {
        state.user.activeRole = action.payload;
        tokenStore.setUser(state.user);
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      tokenStore.setUser(state.user);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.activeRole = 'customer';
      tokenStore.clear();
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
