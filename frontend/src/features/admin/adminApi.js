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
    listAdminCustomers: builder.query({
      query: (params = {}) => ({ url: '/admin/customers', params }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'AdminUsers', id })),
              { type: 'AdminUsers', id: 'LIST' },
            ]
          : [{ type: 'AdminUsers', id: 'LIST' }],
    }),
    getCustomerDetail: builder.query({
      query: (id) => `/admin/customers/${id}/details`,
      providesTags: (result, error, id) => [{ type: 'AdminUsers', id }],
    }),
    getCustomerStats: builder.query({
      query: () => '/admin/customers/stats',
      providesTags: [{ type: 'AdminUsers', id: 'STATS' }, 'AdminOverview'],
    }),
    resetCustomerPassword: builder.mutation({
      query: ({ id, password }) => ({ url: `/admin/users/${id}/reset-password`, method: 'POST', body: { password } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'AdminUsers', id }],
    }),
    verifyCustomerAccount: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/verify`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [{ type: 'AdminUsers', id }, { type: 'AdminUsers', id: 'STATS' }],
    }),
    activateCustomerAccount: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/activate`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [{ type: 'AdminUsers', id }, { type: 'AdminUsers', id: 'STATS' }],
    }),
    listAdminVendors: builder.query({
      query: (params = {}) => ({ url: '/admin/vendors', params }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'AdminUsers', id })),
              { type: 'AdminUsers', id: 'LIST' },
            ]
          : [{ type: 'AdminUsers', id: 'LIST' }],
    }),
    getVendorDetail: builder.query({
      query: (id) => `/admin/vendors/${id}/details`,
      providesTags: (result, error, id) => [{ type: 'AdminUsers', id }],
    }),
    getVendorStats: builder.query({
      query: () => '/admin/vendors/stats',
      providesTags: [{ type: 'AdminUsers', id: 'STATS' }, 'AdminOverview'],
    }),
    listAdminCreators: builder.query({
      query: (params = {}) => ({ url: '/admin/creators', params }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'AdminUsers', id })),
              { type: 'AdminUsers', id: 'LIST' },
            ]
          : [{ type: 'AdminUsers', id: 'LIST' }],
    }),
    getCreatorDetail: builder.query({
      query: (id) => `/admin/creators/${id}/details`,
      providesTags: (result, error, id) => [{ type: 'AdminUsers', id }],
    }),
    getCreatorStats: builder.query({
      query: () => '/admin/creators/stats',
      providesTags: [{ type: 'AdminUsers', id: 'STATS' }, 'AdminOverview'],
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
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }, 'AdminOverview', { type: 'AdminUsers', id: 'STATS' }],
    }),
    unbanUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/unban`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }, { type: 'AdminUsers', id: 'STATS' }],
    }),
    suspendUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/suspend`, method: 'POST' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }, { type: 'AdminUsers', id: 'STATS' }],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }, 'AdminOverview', { type: 'AdminUsers', id: 'STATS' }],
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({ url: `/admin/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }, 'AdminOverview', { type: 'AdminUsers', id: 'STATS' }],
    }),
    deleteVendor: builder.mutation({
      query: (id) => ({ url: `/admin/vendors/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }, 'AdminOverview', { type: 'AdminUsers', id: 'STATS' }],
    }),
    deleteCreator: builder.mutation({
      query: (id) => ({ url: `/admin/creators/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }, 'AdminOverview', { type: 'AdminUsers', id: 'STATS' }],
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
    approveRequirement: builder.mutation({
      query: (id) => ({ url: `/admin/requirements/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Requirements', 'AdminOverview'],
    }),
    rejectRequirement: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/requirements/${id}/reject`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Requirements', 'AdminOverview'],
    }),
    listCategoryRequests: builder.query({
      query: () => '/admin/category-requests',
      providesTags: ['CategoryRequests'],
    }),
    approveCategoryRequest: builder.mutation({
      query: (id) => ({ url: `/admin/category-requests/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['CategoryRequests', 'Categories', 'Requirements', 'AdminOverview'],
    }),
    rejectCategoryRequest: builder.mutation({
      query: ({ id, notes }) => ({ url: `/admin/category-requests/${id}/reject`, method: 'POST', body: { notes } }),
      invalidatesTags: ['CategoryRequests'],
    }),

    // ---- Wallet Management (Complete Module) ----
    getWalletStats: builder.query({
      query: () => '/admin/wallet/stats',
      providesTags: ['AdminWalletStats'],
    }),
    searchWalletUsers: builder.query({
      query: (q) => ({ url: '/admin/wallet/user-search', params: { q } }),
    }),
    listWalletTransactions: builder.query({
      query: (params = {}) => ({ url: '/admin/wallet/transactions', params }),
      providesTags: ['AdminWalletTransactions'],
    }),
    manualCreditWallet: builder.mutation({
      query: (body) => ({ url: '/admin/wallet/manual-credit', method: 'POST', body }),
      invalidatesTags: ['AdminWalletTransactions', 'AdminWalletStats', 'AdminTransactions', 'AdminOverview'],
    }),
    manualDebitWallet: builder.mutation({
      query: (body) => ({ url: '/admin/wallet/manual-debit', method: 'POST', body }),
      invalidatesTags: ['AdminWalletTransactions', 'AdminWalletStats', 'AdminTransactions', 'AdminOverview'],
    }),
    listWalletRecharges: builder.query({
      query: (params = {}) => ({ url: '/admin/wallet/recharges', params }),
      providesTags: ['AdminRecharges'],
    }),
    listWalletRefunds: builder.query({
      query: (params = {}) => ({ url: '/admin/wallet/refunds', params }),
      providesTags: ['AdminRefunds'],
    }),
    approveRefund: builder.mutation({
      query: ({ id, remarks }) => ({ url: `/admin/wallet/refunds/${id}/approve`, method: 'POST', body: { remarks } }),
      invalidatesTags: ['AdminRefunds', 'AdminWalletTransactions', 'AdminWalletStats', 'AdminOverview'],
    }),
    rejectRefund: builder.mutation({
      query: ({ id, remarks }) => ({ url: `/admin/wallet/refunds/${id}/reject`, method: 'POST', body: { remarks } }),
      invalidatesTags: ['AdminRefunds'],
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

    // ---- Admin Profile & Password & Security Logs ----
    updateAdminProfile: builder.mutation({
      query: (body) => ({ url: '/admin/me/profile', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    changeAdminPassword: builder.mutation({
      query: (body) => ({ url: '/admin/me/password', method: 'POST', body }),
    }),
    getAdminSecurityLogs: builder.query({
      query: () => '/admin/security/logs',
      providesTags: ['AdminSecurityLogs'],
    }),

    // ---- Notifications Broadcast ----
    sendBroadcastNotification: builder.mutation({
      query: (body) => ({ url: '/admin/notifications/broadcast', method: 'POST', body }),
    }),



    // ---- Coupons & Offers ----
    // Legacy coupon endpoints removed (moved to subscription-based Coupon Management)

    // ---- New Offers Management System ----
    listOffers: builder.query({
      query: (params = {}) => ({ url: '/offers/admin', params }),
      providesTags: ['Offers'],
    }),
    createOffer: builder.mutation({
      query: (body) => ({ url: '/offers/admin', method: 'POST', body }),
      invalidatesTags: ['Offers'],
    }),
    updateOffer: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/offers/admin/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Offers'],
    }),
    deleteOffer: builder.mutation({
      query: (id) => ({ url: `/offers/admin/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Offers'],
    }),
    activateOffer: builder.mutation({
      query: (id) => ({ url: `/offers/admin/${id}/activate`, method: 'POST' }),
      invalidatesTags: ['Offers'],
    }),
    deactivateOffer: builder.mutation({
      query: (id) => ({ url: `/offers/admin/${id}/deactivate`, method: 'POST' }),
      invalidatesTags: ['Offers'],
    }),
    duplicateOffer: builder.mutation({
      query: (id) => ({ url: `/offers/admin/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: ['Offers'],
    }),
    getOfferAnalytics: builder.query({
      query: (id) => `/offers/admin/${id}/analytics`,
      providesTags: (result, error, id) => [{ type: 'Offers', id }],
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
    getCommissionConfig: builder.query({
      query: () => '/admin/commission/config',
      providesTags: ['CommissionConfig', 'LeadBoostConfig', 'GSTConfig'],
    }),
    updateCommissionConfig: builder.mutation({
      query: (body) => ({ url: '/admin/commission/config', method: 'POST', body }),
      invalidatesTags: ['CommissionConfig', 'CommissionHistory', 'CommissionAnalytics'],
    }),
    updateLeadBoostConfig: builder.mutation({
      query: (body) => ({ url: '/admin/commission/lead-boost', method: 'POST', body }),
      invalidatesTags: ['LeadBoostConfig', 'CommissionHistory'],
    }),
    updateGSTConfig: builder.mutation({
      query: (body) => ({ url: '/admin/commission/gst', method: 'POST', body }),
      invalidatesTags: ['GSTConfig', 'CommissionHistory'],
    }),
    listCommissionHistory: builder.query({
      query: (params = {}) => ({ url: '/admin/commission/history', params }),
      providesTags: ['CommissionHistory'],
    }),
    getCommissionAnalytics: builder.query({
      query: (params = {}) => ({ url: '/admin/commission/analytics', params }),
      providesTags: ['CommissionAnalytics'],
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
    bulkUploadCategories: builder.mutation({
      query: (formData) => ({
        url: '/categories/bulk-upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Categories'],
    }),

    // ---- Subscription Plans (Admin CRUD & Operations) ----
    listSubscriptionPlans: builder.query({
      query: (params = {}) => ({ url: '/admin/subscription/plans', params }),
      providesTags: ['SubscriptionPlans'],
    }),
    createSubscriptionPlan: builder.mutation({
      query: (body) => ({ url: '/admin/subscription/plans', method: 'POST', body }),
      invalidatesTags: ['SubscriptionPlans'],
    }),
    updateSubscriptionPlan: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/subscription/plans/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['SubscriptionPlans'],
    }),
    deleteSubscriptionPlan: builder.mutation({
      query: (id) => ({ url: `/admin/subscription/plans/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SubscriptionPlans'],
    }),
    activateSubscriptionPlan: builder.mutation({
      query: (id) => ({ url: `/admin/subscription/plans/${id}/activate`, method: 'POST' }),
      invalidatesTags: ['SubscriptionPlans'],
    }),
    deactivateSubscriptionPlan: builder.mutation({
      query: (id) => ({ url: `/admin/subscription/plans/${id}/deactivate`, method: 'POST' }),
      invalidatesTags: ['SubscriptionPlans'],
    }),
    archiveSubscriptionPlan: builder.mutation({
      query: (id) => ({ url: `/admin/subscription/plans/${id}/archive`, method: 'POST' }),
      invalidatesTags: ['SubscriptionPlans'],
    }),
    duplicateSubscriptionPlan: builder.mutation({
      query: (id) => ({ url: `/admin/subscription/plans/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: ['SubscriptionPlans'],
    }),

    // ---- User Subscriptions ----
    listUserSubscriptions: builder.query({
      query: (params = {}) => ({ url: '/admin/subscription/user-subscriptions', params }),
      providesTags: ['UserSubscriptions'],
    }),
    cancelUserSubscription: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/subscription/user-subscriptions/${id}/cancel`, method: 'POST', body: { reason } }),
      invalidatesTags: ['UserSubscriptions', 'AdminOverview'],
    }),
    extendUserSubscription: builder.mutation({
      query: ({ id, days }) => ({ url: `/admin/subscription/user-subscriptions/${id}/extend`, method: 'POST', body: { days } }),
      invalidatesTags: ['UserSubscriptions'],
    }),
    renewUserSubscription: builder.mutation({
      query: (id) => ({ url: `/admin/subscription/user-subscriptions/${id}/renew`, method: 'POST' }),
      invalidatesTags: ['UserSubscriptions', 'AdminOverview'],
    }),

    // ---- Coupon Management ----
    listCoupons: builder.query({
      query: (params = {}) => ({ url: '/admin/subscription/coupons', params }),
      providesTags: ['Coupons'],
    }),
    createCoupon: builder.mutation({
      query: (body) => ({ url: '/admin/subscription/coupons', method: 'POST', body }),
      invalidatesTags: ['Coupons'],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/subscription/coupons/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Coupons'],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({ url: `/admin/subscription/coupons/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Coupons'],
    }),
    toggleCoupon: builder.mutation({
      query: (id) => ({ url: `/admin/subscription/coupons/${id}/toggle`, method: 'POST' }),
      invalidatesTags: ['Coupons'],
    }),

    // ---- Invoices ----
    listSubscriptionInvoices: builder.query({
      query: (params = {}) => ({ url: '/admin/subscription/invoices', params }),
      providesTags: ['SubscriptionInvoices'],
    }),

    // ---- Revenue Analytics ----
    getSubscriptionRevenue: builder.query({
      query: () => '/admin/subscription/revenue',
      providesTags: ['FinancialReports'],
    }),

    // ---- Financial Reports (Real Aggregation) ----
    getFinancialReport: builder.query({
      query: (params = {}) => ({ url: '/admin/reports/financial', params }),
      providesTags: ['FinancialReports'],
    }),

    // ---- Location Radius Settings ----
    getLocationRadius: builder.query({
      query: () => '/admin/locations/radius',
      providesTags: ['LocationRadius'],
    }),
    updateLocationRadius: builder.mutation({
      query: (body) => ({ url: '/admin/locations/radius', method: 'PATCH', body }),
      invalidatesTags: ['LocationRadius'],
    }),
  }),
});

export const {
  useGetAdminOverviewQuery,
  useListAdminUsersQuery,
  useListAdminCustomersQuery,
  useGetCustomerDetailQuery,
  useGetCustomerStatsQuery,
  useResetCustomerPasswordMutation,
  useVerifyCustomerAccountMutation,
  useActivateCustomerAccountMutation,
  useListAdminVendorsQuery,
  useGetVendorDetailQuery,
  useGetVendorStatsQuery,
  useListAdminCreatorsQuery,
  useGetCreatorDetailQuery,
  useGetCreatorStatsQuery,
  useGetUserDetailQuery,
  useUpdateUserMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useSuspendUserMutation,
  useDeleteUserMutation,
  useDeleteCustomerMutation,
  useDeleteVendorMutation,
  useDeleteCreatorMutation,
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
  useApproveRequirementMutation,
  useRejectRequirementMutation,
  useListCategoryRequestsQuery,
  useApproveCategoryRequestMutation,
  useRejectCategoryRequestMutation,
  useManualCreditWalletMutation,
  useManualDebitWalletMutation,
  useGetWalletStatsQuery,
  useSearchWalletUsersQuery,
  useLazySearchWalletUsersQuery,
  useListWalletTransactionsQuery,
  useListWalletRechargesQuery,
  useListWalletRefundsQuery,
  useApproveRefundMutation,
  useRejectRefundMutation,
  useListAdminReviewsQuery,
  useDeleteAdminReviewMutation,
  useGetCmsPagesQuery,
  useUpdateCmsPageMutation,
  useGetAppSettingsQuery,
  useUpdateAppSettingsMutation,
  useGetAdminSecurityLogsQuery,
  useSendBroadcastNotificationMutation,

  useListOffersQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
  useActivateOfferMutation,
  useDeactivateOfferMutation,
  useDuplicateOfferMutation,
  useGetOfferAnalyticsQuery,
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
  useGetCommissionConfigQuery,
  useUpdateCommissionConfigMutation,
  useUpdateLeadBoostConfigMutation,
  useUpdateGSTConfigMutation,
  useListCommissionHistoryQuery,
  useGetCommissionAnalyticsQuery,
  useListAdminAuditLogQuery,
  useUpdateAdminProfileMutation,
  useChangeAdminPasswordMutation,
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useBulkUploadCategoriesMutation,
  useListSubscriptionPlansQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
  useActivateSubscriptionPlanMutation,
  useDeactivateSubscriptionPlanMutation,
  useArchiveSubscriptionPlanMutation,
  useDuplicateSubscriptionPlanMutation,
  useListUserSubscriptionsQuery,
  useCancelUserSubscriptionMutation,
  useExtendUserSubscriptionMutation,
  useRenewUserSubscriptionMutation,
  useListCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useToggleCouponMutation,
  useListSubscriptionInvoicesQuery,
  useGetSubscriptionRevenueQuery,
  useGetFinancialReportQuery,
  useGetLocationRadiusQuery,
  useUpdateLocationRadiusMutation,
} = adminApi;


export default adminApi;
