import apiSlice from '../../api/apiSlice';

/**
 * Auth API Endpoints
 * RTK Query endpoints for all authentication operations.
 */
const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Registration ────────────────────────────────────
    register: builder.mutation({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
    }),

    // ── Email Login ─────────────────────────────────────
    loginWithEmail: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // ── Request OTP ─────────────────────────────────────
    requestOtp: builder.mutation({
      query: (data) => ({
        url: '/auth/otp/request',
        method: 'POST',
        body: data,
      }),
    }),

    // ── Verify OTP ──────────────────────────────────────
    verifyOtp: builder.mutation({
      query: (data) => ({
        url: '/auth/otp/verify',
        method: 'POST',
        body: data,
      }),
    }),

    // ── Google Login (redirect) ─────────────────────────
    // Handled via redirect, not API call

    // ── Forgot Password ─────────────────────────────────
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    // ── Reset Password ──────────────────────────────────
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    // ── Get Current User ────────────────────────────────
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // ── Logout ──────────────────────────────────────────
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // ── Logout All Devices ──────────────────────────────
    logoutAll: builder.mutation({
      query: () => ({
        url: '/auth/logout-all',
        method: 'POST',
      }),
    }),

    // ── Switch Role ─────────────────────────────────────
    switchRole: builder.mutation({
      query: (data) => ({
        url: '/auth/switch-role',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // ── Add Role ────────────────────────────────────────
    // ── Add Role ────────────────────────────────────────
    addRole: builder.mutation({
      query: (data) => ({
        url: '/auth/add-role',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // ── Update Profile ──────────────────────────────────
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/auth/profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginWithEmailMutation,
  useRequestOtpMutation,
  useVerifyOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useLogoutMutation,
  useLogoutAllMutation,
  useSwitchRoleMutation,
  useAddRoleMutation,
  useUpdateProfileMutation,
} = authApi;

export default authApi;
