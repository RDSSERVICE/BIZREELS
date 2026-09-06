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
    mutationFn: (params: {
      orderId: string;
      status?: string;
      paymentStatus?: string;
      trackingNumber?: string;
      shippingDetails?: { courierName?: string; trackingNumber?: string };
    }) => updateOrderStatus(params.orderId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
    },
  });
}
