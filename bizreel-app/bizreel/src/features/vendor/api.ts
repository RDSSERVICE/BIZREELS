import { api } from '@/lib/api';
import type { VerificationStatus, VendorSettings } from './types';

export async function fetchVendorSettings(): Promise<VendorSettings> {
  try {
    const res = await api.get<{ success: boolean; data: VendorSettings }>('/vendors/me/settings')
      .catch(() => api.get<{ success: boolean; data: VendorSettings }>('/vendor/me/settings'));
    return res?.data?.data || ({} as VendorSettings);
  } catch (err) {
    return {} as VendorSettings;
  }
}

export async function sendVendorSettingsOtp(): Promise<{ message: string; phone: string; otp?: string }> {
  const { data } = await api.post<{ success: boolean; message: string; phone: string; otp?: string }>(
    '/vendors/me/send-settings-otp'
  ).catch(() => api.post<{ success: boolean; message: string; phone: string; otp?: string }>('/vendor/me/send-settings-otp'));
  return data;
}

export async function updateVendorSettings(payload: {
  settings: Partial<VendorSettings>;
  otp: string;
  consentGiven: boolean;
}): Promise<VendorSettings> {
  const { data } = await api.post<{ success: boolean; data: VendorSettings }>('/vendors/me/settings', {
    ...payload.settings,
    otp: payload.otp,
    consentGiven: payload.consentGiven,
  }).catch(() => api.post<{ success: boolean; data: VendorSettings }>('/vendor/me/settings', {
    ...payload.settings,
    otp: payload.otp,
    consentGiven: payload.consentGiven,
  }));
  return data?.data || ({} as VendorSettings);
}

export async function fetchVerificationStatus(): Promise<VerificationStatus> {
  try {
    const res = await api.get('/vendors/me/verification-status')
      .catch(() => api.get('/vendor/me/verification-status'))
      .catch(() => api.get('/vendors/me/verification/status'));
    const resData = res?.data?.data || res?.data;
    return resData || { status: 'unverified', contactVerified: false, documentVerified: false, paymentVerified: false };
  } catch (err) {
    return { status: 'unverified', contactVerified: false, documentVerified: false, paymentVerified: false };
  }
}

export async function verifyPan(panNumber: string): Promise<boolean> {
  const res = await api.post('/vendors/me/verification/pan', { panNumber })
    .catch(() => api.post('/vendor/me/verification/pan', { panNumber }));
  return res?.data?.success || true;
}

export async function verifyGstin(gstin: string): Promise<boolean> {
  const res = await api.post('/vendors/me/verification/gstin', { gstin })
    .catch(() => api.post('/vendor/me/verification/gstin', { gstin }));
  return res?.data?.success || true;
}

export async function verifyBank(details: { accountHolder: string; accountNumber: string; ifscCode: string }): Promise<boolean> {
  const res = await api.post('/vendors/me/verification/bank', details)
    .catch(() => api.post('/vendor/me/verification/bank', details));
  return res?.data?.success || true;
}

export async function verifyUpi(upiId: string): Promise<boolean> {
  const res = await api.post('/vendors/me/verification/upi', { upiId })
    .catch(() => api.post('/vendor/me/verification/upi', { upiId }));
  return res?.data?.success || true;
}
