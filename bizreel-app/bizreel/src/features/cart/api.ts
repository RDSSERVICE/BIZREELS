import { api } from '@/lib/api';
import type { AddToCartPayload, CartResponse } from './types';

/**
 * Fetch current user cart
 */
export async function getCart(): Promise<CartResponse> {
  const { data } = await api.get<CartResponse>('/cart/me');
  return data;
}

/**
 * Add item to cart
 */
export async function addToCart(payload: AddToCartPayload): Promise<CartResponse> {
  const { data } = await api.post<CartResponse>('/cart/me/add', payload);
  return data;
}

/**
 * Update item quantity in cart
 */
export async function updateCartQuantity(listingId: string, quantity: number): Promise<CartResponse> {
  const { data } = await api.patch<CartResponse>(`/cart/me/items/${listingId}`, { quantity });
  return data;
}

/**
 * Remove item from cart
 */
export async function removeFromCart(listingId: string): Promise<CartResponse> {
  const { data } = await api.delete<CartResponse>(`/cart/me/items/${listingId}`);
  return data;
}

/**
 * Checkout cart into deals/orders
 */
export async function checkoutCart(): Promise<{ ok: boolean; deals: any[] }> {
  const { data } = await api.post<{ ok: boolean; deals: any[] }>('/cart/me/checkout');
  return data;
}
