import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelOrder, createOrder, getOrders } from './api';
import type { CreateOrderPayload } from './types';

export const ORDERS_QUERY_KEY = ['orders'];

export function useMyOrders(status?: string) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, status ?? 'all'],
    queryFn: () => getOrders(status),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) => cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}
