import apiSlice from '../../api/apiSlice';

/**
 * Admin API Slice
 * Injects endpoints for all admin panel modules across all phases.
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
    getUserDetail: builder.query({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminUsers', id }],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }],
    }),
    banUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/ban`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }, 'AdminOverview'],
    }),
    unbanUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/unban`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }],
    }),
    suspendUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/suspend`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }, 'AdminOverview'],
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
    getLoginHistory: builder.query({
      query: (id) => `/admin/users/${id}/login-history`,
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
    bulkApproveListings: builder.mutation({
      query: (listing_ids) => ({ url: '/admin/listings/bulk-approve', method: 'POST', body: { listing_ids } }),
      invalidatesTags: [{ type: 'AdminListings', id: 'LIST' }, 'AdminOverview'],
    }),

    // ---- Reels ----
    listAdminReels: builder.query({
      query: (params = {}) => ({ url: '/admin/reels', params }),
      providesTags: ['Reels'],
    }),
    takedownReel: builder.mutation({
      query: (id) => ({ url: `/admin/reels/${id}/takedown`, method: 'POST' }),
      invalidatesTags: ['Reels', 'AdminOverview'],
    }),
    toggleBoostReel: builder.mutation({
      query: (id) => ({ url: `/admin/reels/${id}/boost`, method: 'POST' }),
      invalidatesTags: ['Reels', 'AdminOverview'],
    }),

    // ---- Boost Plans ----
    listBoostPlans: builder.query({
      query: () => '/admin/boost/plans',
      providesTags: ['BoostPlans'],
    }),
    createBoostPlan: builder.mutation({
      query: (body) => ({ url: '/admin/boost/plans', method: 'POST', body }),
      invalidatesTags: ['BoostPlans'],
    }),
    updateBoostPlan: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/boost/plans/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['BoostPlans'],
    }),

    // ---- Requirements ----
    listAdminRequirements: builder.query({
      query: (params = {}) => ({ url: '/admin/requirements', params }),
      providesTags: ['Requirements'],
    }),

    // ---- Wallet Manual Operations ----
    manualCreditWallet: builder.mutation({
      query: (body) => ({ url: '/admin/wallet/manual-credit', method: 'POST', body }),
      invalidatesTags: ['AdminTransactions', 'AdminOverview'],
    }),
    manualDebitWallet: builder.mutation({
      query: (body) => ({ url: '/admin/wallet/manual-debit', method: 'POST', body }),
      invalidatesTags: ['AdminTransactions', 'AdminOverview'],
    }),

    // ---- Reviews ----
    listAdminReviews: builder.query({
      query: (params = {}) => ({ url: '/admin/reviews', params }),
      providesTags: ['Reviews'],
    }),
    deleteAdminReview: builder.mutation({
      query: (id) => ({ url: `/admin/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Reviews'],
    }),

    // ---- CMS Pages ----
    getCmsPages: builder.query({
      query: () => '/admin/cms',
      providesTags: ['Cms'],
    }),
    updateCmsPage: builder.mutation({
      query: ({ slug, ...body }) => ({ url: `/admin/cms/${slug}`, method: 'PUT', body }),
      invalidatesTags: ['Cms'],
    }),

    // ---- App Settings ----
    getAppSettings: builder.query({
      query: () => '/admin/app-settings',
      providesTags: ['AppSettings'],
    }),
    updateAppSettings: builder.mutation({
      query: (body) => ({ url: '/admin/app-settings', method: 'PATCH', body }),
      invalidatesTags: ['AppSettings'],
    }),

    // ---- Admin Profile & Password ----
    updateAdminProfile: builder.mutation({
      query: (body) => ({ url: '/admin/me/profile', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    changeAdminPassword: builder.mutation({
      query: (body) => ({ url: '/admin/me/password', method: 'POST', body }),
    }),

    // ---- Notifications Broadcast ----
    sendBroadcastNotification: builder.mutation({
      query: (body) => ({ url: '/admin/notifications/broadcast', method: 'POST', body }),
    }),



    // ---- Coupons & Offers ----
    listCoupons: builder.query({
      query: () => '/admin/coupons',
      providesTags: ['Coupons'],
    }),
    createCoupon: builder.mutation({
      query: (body) => ({ url: '/admin/coupons', method: 'POST', body }),
      invalidatesTags: ['Coupons'],
    }),

    // ---- Chat Monitoring ----
    listReportedChats: builder.query({
      query: () => '/admin/chat/reported',
      providesTags: ['Chat'],
    }),


    // ---- Locations ----
    listLocations: builder.query({
      query: () => '/admin/locations',
      providesTags: ['Locations'],
    }),
    createLocation: builder.mutation({
      query: (body) => ({ url: '/admin/locations', method: 'POST', body }),
      invalidatesTags: ['Locations'],
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

    // ---- Categories ----
    listCategories: builder.query({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),
    createCategory: builder.mutation({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),
  }),
});

export const {
  useGetAdminOverviewQuery,
  useListAdminUsersQuery,
  useGetUserDetailQuery,
  useUpdateUserMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useSuspendUserMutation,
  useDeleteUserMutation,
  useFreezeWalletMutation,
  useUnfreezeWalletMutation,
  useAddUserRoleMutation,
  useRemoveUserRoleMutation,
  useGetLoginHistoryQuery,
  useListAdminListingsQuery,
  useTakedownListingMutation,
  useRestoreListingMutation,
  useBulkApproveListingsMutation,
  useListAdminReelsQuery,
  useTakedownReelMutation,
  useToggleBoostReelMutation,
  useListBoostPlansQuery,
  useCreateBoostPlanMutation,
  useUpdateBoostPlanMutation,
  useListLocationsQuery,
  useCreateLocationMutation,
  useListAdminRequirementsQuery,
  useManualCreditWalletMutation,
  useManualDebitWalletMutation,
  useListAdminReviewsQuery,
  useDeleteAdminReviewMutation,
  useGetCmsPagesQuery,
  useUpdateCmsPageMutation,
  useGetAppSettingsQuery,
  useUpdateAppSettingsMutation,
  useGetAdminSecurityLogsQuery,
  useSendBroadcastNotificationMutation,
  useListCouponsQuery,

  useCreateCouponMutation,
  useListReportedChatsQuery,

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
  useUpdateAdminProfileMutation,
  useChangeAdminPasswordMutation,
  useGetCategoriesQuery,
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} = adminApi;


export default adminApi;
