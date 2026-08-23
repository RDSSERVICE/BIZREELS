import { api } from '@/lib/api';

export interface VendorOffer {
  _id: string;
  title: string;
  discountPct: number;
  couponCode: string;
  validTill?: string;
  description?: string;
  is_active: boolean;
}

export async function fetchVendorOffers(): Promise<VendorOffer[]> {
  const { data } = await api.get('/vendor/offers');
  const items = data.data || data.offers || data || [];
  return Array.isArray(items) ? items : [];
}

export async function createVendorOffer(payload: {
  title: string;
  discountPct: number;
  couponCode: string;
  validTill?: string;
  description?: string;
}): Promise<VendorOffer> {
  const { data } = await api.post('/vendor/offers', payload);
  return data.data || data;
}

export async function deleteVendorOffer(id: string): Promise<boolean> {
  const { data } = await api.delete(`/vendor/offers/${id}`);
  return data.success || true;
}
