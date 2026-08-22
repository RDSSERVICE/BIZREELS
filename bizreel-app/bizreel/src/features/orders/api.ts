import { api } from '@/lib/api';
import type { CreateOrderPayload, Order, OrdersResponse } from './types';

/**
 * Place a single product/service order
 */
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<{ success: boolean; data: { order: Order } }>('/orders', payload);
  return data.data.order;
}

/**
 * Get customer orders with optional status filtering
 */
export async function getOrders(status?: string): Promise<OrdersResponse> {
  const params: Record<string, string> = {};
  if (status && status !== 'all') {
    params.status = status;
  }
  const { data } = await api.get<OrdersResponse>('/orders', { params });
  return data;
}

/**
 * Cancel an order with optional reason
 */
export async function cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; message: string; order: Order }> {
  const { data } = await api.patch<{ success: boolean; message: string; data: { order: Order } }>(
    `/orders/${orderId}/cancel`,
    { reason }
  );
  return {
    success: data.success,
    message: data.message,
    order: data.data.order,
  };
}
