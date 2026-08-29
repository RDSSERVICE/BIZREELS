import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createVendorOffer,
  deleteVendorOffer,
  duplicateVendorOffer,
  fetchVendorOffers,
  toggleVendorOfferStatus,
} from './api';

export function useVendorOffers() {
  return useQuery({
    queryKey: ['vendor', 'offers'],
    queryFn: fetchVendorOffers,
  });
}

export function useCreateVendorOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVendorOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'offers'] });
    },
  });
}

export function useToggleVendorOfferStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleVendorOfferStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'offers'] });
    },
  });
}

export function useDuplicateVendorOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: duplicateVendorOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'offers'] });
    },
  });
}

export function useDeleteVendorOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVendorOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'offers'] });
    },
  });
}
