import { api } from '@/lib/api';
import type { Listing } from '@/features/search/types';

export async function fetchVendorListings(vendorId?: string): Promise<Listing[]> {
  try {
    const params: any = { my_listings: true, limit: 100 };
    if (vendorId) params.vendor = vendorId;

    const { data } = await api.get('/listings', { params });
    const rawItems = data.data?.listings || data.data?.items || data.data?.data || data.data || data.items || data.listings || data || [];
    let list = Array.isArray(rawItems) ? rawItems : [];

    if (list.length === 0 && vendorId) {
      try {
        const fallbackRes = await api.get(`/vendors/${vendorId}/listings`);
        const fallbackItems = fallbackRes.data?.items || fallbackRes.data?.data || fallbackRes.data?.listings || fallbackRes.data || [];
        if (Array.isArray(fallbackItems) && fallbackItems.length > 0) {
          list = fallbackItems;
        }
      } catch (fErr) {
        // Silent fallback
      }
    }

    if (vendorId && list.length > 0) {
      return list.filter((item: any) => {
        const itemVendorId = item.vendor?._id || item.vendor?.id || item.vendor;
        if (!itemVendorId) return true;
        return itemVendorId.toString() === vendorId.toString();
      });
    }

    return list;
  } catch (err) {
    console.warn('fetchVendorListings error:', err);
    return [];
  }
}

export async function createVendorListing(payload: {
  type: 'product' | 'service';
  title: string;
  category: string;
  description?: string;
  price: number;
  salePrice?: number;
  stock?: number;
  image?: string;
  [key: string]: any;
}): Promise<Listing> {
  const { data } = await api.post('/listings', payload);
  return data.data || data;
}

export async function updateVendorListing({
  id,
  ...payload
}: {
  id: string;
  [key: string]: any;
}): Promise<Listing> {
  const { data } = await api.patch(`/listings/${id}`, payload);
  return data.data || data;
}

export async function deleteVendorListing(id: string): Promise<boolean> {
  const { data } = await api.delete(`/listings/${id}`);
  return data.success || true;
}
