import { api } from '@/lib/api';
import type { AddToCartPayload, CartResponse } from './types';

/**
 * Fetch current user cart
 */
export async function getCart(): Promise<CartResponse> {
  try {
    const { data } = await api.get<CartResponse>('/cart/me');
    return data;
  } catch (err) {
    const { data } = await api.get<CartResponse>('/cart');
    return data;
  }
}

export async function addToCart(payload: AddToCartPayload): Promise<CartResponse> {
  try {
    const { data } = await api.post<CartResponse>('/cart/me/add', payload);
    return data;
  } catch (err) {
    const { data } = await api.post<CartResponse>('/cart/add', payload);
    return data;
  }
}

export async function updateCartQuantity(listingId: string, quantity: number): Promise<CartResponse> {
  try {
    const { data } = await api.patch<CartResponse>(`/cart/me/items/${listingId}`, { quantity });
    return data;
  } catch (err) {
    const { data } = await api.patch<CartResponse>(`/cart/items/${listingId}`, { quantity });
    return data;
  }
}

export async function removeFromCart(listingId: string): Promise<CartResponse> {
  try {
    const { data } = await api.delete<CartResponse>(`/cart/me/items/${listingId}`);
    return data;
  } catch (err) {
    const { data } = await api.delete<CartResponse>(`/cart/items/${listingId}`);
    return data;
  }
}

export async function checkoutCart(): Promise<{ ok: boolean; deals: any[] }> {
  try {
    const { data } = await api.post<{ ok: boolean; deals: any[] }>('/cart/me/checkout');
    return data;
  } catch (err) {
    const { data } = await api.post<{ ok: boolean; deals: any[] }>('/cart/checkout');
    return data;
  }
}
