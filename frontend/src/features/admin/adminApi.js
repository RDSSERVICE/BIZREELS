import apiSlice from '../../api/apiSlice';

/**
 * Admin API Slice
 * Injects every endpoint the admin panel needs: user moderation, listing
 * moderation, KYC review queue, reports, integration settings, the analytics
 * overview, and the admin console (transactions/orders/commissions/audit log).
 */
const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ---- Dashboard overview ----
    getAdminOverview: builder.query({
      query: () => '/admin/analytics/overview',
      providesTags: ['AdminOverview'],
    }),

    // ---- Users ----
    listAdminUsers: builder.query({
      query: (params = {}) => ({ url: '/admin/users', params }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'AdminUsers', id })),
              { type: 'AdminUsers', id: 'LIST' },
            ]
          : [{ type: 'AdminUsers', id: 'LIST' }],
    }),
    banUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/ban`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }, 'AdminOverview'],
    }),
    unbanUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/unban`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }],
    }),
    freezeWallet: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/freeze-wallet`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }],
    }),
    unfreezeWallet: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/unfreeze-wallet`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }],
    }),
    addUserRole: builder.mutation({
      query: ({ id, role }) => ({ url: `/admin/users/${id}/add-role`, method: 'POST', body: { role } }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }],
    }),
    removeUserRole: builder.mutation({
      query: ({ id, role }) => ({ url: `/admin/users/${id}/remove-role`, method: 'POST', body: { role } }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }],
    }),

    // ---- Listings ----
    listAdminListings: builder.query({
      query: (params = {}) => ({ url: '/admin/listings', params }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'AdminListings', id })),
              { type: 'AdminListings', id: 'LIST' },
            ]
          : [{ type: 'AdminListings', id: 'LIST' }],
    }),
    takedownListing: builder.mutation({
      query: (id) => ({ url: `/admin/listings/${id}/takedown`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminListings', id: 'LIST' }, 'AdminOverview'],
    }),
    restoreListing: builder.mutation({
      query: (id) => ({ url: `/admin/listings/${id}/restore`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminListings', id: 'LIST' }],
    }),

    // ---- KYC queue ----
    getKycQueue: builder.query({
      query: () => '/admin/kyc',
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'AdminKyc', id })),
              { type: 'AdminKyc', id: 'LIST' },
            ]
          : [{ type: 'AdminKyc', id: 'LIST' }],
    }),
    approveKyc: builder.mutation({
      query: (id) => ({ url: `/admin/kyc/${id}/approve`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminKyc', id: 'LIST' }, 'AdminOverview'],
    }),
    rejectKyc: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/kyc/${id}/reject`, method: 'POST', body: { reason } }),
      invalidatesTags: [{ type: 'AdminKyc', id: 'LIST' }, 'AdminOverview'],
    }),

    // ---- Reports ----
    listAdminReports: builder.query({
      query: (params = {}) => ({ url: '/admin/reports', params }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'AdminReports', id })),
              { type: 'AdminReports', id: 'LIST' },
            ]
          : [{ type: 'AdminReports', id: 'LIST' }],
    }),
    resolveReport: builder.mutation({
      query: ({ id, action, note }) => ({ url: `/admin/reports/${id}/resolve`, method: 'POST', body: { action, note } }),
      invalidatesTags: [{ type: 'AdminReports', id: 'LIST' }, 'AdminOverview'],
    }),
    dismissReport: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/reports/${id}/dismiss`, method: 'POST', body: { reason } }),
      invalidatesTags: [{ type: 'AdminReports', id: 'LIST' }, 'AdminOverview'],
    }),

    // ---- Integration settings ----
    getIntegrationSettings: builder.query({
      query: () => '/admin/settings/integrations',
      providesTags: ['AdminSettings'],
    }),
    updateIntegrationSettings: builder.mutation({
      query: (patch) => ({ url: '/admin/settings/integrations', method: 'PATCH', body: patch }),
      invalidatesTags: ['AdminSettings'],
    }),
    testIntegration: builder.mutation({
      query: (integration) => ({ url: `/admin/settings/integrations/test?integration=${encodeURIComponent(integration)}`, method: 'POST' }),
    }),

    // ---- Admin console: transactions / orders / commissions / audit log ----
    listAdminTransactions: builder.query({
      query: (params = {}) => ({ url: '/admin/transactions', params }),
      providesTags: ['AdminTransactions'],
    }),
    listAdminOrders: builder.query({
      query: (params = {}) => ({ url: '/admin/orders', params }),
      providesTags: ['AdminOrders'],
    }),
    listAdminCommissions: builder.query({
      query: (params = {}) => ({ url: '/admin/commissions', params }),
      providesTags: ['AdminCommissions'],
    }),
    getCommissionSummary: builder.query({
      query: (params = {}) => ({ url: '/admin/commissions/summary', params }),
      providesTags: ['AdminCommissions'],
    }),
    setGlobalCommissionRate: builder.mutation({
      query: (rate) => ({ url: '/admin/commissions/rate/global', method: 'POST', body: { rate } }),
      invalidatesTags: ['AdminCommissions'],
    }),
    markCommissionPaid: builder.mutation({
      query: (id) => ({ url: `/admin/commissions/${id}/mark-paid`, method: 'POST' }),
      invalidatesTags: ['AdminCommissions'],
    }),
    listAdminAuditLog: builder.query({
      query: (params = {}) => ({ url: '/admin/audit-log', params }),
      providesTags: ['AdminAuditLog'],
    }),
  }),
});

export const {
  useGetAdminOverviewQuery,
  useListAdminUsersQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useFreezeWalletMutation,
  useUnfreezeWalletMutation,
  useAddUserRoleMutation,
  useRemoveUserRoleMutation,
  useListAdminListingsQuery,
  useTakedownListingMutation,
  useRestoreListingMutation,
  useGetKycQueueQuery,
  useApproveKycMutation,
  useRejectKycMutation,
  useListAdminReportsQuery,
  useResolveReportMutation,
  useDismissReportMutation,
  useGetIntegrationSettingsQuery,
  useUpdateIntegrationSettingsMutation,
  useTestIntegrationMutation,
  useListAdminTransactionsQuery,
  useListAdminOrdersQuery,
  useListAdminCommissionsQuery,
  useGetCommissionSummaryQuery,
  useSetGlobalCommissionRateMutation,
  useMarkCommissionPaidMutation,
  useListAdminAuditLogQuery,
} = adminApi;

export default adminApi;
