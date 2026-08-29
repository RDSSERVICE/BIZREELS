import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context';
import { createVendorListing, deleteVendorListing, fetchVendorListings } from './api';

export function useVendorListings() {
  const { user } = useAuth();
  const vendorId = (user as any)?._id || (user as any)?.id;

  return useQuery({
    queryKey: ['vendor', 'listings', vendorId],
    queryFn: () => fetchVendorListings(vendorId),
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
