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
  } catch (err) {
    const { data } = await api.get('/vendor/offers');
    const items = data.data || data.offers || data.items || data || [];
    return Array.isArray(items) ? items : [];
  }
}

export async function createVendorOffer(payload: any): Promise<VendorOffer> {
  try {
    const { data } = await api.post('/vendors/me/offers', payload);
    return data.data || data;
  } catch (err) {
    const { data } = await api.post('/vendor/offers', payload);
    return data.data || data;
  }
}

export async function updateVendorOffer({ id, ...payload }: { id: string; [key: string]: any }): Promise<VendorOffer> {
  try {
    const { data } = await api.put(`/vendors/me/offers/${id}`, payload);
    return data.data || data;
  } catch (err) {
    const { data } = await api.put(`/vendor/offers/${id}`, payload);
    return data.data || data;
  }
}

export async function toggleVendorOfferStatus(id: string): Promise<boolean> {
  try {
    const { data } = await api.patch(`/vendors/me/offers/${id}/status`);
    return data.success || true;
  } catch (err) {
    return true;
  }
}

export async function duplicateVendorOffer(id: string): Promise<VendorOffer> {
  const { data } = await api.post(`/vendors/me/offers/${id}/duplicate`);
  return data.data || data;
}

export async function deleteVendorOffer(id: string): Promise<boolean> {
  try {
    const { data } = await api.delete(`/vendors/me/offers/${id}`);
    return data.success || true;
  } catch (err) {
    const { data } = await api.delete(`/vendor/offers/${id}`);
    return data.success || true;
  }
}
