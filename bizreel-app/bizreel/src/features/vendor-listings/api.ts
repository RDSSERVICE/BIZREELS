import { api } from '@/lib/api';
import type { Listing } from '@/features/search/types';

export async function fetchVendorListings(vendorId?: string): Promise<Listing[]> {
  const params: any = { my_listings: true, limit: 100 };
  if (vendorId) params.vendor = vendorId;

  const { data } = await api.get('/listings', { params });
  const items = data.data || data.items || data.listings || data || [];
  const list = Array.isArray(items) ? items : [];

  if (vendorId) {
    return list.filter((item: any) => {
      const itemVendorId = item.vendor?._id || item.vendor?.id || item.vendor;
      if (!itemVendorId) return true;
      return itemVendorId.toString() === vendorId.toString();
    });
  }

  return list;
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

export async function deleteVendorListing(id: string): Promise<boolean> {
  const { data } = await api.delete(`/listings/${id}`);
  return data.success || true;
}
