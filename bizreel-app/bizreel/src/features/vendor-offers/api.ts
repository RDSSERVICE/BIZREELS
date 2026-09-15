import { api } from '@/lib/api';

export interface VendorOffer {
  _id: string;
  id?: string;
  category?: string;
  offerName?: string;
  title: string;
  description?: string;
  code?: string;
  couponCode?: string;
  discountPct?: number;
  discountValue?: number;
  discountType?: 'fixed' | 'percent';
  startTime?: string;
  endTime?: string;
  validTill?: string;
  status?: string;
  is_active?: boolean;
  applicableProducts?: string[];
  applicableServices?: string[];
  config?: Record<string, any>;
  createdAt?: string;
}

export async function fetchVendorOffers(): Promise<VendorOffer[]> {
  try {
    const { data } = await api.get('/vendors/me/offers');
    const items = data.data || data.offers || data.items || data || [];
    return Array.isArray(items) ? items : [];
  } catch (err: any) {
    console.warn('fetchVendorOffers error:', err?.response?.data || err?.message);
    return [];
  }
}

export async function createVendorOffer(payload: any): Promise<VendorOffer> {
  try {
    const { data } = await api.post('/vendors/me/offers', payload);
    return data.data || data.offer || data;
  } catch (err: any) {
    console.warn('createVendorOffer /vendors/me/offers error:', err?.response?.data || err?.message);
    throw err;
  }
}

export async function updateVendorOffer({ id, ...payload }: { id: string; [key: string]: any }): Promise<VendorOffer> {
  try {
    const { data } = await api.put(`/vendors/me/offers/${id}`, payload);
    return data.data || data.offer || data;
  } catch (err: any) {
    console.warn('updateVendorOffer error:', err?.response?.data || err?.message);
    throw err;
  }
}

export async function toggleVendorOfferStatus(id: string): Promise<boolean> {
  try {
    const { data } = await api.patch(`/vendors/me/offers/${id}/status`);
    return data.success || true;
  } catch (err: any) {
    console.warn('toggleVendorOfferStatus error:', err?.response?.data || err?.message);
    return true;
  }
}

export async function duplicateVendorOffer(id: string): Promise<VendorOffer> {
  try {
    const { data } = await api.post(`/vendors/me/offers/${id}/duplicate`);
    return data.data || data.offer || data;
  } catch (err: any) {
    console.warn('duplicateVendorOffer error:', err?.response?.data || err?.message);
    throw err;
  }
}

export async function deleteVendorOffer(id: string): Promise<boolean> {
  try {
    const { data } = await api.delete(`/vendors/me/offers/${id}`);
    return data.success || true;
  } catch (err: any) {
    console.warn('deleteVendorOffer error:', err?.response?.data || err?.message);
    return true;
  }
}
