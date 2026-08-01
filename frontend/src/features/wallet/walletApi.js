import apiSlice from '../../api/apiSlice';

/**
 * Wallet API Slice
 * Manages queries and mutations for deposits, ledger logs, and subscription purchases.
 * Includes role-isolated wallet endpoints for Vendor and Creator.
 */
const walletApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch transaction list history
    getTransactions: builder.query({
      query: () => '/wallet/transactions',
      providesTags: ['Wallet'],
    }),

    // Deposit balance
    rechargeWallet: builder.mutation({
      query: (data) => ({
        url: '/wallet/recharge',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wallet', 'User'],
    }),

    // Purchase premium plan
    subscribeToPlan: builder.mutation({
      query: (data) => ({
        url: '/wallet/subscribe',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wallet', 'User'],
    }),

    // ─── Role-Isolated Wallet Endpoints ──────────────────────

    // GET /api/v1/wallet/vendor
    getVendorWallet: builder.query({
      query: () => '/wallet/vendor',
      providesTags: ['VendorWallet'],
    }),

    // GET /api/v1/wallet/creator
    getCreatorWallet: builder.query({
      query: () => '/wallet/creator',
      providesTags: ['CreatorWallet'],
    }),

    // GET /api/v1/transactions/vendor
    getVendorTransactions: builder.query({
      query: (params) => ({
        url: '/transactions/vendor',
        params,
      }),
      providesTags: ['VendorTransactions'],
    }),

    // GET /api/v1/transactions/creator
    getCreatorTransactions: builder.query({
      query: (params) => ({
        url: '/transactions/creator',
        params,
      }),
      providesTags: ['CreatorTransactions'],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useRechargeWalletMutation,
  useSubscribeToPlanMutation,
  useGetVendorWalletQuery,
  useGetCreatorWalletQuery,
  useGetVendorTransactionsQuery,
  useGetCreatorTransactionsQuery,
} = walletApi;

export default walletApi;
