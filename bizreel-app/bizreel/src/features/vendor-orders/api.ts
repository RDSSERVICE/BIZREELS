import { api } from '@/lib/api';
import type { Order } from '@/features/orders/types';

export async function fetchVendorOrders(): Promise<Order[]> {
  const { data } = await api.get('/orders/vendor/me');
  const items = data.data || data.orders || data || [];
  return Array.isArray(items) ? items : [];
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  trackingNumber?: string
): Promise<Order> {
  const { data } = await api.patch(`/orders/${orderId}/status`, {
    status,
    trackingNumber,
  });
  return data.data || data;
}
