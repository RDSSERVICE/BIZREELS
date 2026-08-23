import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addToCart, checkoutCart, getCart, removeFromCart, updateCartQuantity } from './api';
import type { AddToCartPayload } from './types';

export const CART_QUERY_KEY = ['cart'];

export function useCart() {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: getCart,
    staleTime: 0,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddToCartPayload) => addToCart(payload),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, quantity }: { listingId: string; quantity: number }) =>
      updateCartQuantity(listingId, quantity),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => removeFromCart(listingId),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
    },
  });
}

export function useCartCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkoutCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
