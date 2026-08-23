import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchVendorSettings,
  fetchVerificationStatus,
  sendVendorSettingsOtp,
  updateVendorSettings,
  verifyBank,
  verifyGstin,
  verifyPan,
  verifyUpi,
} from './api';

export function useVendorSettings() {
  return useQuery({
    queryKey: ['vendor', 'settings'],
    queryFn: fetchVendorSettings,
  });
}

export function useSendVendorSettingsOtp() {
  return useMutation({
    mutationFn: sendVendorSettingsOtp,
  });
}

export function useUpdateVendorSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVendorSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'settings'] });
    },
  });
}

export function useVerificationStatus() {
  return useQuery({
    queryKey: ['vendor', 'verification'],
    queryFn: fetchVerificationStatus,
  });
}

export function useVerifyPan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyPan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'verification'] });
    },
  });
}

export function useVerifyGstin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyGstin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'verification'] });
    },
  });
}

export function useVerifyBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'verification'] });
    },
  });
}

export function useVerifyUpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyUpi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'verification'] });
    },
  });
}
