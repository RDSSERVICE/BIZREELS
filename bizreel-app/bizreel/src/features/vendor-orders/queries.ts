import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchVendorOrders, updateOrderStatus } from './api';

export function useVendorOrders() {
  return useQuery({
    queryKey: ['vendor', 'orders'],
    queryFn: fetchVendorOrders,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      status,
      trackingNumber,
    }: {
      orderId: string;
      status: string;
      trackingNumber?: string;
    }) => updateOrderStatus(orderId, status, trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
    },
  });
}
