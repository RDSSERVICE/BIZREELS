import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCreditRates, getTopupPacks, getWalletInfo, getWalletTransactions, rechargeWallet, requestPayout } from './api';
import type { RechargeWalletInput } from './types';

export function useWalletInfo() {
  return useQuery({
    queryKey: ['wallet', 'me'],
    queryFn: getWalletInfo,
  });
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: getWalletTransactions,
  });
}

export function useTopupPacks() {
  return useQuery({
    queryKey: ['wallet', 'topup-packs'],
    queryFn: getTopupPacks,
  });
}

export function useCreditRates() {
  return useQuery({
    queryKey: ['wallet', 'credit-rates'],
    queryFn: getCreditRates,
  });
}

export function useRechargeWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RechargeWalletInput) => rechargeWallet(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
    },
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => requestPayout(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
    },
  });
}

