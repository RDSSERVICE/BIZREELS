import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createVendorListing, deleteVendorListing, fetchVendorListings } from './api';

export function useVendorListings() {
  return useQuery({
    queryKey: ['vendor', 'listings'],
    queryFn: fetchVendorListings,
  });
}

export function useCreateVendorListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVendorListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useDeleteVendorListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVendorListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
