import apiSlice from '../../api/apiSlice';

/**
 * Wallet API Slice
 * Manages queries and mutations for deposits, ledger logs, and subscription purchases.
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
  }),
});

export const {
  useGetTransactionsQuery,
  useRechargeWalletMutation,
  useSubscribeToPlanMutation,
} = walletApi;

export default walletApi;
