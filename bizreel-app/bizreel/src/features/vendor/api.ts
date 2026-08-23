import { api } from '@/lib/api';
import type { VerificationStatus, VendorSettings } from './types';

export async function fetchVendorSettings(): Promise<VendorSettings> {
  const { data } = await api.get<{ success: boolean; data: VendorSettings }>('/vendor/me/settings');
  return data.data;
}

export async function sendVendorSettingsOtp(): Promise<{ message: string; phone: string; otp?: string }> {
  const { data } = await api.post<{ success: boolean; message: string; phone: string; otp?: string }>(
    '/vendor/me/send-settings-otp'
  );
  return data;
}

export async function updateVendorSettings(payload: {
  settings: Partial<VendorSettings>;
  otp: string;
  consentGiven: boolean;
}): Promise<VendorSettings> {
  const { data } = await api.post<{ success: boolean; data: VendorSettings }>('/vendor/me/settings', {
    ...payload.settings,
    otp: payload.otp,
    consentGiven: payload.consentGiven,
  });
  return data.data;
}

export async function fetchVerificationStatus(): Promise<VerificationStatus> {
  const { data } = await api.get<{ success: boolean; data: VerificationStatus }>('/vendor/me/verification-status');
  return data.data || { status: 'unverified', contactVerified: false, documentVerified: false, paymentVerified: false };
}

export async function verifyPan(panNumber: string): Promise<boolean> {
  const { data } = await api.post('/vendor/me/verification/pan', { panNumber });
  return data.success || true;
}

export async function verifyGstin(gstin: string): Promise<boolean> {
  const { data } = await api.post('/vendor/me/verification/gstin', { gstin });
  return data.success || true;
}

export async function verifyBank(details: { accountHolder: string; accountNumber: string; ifscCode: string }): Promise<boolean> {
  const { data } = await api.post('/vendor/me/verification/bank', details);
  return data.success || true;
}

export async function verifyUpi(upiId: string): Promise<boolean> {
  const { data } = await api.post('/vendor/me/verification/upi', { upiId });
  return data.success || true;
}
