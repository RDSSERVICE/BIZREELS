import { api } from '@/lib/api';
import type { Order } from '@/features/orders/types';

export async function fetchVendorOrders(): Promise<Order[]> {
  try {
    const res = await api
      .get('/v1/orders', { params: { role: 'vendor' } })
      .catch(() => api.get('/orders/vendor/me'))
      .catch(() => api.get('/orders', { params: { role: 'vendor' } }));

    const items =
      res.data?.data?.orders ||
      res.data?.data ||
      res.data?.orders ||
      (Array.isArray(res.data) ? res.data : []);

    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.log('Error fetching vendor orders:', err);
    return [];
  }
}

export async function updateOrderStatus(
  orderId: string,
  payload: {
    status?: string;
    paymentStatus?: string;
    trackingNumber?: string;
    shippingDetails?: { courierName?: string; trackingNumber?: string };
  } | string,
  trackingNumber?: string
): Promise<Order> {
  const body = typeof payload === 'string' ? { status: payload, trackingNumber } : payload;
  const { data } = await api.patch(`/v1/orders/${orderId}/status`, body).catch(() =>
    api.patch(`/orders/${orderId}/status`, body)
  );
  return data.data || data;
}
